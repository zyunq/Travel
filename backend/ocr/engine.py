"""
PaddleOCR 引擎封装 - 增强版，带详细日志
"""
from paddleocr import PaddleOCR
from typing import List, Dict, Tuple
import os
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class OCREngine:
    _instance = None

    def __new__(cls, use_gpu: bool = False, lang: str = 'ch'):
        """单例模式，避免重复初始化 OCR 引擎"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, use_gpu: bool = False, lang: str = 'ch'):
        """
        初始化 OCR 引擎

        Args:
            use_gpu: 是否使用 GPU
            lang: 语言，'ch' 为中文，'en' 为英文
        """
        if self._initialized:
            return

        logger.info(f"初始化 OCR 引擎: lang={lang}, use_gpu={use_gpu}")
        import logging
        logging.getLogger('ppocr').setLevel(logging.ERROR)
        self.ocr = PaddleOCR(
            use_angle_cls=True,
            lang=lang
        )
        self._initialized = True

    def recognize(self, image_path: str) -> Tuple[List[Dict], Dict]:
        """
        识别图片中的文字

        Args:
            image_path: 图片路径

        Returns:
            (识别结果列表, 调试信息)
        """
        debug_info = {
            "image_path": image_path,
            "ocr_success": False,
            "text_count": 0,
            "avg_confidence": 0,
            "raw_texts": [],
            "error": None
        }

        try:
            result = self.ocr.ocr(image_path, cls=True)

            if not result:
                debug_info["error"] = "OCR返回空结果"
                logger.warning(f"[OCR] {image_path} - 返回空结果")
                return [], debug_info

            if not result[0]:
                debug_info["error"] = "未检测到任何文字"
                logger.warning(f"[OCR] {image_path} - 未检测到文字")
                return [], debug_info

            lines = []
            total_confidence = 0

            for line in result[0]:
                text = line[1][0]
                confidence = line[1][1]
                position = line[0]

                lines.append({
                    "text": text,
                    "confidence": confidence,
                    "position": position
                })
                debug_info["raw_texts"].append(text)
                total_confidence += confidence

            debug_info["ocr_success"] = True
            debug_info["text_count"] = len(lines)
            debug_info["avg_confidence"] = round(total_confidence / len(lines), 3) if lines else 0

            logger.info(f"[OCR] {image_path} - 识别成功: {len(lines)}行文字, 平均置信度: {debug_info['avg_confidence']}")

            return lines, debug_info

        except Exception as e:
            debug_info["error"] = str(e)
            logger.error(f"[OCR] {image_path} - 识别异常: {e}")
            return [], debug_info

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

        # 重试：直接识别原图（跳过预处理，不使用角度分类）
        if max_retries > 0:
            debug_info["retried"] = True
            try:
                # 重试时不使用角度分类，减少递归深度
                result = self.ocr.ocr(image_path, cls=False)
                if result and result[0]:
                    lines = []
                    total_confidence = 0
                    for line in result[0]:
                        text = line[1][0]
                        confidence = line[1][1]
                        position = line[0]
                        lines.append({
                            "text": text,
                            "confidence": confidence,
                            "position": position
                        })
                        debug_info["raw_texts"].append(text)
                        total_confidence += confidence
                    debug_info["ocr_success"] = True
                    debug_info["text_count"] = len(lines)
                    debug_info["avg_confidence"] = round(total_confidence / len(lines), 3) if lines else 0
                    return lines, debug_info
            except RecursionError as e:
                debug_info["error"] = f"重试后仍递归超限: {str(e)[:100]}"
            except Exception as e:
                debug_info["error"] = f"重试失败: {str(e)[:200]}"

        return [], debug_info

    def recognize_with_debug(self, image_path: str) -> Dict:
        """
        识别图片并返回完整的调试信息

        Args:
            image_path: 图片路径

        Returns:
            包含识别结果和调试信息的字典
        """
        lines, debug_info = self.recognize(image_path)

        # 按 Y 坐标排序（从上到下）
        if lines:
            lines.sort(key=lambda x: x["position"][0][1])

        return {
            "lines": lines,
            "raw_text": "\n".join([line["text"] for line in lines]),
            "debug": debug_info
        }

    def analyze_image_type(self, lines: List[Dict]) -> Dict:
        """
        分析图片可能是什么类型

        Args:
            lines: OCR 识别结果

        Returns:
            分析结果
        """
        if not lines:
            return {
                "detected": False,
                "possible_types": [],
                "reason": "未检测到文字"
            }

        text = " ".join([line["text"] for line in lines])
        possible_types = []
        detected_keywords = []

        # 检测身份证关键词
        id_card_keywords = ["姓名", "性别", "民族", "出生", "住址", "公民身份号码", "居民身份证"]
        found_id = [kw for kw in id_card_keywords if kw in text]
        if found_id:
            possible_types.append("身份证")
            detected_keywords.extend(found_id)

        # 检测护照关键词
        passport_keywords = ["护照", "PASSPORT", "国籍", "NATIONALITY", "签发地"]
        found_passport = [kw for kw in passport_keywords if kw in text.upper()]
        if found_passport:
            possible_types.append("护照")
            detected_keywords.extend(found_passport)

        # 检测港澳通行证关键词
        hk_keywords = ["港澳通行证", "往来港澳", "通行证"]
        found_hk = [kw for kw in hk_keywords if kw in text]
        if found_hk:
            possible_types.append("港澳通行证")
            detected_keywords.extend(found_hk)

        # 检测是否可能是个人照片
        if len(lines) < 3:
            possible_types.append("可能是个人照片/头像")

        # 检测是否只有英文
        if all(ord(c) < 128 or c.isspace() for c in text if c):
            possible_types.append("纯英文内容")

        return {
            "detected": len(possible_types) > 0,
            "possible_types": possible_types,
            "keywords_found": detected_keywords,
            "text_count": len(lines),
            "sample_text": text[:200] if text else ""
        }
