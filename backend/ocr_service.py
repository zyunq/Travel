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
sys.setrecursionlimit(10000)  # 增加递归深度限制，解决 PaddleOCR 递归超限问题

# 同时增加 PIL 的递归限制
import PIL.Image
PIL.Image.MAX_IMAGE_PIXELS = None

import os
import json
import tempfile
import zipfile
import shutil

# 添加当前目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ocr.engine import OCREngine
from parsers.id_card import IDCardParser
from parsers.hk_macao_pass import HKMacaoPassParser
from parsers.passport import PassportParser


def detect_document_type(ocr_result):
    """根据 OCR 结果自动判断证件类型"""
    text = " ".join([line["text"] for line in ocr_result])

    if "居民身份证" in text or "身份証" in text or "公民身份号码" in text:
        return "id_card"
    elif "港澳通行证" in text or "往来港澳" in text:
        return "hk_macao_pass"
    elif "护照" in text or "PASSPORT" in text.upper():
        return "passport"
    else:
        return "id_card"  # 默认当作身份证处理


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


def get_supported_types():
    """获取支持的证件类型"""
    return {
        "types": [
            {"code": "id_card", "name": "大陆居民身份证"},
            {"code": "hk_macao_pass", "name": "港澳通行证"},
            {"code": "passport", "name": "护照"},
        ]
    }


def main():
    # 设置 stdout 编码为 UTF-8（Windows 兼容）
    if sys.platform == 'win32':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "用法: python ocr_service.py <command> [args]"
        }))
        sys.exit(1)

    command = sys.argv[1]

    if command == "types":
        result = get_supported_types()

    elif command == "recognize":
        if len(sys.argv) < 3:
            result = {"success": False, "error": "请提供图片路径"}
        else:
            image_path = sys.argv[2]
            doc_type = sys.argv[3] if len(sys.argv) > 3 else None
            result = recognize_single(image_path, doc_type)

    elif command == "batch":
        if len(sys.argv) < 3:
            result = {"success": False, "error": "请提供ZIP文件路径"}
        else:
            zip_path = sys.argv[2]
            result = recognize_batch(zip_path)

    else:
        result = {"success": False, "error": f"未知命令: {command}"}

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
