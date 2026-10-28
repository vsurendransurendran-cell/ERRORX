import React from 'react';
import { Terminal, ShieldCheck, CheckCircle2, History, BookOpen, FlaskConical, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'analyzer' | 'history' | 'learning' | 'testsuite';
  setActiveTab: (tab: 'analyzer' | 'history' | 'learning' | 'testsuite') => void;
  historyCount: number;
  aiConfigured: boolean;
  onOpenTestSuite: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  historyCount,
  aiConfigured,
  onOpenTestSuite
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#0d1322]/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-sm">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-mono">ERRORX</span>
                <span className="text-xs font-semibold text-sky-400 bg-sky-950/60 border border-sky-800/60 px-1.5 py-0.5 rounded">v1.0</span>
                <span className="text-xs text-slate-500 hidden sm:inline">·</span>
                <span className="text-xs text-slate-400 hidden sm:inline">Team Code Phantom</span>
              </div>
              <p className="text-xs text-slate-400 hidden md:block">
                Python Error Analysis & Debugging Assistant · Code Conqueror India
              </p>
            </div>
          </div>

          {/* Engine Status Indicators & Navigation Tabs */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Engine badge (Text-based, clean) */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-slate-300">Python 3.10 AST</span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>AI: {aiConfigured ? 'Ready' : 'Deterministic'}</span>
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center p-1 bg-slate-900/90 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveTab('analyzer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'analyzer'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                aria-label="Code Analyzer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Analyzer</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'history'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                aria-label="Analysis History"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">History</span>
                {historyCount > 0 && (
                  <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full text-slate-300">
                    {historyCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('learning')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'learning'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                aria-label="Learning Reference Catalog"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Learn Errors</span>
              </button>
            </div>

            {/* Test Suite Button for Judges */}
            <button
              onClick={onOpenTestSuite}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
              title="Run Automated Verification Tests (TEST 1 - 12)"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Run Test Suite (12)</span>
              <span className="md:hidden">Tests</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
