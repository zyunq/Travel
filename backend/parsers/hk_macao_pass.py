"""
港澳通行证解析器
"""
from typing import List, Dict, Any
from .base import BaseParser
import re


class HKMacaoPassParser(BaseParser):
    """港澳通行证解析器"""

    def parse(self, ocr_result: List[Dict]) -> Dict[str, Any]:
        """
        解析港澳通行证信息

        返回字段：
        - name: 姓名
        - name_en: 英文姓名
        - birth_date: 出生日期
        - gender: 性别
        - id_number: 证件号码
        - valid_until: 有效期至
        - issue_place: 签发地
        """
        lines = self.get_text_lines(ocr_result)
        text = "\n".join(lines)

        result = {
            "name": self._extract_name(lines),
            "name_en": self._extract_name_en(lines),
            "birth_date": self._extract_birth_date(text),
            "gender": self._extract_gender(text),
            "id_number": self._extract_id_number(text),
            "valid_until": self._extract_valid_date(text),
            "issue_place": self._extract_issue_place(text),
        }

        return result

    def _extract_name(self, lines: List[str]) -> str:
        """提取中文姓名"""
        for i, line in enumerate(lines):
            if "姓名" in line:
                name = re.sub(r"姓\s*名\s*", "", line).strip()
                if name:
                    return name
                if i + 1 < len(lines):
                    return lines[i + 1].strip()
        return ""

    def _extract_name_en(self, lines: List[str]) -> str:
        """提取英文姓名"""
        for line in lines:
            # 匹配大写字母开头的英文名
            if re.match(r"^[A-Z][a-z]+\s+[A-Z][a-z]+$", line.strip()):
                return line.strip()
            # 匹配 P< 开头的机器可读区
            if line.startswith("P<"):
                parts = line[3:].split("<<")
                if len(parts) >= 1:
                    surname = parts[0].replace("<", " ").strip()
                    given = parts[1].replace("<", " ").strip() if len(parts) > 1 else ""
                    return f"{surname} {given}".strip()
        return ""

    def _extract_birth_date(self, text: str) -> str:
        """提取出生日期"""
        # 匹配 YYYY-MM-DD 或 YYYY.MM.DD 格式
        match = re.search(r"(\d{4})[-./](\d{2})[-./](\d{2})", text)
        if match:
            return f"{match.group(1)}-{match.group(2)}-{match.group(3)}"
        return ""

    def _extract_gender(self, text: str) -> str:
        """提取性别"""
        if "男" in text or "M" in text.upper():
            return "男"
        elif "女" in text or "F" in text.upper():
            return "女"
        return ""

    def _extract_id_number(self, text: str) -> str:
        """提取证件号码"""
        # 港澳通行证号码格式：C+8位数字 或 E+8位数字
        match = re.search(r"[CE]\d{8}", text)
        if match:
            return match.group()
        return ""

    def _extract_valid_date(self, text: str) -> str:
        """提取有效期"""
        match = re.search(r"有效期[至到]\s*(\d{4})[-./](\d{2})[-./](\d{2})", text)
        if match:
            return f"{match.group(1)}-{match.group(2)}-{match.group(3)}"
        return ""

    def _extract_issue_place(self, text: str) -> str:
        """提取签发地"""
        match = re.search(r"签发地\s*(\S+)", text)
        if match:
            return match.group(1)
        return ""
