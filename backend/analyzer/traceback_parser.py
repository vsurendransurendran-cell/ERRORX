"""
ERRORX - Traceback and Runtime Exception Parser
Parses user-submitted Python stack traces, pinpoints root failure lines and exceptions,
and generates human-readable diagnostics and remediation steps.
"""

import re
from typing import List, Dict, Any, Optional

# Knowledge base of common Python runtime exceptions
EXCEPTION_GUIDES = {
    "IndexError": {
        "title": "IndexError: Sequence Index Out of Range",
        "what": "The program attempted to access an item at an index position that does not exist in the list, tuple, or string.",
        "why": "Python lists are 0-indexed (indices run from 0 to len - 1). Attempting to access an index >= len(sequence) raises IndexError.",
        "how": "Check the sequence length with len(seq) before indexing, or use 'for item in seq:' or exception guards.",
        "example": "# Buggy:\nitems = ['apple', 'banana']\nval = items[2] # Raises IndexError\n\n# Correct:\nif len(items) > 2:\n    val = items[2]",
        "prevention": "Remember zero-indexing: the last element is seq[-1], and valid indices are 0 to len(seq) - 1."
    },
    "KeyError": {
        "title": "KeyError: Dictionary Key Not Found",
        "what": "The program attempted to read a key from a dictionary using dict[key], but the key does not exist.",
        "why": "Standard square bracket notation [] requires the key to exist in the dictionary; if missing, KeyError is raised.",
        "how": "Use dict.get(key, default) instead of dict[key], or verify existence with 'if key in my_dict:'.",
        "example": "# Buggy:\nuser = {'name': 'Alice'}\nage = user['age'] # Raises KeyError\n\n# Correct:\nage = user.get('age', 0) # Returns 0 gracefully",
        "prevention": "Use .get() when a dictionary key might be optional."
    },
    "AttributeError": {
        "title": "AttributeError: Object Has No Such Attribute",
        "what": "The program tried to access a method or property on an object that does not define it, or the object is unexpectedly None.",
        "why": "Frequently happens when a function that returned None was chained (e.g., list.sort() returns None, so list.sort().append() fails).",
        "how": "Verify that the variable is the expected type and not None using 'if obj is not None:'.",
        "example": "# Common trap: .sort() modifies in-place and returns None\nnums = [3, 1, 2]\n# nums = nums.sort() # nums becomes None!\nnums.sort()\nprint(nums)",
        "prevention": "Remember methods that modify objects in-place (sort, append, reverse) return None."
    },
    "TypeError": {
        "title": "TypeError: Incompatible Types or Arguments",
        "what": "An operation or function was applied to an object of inappropriate type, or wrong number of arguments was supplied.",
        "why": "Python does not automatically coerce types (e.g. adding integer to string), or a function call signature was mismatched.",
        "how": "Inspect variable types with type(...) and use explicit conversions like str(x) or int(x).",
        "example": "# Fix:\nmessage = f'Result: {count}'",
        "prevention": "Use type annotations (x: int) and check function parameter signatures."
    },
    "ValueError": {
        "title": "ValueError: Right Type but Inappropriate Value",
        "what": "A function received an argument with the right data type but an invalid value (e.g., int('abc')).",
        "why": "The input cannot be converted or processed under the function's internal constraints.",
        "how": "Use try/except ValueError or input validation before calling conversion functions.",
        "example": "try:\n    num = int(user_input)\nexcept ValueError:\n    print('Please enter valid digits')",
        "prevention": "Sanitize and validate user strings before converting with int() or float()."
    },
    "ZeroDivisionError": {
        "title": "ZeroDivisionError: Division by Zero",
        "what": "A division (/) or modulo (%) operation had a divisor of zero.",
        "why": "Mathematical division by zero is undefined.",
        "how": "Add a guard check 'if divisor != 0:' before dividing.",
        "example": "ratio = (part / total) if total != 0 else 0.0",
        "prevention": "Always guard denominators before mathematical divisions."
    },
    "FileNotFoundError": {
        "title": "FileNotFoundError: File Does Not Exist",
        "what": "The program tried to open or read a file at a path that does not exist on the filesystem.",
        "why": "Incorrect file path, working directory mismatch, or file has not been created yet.",
        "how": "Check file existence with os.path.exists() or pathlib.Path.is_file().",
        "example": "from pathlib import Path\nfile_path = Path('data.csv')\nif file_path.is_file():\n    data = file_path.read_text()",
        "prevention": "Use pathlib.Path and relative paths anchored to __file__."
    },
    "RecursionError": {
        "title": "RecursionError: Maximum Recursion Depth Exceeded",
        "what": "A recursive function called itself repeatedly without reaching a terminating base case.",
        "why": "Missing or unreachable base case in recursion causes stack overflow.",
        "how": "Ensure every recursion branch moves towards a base condition that terminates without recurring.",
        "example": "def countdown(n):\n    if n <= 0: # Base case\n        return\n    countdown(n - 1)",
        "prevention": "Always write and test your base case first when implementing recursion."
    }
}


