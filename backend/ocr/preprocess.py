"""
图片预处理工具
"""
from PIL import Image
import numpy as np
from typing import Tuple


def preprocess_image(image_path: str, output_path: str = None) -> str:
    """
    图片预处理：调整大小、增强对比度等

    Args:
        image_path: 原图路径
        output_path: 输出路径，默认覆盖原图

    Returns:
        处理后的图片路径
    """
    img = Image.open(image_path)

    # 转换为 RGB（如果是 RGBA）
    if img.mode == 'RGBA':
        img = img.convert('RGB')

    # 如果图片太大，缩放到合适尺寸
    max_size = 2000
    if max(img.size) > max_size:
        ratio = max_size / max(img.size)
        new_size = tuple(int(dim * ratio) for dim in img.size)
        img = img.resize(new_size, Image.LANCZOS)

    # 增强对比度
    from PIL import ImageEnhance
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.2)

    # 保存
    if output_path is None:
        output_path = image_path
    img.save(output_path, quality=95)

    return output_path


def rotate_image_if_needed(image_path: str) -> Tuple[str, bool]:
    """
    如果需要则旋转图片（基于 EXIF 信息）

    Args:
        image_path: 图片路径

    Returns:
        (图片路径, 是否旋转了)
    """
    img = Image.open(image_path)

    # 获取 EXIF 方向信息
    try:
        from PIL import ImageOps
        img = ImageOps.exif_transpose(img)
        img.save(image_path)
        return image_path, True
    except:
        return image_path, False


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
