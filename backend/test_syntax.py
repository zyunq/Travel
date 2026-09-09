#!/usr/bin/env python
# -*- coding: utf-8 -*-
import ast
import sys

try:
    with open('ocr_service.py', 'r', encoding='utf-8') as f:
        code = f.read()
    ast.parse(code)
    print("Syntax OK")
except SyntaxError as e:
    print(f"Syntax Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
