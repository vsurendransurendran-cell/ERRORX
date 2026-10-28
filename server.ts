import express, { Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '500kb' }));

// Helper to run Python analyzer safely via stdio
function runPythonAnalyzer(code: string, tracebackStr: string = ''): Promise<any> {
  return new Promise((resolve, reject) => {
    const analyzerPath = path.resolve(__dirname, 'backend', 'analyzer', 'main.py');
    const pyProcess = spawn('python3', [analyzerPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdoutData = '';
    let stderrData = '';

    const timeout = setTimeout(() => {
      pyProcess.kill();
      reject(new Error('Analysis timed out after 5000ms.'));
    }, 5000);

    pyProcess.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    pyProcess.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    pyProcess.on('close', (exitCode) => {
      clearTimeout(timeout);
      if (exitCode !== 0 && !stdoutData.trim()) {
        return reject(new Error(`Analyzer process failed with code ${exitCode}: ${stderrData}`));
      }

      try {
        const parsed = JSON.parse(stdoutData.trim());
        resolve(parsed);
      } catch (err: any) {
        reject(new Error(`Invalid JSON output from analyzer: ${stdoutData.slice(0, 200)}... (${err.message})`));
      }
    });

    pyProcess.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });

    // Write request payload to stdin
    pyProcess.stdin.write(JSON.stringify({ code, traceback: tracebackStr }));
    pyProcess.stdin.end();
  });
}

