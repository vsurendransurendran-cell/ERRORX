import React from 'react';
import { Terminal, ShieldCheck, CheckCircle2, History, BookOpen, FlaskConical, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'landing' | 'analyzer' | 'history' | 'learning' | 'testsuite';
  setActiveTab: (tab: 'landing' | 'analyzer' | 'history' | 'learning' | 'testsuite') => void;
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
    <header className="border-b border-cyan-950/80 bg-black/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity / Home Link */}
          <button 
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,210,255,0.25)] group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(0,210,255,0.5)] transition-all">
              <Terminal className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-mono group-hover:text-cyan-300 transition-colors">
                  ERRORX
                </span>
                <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(0,210,255,0.2)]">
                  v1.0
                </span>
                <span className="text-xs text-slate-600 hidden sm:inline">·</span>
                <span className="text-xs text-cyan-400/80 font-mono hidden sm:inline">Code Phantom</span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                Python Debugging Assistant · Code Conqueror India
              </p>
            </div>
          </button>

          {/* Engine Status Indicators & Navigation Tabs */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Engine badge (Text-based, clean) */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 px-2.5 py-1 rounded-lg bg-black border border-cyan-900/60">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#00d2ff]"></span>
              <span className="font-mono text-cyan-200">Python 3.10 AST</span>
              <span className="text-cyan-900">|</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>AI: {aiConfigured ? 'Ready' : 'Deterministic'}</span>
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center p-1 bg-black rounded-lg border border-cyan-950">
              <button
                onClick={() => setActiveTab('landing')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'landing'
                    ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,210,255,0.4)]'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/30'
                }`}
                aria-label="Home Landing Page"
              >
                <span>Home</span>
              </button>

              <button
                onClick={() => setActiveTab('analyzer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'analyzer'
                    ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,210,255,0.4)]'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/30'
                }`}
                aria-label="Code Analyzer Workbench"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Workbench</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'history'
                    ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,210,255,0.4)]'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/30'
                }`}
                aria-label="Analysis History"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">History</span>
                {historyCount > 0 && (
                  <span className="text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-300 px-1.5 py-0.2 rounded-full">
                    {historyCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('learning')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'learning'
                    ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,210,255,0.4)]'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/30'
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 transition-all shadow-[0_0_12px_rgba(0,210,255,0.15)] cursor-pointer"
              title="Run Automated Verification Tests (TEST 1 - 12)"
            >
              <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Test Suite (12)</span>
              <span className="md:hidden">Tests</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
