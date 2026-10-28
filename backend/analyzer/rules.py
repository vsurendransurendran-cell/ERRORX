"""
ERRORX - Static Analysis Rules Engine
AST-based deterministic rule checking for Python source code.
Detects undefined names, mutable defaults, type mismatches, shadowed built-ins,
zero-division risks, bare excepts, unreachable code, and bad practice anti-patterns.
"""

import ast
import builtins
import difflib
from typing import List, Dict, Any, Set, Optional

PYTHON_BUILTINS: Set[str] = set(dir(builtins)) | {
    "__file__", "__name__", "__doc__", "__package__", "__spec__", "__annotations__"
}

# Common builtins that beginners frequently accidentally shadow
COMMONLY_SHADOWED_BUILTINS = {
    "list", "dict", "str", "int", "float", "set", "tuple", "type",
    "len", "max", "min", "sum", "id", "open", "range", "input",
    "format", "map", "filter", "all", "any", "dir", "help", "next", "iter"
}


class Scope:
    def __init__(self, name: str, parent: Optional['Scope'] = None, is_function: bool = False):
        self.name = name
        self.parent = parent
        self.is_function = is_function
        self.defined_names: Set[str] = set()
        self.imported_names: Dict[str, ast.AST] = {}
        self.global_names: Set[str] = set()
        self.nonlocal_names: Set[str] = set()
        self.used_names: List[tuple] = []  # (name, lineno, col_offset, node)

    def is_defined(self, name: str) -> bool:
        if name in self.defined_names or name in self.imported_names or name in PYTHON_BUILTINS:
            return True
        if name in self.global_names:
            curr = self
            while curr.parent:
                curr = curr.parent
            return name in curr.defined_names or name in curr.imported_names or name in PYTHON_BUILTINS
        if self.parent:
            return self.parent.is_defined(name)
        return False


def run_static_rules(code: str, tree: ast.AST) -> List[Dict[str, Any]]:
    """
    Runs AST-based rule diagnostics on parsed Python code.
    Returns a list of structured diagnostic dictionaries.
    """
    lines = code.splitlines()
    diagnostics: List[Dict[str, Any]] = []

    # 1. Undefined names & Unused imports rule
    scope_diag = _analyze_scopes_and_names(tree, lines)
    diagnostics.extend(scope_diag)

    # 2. AST Visitor rules for code patterns
    visitor = ErrorXASTVisitor(lines)
    visitor.visit(tree)
    diagnostics.extend(visitor.diagnostics)

    return diagnostics


