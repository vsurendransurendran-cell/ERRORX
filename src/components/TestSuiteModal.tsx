import React, { useState } from 'react';
import { X, Play, CheckCircle2, XCircle, RefreshCw, Terminal, ShieldCheck, FileCheck } from 'lucide-react';
import { TestSuiteResponse } from '../types';

interface TestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = ({ isOpen, onClose }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestSuiteResponse | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const runTests = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/run-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data: TestSuiteResponse = await res.json();
      setResults(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to execute test suite');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0d1322] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">ERRORX Verification Test Suite</h2>
                <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                  pytest & unittest spec
                </span>
              </div>
              <p className="text-xs text-slate-400">
                12 Mandatory Tests (TEST 1 to TEST 12) per Code Conqueror India rubric
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runTests}
              disabled={isRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-colors shadow-sm ${
                isRunning
                  ? 'bg-slate-700 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running Tests...' : 'Run All 12 Tests'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-xs text-red-200 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Test Status Overview Cards */}
          {results && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-500 block text-[11px]">Total Tests</span>
                <span className="text-xl font-bold font-mono text-slate-100">{results.total_tests}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-center">
                <span className="text-emerald-400 block text-[11px]">Passed</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{results.passed_tests}</span>
              </div>
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/40 text-center">
                <span className="text-red-400 block text-[11px]">Failed</span>
                <span className="text-xl font-bold font-mono text-red-400">{results.failed_tests}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-slate-500 block text-[11px]">Suite Status</span>
                <span className={`text-base font-bold font-mono ${results.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {results.success ? 'ALL PASSED (100%)' : 'FAILURES DETECTED'}
                </span>
              </div>
            </div>
          )}

          {/* 12 Required Test Cases Matrix */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden text-xs">
            <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-800 font-semibold text-slate-300 flex items-center justify-between">
              <span>Test Matrix Specification</span>
              <span className="text-slate-400 font-mono text-[11px]">12/12 Implemented</span>
            </div>

            <div className="divide-y divide-slate-800/60 font-mono">
              {[
                { id: 'TEST 1', name: 'Valid Python code', input: 'def add(a, b): return a + b', expect: 'Parsing succeeds without syntax error' },
                { id: 'TEST 2', name: 'Missing colon', input: 'if x > 10 \\n print("Hi")', expect: 'Syntax diagnostic with line & suggested fix' },
                { id: 'TEST 3', name: 'Invalid indentation', input: 'def foo(): \\n print("Hi")', expect: 'IndentationError with block location' },
                { id: 'TEST 4', name: 'Undefined name candidate', input: 'return subtotal + tax', expect: 'NameError candidate with fuzzy typo match' },
                { id: 'TEST 5', name: 'Empty input', input: '"" (empty string)', expect: 'Clean handling, 0 crash, zero errors' },
                { id: 'TEST 6', name: 'Malformed API input', input: 'def @!#$:', expect: 'Controlled validation error' },
                { id: 'TEST 7', name: 'Large input (>100KB)', input: '# Large payload > 100KB', expect: 'Security size limit enforced' },
                { id: 'TEST 8', name: 'Mutable default argument', input: 'def fn(basket=[])', expect: 'Runtime risk warning against shared state' },
                { id: 'TEST 9', name: 'Type mismatch', input: '"Total: " + 50', expect: 'TypeError risk detected (str + int)' },
                { id: 'TEST 10', name: 'Traceback parser', input: 'Traceback ... ZeroDivisionError', expect: 'Extracts frames, line & remediations' },
                { id: 'TEST 11', name: 'Shadowed built-ins', input: 'list = [10, 20, 30]', expect: 'Warns against masking Python built-in' },
                { id: 'TEST 12', name: 'Security isolation', input: 'import os; os.system(...)', expect: 'Static AST parsing only; zero execution' }
              ].map((testCase, idx) => {
                const itemResult = results?.tests[idx];
                const isPassed = itemResult?.status === 'PASS';

                return (
                  <div key={testCase.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-800/30">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sky-400">{testCase.id}</span>
                        <span className="text-slate-600">·</span>
                        <span className="font-semibold text-slate-200 font-sans">{testCase.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans">
                        <span className="text-slate-500">Expected:</span> {testCase.expect}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {results ? (
                        isPassed ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" /> PASS
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/80 border border-red-800/80 px-2 py-0.5 rounded">
                            <XCircle className="w-3 h-3" /> FAIL
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                          Ready to execute
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Raw Terminal Output Drawer */}
          {results?.raw_output && (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-400 hover:text-slate-200 bg-slate-900"
              >
                <div className="flex items-center gap-2 font-mono">
                  <Terminal className="w-3.5 h-3.5 text-sky-400" />
                  <span>Raw Python Unittest Terminal Log</span>
                </div>
                <span>{showLogs ? 'Hide Log' : 'View Terminal Output'}</span>
              </button>

              {showLogs && (
                <pre className="p-4 font-mono text-[11px] text-emerald-300 leading-relaxed overflow-x-auto whitespace-pre">
                  {results.raw_output}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Automated AST test harness verified against CPython 3.10 runtime</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
