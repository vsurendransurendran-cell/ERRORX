"""
ERRORX - Python Syntax and Indentation Analyzer
Deterministic AST and token parsing for Python source code.
Detects SyntaxError, IndentationError, TabError with accurate root-cause heuristics and suggested fixes.
"""

import ast
import re
import tokenize
import io
from typing import Dict, Any, Optional, List

def analyze_syntax(code: str) -> Optional[Dict[str, Any]]:
    """
    Parses code using Python ast.parse and compile().
    If a syntax/indentation error occurs, returns structured diagnostic information.
    If valid syntax, returns None.
    """
    if not code.strip():
        return None

    try:
        # First attempt ast.parse
        ast.parse(code)
        # Also attempt compile in 'exec' mode to catch additional compilation-level errors
        compile(code, '<string>', 'exec')
        return None
    except (SyntaxError, IndentationError, TabError) as err:
        return _format_syntax_error(code, err)
    except Exception as err:
        return {
            "id": "parse-error",
            "category": "syntax",
            "severity": "error",
            "line": 1,
            "col": 1,
            "end_line": 1,
            "end_col": 1,
            "message": f"Parsing failed: {str(err)}",
            "code_snippet": code.splitlines()[0] if code.splitlines() else "",
            "explanation": {
                "what_it_does": "The Python parser encountered an unexpected error while reading the code.",
                "why_problematic": "Python could not compile the submitted source code.",
                "how_to_fix": "Verify that the input is valid Python code.",
                "concept_to_learn": "Python source code compilation"
            },
            "suggested_fix": None,
            "learning_concept": {
                "title": "Python Compilation Process",
                "explanation": "Before executing Python code, the Python interpreter compiles the source code into bytecode. If the source violates Python's formal grammar rules, compilation halts immediately with a SyntaxError.",
                "example": "x = 10\nprint(x)",
                "prevention_tip": "Check that all statements follow Python language grammar."
            }
        }


def _format_syntax_error(code: str, err: SyntaxError) -> Dict[str, Any]:
    lines = code.splitlines()
    lineno = err.lineno or 1
    offset = err.offset or 1
    line_idx = max(0, min(lineno - 1, len(lines) - 1)) if lines else 0
    problem_line = lines[line_idx] if lines else ""

    # Classify category
    is_indentation = isinstance(err, IndentationError) or isinstance(err, TabError) or "indent" in str(err).lower()
    category = "indentation" if is_indentation else "syntax"

    # Analyze error message and pattern heuristics
    heuristic = _detect_syntax_heuristic(code, lines, lineno, offset, err, problem_line)

    return {
        "id": f"syntax-{lineno}-{offset}",
        "category": category,
        "severity": "error",
        "line": lineno,
        "col": offset,
        "end_line": lineno,
        "end_col": offset,
        "message": heuristic.get("message", str(err.msg or err)),
        "code_snippet": problem_line,
        "explanation": heuristic["explanation"],
        "suggested_fix": heuristic.get("suggested_fix"),
        "learning_concept": heuristic["learning_concept"],
        "confidence": "high"
    }


