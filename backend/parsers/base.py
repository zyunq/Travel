"""
解析器基类
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any


class BaseParser(ABC):
    """证件解析器基类"""

    @abstractmethod
    def parse(self, ocr_result: List[Dict]) -> Dict[str, Any]:
        """
        解析 OCR 结果

        Args:
            ocr_result: OCR 识别结果

        Returns:
            解析后的结构化数据
        """
        pass

    def get_text_lines(self, ocr_result: List[Dict]) -> List[str]:
        """获取所有文本行"""
        return [line["text"] for line in ocr_result]

    def find_text_after_keyword(
        self,
        lines: List[str],
        keyword: str,
        default: str = ""
    ) -> str:
        """
        查找关键词后的文本

        Args:
            lines: 文本行列表
            keyword: 关键词
            default: 默认值

        Returns:
            关键词后的文本
        """
        for i, line in enumerate(lines):
            if keyword in line:
                # 如果关键词和值在同一行
                value = line.replace(keyword, "").strip()
                if value:
                    return value
                # 如果值在下一行
                if i + 1 < len(lines):
                    return lines[i + 1].strip()
        return default

    def extract_number(self, text: str) -> str:
        """提取文本中的数字和字母"""
        return "".join(c for c in text if c.isalnum())
