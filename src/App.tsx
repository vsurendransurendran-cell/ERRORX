import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Sparkles, 
  History, 
  BookOpen, 
  FlaskConical, 
  Undo,
  Download,
  Share2,
  FileCode
} from 'lucide-react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { CodeEditor } from './components/CodeEditor';
import { DiagnosticCard } from './components/DiagnosticCard';
import { AIExplanationCard } from './components/AIExplanationCard';
import { DiffModal } from './components/DiffModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { LearningCatalog } from './components/LearningCatalog';
import { TestSuiteModal } from './components/TestSuiteModal';
import { AnalysisResponse, DiagnosticItem, HistoryEntry } from './types';

const STORAGE_KEY = 'errorx_analysis_history';

export default function App() {
  const [code, setCode] = useState<string>('');
  const [traceback, setTraceback] = useState<string>('');
  const [enableAi, setEnableAi] = useState<boolean>(false); // Fast deterministic AST by default
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [selectedDiffDiag, setSelectedDiffDiag] = useState<DiagnosticItem | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'landing' | 'analyzer' | 'history' | 'learning' | 'testsuite'>('landing');
  const [isTestSuiteOpen, setIsTestSuiteOpen] = useState<boolean>(false);
  const [aiConfigured, setAiConfigured] = useState<boolean>(true);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [previousCode, setPreviousCode] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Load history & server health on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: HistoryEntry[] = JSON.parse(stored);
        const cleanHistory = parsed.filter(item => !item.fullCode.includes('calculate_discount'));
        setHistory(cleanHistory);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanHistory));
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage', e);
    }

    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setAiConfigured(data.ai_configured ?? true);
      })
      .catch(() => {
        setAiConfigured(false);
      });
  }, []);

  const saveHistoryEntry = (codeText: string, tbText: string, res: AnalysisResponse) => {
    try {
      const newEntry: HistoryEntry = {
        id: `scan-${Date.now()}`,
        timestamp: new Date().toISOString(),
        codeSnippet: codeText.slice(0, 150),
        fullCode: codeText,
        traceback: tbText,
        validSyntax: res.valid_syntax,
        errorCount: res.metrics?.error_count || 0,
        warningCount: res.metrics?.warning_count || 0,
        totalDiagnostics: res.diagnostics?.length || 0
      };

      const updated = [newEntry, ...history.filter(h => h.fullCode !== codeText)].slice(0, 30);
      setHistory(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not persist history', e);
    }
  };

  const handleAnalyze = async (codeToAnalyze = code, tbToAnalyze = traceback, useAi = enableAi) => {
    if (!codeToAnalyze.trim() && !tbToAnalyze.trim()) {
      setStatusNotice('Please enter Python code or paste a traceback to analyze.');
      setTimeout(() => setStatusNotice(null), 3000);
      return;
    }

    setIsAnalyzing(true);
    setHighlightedLine(null);

    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          code: codeToAnalyze,
          traceback: tbToAnalyze,
          enable_ai: useAi
        })
      });

      clearTimeout(timeoutTimer);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data: AnalysisResponse = await res.json();
      setAnalysisResult(data);
      saveHistoryEntry(codeToAnalyze, tbToAnalyze, data);

      if (data.diagnostics && data.diagnostics.length > 0 && data.diagnostics[0].line) {
        setHighlightedLine(data.diagnostics[0].line);
      }
    } catch (err: any) {
      clearTimeout(timeoutTimer);
      const isAbort = err.name === 'AbortError';
      const errMsg = isAbort ? 'Analysis request timed out after 6 seconds' : err.message;

      setAnalysisResult({
        valid_syntax: false,
        diagnostics: [{
          id: 'network-err',
          category: 'analysis',
          severity: 'error',
          line: 1,
          col: 1,
          message: `Analysis note: ${errMsg}`,
          explanation: {
            what_it_does: 'The request took longer than expected or was interrupted.',
            why_problematic: 'Communication with backend timed out.',
            how_to_fix: 'Please retry analysis. Turning off AI will make analysis instantaneous (<20ms).',
            concept_to_learn: 'Request Latency & Fallbacks'
          }
        }],
        metrics: { total_lines: 0, error_count: 1, warning_count: 0, info_count: 0 },
        has_suggested_fixes: false
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStart = () => {
    setActiveTab('analyzer');
  };

  const handleApplyFix = (patchedCode: string) => {
    setPreviousCode(code);
    setCode(patchedCode);
    setStatusNotice('Correction applied to editor! Running verification scan...');
    setTimeout(() => setStatusNotice(null), 4000);

    // Automatically re-run analysis to verify that the fix eliminated the error
    handleAnalyze(patchedCode, traceback, false);
  };

  const handleUndoFix = () => {
    if (previousCode !== null) {
      setCode(previousCode);
      const restored = previousCode;
      setPreviousCode(null);
      setStatusNotice('Reverted back to previous code version.');
      setTimeout(() => setStatusNotice(null), 3000);
      handleAnalyze(restored, traceback, false);
    }
  };

  const handleLoadHistory = (entry: HistoryEntry) => {
    setCode(entry.fullCode);
    setTraceback(entry.traceback || '');
    setActiveTab('analyzer');
    handleAnalyze(entry.fullCode, entry.traceback || '', false);
  };

  const handleDeleteHistoryEntry = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Filter diagnostics by severity
  const filteredDiagnostics = (analysisResult?.diagnostics || []).filter(d => {
    if (filterSeverity === 'all') return true;
    return d.severity === filterSeverity;
  });

  return (
    <div className="min-h-screen flex flex-col bg-black text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={history.length}
        aiConfigured={aiConfigured}
        onOpenTestSuite={() => setIsTestSuiteOpen(true)}
      />

      {/* Status Notice Toast */}
      {statusNotice && (
        <div className="bg-cyan-600/90 text-black font-semibold text-xs text-center py-2 px-4 shadow sticky top-16 z-30 animate-fade-in flex items-center justify-center gap-3">
          <span>{statusNotice}</span>
          {previousCode !== null && (
            <button
              onClick={handleUndoFix}
              className="underline font-bold hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Undo className="w-3 h-3" />
              Undo Change
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full mx-auto">
        {activeTab === 'landing' ? (
          <LandingPage
            onStart={handleStart}
            onOpenTestSuite={() => setIsTestSuiteOpen(true)}
          />
        ) : activeTab === 'history' ? (
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <HistoryDrawer
              history={history}
              onLoadHistory={handleLoadHistory}
              onDeleteEntry={handleDeleteHistoryEntry}
              onClearAll={handleClearHistory}
              onBackToAnalyzer={() => setActiveTab('analyzer')}
            />
          </div>
        ) : activeTab === 'learning' ? (
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <LearningCatalog />
          </div>
        ) : (
          /* Analyzer Main Workspace: Two-Column Workbench */
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Code Editor & Input Controls (7 cols on desktop) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <CodeEditor
                  code={code}
                  setCode={setCode}
                  traceback={traceback}
                  setTraceback={setTraceback}
                  enableAi={enableAi}
                  setEnableAi={setEnableAi}
                  onAnalyze={() => handleAnalyze(code, traceback, enableAi)}
                  isAnalyzing={isAnalyzing}
                  highlightedLine={highlightedLine}
                  aiConfigured={aiConfigured}
                />

                {/* Undo action banner if a fix was applied */}
                {previousCode !== null && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-cyan-900/60 text-xs">
                    <div className="flex items-center gap-2 text-cyan-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      <span>Applied automated code fix to editor.</span>
                    </div>
                    <button
                      onClick={handleUndoFix}
                      className="flex items-center gap-1 px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition-colors font-medium cursor-pointer"
                    >
                      <Undo className="w-3.5 h-3.5" />
                      <span>Undo & Restore Original</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Diagnostic Cards & Explanations (5 cols on desktop) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {/* Summary Metrics Bar */}
                {analysisResult && (
                  <div className="p-4 rounded-xl border border-cyan-950 bg-[#070d1a] shadow-[0_0_20px_rgba(0,210,255,0.05)]">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                          Diagnostic Assessment
                        </span>
                        <span className="text-cyan-900">·</span>
                        <span className="text-xs text-slate-400 font-mono">
                          {analysisResult.metrics?.total_lines || 0} lines scanned
                        </span>
                      </div>

                      {analysisResult.valid_syntax ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded border text-emerald-400 bg-emerald-950/60 border-emerald-800/60 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Syntax Valid
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded border text-red-400 bg-red-950/60 border-red-800/60 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Syntax Failure
                        </span>
                      )}
                    </div>

                    {/* Filter Segmented Controls */}
                    <div className="flex items-center gap-1 p-1 bg-black rounded-lg text-xs border border-cyan-950">
                      <button
                        onClick={() => setFilterSeverity('all')}
                        className={`flex-1 py-1 px-2 rounded-md transition-colors text-center font-medium ${
                          filterSeverity === 'all'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        All ({analysisResult.diagnostics.length})
                      </button>
                      <button
                        onClick={() => setFilterSeverity('error')}
                        className={`flex-1 py-1 px-2 rounded-md transition-colors text-center font-medium ${
                          filterSeverity === 'error'
                            ? 'bg-red-950/80 text-red-300 border border-red-800/60'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Errors ({analysisResult.metrics?.error_count || 0})
                      </button>
                      <button
                        onClick={() => setFilterSeverity('warning')}
                        className={`flex-1 py-1 px-2 rounded-md transition-colors text-center font-medium ${
                          filterSeverity === 'warning'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Warnings ({analysisResult.metrics?.warning_count || 0})
                      </button>
                      <button
                        onClick={() => setFilterSeverity('info')}
                        className={`flex-1 py-1 px-2 rounded-md transition-colors text-center font-medium ${
                          filterSeverity === 'info'
                            ? 'bg-sky-950/80 text-sky-300 border border-sky-800/60'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Info ({analysisResult.metrics?.info_count || 0})
                      </button>
                    </div>
                  </div>
                )}

                {/* No Diagnostics State (Code is Clean) */}
                {analysisResult && analysisResult.diagnostics.length === 0 && (
                  <div className="p-8 rounded-2xl border border-emerald-900/40 bg-[#0c1815] text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-white">No Errors or Bad Practices Found!</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Python parsed the source code cleanly without any syntax errors, unresolved names, or detected anti-patterns.
                    </p>
                  </div>
                )}

                {/* List of Diagnostic Findings */}
                <div className="space-y-4">
                  {filteredDiagnostics.map((diag) => (
                    <DiagnosticCard
                      key={diag.id}
                      diagnostic={diag}
                      onApplyFix={handleApplyFix}
                      onHighlightLine={(line) => setHighlightedLine(line)}
                      onViewDiff={(d) => setSelectedDiffDiag(d)}
                    />
                  ))}
                </div>

                {/* Optional AI Natural-Language Explanation Card */}
                {analysisResult?.ai_explanation && (
                  <AIExplanationCard aiExplanation={analysisResult.ai_explanation} />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Before-and-After Comparison Diff Modal */}
      {selectedDiffDiag && (
        <DiffModal
          diagnostic={selectedDiffDiag}
          currentCode={code}
          onClose={() => setSelectedDiffDiag(null)}
          onApplyFix={handleApplyFix}
        />
      )}

      {/* Automated Test Suite Modal for Judges & Verification */}
      <TestSuiteModal
        isOpen={isTestSuiteOpen}
        onClose={() => setIsTestSuiteOpen(false)}
      />

      {/* Footer per hackathon guidelines */}
      <footer className="border-t border-cyan-950/80 bg-black py-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-cyan-400 font-mono">ERRORX</span>
            <span className="text-slate-700">·</span>
            <span>Code Conqueror India</span>
            <span className="text-slate-700">·</span>
            <span className="text-slate-400">Team Code Phantom (V Surendran)</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-cyan-300/80">Deterministic AST Engine</span>
            <span className="text-slate-700">·</span>
            <span className="text-slate-400">Black & Electric Blue Edition</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
