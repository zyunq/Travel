# OCR 识别稳定性优化 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化 OCR 识别稳定性，解决递归深度超限导致的识别失败问题

**Architecture:** 在 OCR 处理流程中增加图片预处理标准化、递归限制设置、安全识别方法（带自动重试），确保单张图片失败不影响整体批量处理

**Tech Stack:** Python, PaddleOCR, Pillow (PIL)

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `backend/ocr_service.py` | 修改 | 入口设置递归限制、调用安全识别方法 |
| `backend/ocr/preprocess.py` | 修改 | 新增 `standardize_image()` 图片标准化函数 |
| `backend/ocr/engine.py` | 修改 | 新增 `recognize_safe()` 安全识别方法 |

---

## Task 1: 添加递归限制入口

**Files:**
- Modify: `backend/ocr_service.py:1-15`

- [ ] **Step 1: 在文件开头添加递归限制**

在 `backend/ocr_service.py` 文件的 import 部分后添加递归限制设置：

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
证件识别服务 - 供 Node.js 调用的入口脚本

使用方式:
    python ocr_service.py recognize <image_path> [doc_type]
    python ocr_service.py batch <zip_path>
    python ocr_service.py types

输出: JSON 格式结果到 stdout
"""

import sys
sys.setrecursionlimit(5000)  # 增加递归深度限制，解决 PaddleOCR 递归超限问题

import os
import json
import tempfile
import zipfile
import shutil
```

- [ ] **Step 2: 验证修改**

运行以下命令验证语法正确：

```bash
cd C:\project\Travel\backend && python -c "import ocr_service; print('OK')"
```

预期输出: `OK`

- [ ] **Step 3: 提交**

```bash
git add backend/ocr_service.py
git commit -m "fix(ocr): 增加递归深度限制解决 PaddleOCR 递归超限问题"
```

---

## Task 2: 新增图片标准化函数

**Files:**
- Modify: `backend/ocr/preprocess.py`

- [ ] **Step 1: 添加 `standardize_image()` 函数**

在 `backend/ocr/preprocess.py` 文件末尾添加新函数：

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
        output_path: 输出路径，默认生成新的 JPEG 文件

    Returns:
        处理后的图片路径
    """
    import os

    img = Image.open(image_path)

    # 1. 转换为 RGB
    if img.mode in ('RGBA', 'P', 'LA', 'L'):
        img = img.convert('RGB')

    # 2. 移除 EXIF 方向
    try:
        from PIL import ImageOps
        img = ImageOps.exif_transpose(img)
    except Exception:
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
        # 生成临时文件路径
        base = os.path.splitext(image_path)[0]
        output_path = base + '_standardized.jpg'

    img.save(output_path, 'JPEG', quality=95)

    return output_path
```

- [ ] **Step 2: 验证语法正确**

```bash
cd C:\project\Travel\backend && python -c "from ocr.preprocess import standardize_image; print('OK')"
```

预期输出: `OK`

- [ ] **Step 3: 提交**

```bash
git add backend/ocr/preprocess.py
git commit -m "feat(ocr): 新增图片标准化函数降低 OCR 处理复杂度"
```

---

## Task 3: 新增安全识别方法

**Files:**
- Modify: `backend/ocr/engine.py`

- [ ] **Step 1: 添加 `recognize_safe()` 方法**

在 `backend/ocr/engine.py` 的 `OCREngine` 类中，在 `recognize` 方法后添加新方法：

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

- [ ] **Step 2: 验证语法正确**

```bash
cd C:\project\Travel\backend && python -c "from ocr.engine import OCREngine; e = OCREngine.__new__(OCREngine); print('OK')"
```

预期输出: `OK`

- [ ] **Step 3: 提交**

```bash
git add backend/ocr/engine.py
git commit -m "feat(ocr): 新增安全识别方法带自动重试机制"
```

---

## Task 4: 改造单张识别函数

**Files:**
- Modify: `backend/ocr_service.py:44-93`

- [ ] **Step 1: 修改 `recognize_single()` 函数**

将 `backend/ocr_service.py` 中的 `recognize_single` 函数修改为使用 `recognize_safe`：

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

        # 使用安全识别方法（带预处理和自动重试）
        ocr_result, debug_info = ocr_engine.recognize_safe(image_path)

        if not ocr_result:
            return {
                "success": False,
                "error": debug_info.get("error", "无法识别图片内容"),
                "debug": debug_info
            }

        # 如果未指定类型，自动判断
        if not doc_type:
            doc_type = detect_document_type(ocr_result)

        # 使用对应解析器
        if doc_type not in parsers:
            return {
                "success": False,
                "error": f"不支持的证件类型: {doc_type}"
            }

        parser = parsers[doc_type]
        result = parser.parse(ocr_result)

        return {
            "success": True,
            "doc_type": doc_type,
            "data": result,
            "debug": {
                "text_count": debug_info.get("text_count", 0),
                "avg_confidence": debug_info.get("avg_confidence", 0),
                "raw_texts": debug_info.get("raw_texts", [])[:10],  # 只返回前10条
                "retried": debug_info.get("retried", False)
            }
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
```

