# OCR 识别稳定性优化设计

## 一、背景

批量识别证件图片时，部分图片（47 张）识别失败，错误信息为：
```
maximum recursion depth exceeded while calling a Python object
```

## 二、问题分析

### 2.1 根本原因

这是 PaddleOCR 的已知问题：

1. **递归深度超限**：PaddleOCR 内部 `warp_mls.py` 在处理某些图片时会触发深度递归，超过 Python 默认的 1000 层限制
2. **异常处理崩溃**：异常发生时 `traceback.format_exc()` 也会递归，导致错误处理本身也崩溃
3. **图片特征触发边缘情况**：大尺寸、特殊格式、EXIF 方向异常等特征会增加递归深度

### 2.2 影响因素

| 因素 | 影响 |
|------|------|
| 图片尺寸过大（>2000px） | 增加计算复杂度 |
| PNG 透明层、特殊色彩空间 | 预处理失败 |
| EXIF 方向信息异常 | 触发旋转处理递归 |
| 图片质量差 | OCR 引擎反复尝试 |

## 三、解决方案

### 3.1 整体策略

```
图片 → 预处理(标准化) → OCR识别
                           ↓
                      成功 → 返回结果
                           ↓
                      失败 → 简化重试(跳过增强)
                           ↓
                      成功 → 返回结果
                           ↓
                      失败 → 记录错误原因
```

### 3.2 改造范围

| 文件 | 改动内容 |
|------|----------|
| `backend/ocr_service.py` | 入口设置递归限制、调用安全识别方法 |
| `backend/ocr/preprocess.py` | 新增图片标准化函数 |
| `backend/ocr/engine.py` | 新增安全识别方法，带自动重试 |

## 四、详细设计

### 4.1 入口递归限制 (`backend/ocr_service.py`)

在文件开头增加：

```python
import sys
sys.setrecursionlimit(5000)
```

### 4.2 图片标准化 (`backend/ocr/preprocess.py`)

新增函数：

```python
def standardize_image(image_path: str, output_path: str = None) -> str:
    """
    标准化图片，降低 OCR 处理复杂度

    处理内容：
    1. 转换为 RGB 模式（处理 RGBA、P 模式）
    2. 移除 EXIF 方向信息
    3. 限制最大尺寸为 1500px（保持比例）
    4. 增强对比度 1.2 倍
    5. 强制保存为 JPEG 格式（质量 95）

    Args:
        image_path: 原图路径
        output_path: 输出路径，默认覆盖原图

    Returns:
        处理后的图片路径
    """
    img = Image.open(image_path)

    # 1. 转换为 RGB
    if img.mode in ('RGBA', 'P', 'LA', 'L'):
        img = img.convert('RGB')

    # 2. 移除 EXIF 方向
    try:
        from PIL import ImageOps
        img = ImageOps.exif_transpose(img)
    except:
        pass

    # 3. 限制尺寸
    max_size = 1500
    if max(img.size) > max_size:
        ratio = max_size / max(img.size)
        new_size = tuple(int(dim * ratio) for dim in img.size)
        img = img.resize(new_size, Image.LANCZOS)

    # 4. 增强对比度
    from PIL import ImageEnhance
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.2)

    # 5. 保存为 JPEG
    if output_path is None:
        # 修改扩展名为 .jpg
        base = os.path.splitext(image_path)[0]
        output_path = base + '.jpg'

    img.save(output_path, 'JPEG', quality=95)

    return output_path
```

### 4.3 安全识别方法 (`backend/ocr/engine.py`)

在 `OCREngine` 类中新增方法：

```python
def recognize_safe(self, image_path: str, max_retries: int = 1) -> Tuple[List[Dict], Dict]:
    """
    安全识别，带预处理和自动重试

    Args:
        image_path: 图片路径
        max_retries: 最大重试次数

    Returns:
        (识别结果列表, 调试信息)
    """
    from ocr.preprocess import standardize_image

    debug_info = {
        "image_path": image_path,
        "ocr_success": False,
        "text_count": 0,
        "avg_confidence": 0,
        "raw_texts": [],
        "error": None,
        "retried": False
    }

    # 第一次尝试：预处理后识别
    try:
        processed_path = standardize_image(image_path)
        lines, info = self.recognize(processed_path)

        if lines:
            return lines, {**debug_info, **info, "ocr_success": True}

        # 没有识别到文字，记录原因
        debug_info["error"] = info.get("error", "未检测到文字")

    except RecursionError as e:
        debug_info["error"] = f"递归深度超限: {str(e)[:100]}"
    except Exception as e:
        debug_info["error"] = str(e)[:200]

    # 重试：直接识别原图（跳过预处理）
    if max_retries > 0:
        debug_info["retried"] = True
        try:
            lines, info = self.recognize(image_path)
            if lines:
                return lines, {**debug_info, **info, "ocr_success": True}
        except RecursionError as e:
            debug_info["error"] = f"重试后仍递归超限: {str(e)[:100]}"
        except Exception as e:
            debug_info["error"] = f"重试失败: {str(e)[:200]}"

    return [], debug_info
```

### 4.4 批量处理改造 (`backend/ocr_service.py`)

修改 `recognize_single()` 函数：

```python
def recognize_single(image_path, doc_type=None):
    """识别单张证件图片"""
    try:
        ocr_engine = OCREngine()

        parsers = {
            "id_card": IDCardParser(),
            "hk_macao_pass": HKMacaoPassParser(),
            "passport": PassportParser(),
        }

        # 使用安全识别方法
        ocr_result, debug_info = ocr_engine.recognize_safe(image_path)

        if not ocr_result:
            return {
                "success": False,
                "error": debug_info.get("error", "无法识别图片内容"),
                "debug": debug_info
            }

        # 后续解析逻辑不变...
```

修改 `recognize_batch()` 函数中调用识别的部分：

```python
# 原来：
ocr_result, debug_info = ocr_engine.recognize(file_path)

# 改为：
ocr_result, debug_info = ocr_engine.recognize_safe(file_path)
```

## 五、预期效果

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 递归限制 | 1000 层 | 5000 层 |
| 图片预处理 | 仅调整尺寸 | 完整标准化流程 |
| 失败重试 | 无 | 自动重试 1 次 |
| 错误隔离 | 可能影响后续图片 | 完全隔离 |
| 失败率 | 47 张失败 | 预计降低 60-80% |

## 六、用户操作

优化后，失败的图片用户可以：
1. 重新上传包含失败图片的 ZIP 包再次识别
2. 系统会自动使用优化后的流程处理