// Helper to run Python unittest suite
function runPythonTestSuite(): Promise<any> {
  return new Promise((resolve) => {
    const testPath = path.resolve(__dirname, 'tests', 'test_analyzer.py');
    const pyProcess = spawn('python3', ['-m', 'unittest', '-v', testPath]);

    let output = '';
    const timeout = setTimeout(() => {
      pyProcess.kill();
      resolve({ success: false, error: 'Tests timed out', tests: [] });
    }, 10000);

    pyProcess.stdout.on('data', (d) => { output += d.toString(); });
    pyProcess.stderr.on('data', (d) => { output += d.toString(); });

    pyProcess.on('close', (code) => {
      clearTimeout(timeout);
      const testItems: any[] = [];
      const testBlocks = output.split(/(?=test_\d+_\w+)/g);

      const knownDescriptions: Record<string, string> = {
        test_01_valid_python_code: 'TEST 1: Valid Python code -> parsing succeeds with no syntax errors',
        test_02_missing_colon: 'TEST 2: Missing colon -> detected with line and automated colon suggestion',
        test_03_invalid_indentation: 'TEST 3: Invalid indentation -> parser reports exact indentation mismatch',
        test_04_undefined_name_candidate: 'TEST 4: Undefined name -> identifies unresolved identifier with typo fuzzy match',
        test_05_empty_input: 'TEST 5: Empty input -> safely handled with zero crash',
        test_06_malformed_syntax_graceful: 'TEST 6: Malformed input -> returns controlled diagnostic error',
        test_07_large_input_limit: 'TEST 7: Large input (>100KB) -> enforces security threshold',
        test_08_mutable_default_arguments: 'TEST 8: Mutable default argument -> warns against shared list/dict defaults',
        test_09_type_mismatch_binop: 'TEST 9: Type mismatch -> detects str + int binary operator conflict',
        test_10_traceback_parser: 'TEST 10: Traceback parser -> extracts stack frames, line numbers, and causes',
        test_11_shadowed_builtins: 'TEST 11: Shadowed built-in -> warns against overwriting list/dict/str identifiers',
        test_12_security_no_execution: 'TEST 12: Security -> static AST parsing without arbitrary code execution'
      };

      for (const block of testBlocks) {
        const headerMatch = block.match(/^(test_\d+_\w+)/);
        if (headerMatch) {
          const testName = headerMatch[1];
          const passed = block.includes('... ok');
          const failed = block.includes('... FAIL') || block.includes('... ERROR');
          if (passed || failed) {
            testItems.push({
              name: testName,
              description: knownDescriptions[testName] || testName,
              status: passed ? 'PASS' : 'FAIL',
              raw: block.trim().split('\n')[0]
            });
          }
        }
      }

      resolve({
        success: code === 0,
        total_tests: testItems.length,
        passed_tests: testItems.filter(t => t.status === 'PASS').length,
        failed_tests: testItems.filter(t => t.status === 'FAIL').length,
        tests: testItems,
        raw_output: output
      });
    });
  });
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Health & configuration check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    project: 'ERRORX',
    team: 'Code Phantom',
    participant: 'V Surendran',
    python_engine: 'Python 3.10 AST',
    ai_configured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// Run Test Suite endpoint
app.post('/api/run-tests', async (req: Request, res: Response) => {
  try {
    const results = await runPythonTestSuite();
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Analyze code endpoint
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { code = '', traceback: tracebackStr = '', enable_ai = false } = req.body;

    // STEP 2: Input size validation
    if (typeof code !== 'string') {
      return res.status(400).json({ error: 'Field "code" must be a string.' });
    }

    if (code.length > 100_000) {
      return res.status(413).json({
        error: 'Input exceeds maximum allowed size of 100KB.',
        valid_syntax: false,
        diagnostics: [{
          id: 'size-limit',
          category: 'security',
          severity: 'error',
          line: 1,
          col: 1,
          message: 'Code payload exceeds the maximum 100KB security boundary.',
          explanation: {
            what_it_does: 'Attempted to submit an oversized payload.',
            why_problematic: 'Exceeding size limits risks resource exhaustion.',
            how_to_fix: 'Submit modular code snippets under 100KB.',
            concept_to_learn: 'Resource Security & Input Bounds'
          }
        }]
      });
    }

    // STEP 3-7: Run deterministic Python AST analysis engine
    const analysisResult = await runPythonAnalyzer(code, tracebackStr);

    // STEP 8: Optional AI enrichment (only when requested and key is present)
    let aiExplanation: any = null;

    if (enable_ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        aiExplanation = {
          available: false,
          reason: 'AI service unavailable: GEMINI_API_KEY is not configured on the server. Local deterministic analysis completed successfully.',
          source: 'local_fallback'
        };
      } else {
        try {
          const ai = new GoogleGenAI();
          const diagnosticSummary = analysisResult.diagnostics?.map((d: any) =>
            `- [${d.category.toUpperCase()}] Line ${d.line || '?'}: ${d.message}`
          ).join('\n') || 'No deterministic errors flagged.';

          const prompt = `You are ERRORX, an empathetic, expert Python programming instructor and debugging assistant for Team Code Phantom (Code Conqueror India).

The user submitted the following Python code for analysis:
\`\`\`python
${code || '(No code provided)'}
\`\`\`

${tracebackStr ? `The user also provided this traceback/error:\n\`\`\`\n${tracebackStr}\n\`\`\`\n` : ''}

Our deterministic AST static analyzer detected the following findings:
${diagnosticSummary}

Please provide an intelligent, encouraging explanation designed for a Python beginner or student:
1. Executive Summary: What went wrong in plain, friendly English.
2. The Mental Model / Analogy: Why Python behaves this way (e.g. how Python scopes variables, why default arguments behave like shared containers, or why strings and numbers cannot be implicitly concatenated).
3. Exact Step-by-Step Fix: How to fix the code cleanly.
4. Pro Tip for Future Coding: A practical habit to avoid ever making this mistake again.

Keep it concise, well-structured with clear markdown headings, and encouraging. Never invent false runtime guarantees.`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt
          });

          aiExplanation = {
            available: true,
            model: 'gemini-3.8-flash',
            source: 'gemini_ai',
            content: response.text || 'No explanation generated.',
            generated_at: new Date().toISOString()
          };
        } catch (aiErr: any) {
          aiExplanation = {
            available: false,
            reason: `AI service encountered a temporary error: ${aiErr.message || 'API request failed'}. Deterministic static analysis remains 100% active.`,
            source: 'local_fallback'
          };
        }
      }
    }

    res.json({
      ...analysisResult,
      ai_explanation: aiExplanation
    });
  } catch (err: any) {
    res.status(500).json({
      error: `Analysis error: ${err.message}`,
      valid_syntax: false,
      diagnostics: []
    });
  }
});

// -------------------------------------------------------------
// Dev vs Production static/Vite serving
// -------------------------------------------------------------
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, HOST, () => {
    console.log(`ERRORX Server running on http://${HOST}:${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer();
