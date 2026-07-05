"""
护照解析器
"""
from typing import List, Dict, Any
from .base import BaseParser
import re


class PassportParser(BaseParser):
    """护照解析器（支持中国护照和外国护照）"""

    def parse(self, ocr_result: List[Dict]) -> Dict[str, Any]:
        """
        解析护照信息

        返回字段：
        - name: 姓名（中文或英文）
        - name_cn: 中文名称（中国护照）
        - name_en: 英文名称
        - gender: 性别
        - birth_date: 出生日期
        - birth_place: 出生地点
        - passport_number: 护照号码
        - nationality: 国籍
        - valid_until: 有效期至
        - issue_place: 签发地点
        - issue_date: 签发日期
        """
        lines = self.get_text_lines(ocr_result)
        text = "\n".join(lines)

        # 检测是否为中国护照
        is_chinese = "中华人民共和国" in text or "护照" in text

        result = {
            "name": self._extract_name(lines, is_chinese),
            "name_cn": self._extract_name_cn(lines) if is_chinese else "",
            "name_en": self._extract_name_en(lines),
            "gender": self._extract_gender(text),
            "birth_date": self._extract_birth_date(text, lines, is_chinese),
            "birth_place": self._extract_birth_place(text, is_chinese),
            "passport_number": self._extract_passport_number(text),
            "nationality": self._extract_nationality(text, is_chinese),
            "valid_until": self._extract_valid_date(text),
            "issue_place": self._extract_issue_place(text, is_chinese),
            "issue_date": self._extract_issue_date(text),
        }

        return result

    def _extract_name(self, lines: List[str], is_chinese: bool) -> str:
        """提取姓名"""
        if is_chinese:
            name_cn = self._extract_name_cn(lines)
            if name_cn:
                return name_cn
        return self._extract_name_en(lines)

    def _extract_name_cn(self, lines: List[str]) -> str:
        """提取中文姓名"""
        for i, line in enumerate(lines):
            if "姓名" in line:
                name = re.sub(r"姓\s*名\s*", "", line).strip()
                if name and all('\u4e00' <= c <= '\u9fff' or c.isspace() for c in name):
                    return name
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    if all('\u4e00' <= c <= '\u9fff' or c.isspace() for c in next_line):
                        return next_line
        return ""

    def _extract_name_en(self, lines: List[str]) -> str:
        """提取英文姓名"""
        for line in lines:
            # 匹配机器可读区（P<CHN<...）
            if line.startswith("P<"):
                parts = line[3:].split("<<")
                if len(parts) >= 2:
                    surname = parts[0].replace("<", " ").strip()
                    given = parts[1].replace("<", " ").strip()
                    return f"{surname} {given}".strip()

        # 普通英文名格式
        for line in lines:
            if re.match(r"^[A-Z]+\s+[A-Z]+$", line.strip()):
                return line.strip().title()

        return ""

    def _extract_gender(self, text: str) -> str:
        """提取性别"""
        if "男" in text or "M" in text.split():
            return "男"
        elif "女" in text or "F" in text.split():
            return "女"
        return ""

    def _extract_birth_date(self, text: str, lines: List[str], is_chinese: bool) -> str:
        """提取出生日期"""
        # 尝试多种格式
        patterns = [
            r"(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日",
            r"(\d{2})[./](\d{2})[./](\d{4})",
            r"(\d{4})[-./](\d{2})[-./](\d{2})",
        ]

        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                groups = match.groups()
                if len(groups[0]) == 4:
                    return f"{groups[0]}-{groups[1].zfill(2)}-{groups[2].zfill(2)}"
                else:
                    return f"{groups[2]}-{groups[1].zfill(2)}-{groups[0].zfill(2)}"

        # 机器可读区提取（格式：YYMMDD）
        for line in lines:
            if len(line) >= 20 and line.startswith("P<"):
                # 尝试解析机器可读区第二行
                pass

        return ""

    def _extract_birth_place(self, text: str, is_chinese: bool) -> str:
        """提取出生地点"""
        if is_chinese:
            match = re.search(r"出生地点\s*(\S+)", text)
            if match:
                return match.group(1)

            # 省份列表
            provinces = ["北京", "上海", "天津", "重庆", "河北", "山西", "辽宁",
                        "吉林", "黑龙江", "江苏", "浙江", "安徽", "福建", "江西",
                        "山东", "河南", "湖北", "湖南", "广东", "广西", "海南",
                        "四川", "贵州", "云南", "陕西", "甘肃", "青海", "内蒙古",
                        "广西", "西藏", "宁夏", "新疆"]

            for prov in provinces:
                if prov in text:
                    return prov

        return ""

    def _extract_passport_number(self, text: str) -> str:
        """提取护照号码"""
        # 中国护照：E + 8位数字
        match = re.search(r"E\d{8}", text)
        if match:
            return match.group()

        # 其他护照号码格式
        match = re.search(r"[A-Z]\d{8}", text)
        if match:
            return match.group()

        match = re.search(r"[A-Z]{2}\d{7}", text)
        if match:
            return match.group()

        return ""

    def _extract_nationality(self, text: str, is_chinese: bool) -> str:
        """提取国籍"""
        if is_chinese:
            return "中国"

        # 尝试提取国籍信息
        match = re.search(r"国籍\s*(\S+)", text)
        if match:
            return match.group(1)

        match = re.search(r"Nationality\s*[：:]\s*(\w+)", text, re.IGNORECASE)
        if match:
            return match.group(1)

        return ""

    def _extract_valid_date(self, text: str) -> str:
        """提取有效期"""
        patterns = [
            r"有效期[至到]\s*(\d{4})[-./](\d{2})[-./](\d{2})",
            r"(\d{4})[-./](\d{2})[-./](\d{2})",
        ]

        # 找到所有日期，取最后一个（通常是有效期）
        matches = list(re.finditer(r"(\d{4})[-./](\d{2})[-./](\d{2})", text))
        if matches:
            last_match = matches[-1]
            return f"{last_match.group(1)}-{last_match.group(2)}-{last_match.group(3)}"

        return ""

    def _extract_issue_place(self, text: str, is_chinese: bool) -> str:
        """提取签发地点"""
        if is_chinese:
            match = re.search(r"签发地点\s*(\S+)", text)
            if match:
                return match.group(1)

            match = re.search(r"签发地\s*(\S+)", text)
            if match:
                return match.group(1)

        return ""

    def _extract_issue_date(self, text: str) -> str:
        """提取签发日期"""
        # 找到所有日期，取第一个（通常是签发日期）
        matches = list(re.finditer(r"(\d{4})[-./](\d{2})[-./](\d{2})", text))
        if len(matches) >= 2:
            first_match = matches[0]
            return f"{first_match.group(1)}-{first_match.group(2)}-{first_match.group(3)}"

        return ""
