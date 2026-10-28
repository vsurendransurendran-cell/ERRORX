import React, { useState } from 'react';
import { X, Check, Copy, GitCompare, ArrowRight } from 'lucide-react';
import { DiagnosticItem } from '../types';

interface DiffModalProps {
  diagnostic: DiagnosticItem | null;
  currentCode: string;
  onClose: () => void;
  onApplyFix: (patchedCode: string) => void;
}

export const DiffModal: React.FC<DiffModalProps> = ({
  diagnostic,
  currentCode,
  onClose,
  onApplyFix
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');
  const [copied, setCopied] = useState(false);

  if (!diagnostic || !diagnostic.suggested_fix) return null;

  const fix = diagnostic.suggested_fix;
  const originalLine = fix.original;
  const replacementLine = fix.replacement;
  const fullPatched = fix.full_patched_code || currentCode;

  const handleCopyPatched = () => {
    navigator.clipboard.writeText(fullPatched);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (fullPatched) {
      onApplyFix(fullPatched);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0d1322] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Before & After Correction Diff</h2>
              <p className="text-xs text-slate-400">
                Line {diagnostic.line}: {diagnostic.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center p-1 bg-slate-800 rounded-lg text-xs">
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewMode === 'side-by-side' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Side by Side
              </button>
              <button
                onClick={() => setViewMode('unified')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewMode === 'unified' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Unified Line Diff
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Diff Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Explanation Box */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <h4 className="font-semibold text-slate-200 mb-1">Fix Rationale:</h4>
            <p className="text-slate-400 leading-relaxed mb-2">
              {fix.explanation}
            </p>
            {fix.assumptions && (
              <p className="text-slate-500 italic">
                Assumptions: {fix.assumptions}
              </p>
            )}
          </div>

          {/* Diff Views */}
          {viewMode === 'side-by-side' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original Code */}
              <div className="flex flex-col rounded-xl border border-red-900/40 bg-[#160f15] overflow-hidden">
                <div className="px-4 py-2 border-b border-red-900/40 bg-red-950/40 text-xs font-semibold text-red-300 flex items-center justify-between">
                  <span>Original Code (Problematic)</span>
                  <span className="text-[10px] bg-red-900/60 px-2 py-0.5 rounded text-red-200">Before</span>
                </div>
                <div className="p-4 font-mono text-xs overflow-x-auto text-red-200 whitespace-pre">
                  {currentCode}
                </div>
              </div>

              {/* Patched Code */}
              <div className="flex flex-col rounded-xl border border-emerald-900/40 bg-[#0d1815] overflow-hidden">
                <div className="px-4 py-2 border-b border-emerald-900/40 bg-emerald-950/40 text-xs font-semibold text-emerald-300 flex items-center justify-between">
                  <span>Corrected Code (Proposed)</span>
                  <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">After</span>
                </div>
                <div className="p-4 font-mono text-xs overflow-x-auto text-emerald-200 whitespace-pre">
                  {fullPatched}
                </div>
              </div>
            </div>
          ) : (
            /* Unified Line Diff */
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs overflow-x-auto space-y-2">
              <div className="text-[11px] text-slate-500 font-sans mb-2">
                Focused Line Comparison:
              </div>
              <div className="p-3 rounded bg-red-950/40 border border-red-900/50 text-red-300 flex items-center gap-3">
                <span className="text-red-400 font-bold select-none">-</span>
                <code>{originalLine}</code>
              </div>
              <div className="p-3 rounded bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 flex items-center gap-3">
                <span className="text-emerald-400 font-bold select-none">+</span>
                <code>{replacementLine}</code>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90 text-xs">
          <button
            onClick={handleCopyPatched}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Corrected Code!' : 'Copy Corrected Code'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Apply Fix to Editor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
