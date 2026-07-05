# 解析器模块
from .base import BaseParser
from .id_card import IDCardParser
from .hk_macao_pass import HKMacaoPassParser
from .passport import PassportParser

__all__ = [
    "BaseParser",
    "IDCardParser",
    "HKMacaoPassParser",
    "PassportParser",
]
