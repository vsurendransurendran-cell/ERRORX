"""
ERRORX - Core Analysis Engine Runner
Command-line and standard I/O interface for running Python AST analysis,
rule diagnostics, and traceback parsing safely without code execution.
"""

import sys
import os
import json
import ast
from typing import Dict, Any, List

# Ensure root directory and backend directory are on sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
root_dir = os.path.dirname(backend_dir)
for p in [root_dir, backend_dir, current_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.analyzer.syntax import analyze_syntax
    from backend.analyzer.rules import run_static_rules
    from backend.analyzer.traceback_parser import parse_traceback
except ImportError:
    from syntax import analyze_syntax
    from rules import run_static_rules
    from traceback_parser import parse_traceback

MAX_CODE_LENGTH = 100_000  # 100 KB limit for security & memory protection


def analyze_python_code(code: str, traceback_str: str = "") -> Dict[str, Any]:
    """
    Main analysis entry point.
    Returns:
    {
        "valid_syntax": bool,
        "diagnostics": List[Dict],
        "metrics": {
            "total_lines": int,
            "error_count": int,
            "warning_count": int,
            "info_count": int
        },
        "has_suggested_fixes": bool,
        "traceback_diagnostic": Optional[Dict]
    }
    """
    if len(code) > MAX_CODE_LENGTH:
        return {
            "error": f"Input exceeds maximum allowed length of {MAX_CODE_LENGTH} characters.",
            "valid_syntax": False,
            "diagnostics": [{
                "id": "limit-exceeded",
                "category": "security",
                "severity": "error",
                "line": 1,
                "col": 1,
                "message": f"Input size limit exceeded ({len(code)} bytes > {MAX_CODE_LENGTH} bytes limit).",
                "explanation": {
                    "what_it_does": "Submitted code payload exceeded size boundaries.",
                    "why_problematic": "Guards server resources and prevents denial of service.",
                    "how_to_fix": "Please submit code snippets under 100KB for analysis.",
                    "concept_to_learn": "Input Validation & Resource Limits"
                },
                "suggested_fix": None,
                "learning_concept": {
                    "title": "Defensive Resource Management",
                    "explanation": "Static analysis parses code into Abstract Syntax Trees. Setting upper bounds on payload size prevents unbounded memory consumption.",
                    "example": "",
                    "prevention_tip": "Keep analysis units modular."
                }
            }],
            "metrics": {"total_lines": 0, "error_count": 1, "warning_count": 0, "info_count": 0},
            "has_suggested_fixes": False
        }

    lines = code.splitlines()
    total_lines = len(lines)
    diagnostics: List[Dict[str, Any]] = []

    # 1. First parse syntax
    syntax_error = analyze_syntax(code)

    if syntax_error:
        valid_syntax = False
        diagnostics.append(syntax_error)
    else:
        valid_syntax = True
        if code.strip():
            try:
                tree = ast.parse(code)
                rule_findings = run_static_rules(code, tree)
                diagnostics.extend(rule_findings)
            except Exception as e:
                diagnostics.append({
                    "id": "ast-rule-exception",
                    "category": "analysis",
                    "severity": "info",
                    "line": 1,
                    "col": 1,
                    "message": f"Static analysis note: {str(e)}",
                    "explanation": {
                        "what_it_does": "A rule encountered a non-fatal parsing variation.",
                        "why_problematic": "Some static rules could not complete.",
                        "how_to_fix": "Review syntax standard.",
                        "concept_to_learn": "Static Analysis Rule Traversal"
                    },
                    "suggested_fix": None,
                    "learning_concept": None
                })

    # 2. Check for optional traceback
    tb_diag = None
    if traceback_str and traceback_str.strip():
        tb_diag = parse_traceback(traceback_str.strip())
        if tb_diag:
            diagnostics.insert(0, tb_diag)

    # Calculate metrics
    error_count = sum(1 for d in diagnostics if d.get("severity") == "error")
    warning_count = sum(1 for d in diagnostics if d.get("severity") == "warning")
    info_count = sum(1 for d in diagnostics if d.get("severity") == "info")
    has_suggested_fixes = any(d.get("suggested_fix") is not None for d in diagnostics)

    return {
        "valid_syntax": valid_syntax,
        "diagnostics": diagnostics,
        "metrics": {
            "total_lines": total_lines,
            "error_count": error_count,
            "warning_count": warning_count,
            "info_count": info_count
        },
        "has_suggested_fixes": has_suggested_fixes,
        "traceback_diagnostic": tb_diag
    }


def main():
    """
    Standard I/O CLI runner.
    Reads JSON from stdin: {"code": "...", "traceback": "..."}
    Outputs JSON response to stdout.
    """
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({
                "error": "Empty request input",
                "valid_syntax": True,
                "diagnostics": [],
                "metrics": {"total_lines": 0, "error_count": 0, "warning_count": 0, "info_count": 0},
                "has_suggested_fixes": False
            }))
            return

        payload = json.loads(raw_input)
        code = payload.get("code", "")
        traceback_str = payload.get("traceback", "")

        result = analyze_python_code(code, traceback_str)
        print(json.dumps(result, indent=2))
    except Exception as exc:
        print(json.dumps({
            "error": f"Internal analyzer error: {str(exc)}",
            "valid_syntax": False,
            "diagnostics": [],
            "metrics": {"total_lines": 0, "error_count": 1, "warning_count": 0, "info_count": 0},
            "has_suggested_fixes": False
        }))

if __name__ == "__main__":
    main()
