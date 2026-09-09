# Test syntax check
# This file tests if the recognize_safe method was added correctly

def test_syntax():
    """Test that we can parse the engine.py file"""
    import ast
    with open('backend/ocr/engine.py', 'r', encoding='utf-8') as f:
        content = f.read()
    try:
        ast.parse(content)
        print("✓ Syntax check passed")
        return True
    except SyntaxError as e:
        print(f"✗ Syntax error at line {e.lineno}: {e.msg}")
        return False

def test_method_exists():
    """Test that the recognize_safe method exists"""
    import re
    with open('backend/ocr/engine.py', 'r', encoding='utf-8') as f:
        content = f.read()

    if 'def recognize_safe(self, image_path: str, max_retries: int = 1)' in content:
        print("✓ recognize_safe method found")
        return True
    else:
        print("✗ recognize_safe method not found")
        return False

def test_imports():
    """Test that RecursionError is handled"""
    with open('backend/ocr/engine.py', 'r', encoding='utf-8') as f:
        content = f.read()

    if 'except RecursionError as e:' in content:
        print("✓ RecursionError handling found")
        return True
    else:
        print("✗ RecursionError handling not found")
        return False

if __name__ == '__main__':
    print("Running verification tests...")
    print("-" * 50)

    test1 = test_syntax()
    test2 = test_method_exists()
    test3 = test_imports()

    print("-" * 50)
    if all([test1, test2, test3]):
        print("✓ All tests passed!")
    else:
        print("✗ Some tests failed")