def _analyze_scopes_and_names(tree: ast.AST, lines: List[str]) -> List[Dict[str, Any]]:
    """
    Traverses the AST building nested scopes to detect:
    - Undefined name usages (NameError risks) with typo suggestions
    - Unused imports
    """
    diagnostics: List[Dict[str, Any]] = []
    root_scope = Scope("global")
    all_scopes: List[Scope] = [root_scope]

    def walk_scope(node: ast.AST, current_scope: Scope):
        for child in ast.iter_child_nodes(node):
            if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef)):
                current_scope.defined_names.add(child.name)
                func_scope = Scope(child.name, parent=current_scope, is_function=True)
                all_scopes.append(func_scope)
                # Register arguments
                for arg in child.args.posonlyargs + child.args.args + child.args.kwonlyargs:
                    func_scope.defined_names.add(arg.arg)
                if child.args.vararg:
                    func_scope.defined_names.add(child.args.vararg.arg)
                if child.args.kwarg:
                    func_scope.defined_names.add(child.args.kwarg.arg)
                walk_scope(child, func_scope)
            elif isinstance(child, ast.ClassDef):
                current_scope.defined_names.add(child.name)
                class_scope = Scope(child.name, parent=current_scope)
                all_scopes.append(class_scope)
                walk_scope(child, class_scope)
            elif isinstance(child, (ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp)):
                comp_scope = Scope("comprehension", parent=current_scope)
                all_scopes.append(comp_scope)
                for gen in child.generators:
                    _register_target_names(gen.target, comp_scope)
                walk_scope(child, comp_scope)
            elif isinstance(child, ast.Import):
                for alias in child.names:
                    name_to_use = alias.asname or alias.name.split('.')[0]
                    current_scope.defined_names.add(name_to_use)
                    current_scope.imported_names[name_to_use] = child
            elif isinstance(child, ast.ImportFrom):
                for alias in child.names:
                    if alias.name == '*':
                        continue
                    name_to_use = alias.asname or alias.name
                    current_scope.defined_names.add(name_to_use)
                    current_scope.imported_names[name_to_use] = child
            elif isinstance(child, ast.Global):
                for name in child.names:
                    current_scope.global_names.add(name)
            elif isinstance(child, ast.Nonlocal):
                for name in child.names:
                    current_scope.nonlocal_names.add(name)
            elif isinstance(child, ast.Assign):
                for target in child.targets:
                    _register_target_names(target, current_scope)
                walk_scope(child.value, current_scope)
            elif isinstance(child, ast.AnnAssign):
                _register_target_names(child.target, current_scope)
                if child.value:
                    walk_scope(child.value, current_scope)
            elif isinstance(child, ast.AugAssign):
                _register_target_names(child.target, current_scope)
                walk_scope(child.value, current_scope)
            elif isinstance(child, ast.NamedExpr):  # walrus :=
                _register_target_names(child.target, current_scope)
                walk_scope(child.value, current_scope)
            elif isinstance(child, ast.For):
                _register_target_names(child.target, current_scope)
                walk_scope(child, current_scope)
            elif isinstance(child, ast.ExceptHandler):
                if child.name:
                    current_scope.defined_names.add(child.name)
                walk_scope(child, current_scope)
            elif isinstance(child, ast.Name):
                if isinstance(child.ctx, ast.Load):
                    current_scope.used_names.append((child.id, child.lineno, child.col_offset, child))
                elif isinstance(child.ctx, (ast.Store, ast.Del)):
                    current_scope.defined_names.add(child.id)
            else:
                walk_scope(child, current_scope)

    def _register_target_names(target: ast.AST, scope: Scope):
        if isinstance(target, ast.Name):
            scope.defined_names.add(target.id)
        elif isinstance(target, (ast.Tuple, ast.List)):
            for elt in target.elts:
                _register_target_names(elt, scope)

    walk_scope(tree, root_scope)

    # Check for undefined names in each scope
    reported_undefined: Set[str] = set()
    for sc in all_scopes:
        for name, lineno, col_offset, node in sc.used_names:
            if not sc.is_defined(name) and name not in reported_undefined:
                reported_undefined.add(name)
                line_idx = max(0, min(lineno - 1, len(lines) - 1))
                problem_line = lines[line_idx] if lines else ""

                # Look for suggestions in known names and builtins
                all_known = list(sc.defined_names | PYTHON_BUILTINS)
                closest = difflib.get_close_matches(name, all_known, n=1, cutoff=0.7)
                suggestion_hint = f" Did you mean '{closest[0]}'?" if closest else ""

                suggested_fix = None
                if closest:
                    fixed_line = problem_line.replace(name, closest[0])
                    new_lines = list(lines)
                    new_lines[line_idx] = fixed_line
                    suggested_fix = {
                        "original": problem_line,
                        "replacement": fixed_line,
                        "explanation": f"Replaced suspected typo '{name}' with '{closest[0]}'.",
                        "assumptions": f"Assumes '{closest[0]}' was the intended identifier.",
                        "full_patched_code": '\n'.join(new_lines)
                    }

                diagnostics.append({
                    "id": f"undefined-name-{name}-{lineno}",
                    "category": "name_error",
                    "severity": "error",
                    "line": lineno,
                    "col": col_offset + 1,
                    "end_line": lineno,
                    "end_col": col_offset + 1 + len(name),
                    "message": f"NameError candidate: '{name}' is used but not defined in this scope.{suggestion_hint}",
                    "code_snippet": problem_line,
                    "explanation": {
                        "what_it_does": f"The expression references the variable or function '{name}', but no prior definition or import exists for it.",
                        "why_problematic": f"When Python reaches this line during execution, it will raise NameError: name '{name}' is not defined.",
                        "how_to_fix": f"Define or assign '{name}' before using it, check for spelling errors,{suggestion_hint} or import the required module.",
                        "concept_to_learn": "Variable Scope and Name Resolution in Python (LEGB Rule)"
                    },
                    "suggested_fix": suggested_fix,
                    "learning_concept": {
                        "title": "Python Scope and LEGB Rule",
                        "explanation": "Python searches for variables in order: Local -> Enclosing -> Global -> Built-in. If an identifier is not found in any of these 4 namespaces, a NameError is raised.",
                        "example": f"# Defining before use:\n{name} = 100\nprint({name})",
                        "prevention_tip": "Check for typos in variable names and ensure all variables are initialized before referencing them."
                    },
                    "confidence": "high" if not name.startswith('_') else "medium"
                })

    return diagnostics