- [ ] **Step 2: 验证语法正确**

```bash
cd C:\project\Travel\backend && python -c "import ocr_service; print('OK')"
```

预期输出: `OK`

- [ ] **Step 3: 提交**

```bash
git add backend/ocr_service.py
git commit -m "refactor(ocr): 单张识别改用安全识别方法"
```

---

## Task 5: 改造批量识别函数

**Files:**
- Modify: `backend/ocr_service.py:96-171`

- [ ] **Step 1: 修改 `recognize_batch()` 函数中的 OCR 调用**

找到 `recognize_batch` 函数中调用 `ocr_engine.recognize` 的地方，改为 `recognize_safe`：

```python
def recognize_batch(zip_path):
    """批量识别压缩包中的证件图片"""
    results = []
    failed = []
    temp_dir = tempfile.mkdtemp()

    try:
        # 解压
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)

        ocr_engine = OCREngine()

        parsers = {
            "id_card": IDCardParser(),
            "hk_macao_pass": HKMacaoPassParser(),
            "passport": PassportParser(),
        }

        image_extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.gif')
        image_count = 0

        for root, dirs, files in os.walk(temp_dir):
            for filename in files:
                file_path = os.path.join(root, filename)
                ext = os.path.splitext(filename)[1].lower()

                if ext in image_extensions:
                    image_count += 1
                    try:
                        # 使用安全识别方法（带预处理和自动重试）
                        ocr_result, debug_info = ocr_engine.recognize_safe(file_path)

                        if ocr_result:
                            doc_type = detect_document_type(ocr_result)
                            parser = parsers.get(doc_type)

                            if parser:
                                data = parser.parse(ocr_result)
                                data['doc_type'] = doc_type
                                data['source_file'] = filename
                                results.append(data)
                            else:
                                failed.append({
                                    "filename": filename,
                                    "reason": f"证件类型 '{doc_type}' 暂不支持"
                                })
                        else:
                            failed.append({
                                "filename": filename,
                                "reason": debug_info.get("error", "未检测到文字")
                            })

                    except Exception as e:
                        failed.append({
                            "filename": filename,
                            "reason": str(e)
                        })

        return {
            "success": True,
            "results": results,
            "failed": failed,
            "count": len(results),
            "failed_count": len(failed),
            "total_count": image_count
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        # 清理临时目录
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
```

- [ ] **Step 2: 验证语法正确**

```bash
cd C:\project\Travel\backend && python -c "import ocr_service; print('OK')"
```

预期输出: `OK`

- [ ] **Step 3: 提交**

```bash
git add backend/ocr_service.py
git commit -m "refactor(ocr): 批量识别改用安全识别方法"
```

---

## 完成确认

- [ ] **最终验证：启动后端服务测试**

```bash
cd C:\project\Travel\backend && node app.js
```

确认服务正常启动，无报错。

---

## 变更总结

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `backend/ocr_service.py` | 修改 | 添加递归限制、改用安全识别方法 |
| `backend/ocr/preprocess.py` | 修改 | 新增 `standardize_image()` 函数 |
| `backend/ocr/engine.py` | 修改 | 新增 `recognize_safe()` 方法 |
