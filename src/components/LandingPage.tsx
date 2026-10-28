import React from 'react';
import { 
  Play, 
  Terminal, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  GitCompare, 
  BookOpen, 
  Cpu, 
  ArrowRight,
  Code2,
  Sparkles,
  FlaskConical
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onOpenTestSuite: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onOpenTestSuite }) => {
  return (
    <div className="relative min-h-[calc(100vh-64px)] flex flex-col justify-between bg-black text-white overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* Electric Blue Ambient Glows & Cyber Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00d2ff0a_1px,transparent_1px),linear-gradient(to_bottom,#00d2ff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/20 via-blue-600/15 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-600/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-700/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 text-center flex flex-col items-center">
        {/* Hackathon Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-xs font-mono tracking-wider mb-8 shadow-[0_0_15px_rgba(0,210,255,0.2)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00d2ff]" />
          <span>Code Conqueror India</span>
          <span className="text-cyan-600">·</span>
          <span>Team Code Phantom (V Surendran)</span>
        </div>

        {/* Electric Blue Custom Logo */}
        <div className="relative mb-6 group cursor-pointer" onClick={() => onStart()}>
          <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-3xl blur-lg opacity-70 group-hover:opacity-100 transition duration-500" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-black border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_35px_rgba(0,210,255,0.5)]">
            <svg 
              className="w-14 h-14 sm:w-16 sm:h-16 text-cyan-400 transition-transform duration-300 group-hover:scale-105" 
              viewBox="0 0 48 48" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Hexagon Circuit */}
              <polygon points="24,3 43,14 43,34 24,45 5,34 5,14" stroke="#00e5ff" strokeWidth="2.5" strokeLinejoin="round" fill="#040914" />
              {/* Electric Lightning & Brackets */}
              <path d="M16 19L11 24L16 29" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M32 19L37 24L32 29" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M26 12L19 25H28L21 36" stroke="#00e5ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_#00e5ff]"/>
            </svg>
          </div>
        </div>

        {/* Project Name in Electric Blue Styling */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight font-mono mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-300 to-cyan-400 drop-shadow-[0_0_25px_rgba(0,229,255,0.4)]">
            ERRORX
          </span>
        </h1>

        {/* Subtitle / Purpose */}
        <p className="text-lg sm:text-xl text-cyan-100/90 max-w-2xl mx-auto mb-4 font-sans font-medium leading-relaxed">
          The Intelligent Python Error Analysis & Deterministic Debugging Assistant
        </p>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed font-sans">
          Combines instantaneous CPython AST parsing, 12 verified heuristic rules, automated before-and-after diffs, and beginner-friendly root-cause explanations.
        </p>

        {/* START BUTTON BELOW LOGO AND PROJECT NAME */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
          <button
            onClick={() => onStart()}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold text-base tracking-wide flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_0_35px_rgba(0,229,255,0.6)] hover:shadow-[0_0_50px_rgba(0,229,255,0.9)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-5 h-5 fill-black" />
            <span>START DEBUGGING</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenTestSuite}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-black hover:bg-slate-900 text-cyan-300 hover:text-cyan-200 border border-cyan-500/50 hover:border-cyan-400 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,210,255,0.15)] cursor-pointer"
          >
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            <span>Run 12 Tests</span>
          </button>
        </div>
      </div>

      {/* Feature Pillars in Black & Electric Blue */}
      <div className="relative z-10 border-t border-cyan-950/60 bg-gradient-to-b from-black to-[#030611] py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="p-5 rounded-2xl bg-black border border-cyan-950 hover:border-cyan-500/40 transition-colors shadow-[0_0_20px_rgba(0,210,255,0.05)]">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-mono mb-1.5">
                Instant AST Static Engine
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero network lag for core analysis. Parses CPython 3.10 AST and token streams in &lt;15ms without executing untrusted code.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-5 rounded-2xl bg-black border border-cyan-950 hover:border-cyan-500/40 transition-colors shadow-[0_0_20px_rgba(0,210,255,0.05)]">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
                <GitCompare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-mono mb-1.5">
                Before & After Diff Viewer
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Review automated code patches side-by-side. Apply fixes with a single click and instant undo to verify errors are eliminated.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-5 rounded-2xl bg-black border border-cyan-950 hover:border-cyan-500/40 transition-colors shadow-[0_0_20px_rgba(0,210,255,0.05)]">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-mono mb-1.5">
                Beginner Learning Mode
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clear 5-facet explanations: what the code does, why it fails, line involved, how to fix, and prevention mental models.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