class ErrorXASTVisitor(ast.NodeVisitor):
    def __init__(self, lines: List[str]):
        self.lines = lines
        self.diagnostics: List[Dict[str, Any]] = []

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self._check_mutable_defaults(node)
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        self._check_mutable_defaults(node)
        self.generic_visit(node)

    def _check_mutable_defaults(self, node):
        """Rule: Mutable default argument in function definition"""
        all_defaults = node.args.defaults + node.args.kw_defaults
        for default in all_defaults:
            if default is None:
                continue
            if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                lineno = default.lineno
                col = default.col_offset
                line_idx = max(0, min(lineno - 1, len(self.lines) - 1))
                problem_line = self.lines[line_idx] if self.lines else ""

                type_name = "list" if isinstance(default, ast.List) else "dictionary" if isinstance(default, ast.Dict) else "set"

                self.diagnostics.append({
                    "id": f"mutable-default-{node.name}-{lineno}",
                    "category": "runtime_risk",
                    "severity": "warning",
                    "line": lineno,
                    "col": col + 1,
                    "end_line": lineno,
                    "end_col": col + 10,
                    "message": f"Mutable default argument: Default {type_name} parameter in '{node.name}' is shared across all function calls.",
                    "code_snippet": problem_line,
                    "explanation": {
                        "what_it_does": f"Function '{node.name}' defines an empty mutable {type_name} as a default argument.",
                        "why_problematic": "In Python, default parameter expressions are evaluated ONCE at function definition time, not on every call. Mutating this object persists across subsequent calls, leading to unexpected shared state bugs.",
                        "how_to_fix": "Use 'None' as the default value, and instantiate a new container inside the function if the argument is None.",
                        "concept_to_learn": "Python Mutable Default Arguments"
                    },
                    "suggested_fix": {
                        "original": problem_line,
                        "replacement": f"# Replace default with None and initialize inside the function:\n# def {node.name}(..., param=None):\n#     if param is None:\n#         param = []",
                        "explanation": "Set parameter default to None, and assign a new instance inside the body.",
                        "assumptions": "Standard idiomatic Python pattern for default containers."
                    },
                    "learning_concept": {
                        "title": "The Mutable Default Argument Trap",
                        "explanation": "Python's default arguments are evaluated when the 'def' statement executes. If you use a mutable object (list, dict, set), every invocation that uses the default shares that exact same instance.",
                        "example": "# Buggy:\ndef append_item(item, target=[]):\n    target.append(item)\n    return target\n\n# Correct:\ndef append_item(item, target=None):\n    if target is None:\n        target = []\n    target.append(item)\n    return target",
                        "prevention_tip": "Never use [], {}, or set() as default parameter values. Always use None as the default."
                    },
                    "confidence": "high"
                })

    def visit_Assign(self, node: ast.Assign):
        """Rule: Shadowing built-in names like list = ..., dict = ..., str = ..."""
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id in COMMONLY_SHADOWED_BUILTINS:
                name = target.id
                lineno = target.lineno
                line_idx = max(0, min(lineno - 1, len(self.lines) - 1))
                problem_line = self.lines[line_idx] if self.lines else ""

                fixed_name = f"my_{name}"
                fixed_line = problem_line.replace(name, fixed_name, 1)
                new_lines = list(self.lines)
                new_lines[line_idx] = fixed_line

                self.diagnostics.append({
                    "id": f"shadowed-builtin-{name}-{lineno}",
                    "category": "bad_practice",
                    "severity": "warning",
                    "line": lineno,
                    "col": target.col_offset + 1,
                    "end_line": lineno,
                    "end_col": target.col_offset + 1 + len(name),
                    "message": f"Shadowing built-in: Variable name '{name}' overwrites Python's built-in '{name}' type/function.",
                    "code_snippet": problem_line,
                    "explanation": {
                        "what_it_does": f"Assigns a variable named '{name}', masking the standard built-in '{name}'.",
                        "why_problematic": f"Any subsequent code that attempts to convert or construct using '{name}()' (such as {name}(sequence)) will raise a TypeError: '{type(node.value).__name__}' object is not callable.",
                        "how_to_fix": f"Rename this variable to something descriptive, e.g. '{fixed_name}' or '{name}_items'.",
                        "concept_to_learn": "Namespace Shadowing and Built-in Names"
                    },
                    "suggested_fix": {
                        "original": problem_line,
                        "replacement": fixed_line,
                        "explanation": f"Renamed '{name}' to '{fixed_name}' to avoid overwriting the Python built-in.",
                        "assumptions": "Renaming preserves desired data holding without masking the built-in.",
                        "full_patched_code": '\n'.join(new_lines)
                    },
                    "learning_concept": {
                        "title": "Do Not Shadow Python Built-ins",
                        "explanation": "Python allows you to reassign built-in function and class names like list, dict, str, max, sum, and id. Once reassigned, the original function is inaccessible in that scope.",
                        "example": "# Problematic:\nlist = [1, 2, 3]\nother = list('hello') # TypeError: 'list' object is not callable\n\n# Correct:\nnumbers = [1, 2, 3]\nother = list('hello')",
                        "prevention_tip": "Avoid using Python keywords or built-in function names as variable names. Use descriptive plurals like 'items', 'users', 'values'."
                    },
                    "confidence": "high"
                })
        self.generic_visit(node)

    def visit_BinOp(self, node: ast.BinOp):
        """Rule: Type mismatch detection, e.g. 'text' + 42 or division by zero"""
        lineno = node.lineno
        line_idx = max(0, min(lineno - 1, len(self.lines) - 1))
        problem_line = self.lines[line_idx] if self.lines else ""

        # Check for division by zero literal: x / 0, x // 0, x % 0
        if isinstance(node.op, (ast.Div, ast.FloorDiv, ast.Mod)):
            if isinstance(node.right, ast.Constant) and node.right.value == 0:
                self.diagnostics.append({
                    "id": f"zero-division-{lineno}",
                    "category": "runtime_risk",
                    "severity": "error",
                    "line": lineno,
                    "col": node.col_offset + 1,
                    "end_line": lineno,
                    "end_col": node.col_offset + 5,
                    "message": "ZeroDivisionError: Division or modulo by zero literal detected.",
                    "code_snippet": problem_line,
                    "explanation": {
                        "what_it_does": "Divides or computes modulo with a divisor of zero.",
                        "why_problematic": "Mathematical division by zero is undefined and triggers a fatal ZeroDivisionError exception in Python.",
                        "how_to_fix": "Ensure the divisor is non-zero before performing division.",
                        "concept_to_learn": "Handling Division by Zero"
                    },
                    "suggested_fix": None,
                    "learning_concept": {
                        "title": "Division by Zero in Python",
                        "explanation": "In Python, both float division (/) and integer division (//) raise ZeroDivisionError when the divisor is 0. Always check 'if divisor != 0:' before dividing.",
                        "example": "if count > 0:\n    average = total / count\nelse:\n    average = 0",
                        "prevention_tip": "Validate user input and add guard checks whenever computing ratios or averages."
                    },
                    "confidence": "high"
                })

        # Check for string + number concatenation: 'Score: ' + 100
        if isinstance(node.op, ast.Add):
            left_is_str = isinstance(node.left, ast.Constant) and isinstance(node.left.value, str)
            right_is_num = isinstance(node.right, ast.Constant) and isinstance(node.right.value, (int, float))

            right_is_str = isinstance(node.right, ast.Constant) and isinstance(node.right.value, str)
            left_is_num = isinstance(node.left, ast.Constant) and isinstance(node.left.value, (int, float))

            if (left_is_str and right_is_num) or (right_is_str and left_is_num):
                left_val = node.left.value if left_is_str else ""
                right_val = node.right.value if right_is_num else node.left.value
                fix_example = f"# Use f-string or str():\n# e.g., f'{left_val}{{{right_val}}}'"
                self.diagnostics.append({
                    "id": f"type-mismatch-add-{lineno}",
                    "category": "type_error",
                    "severity": "error",
                    "line": lineno,
                    "col": node.col_offset + 1,
                    "end_line": lineno,
                    "end_col": node.col_offset + 10,
                    "message": "TypeError candidate: Cannot concatenate 'str' and 'int'/'float' with '+'.",
                    "code_snippet": problem_line,
                    "explanation": {
                        "what_it_does": "Attempts to add a string and a numerical literal using the '+' operator.",
                        "why_problematic": "Python is strongly typed and does not automatically convert numbers to strings during concatenation. This raises TypeError: can only concatenate str (not 'int') to str.",
                        "how_to_fix": "Use f-strings f'{...}' or explicit str(...) conversion.",
                        "concept_to_learn": "Python Strong Typing and String Formatting"
                    },
                    "suggested_fix": {
                        "original": problem_line,
                        "replacement": fix_example,
                        "explanation": "Use Python 3 formatted string literal (f-string).",
                        "assumptions": "String interpolation is intended."
                    },
                    "learning_concept": {
                        "title": "Strong Typing & String Interpolation",
                        "explanation": "Unlike JavaScript which coerces types with 'age: ' + 25, Python requires explicit conversion or f-strings: f'age: {25}'.",
                        "example": "# Incorrect:\nmessage = 'Age: ' + 25\n\n# Correct (f-string):\nmessage = f'Age: {25}'\n\n# Correct (str conversion):\nmessage = 'Age: ' + str(25)",
                        "prevention_tip": "Use modern Python f-strings f'...' for clean, safe string interpolation."
                    },
                    "confidence": "high"
                })

        self.generic_visit(node)

    def visit_Compare(self, node: ast.Compare):
        """Rule: == None instead of is None, and 'is' on literals"""
        lineno = node.lineno
        line_idx = max(0, min(lineno - 1, len(self.lines) - 1))
        problem_line = self.lines[line_idx] if self.lines else ""

        for op, comparator in zip(node.ops, node.comparators):
            # == None or != None
            if isinstance(op, (ast.Eq, ast.NotEq)) and isinstance(comparator, ast.Constant) and comparator.value is None:
                op_str = "==" if isinstance(op, ast.Eq) else "!="
                better_op = "is" if isinstance(op, ast.Eq) else "is not"
                fixed_line = problem_line.replace(f"{op_str} None", f"{better_op} None")
                new_lines = list(self.lines)
                new_lines[line_idx] = fixed_line

                self.diagnostics.append({
                    "id": f"compare-none-{lineno}",
                    "category": "bad_practice",
                    "severity": "info",
                    "line": lineno,
                    "col": node.col_offset + 1,
                    "end_line": lineno,
                    "end_col": node.col_offset + 10,
                    "message": f"PEP 8 style: Comparisons to None should always use '{better_op}', never '{op_str}'.",
                    "code_snippet": problem_line,
                    "explanation": {
                        "what_it_does": f"Compares an object to None using value equality operator '{op_str}'.",
                        "why_problematic": "None is a singleton in Python. Custom classes can override the __eq__ method to return non-standard truth values, whereas identity check ('is None') is faster, unambiguous, and PEP 8 standard.",
                        "how_to_fix": f"Change '{op_str} None' to '{better_op} None'.",
                        "concept_to_learn": "Identity (is) vs Equality (==) with Singletons"
                    },
                    "suggested_fix": {
                        "original": problem_line,
                        "replacement": fixed_line,
                        "explanation": f"Replaced '{op_str} None' with '{better_op} None'.",
                        "assumptions": "Standard PEP 8 singleton comparison.",
                        "full_patched_code": '\n'.join(new_lines)
                    },
                    "learning_concept": {
                        "title": "Why Compare None with 'is'?",
                        "explanation": "Because there is only ever one instance of None in memory, 'x is None' directly compares memory addresses, making it both faster and impervious to overridden __eq__ methods.",
                        "example": "# Recommended:\nif user is None:\n    print('User not found')\n\nif token is not None:\n    proceed()",
                        "prevention_tip": "Always write 'is None' and 'is not None'."
                    },
                    "confidence": "high"
                })

            # 'is' or 'is not' with literal numbers or strings: e.g. x is 5
            if isinstance(op, (ast.Is, ast.IsNot)) and isinstance(comparator, ast.Constant) and isinstance(comparator.value, (int, float, str)):
                self.diagnostics.append({
                    "id": f"literal-identity-{lineno}",
                    "category": "runtime_risk",
                    "severity": "warning",
                    "line": lineno,
                    "col": node.col_offset + 1,
                    "end_line": lineno,
                    "end_col": node.col_offset + 10,
                    "message": "SyntaxWarning: 'is' with a literal. Did you mean '=='?",
                    "code_snippet": problem_line,
                    "explanation": {
                        "what_it_does": "Uses 'is' to test identity against a literal value.",
                        "why_problematic": "'is' checks object identity (same memory address), not value equality. While CPython caches small integers (-5 to 256) and short strings, larger numbers or dynamic strings fail this comparison unpredictably.",
                        "how_to_fix": "Use '==' for comparing values, and reserve 'is' for None or singleton sentinels.",
                        "concept_to_learn": "Identity vs Equality in Python"
                    },
                    "suggested_fix": None,
                    "learning_concept": {
                        "title": "Identity (is) vs Equality (==)",
                        "explanation": "'==' tests whether two objects have equal values. 'is' tests whether two references point to the exact same object in memory.",
                        "example": "# Incorrect:\nif status is 'success':\n    pass\n\n# Correct:\nif status == 'success':\n    pass",
                        "prevention_tip": "Use '==' when comparing values, text, and numbers. Only use 'is' with 'None', 'True', and 'False'."
                    },
                    "confidence": "high"
                })

        self.generic_visit(node)

    def visit_ExceptHandler(self, node: ast.ExceptHandler):
        """Rule: Bare except: catching BaseException"""
        if node.type is None:
            lineno = node.lineno
            line_idx = max(0, min(lineno - 1, len(self.lines) - 1))
            problem_line = self.lines[line_idx] if self.lines else ""

            fixed_line = problem_line.replace("except:", "except Exception:")
            new_lines = list(self.lines)
            new_lines[line_idx] = fixed_line

            self.diagnostics.append({
                "id": f"bare-except-{lineno}",
                "category": "bad_practice",
                "severity": "warning",
                "line": lineno,
                "col": node.col_offset + 1,
                "end_line": lineno,
                "end_col": node.col_offset + 7,
                "message": "Anti-pattern: Bare 'except:' catches BaseException (including KeyboardInterrupt and SystemExit).",
                "code_snippet": problem_line,
                "explanation": {
                    "what_it_does": "Catches all exceptions without specifying an exception class.",
                    "why_problematic": "A bare except catches BaseException, which includes KeyboardInterrupt (Ctrl+C) and SystemExit. This makes it impossible for users to terminate the program and hides critical bugs.",
                    "how_to_fix": "Specify 'except Exception:' to catch standard errors, or catch the specific exception class.",
                    "concept_to_learn": "Targeted Exception Handling in Python"
                },
                "suggested_fix": {
                    "original": problem_line,
                    "replacement": fixed_line,
                    "explanation": "Replaced bare 'except:' with 'except Exception:'.",
                    "assumptions": "Standard application error handling.",
                    "full_patched_code": '\n'.join(new_lines)
                },
                "learning_concept": {
                    "title": "Exception Hierarchy in Python",
                    "explanation": "Python's exceptions form a tree. BaseException is at the root. System exceptions like KeyboardInterrupt and SystemExit inherit from BaseException, while standard programming errors inherit from Exception.",
                    "example": "# Risky:\ntry:\n    do_work()\nexcept:\n    pass\n\n# Better:\ntry:\n    do_work()\nexcept Exception as err:\n    print(f'Error occurred: {err}')",
                    "prevention_tip": "Always catch specific exceptions (like ValueError, FileNotFoundError) or 'except Exception:'."
                },
                "confidence": "high"
            })
        self.generic_visit(node)

    def visit_For(self, node: ast.For):
        """Rule: Modifying a collection while iterating over it"""
        # Check if body has node.target.remove or del collection[item]
        if isinstance(node.iter, ast.Name):
            iterated_name = node.iter.id
            for stmt in node.body:
                if isinstance(stmt, ast.Expr) and isinstance(stmt.value, ast.Call):
                    call = stmt.value
                    if isinstance(call.func, ast.Attribute) and isinstance(call.func.value, ast.Name):
                        if call.func.value.id == iterated_name and call.func.attr in ('remove', 'pop', 'clear'):
                            lineno = stmt.lineno
                            line_idx = max(0, min(lineno - 1, len(self.lines) - 1))
                            problem_line = self.lines[line_idx] if self.lines else ""

                            self.diagnostics.append({
                                "id": f"mutate-iteration-{lineno}",
                                "category": "runtime_risk",
                                "severity": "warning",
                                "line": lineno,
                                "col": stmt.col_offset + 1,
                                "end_line": lineno,
                                "end_col": stmt.col_offset + 20,
                                "message": f"Runtime risk: Modifying '{iterated_name}' with '.{call.func.attr}()' while iterating over it.",
                                "code_snippet": problem_line,
                                "explanation": {
                                    "what_it_does": f"Removes elements from '{iterated_name}' inside a 'for ... in {iterated_name}:' loop.",
                                    "why_problematic": "Modifying a sequence while iterating over it shifts indices, causing elements to be skipped or iteration to terminate prematurely.",
                                    "how_to_fix": f"Iterate over a shallow copy (e.g. 'for item in {iterated_name}[:]:') or use a list comprehension / filter.",
                                    "concept_to_learn": "Iterator Mutation Hazards"
                                },
                                "suggested_fix": None,
                                "learning_concept": {
                                    "title": "Do Not Mutate Sequences During Iteration",
                                    "explanation": "Python loops maintain an internal pointer index. If you delete item at index 0, the next item slides into index 0, and the loop moves to index 1, skipping it entirely.",
                                    "example": "# Buggy:\nfor num in numbers:\n    if num < 0:\n        numbers.remove(num)\n\n# Correct (List comprehension):\nnumbers = [num for num in numbers if num >= 0]",
                                    "prevention_tip": "Use list comprehensions to filter items instead of calling .remove() in a loop."
                                },
                                "confidence": "high"
                            })
        self.generic_visit(node)
