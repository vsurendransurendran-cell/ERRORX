# ERRORX — Python Error Analysis & Debugging Assistant

**Team**: Code Phantom  
**Participant**: V Surendran  
**Competition**: Code Conqueror India  
**Status**: Production Ready & Fully Tested  

---

## 1. Problem Statement
Python beginners, students, and software developers frequently struggle to interpret exceptions, locate root causes, understand incorrect syntax, and identify appropriate fixes. Common pain points include:
- Cryptic and overwhelming Python traceback messages.
- Difficulty distinguishing parsing syntax errors from runtime exceptions and suspicious code patterns.
- Not knowing *why* an expression failed or how to avoid repeating the mistake.
- Blindly copying suggested code without understanding the underlying mental model.

ERRORX solves this by uniting **deterministic Python Abstract Syntax Tree (AST) static analysis** with **structured root-cause diagnostics, side-by-side diff comparisons, interactive beginner learning modules, and optional AI explanations**.

---

## 2. Core Architecture & Workflow
```
[User Python Code / Traceback]
             │
             ▼
   [Express API Route /api/analyze]
   (Validates size <100KB, no eval/exec)
             │
             ▼
   [CPython 3.10 AST Engine]
   ├── syntax.py (ast.parse, compile, colon heuristics, unmatched brackets)
   ├── rules.py (LEGB scope tracker, mutable defaults, type mismatches, zero division)
   └── traceback_parser.py (Multi-frame stack trace extractor & exception guide)
             │
             ▼
   [Deterministic Diagnostic Normalizer]
   (Calculates severity, line/col, exact root cause, suggested fix & full patched code)
             │
             ▼
   [Optional: Gemini 3.8 Flash AI Enrichment]
   (Only when toggled ON and GEMINI_API_KEY is present; gracefully falls back)
             │
             ▼
   [ERRORX React UI Workbench]
   ├── Monospace Editor with Line Numbers & Tab Indentation
   ├── Diagnostic Cards with Error Pointers
   ├── Side-by-Side & Unified Diff Comparison Viewer
   ├── One-Click "Apply Fix to Editor" with Instant Undo
   ├── Interactive Learning Knowledge Base
   └── Local IndexedDB/LocalStorage Analysis History
```

---

## 3. Technology Stack
- **Backend Runtime**: Node.js & Express (API bridge & static delivery)
- **Core Analysis Engine**: Python 3.10 standard library (`ast`, `tokenize`, `traceback`, `builtins`)
- **Frontend Framework**: React 19, TypeScript, Tailwind CSS, Lucide React, Motion
- **AI Integration**: `@google/genai` TypeScript SDK (server-side proxy, model `gemini-3.8-flash`)
- **Testing**: Python `unittest` framework (covers 12 mandatory test cases)
- **Storage & Offline**: Browser LocalStorage/IndexedDB, Web App Manifest & Service Worker PWA

---

## 4. Verification Test Matrix (TEST 1 to TEST 12)

| Test ID | Test Objective | Input Condition | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TEST 1** | Valid Python code | `def add(a, b): return a + b` | Parsing succeeds, no syntax error reported | **PASS** |
| **TEST 2** | Missing colon | `if x > 10 \n print("Hi")` | Syntax diagnostic with line number & colon fix | **PASS** |
| **TEST 3** | Invalid indentation | `def foo(): \n print("Hi")` | IndentationError reported with block location | **PASS** |
| **TEST 4** | Undefined-name candidate | `return subtotal + tax` | NameError candidate with fuzzy typo match | **PASS** |
| **TEST 5** | Empty input | `""` (Empty string) | Controlled handling without crashing | **PASS** |
| **TEST 6** | Malformed API request | `def @!#$:` | Controlled validation error returned | **PASS** |
| **TEST 7** | Large input limit | Payload > 100 KB | Configured security threshold limit enforced | **PASS** |
| **TEST 8** | Mutable default arguments | `def fn(basket=[])` | Warning against shared list/dict state | **PASS** |
| **TEST 9** | Type mismatch | `"Total: " + 50` | TypeError risk detected (str + int) | **PASS** |
| **TEST 10** | Traceback parser | Multi-line `ZeroDivisionError` | Extracts stack frames, culprit line & fix | **PASS** |
| **TEST 11** | Shadowed built-ins | `list = [10, 20, 30]` | Warns against masking Python built-in | **PASS** |
| **TEST 12** | Security isolation | `import os; os.system(...)` | Static AST parsed only; zero code execution | **PASS** |

*All 12 tests can be verified dynamically inside the application by clicking the **"Run Test Suite (12)"** button in the header.*

---

## 5. Security Architecture
1. **Zero Untrusted Code Execution**: ERRORX never invokes `eval()`, `exec()`, or executes user-submitted code in the Python process. All analysis is performed statically through `ast.parse()` and token stream inspection.
2. **Payload Size Guard**: Inputs are strictly limited to 100KB to safeguard memory and prevent denial-of-service attempts.
3. **API Key Confidentiality**: All AI calls occur strictly server-side via Node.js environment variables (`GEMINI_API_KEY`). Keys are never exposed to the client bundle or browser network requests.
4. **Local Privacy**: User analysis history is persisted exclusively in the client's local browser storage. No code is transmitted to third-party databases.

---

## 6. Local Setup and Startup Instructions

### Prerequisites
- Node.js $\ge$ 18.0
- Python $\ge$ 3.8 (CPython standard installation)

### Installation
```bash
# Clone the repository
git clone <repository_url>
cd errorx

# Install dependencies
npm install
```

### Environment Configuration
Create a `.env` file in the root directory (optional for deterministic features, required for AI explanations):
```env
# Optional: Enables natural-language AI insights alongside AST analysis
GEMINI_API_KEY="your-google-gemini-api-key"
PORT=3000
```

### Running the Application
```bash
# Start the full-stack development server
npm run dev

# Open your browser at http://localhost:3000
```

### Running the Python Test Suite
```bash
# Run the automated 12-test suite via Python unittest
python3 tests/test_analyzer.py

# Or via npm script
npm run test:python
```

---

## 7. Known Limitations & Future Scope
- **Dynamic Typing Bounds**: Static AST analysis cannot resolve runtime values dependent on external database queries or runtime network responses (e.g. dynamic JSON schemas).
- **Execution Sandboxing**: To protect security, code execution is intentionally disabled in this release. Future releases may integrate WebAssembly Pyodide for safe in-browser sandboxed execution.
- **Single-File Scope**: Current static analysis resolves single-file scripts and module imports, with multi-file project dependency trees planned for v2.0.
