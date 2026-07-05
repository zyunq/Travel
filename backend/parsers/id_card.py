"""
大陆居民身份证解析器
"""
from typing import List, Dict, Any
from .base import BaseParser
import re


class IDCardParser(BaseParser):
    """大陆居民身份证解析器"""

    def parse(self, ocr_result: List[Dict]) -> Dict[str, Any]:
        """
        解析身份证信息

        返回字段：
        - name: 姓名
        - gender: 性别
        - nation: 民族
        - birth_date: 出生日期
        - address: 住址
        - id_number: 身份证号
        """
        lines = self.get_text_lines(ocr_result)
        text = "\n".join(lines)

        result = {
            "name": self._extract_name(lines),
            "gender": self._extract_gender(text),
            "nation": self._extract_nation(text),
            "birth_date": self._extract_birth_date(text),
            "address": self._extract_address(lines),
            "id_number": self._extract_id_number(text),
        }

        return result

    def _extract_name(self, lines: List[str]) -> str:
        """提取姓名"""
        for i, line in enumerate(lines):
            if "姓名" in line or "姓 名" in line:
                # 姓名在同一行
                name = re.sub(r"姓\s*名", "", line).strip()
                if name:
                    return name
                # 姓名在下一行
                if i + 1 < len(lines):
                    return lines[i + 1].strip()
        return ""

    def _extract_gender(self, text: str) -> str:
        """提取性别"""
        if "男" in text:
            return "男"
        elif "女" in text:
            return "女"
        return ""

    def _extract_nation(self, text: str) -> str:
        """提取民族"""
        match = re.search(r"民族\s*(\S+)", text)
        if match:
            return match.group(1)

        # 常见民族列表
        nations = ["汉", "蒙古", "回", "藏", "维吾尔", "苗", "彝", "壮", "布依",
                   "朝鲜", "满", "侗", "瑶", "白", "土家", "哈尼", "哈萨克", "傣", "黎"]

        for nation in nations:
            if nation in text:
                return nation + "族" if len(nation) == 1 else nation

        return ""

    def _extract_birth_date(self, text: str) -> str:
        """提取出生日期"""
        # 尝试匹配 YYYY年MM月DD日 格式
        match = re.search(r"(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日", text)
        if match:
            year, month, day = match.groups()
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"

        # 尝试从身份证号提取
        id_match = re.search(r"\d{17}[\dXx]", text)
        if id_match:
            id_num = id_match.group()
            year = id_num[6:10]
            month = id_num[10:12]
            day = id_num[12:14]
            return f"{year}-{month}-{day}"

        return ""

    def _extract_address(self, lines: List[str]) -> str:
        """提取住址"""
        address_lines = []
        in_address = False

        for line in lines:
            if "住址" in line:
                in_address = True
                addr = re.sub(r"住\s*址", "", line).strip()
                if addr:
                    address_lines.append(addr)
            elif in_address:
                # 地址通常到公民身份号码前结束
                if "公民身份号码" in line or "身份号码" in line:
                    break
                if line.strip():
                    address_lines.append(line.strip())

        return "".join(address_lines)

    def _extract_id_number(self, text: str) -> str:
        """提取身份证号"""
        match = re.search(r"\d{17}[\dXx]", text)
        if match:
            return match.group().upper()
        return ""
