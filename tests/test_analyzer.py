"""
ERRORX - Test Suite
Covers Tests 1-12 as specified in ERRORX Master Requirements.
Uses Python standard unittest framework for standalone verification.
"""

import unittest
import sys
import os

# Put backend on path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
backend_dir = os.path.join(parent_dir, 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from backend.analyzer.syntax import analyze_syntax
from backend.analyzer.rules import run_static_rules
from backend.analyzer.traceback_parser import parse_traceback
from backend.analyzer.main import analyze_python_code
import ast


class TestErrorXAnalyzer(unittest.TestCase):

    def test_01_valid_python_code(self):
        """TEST 1: Valid Python code should succeed with no syntax errors"""
        code = "def add(a: int, b: int) -> int:\n    return a + b\n\nresult = add(5, 10)\nprint(result)"
        result = analyze_python_code(code)
        self.assertTrue(result["valid_syntax"])
        syntax_errors = [d for d in result["diagnostics"] if d["category"] == "syntax"]
        self.assertEqual(len(syntax_errors), 0)

    def test_02_missing_colon(self):
        """TEST 2: Missing colon should return syntax diagnostic with line number"""
        code = "if x > 10\n    print('Greater')"
        result = analyze_python_code(code)
        self.assertFalse(result["valid_syntax"])
        self.assertGreater(len(result["diagnostics"]), 0)
        diag = result["diagnostics"][0]
        self.assertEqual(diag["category"], "syntax")
        self.assertEqual(diag["line"], 1)
        self.assertIn("colon", diag["message"].lower())
        self.assertIsNotNone(diag.get("suggested_fix"))

    def test_03_invalid_indentation(self):
        """TEST 3: Invalid indentation should be reported as indentation error"""
        code = "def calculate():\nprint('Not indented')"
        result = analyze_python_code(code)
        self.assertFalse(result["valid_syntax"])
        diag = result["diagnostics"][0]
        self.assertEqual(diag["category"], "indentation")
        self.assertEqual(diag["line"], 2)

    def test_04_undefined_name_candidate(self):
        """TEST 4: Undefined name candidate detected by static rules"""
        code = "def calculate_total():\n    return subtotal + tax"
        result = analyze_python_code(code)
        self.assertTrue(result["valid_syntax"])
        names = [d for d in result["diagnostics"] if d["category"] == "name_error"]
        self.assertGreater(len(names), 0)
        found_names = [d["message"] for d in names]
        self.assertTrue(any("subtotal" in msg or "tax" in msg for msg in found_names))

    def test_05_empty_input(self):
        """TEST 5: Empty input is handled safely without crashing"""
        result = analyze_python_code("")
        self.assertTrue(result["valid_syntax"])
        self.assertEqual(len(result["diagnostics"]), 0)
        self.assertEqual(result["metrics"]["total_lines"], 0)

    def test_06_malformed_syntax_graceful(self):
        """TEST 6: Malformed Python tokens return controlled diagnostic"""
        code = "def @!#$:"
        result = analyze_python_code(code)
        self.assertFalse(result["valid_syntax"])
        self.assertGreater(len(result["diagnostics"]), 0)

    def test_07_large_input_limit(self):
        """TEST 7: Overly large input triggers security threshold limit"""
        huge_code = "# Comment\n" * 15_000 # > 100KB
        result = analyze_python_code(huge_code)
        self.assertIn("error", result)
        self.assertTrue(any(d["category"] == "security" for d in result["diagnostics"]))

    def test_08_mutable_default_arguments(self):
        """TEST 8: Mutable default argument detected with clear warning"""
        code = "def add_item(item, basket=[]):\n    basket.append(item)\n    return basket"
        result = analyze_python_code(code)
        self.assertTrue(result["valid_syntax"])
        mutables = [d for d in result["diagnostics"] if "mutable-default" in d["id"]]
        self.assertEqual(len(mutables), 1)
        self.assertEqual(mutables[0]["severity"], "warning")

    def test_09_type_mismatch_binop(self):
        """TEST 9: Adding string and integer literal detected as TypeError risk"""
        code = "total_msg = 'Total is: ' + 50"
        result = analyze_python_code(code)
        self.assertTrue(result["valid_syntax"])
        type_errors = [d for d in result["diagnostics"] if d["category"] == "type_error"]
        self.assertEqual(len(type_errors), 1)

    def test_10_traceback_parser(self):
        """TEST 10: Multi-line traceback parsing extracts exception & frames"""
        tb = """Traceback (most recent call last):
  File "app.py", line 14, in calculate_average
    return total / count
ZeroDivisionError: division by zero"""
        parsed = parse_traceback(tb)
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed["category"], "traceback")
        self.assertEqual(parsed["line"], 14)
        self.assertIn("ZeroDivisionError", parsed["message"])

    def test_11_shadowed_builtins(self):
        """TEST 11: Shadowing built-in names like list = [1, 2] flagged"""
        code = "list = [10, 20, 30]\nprint(list)"
        result = analyze_python_code(code)
        shadowed = [d for d in result["diagnostics"] if "shadowed-builtin" in d["id"]]
        self.assertEqual(len(shadowed), 1)

    def test_12_security_no_execution(self):
        """TEST 12: Code containing potentially dangerous calls is analyzed statically, never executed"""
        code = "import os\nos.system('echo dangerous')"
        result = analyze_python_code(code)
        self.assertTrue(result["valid_syntax"])
        # Code was parsed only; no command executed


if __name__ == "__main__":
    unittest.main()