def parse_traceback(tb_text: str) -> Optional[Dict[str, Any]]:
    """
    Parses a Python traceback string and extracts:
    - exception_type
    - exception_message
    - stack frames (file, line, func, code)
    - targeted explanation and learning concept
    """
    if not tb_text or "Traceback (most recent call last):" not in tb_text:
        # Check if user just pasted an error line like "IndexError: list index out of range"
        direct_match = re.search(r'^([A-Z][a-zA-Z0-9_]*(?:Error|Exception|Warning)):\s*(.*)$', tb_text.strip(), re.MULTILINE)
        if direct_match:
            exc_type = direct_match.group(1)
            exc_msg = direct_match.group(2)
            guide = EXCEPTION_GUIDES.get(exc_type, {
                "title": f"{exc_type} Runtime Exception",
                "what": f"Python threw a runtime {exc_type}.",
                "why": exc_msg,
                "how": "Inspect the variables and statements leading up to this exception.",
                "example": "",
                "prevention": "Add defensive error handling or validation."
            })

            return {
                "id": f"tb-direct-{exc_type}",
                "category": "traceback",
                "severity": "error",
                "line": None,
                "col": None,
                "end_line": None,
                "end_col": None,
                "message": f"{exc_type}: {exc_msg}",
                "code_snippet": "",
                "frames": [],
                "explanation": {
                    "what_it_does": guide["what"],
                    "why_problematic": f"The interpreter halted with: {exc_msg}",
                    "how_to_fix": guide["how"],
                    "concept_to_learn": guide["title"]
                },
                "suggested_fix": None,
                "learning_concept": {
                    "title": guide["title"],
                    "explanation": guide["why"],
                    "example": guide["example"],
                    "prevention_tip": guide["prevention"]
                },
                "confidence": "high"
            }
        return None

    # Parse multi-frame traceback
    frames = []
    # Frame regex: File "...", line 12, in <module>
    frame_pattern = re.compile(r'File\s+["\'](.*?)["\'],\s+line\s+(\d+)(?:,\s+in\s+(.*))?')
    lines = tb_text.splitlines()

    i = 0
    exc_type = "Exception"
    exc_msg = "Unknown error"

    while i < len(lines):
        line = lines[i].strip()
        match = frame_pattern.search(line)
        if match:
            file_name = match.group(1)
            lineno = int(match.group(2))
            func_name = match.group(3) or ""
            code_line = ""
            if i + 1 < len(lines) and not lines[i + 1].strip().startswith('File '):
                code_line = lines[i + 1].strip()
                i += 1
            frames.append({
                "file": file_name,
                "line": lineno,
                "function": func_name,
                "code": code_line
            })
        elif line and not line.startswith('Traceback'):
            # Check for final ExceptionType: message line
            exc_match = re.match(r'^([A-Z][a-zA-Z0-9_]*(?:Error|Exception|Warning)):\s*(.*)$', line)
            if exc_match:
                exc_type = exc_match.group(1)
                exc_msg = exc_match.group(2)
        i += 1

    last_frame = frames[-1] if frames else None
    guide = EXCEPTION_GUIDES.get(exc_type, {
        "title": f"{exc_type} Runtime Exception",
        "what": f"Python threw a runtime {exc_type}.",
        "why": exc_msg,
        "how": "Inspect the variables and statements leading up to this exception.",
        "example": "",
        "prevention": "Add defensive error handling or validation."
    })

    culprit_info = f" on line {last_frame['line']}" if last_frame else ""

    return {
        "id": f"traceback-{exc_type}",
        "category": "traceback",
        "severity": "error",
        "line": last_frame["line"] if last_frame else None,
        "col": 1,
        "end_line": last_frame["line"] if last_frame else None,
        "end_col": 1,
        "message": f"{exc_type}: {exc_msg}{culprit_info}",
        "code_snippet": last_frame["code"] if last_frame else "",
        "frames": frames,
        "explanation": {
            "what_it_does": guide["what"],
            "why_problematic": f"The program terminated at runtime: {exc_msg}",
            "how_to_fix": guide["how"],
            "concept_to_learn": guide["title"]
        },
        "suggested_fix": None,
        "learning_concept": {
            "title": guide["title"],
            "explanation": guide["why"],
            "example": guide["example"],
            "prevention_tip": guide["prevention"]
        },
        "confidence": "high"
    }