def _detect_syntax_heuristic(
    code: str,
    lines: List[str],
    lineno: int,
    offset: int,
    err: SyntaxError,
    problem_line: str
) -> Dict[str, Any]:
    msg = str(err.msg or err)
    stripped = problem_line.strip()

    # 1. Check for missing colon on compound statements
    # e.g., if x > 5, def foo(), for item in items, class MyClass, while True, etc.
    compound_keywords = (
        'if ', 'elif ', 'else:', 'else', 'for ', 'while ', 'def ', 'class ',
        'try:', 'try', 'except ', 'except:', 'except', 'finally:', 'finally', 'with '
    )
    is_compound = any(stripped.startswith(kw) for kw in compound_keywords) or re.match(r'^(if|elif|else|for|while|def|class|try|except|finally|with)\b', stripped)

    if is_compound and not stripped.endswith(':') and not stripped.endswith('\\'):
        # Check if previous or current line lacks colon
        fixed_line = problem_line.rstrip() + ':'
        new_lines = list(lines)
        new_lines[lineno - 1] = fixed_line
        full_patched = '\n'.join(new_lines)

        return {
            "message": f"SyntaxError: Missing colon ':' at the end of '{stripped.split()[0]}' statement",
            "explanation": {
                "what_it_does": f"The '{stripped.split()[0]}' header opens a new code block without a terminating colon.",
                "why_problematic": "In Python, compound statements (like if, for, while, def, class, try) must end with a colon ':' to indicate the start of an indented suite.",
                "how_to_fix": f"Add a colon ':' at the end of line {lineno}.",
                "concept_to_learn": "Python Compound Statements and Colon Syntax"
            },
            "suggested_fix": {
                "original": problem_line,
                "replacement": fixed_line,
                "explanation": "Appended missing colon ':' to close the block header.",
                "assumptions": "Assumes the block body continues on subsequent indented lines.",
                "full_patched_code": full_patched
            },
            "learning_concept": {
                "title": "Block Headers & Colons in Python",
                "explanation": "Unlike languages that use curly braces { }, Python uses a colon ':' followed by an indented block to delineate scope.",
                "example": "# Incorrect:\nif score > 90\n    print('A')\n\n# Correct:\nif score > 90:\n    print('A')",
                "prevention_tip": "Always remember: every statement that starts a code block (if, elif, else, def, class, while, for, try, with) ends with a colon."
            }
        }

    # 2. Check for assignment in condition: if x = 5:
    assignment_in_cond = re.search(r'^(if|elif|while)\s+(.+?)\s*=\s*([^=].*):?$', stripped)
    if assignment_in_cond and not stripped.startswith(('if ==', 'if !=')):
        var_name = assignment_in_cond.group(2).strip()
        val_expr = assignment_in_cond.group(3).rstrip(':').strip()
        kw = assignment_in_cond.group(1)
        fixed_line = problem_line.replace(f"{var_name} = {val_expr}", f"{var_name} == {val_expr}")
        if not fixed_line.strip().endswith(':'):
            fixed_line = fixed_line.rstrip() + ':'
        new_lines = list(lines)
        new_lines[lineno - 1] = fixed_line
        full_patched = '\n'.join(new_lines)

        return {
            "message": "SyntaxError: Assignment operator '=' used instead of equality comparison '==' in condition",
            "explanation": {
                "what_it_does": f"Attempted to assign a value with '=' inside a '{kw}' condition expression.",
                "why_problematic": "A single '=' is the assignment operator in Python. Conditional statements test truth values and require comparison operators like '==' or the walrus operator ':='.",
                "how_to_fix": "Replace '=' with '==' for equality comparison, or use ':=' if intentional assignment expression is desired.",
                "concept_to_learn": "Assignment (=) vs Equality Comparison (==)"
            },
            "suggested_fix": {
                "original": problem_line,
                "replacement": fixed_line,
                "explanation": "Replaced '=' with '==' to perform comparison rather than assignment.",
                "assumptions": "Assumes equality check is intended.",
                "full_patched_code": full_patched
            },
            "learning_concept": {
                "title": "Equality (==) vs Assignment (=)",
                "explanation": "'=' assigns a value to a variable. '==' compares two values and evaluates to True or False. Using '=' in an if-condition is invalid in Python.",
                "example": "# Incorrect:\nif user_role = 'admin':\n    pass\n\n# Correct:\nif user_role == 'admin':\n    pass",
                "prevention_tip": "When asking 'is this equal to that?', use '=='. When saying 'store this into that', use '='."
            }
        }

    # 3. Check for Python 2 print statement: print "hello"
    py2_print = re.match(r'^print\s+([^\(].*)$', stripped)
    if py2_print:
        content = py2_print.group(1).rstrip()
        fixed_line = problem_line.replace(stripped, f"print({content})")
        new_lines = list(lines)
        new_lines[lineno - 1] = fixed_line
        full_patched = '\n'.join(new_lines)

        return {
            "message": "SyntaxError: Missing parentheses in call to 'print'. Did you mean print(...) ?",
            "explanation": {
                "what_it_does": "Called print as a statement without parentheses (Python 2 syntax).",
                "why_problematic": "In Python 3, 'print' is a built-in function, not a statement keyword. Functions must be called with parentheses ().",
                "how_to_fix": f"Wrap the arguments in parentheses: print({content})",
                "concept_to_learn": "Python 3 Print Function"
            },
            "suggested_fix": {
                "original": problem_line,
                "replacement": fixed_line,
                "explanation": "Wrapped print arguments in parentheses.",
                "assumptions": "Standard print function call.",
                "full_patched_code": full_patched
            },
            "learning_concept": {
                "title": "print() is a Function in Python 3",
                "explanation": "Python 2 allowed 'print \"message\"'. Python 3 strictly requires 'print(\"message\")'.",
                "example": "# Python 3:\nprint('Hello, World!')\nprint('Total:', 42)",
                "prevention_tip": "Always put parentheses around the arguments you pass to print()."
            }
        }

    # 4. IndentationError handling
    if isinstance(err, IndentationError) or isinstance(err, TabError) or "indent" in msg.lower():
        is_expected = "expected an indented block" in msg.lower()
        is_unexpected = "unexpected indent" in msg.lower()
        is_unindent = "unindent does not match" in msg.lower()

        detail_what = "The code indentation does not match Python's block structure rules."
        detail_why = "Python uses indentation (whitespace) to determine the structure and nesting of statements."
        detail_fix = "Ensure standard 4-space indentation for nested code blocks."

        if is_expected:
            detail_what = f"The line after a block header on line {max(1, lineno - 1)} requires indentation, but none was found."
            detail_why = "When a statement ends with ':', Python expects the next non-empty line to be indented to form the block body."
            detail_fix = f"Indent line {lineno} by 4 spaces (or insert 'pass' if the block is intentionally empty)."
        elif is_unexpected:
            detail_what = f"Line {lineno} has extra spaces that do not align with any containing block."
            detail_why = "Python encountered unexpected leading whitespace on this line."
            detail_fix = f"Remove unnecessary leading spaces so line {lineno} aligns with surrounding code."
        elif is_unindent:
            detail_what = f"Line {lineno} unindents to a level that does not match any previous block indentation."
            detail_why = "Python requires matching indentation levels when exiting nested blocks."
            detail_fix = "Align this line with the target outer block's indentation level (typically multiples of 4 spaces)."

        # Try generating fix by indenting or unindenting
        suggested_fix = None
        if is_expected and lineno > 1:
            prev_line = lines[lineno - 2]
            prev_indent = len(prev_line) - len(prev_line.lstrip())
            fixed_line = " " * (prev_indent + 4) + stripped
            new_lines = list(lines)
            new_lines[lineno - 1] = fixed_line
            suggested_fix = {
                "original": problem_line,
                "replacement": fixed_line,
                "explanation": "Indented line by 4 spaces under the preceding header.",
                "assumptions": "Assumes this statement belongs inside the preceding block.",
                "full_patched_code": '\n'.join(new_lines)
            }

        return {
            "message": f"IndentationError: {msg}",
            "explanation": {
                "what_it_does": detail_what,
                "why_problematic": detail_why,
                "how_to_fix": detail_fix,
                "concept_to_learn": "Python Indentation and Block Scoping"
            },
            "suggested_fix": suggested_fix,
            "learning_concept": {
                "title": "Python Indentation Rules (PEP 8)",
                "explanation": "Python does not use { } to enclose code blocks. Instead, 4 spaces per indentation level define where functions, loops, and conditions begin and end.",
                "example": "def greet(name):\n    # 4 spaces of indentation\n    if name:\n        # 8 spaces of indentation\n        return f'Hello, {name}'\n    return 'Hello, Guest'",
                "prevention_tip": "Configure your editor to use spaces instead of tabs, with tab size set to 4 spaces."
            }
        }

    # 5. Check for unclosed parenthesis, bracket, or curly brace
    unclosed = _find_unclosed_delimiters(code, lineno)
    if unclosed:
        delim_char, delim_line, delim_col = unclosed
        matching_char = { '(': ')', '[': ']', '{': '}' }.get(delim_char, '')
        fixed_line = lines[delim_line - 1] + matching_char
        new_lines = list(lines)
        new_lines[delim_line - 1] = fixed_line
        full_patched = '\n'.join(new_lines)

        return {
            "message": f"SyntaxError: Unclosed delimiter '{delim_char}' opened on line {delim_line}",
            "explanation": {
                "what_it_does": f"An opening delimiter '{delim_char}' on line {delim_line} was never closed with '{matching_char}'.",
                "why_problematic": "Python continues reading across newlines until opening parentheses, brackets, or braces are closed. When it reaches an unexpected token or EOF, syntax parsing fails.",
                "how_to_fix": f"Add the closing '{matching_char}' on line {delim_line} or where the expression terminates.",
                "concept_to_learn": "Bracket, Parenthesis, and Brace Balancing"
            },
            "suggested_fix": {
                "original": lines[delim_line - 1],
                "replacement": fixed_line,
                "explanation": f"Closed '{delim_char}' with '{matching_char}'.",
                "assumptions": f"Assumes closing delimiter belongs at the end of line {delim_line}.",
                "full_patched_code": full_patched
            },
            "learning_concept": {
                "title": "Delimiter Matching in Python",
                "explanation": "Every '(', '[', and '{' in Python must have a matching ')', ']', and '}'. If left unclosed, Python treats subsequent lines as part of the same expression.",
                "example": "# Incorrect:\ntotal = sum([1, 2, 3\n\n# Correct:\ntotal = sum([1, 2, 3])",
                "prevention_tip": "Count your parentheses and brackets whenever Python flags a SyntaxError at the start of a seemingly normal line."
            }
        }

    # 6. Fallback general syntax error
    return {
        "message": f"SyntaxError: {msg}",
        "explanation": {
            "what_it_does": f"Encountered invalid Python syntax near line {lineno}, column {offset}: '{problem_line.strip()}'",
            "why_problematic": "The Python interpreter could not parse this line according to Python language grammar.",
            "how_to_fix": f"Inspect line {lineno} and the preceding line for typos, missing symbols, or misplaced keywords.",
            "concept_to_learn": "Python Syntax Validation"
        },
        "suggested_fix": None,
        "learning_concept": {
            "title": "Understanding Python Syntax Errors",
            "explanation": "A SyntaxError indicates that Python cannot understand the token structure of your code. Often the real issue is on the flagged line or the immediate line above it.",
            "example": "# Common causes include missing colons, mismatched quotes, or extra keywords.",
            "prevention_tip": "Look directly above the line where the error was reported; errors often originate from an unclosed string or parenthesis on the prior line."
        }
    }


def _find_unclosed_delimiters(code: str, error_lineno: int) -> Optional[tuple]:
    """
    Scans tokens up to error_lineno to find unclosed (, [, or {.
    Returns (char, lineno, col) if found.
    """
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    try:
        tokens = tokenize.tokenize(io.BytesIO(code.encode('utf-8')).readline)
        for tok in tokens:
            if tok.start[0] > error_lineno + 1:
                break
            if tok.type == tokenize.OP:
                val = tok.string
                if val in '([{':
                    stack.append((val, tok.start[0], tok.start[1]))
                elif val in ')]}':
                    if stack and stack[-1][0] == pairs[val]:
                        stack.pop()
    except Exception:
        pass

    if stack:
        return stack[-1]
    return None
