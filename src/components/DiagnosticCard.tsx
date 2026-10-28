import React, { useState } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Wrench, 
  BookOpen, 
  ArrowRight, 
  GitCompare, 
  CornerDownRight,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DiagnosticItem } from '../types';

interface DiagnosticCardProps {
  diagnostic: DiagnosticItem;
  onApplyFix?: (patchedCode: string) => void;
  onHighlightLine?: (line: number | null) => void;
  onViewDiff?: (diag: DiagnosticItem) => void;
}

export const DiagnosticCard: React.FC<DiagnosticCardProps> = ({
  diagnostic,
  onApplyFix,
  onHighlightLine,
  onViewDiff
}) => {
  const [learningOpen, setLearningOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  const isError = diagnostic.severity === 'error';
  const isWarning = diagnostic.severity === 'warning';

  const severityColor = isError 
    ? 'text-red-400 bg-red-950/40 border-red-800/60' 
    : isWarning 
    ? 'text-amber-400 bg-amber-950/40 border-amber-800/60' 
    : 'text-sky-400 bg-sky-950/40 border-sky-800/60';

  const categoryName = {
    syntax: 'Syntax Error',
    indentation: 'Indentation Error',
    name_error: 'Name Resolution',
    type_error: 'Type Error',
    runtime_risk: 'Runtime Risk',
    bad_practice: 'Anti-Pattern',
    traceback: 'Traceback Exception',
    security: 'Security Restriction',
    analysis: 'Static Analysis'
  }[diagnostic.category] || diagnostic.category;

  const handleApply = () => {
    if (diagnostic.suggested_fix?.full_patched_code && onApplyFix) {
      onApplyFix(diagnostic.suggested_fix.full_patched_code);
      setApplied(true);
      setTimeout(() => setApplied(false), 3000);
    }
  };

  return (
    <div className={`rounded-xl border p-4 sm:p-5 transition-all ${
      isError 
        ? 'bg-[#110e17] border-red-900/40 hover:border-red-700/60' 
        : isWarning 
        ? 'bg-[#15120d] border-amber-900/40 hover:border-amber-700/60' 
        : 'bg-[#0e1424] border-slate-800 hover:border-slate-700'
    }`}>
      {/* Top Header: Category, Severity, and Line number */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {isError ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : isWarning ? (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          ) : (
            <Info className="w-4 h-4 text-sky-400" />
          )}

          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {categoryName}
          </span>

          {diagnostic.line && (
            <>
              <span className="text-slate-600">·</span>
              <button
                onClick={() => onHighlightLine?.(diagnostic.line)}
                className="text-xs font-mono font-medium text-sky-400 hover:text-sky-300 hover:underline cursor-pointer"
                title="Highlight line in editor"
              >
                Line {diagnostic.line}{diagnostic.col ? `:${diagnostic.col}` : ''}
              </button>
            </>
          )}

          {diagnostic.confidence && (
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              ({diagnostic.confidence} confidence)
            </span>
          )}
        </div>

        {/* Severity Label */}
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${severityColor}`}>
          {diagnostic.severity.toUpperCase()}
        </span>
      </div>

      {/* Main Error Message */}
      <h3 className="text-sm sm:text-base font-semibold text-slate-100 font-mono mb-3">
        {diagnostic.message}
      </h3>

      {/* Offending Code Snippet Context */}
      {diagnostic.code_snippet && (
        <div className="mb-4 bg-slate-950 rounded-lg p-3 border border-slate-800/80 font-mono text-xs overflow-x-auto">
          <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
            <span>Problematic line {diagnostic.line}:</span>
            <span className="text-red-400 font-bold">▲ Error Location</span>
          </div>
          <div className="text-red-300 bg-red-950/20 px-2 py-1 rounded">
            {diagnostic.code_snippet}
          </div>
        </div>
      )}

      {/* Root-Cause Explanation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-4 bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80">
        <div>
          <span className="font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            What the code is doing
          </span>
          <p className="text-slate-400 leading-relaxed">
            {diagnostic.explanation.what_it_does}
          </p>
        </div>

        <div>
          <span className="font-semibold text-amber-300 block mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Why it is problematic
          </span>
          <p className="text-slate-400 leading-relaxed">
            {diagnostic.explanation.why_problematic}
          </p>
        </div>

        <div className="md:col-span-2 pt-2 border-t border-slate-800/60">
          <span className="font-semibold text-emerald-300 block mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            How to investigate or fix
          </span>
          <p className="text-slate-300 leading-relaxed">
            {diagnostic.explanation.how_to_fix}
          </p>
        </div>
      </div>

      {/* Suggested Fix Section */}
      {diagnostic.suggested_fix && (
        <div className="mb-4 p-3.5 bg-slate-950 rounded-lg border border-emerald-900/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Wrench className="w-3.5 h-3.5" />
              <span>Suggested Correction</span>
            </div>

            <div className="flex items-center gap-2">
              {onViewDiff && (
                <button
                  onClick={() => onViewDiff(diagnostic)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 hover:underline"
                >
                  <GitCompare className="w-3 h-3" />
                  <span>Compare Diff</span>
                </button>
              )}

              {diagnostic.suggested_fix.full_patched_code && onApplyFix && (
                <button
                  onClick={handleApply}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    applied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {applied ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Applied to Editor!</span>
                    </>
                  ) : (
                    <>
                      <CornerDownRight className="w-3 h-3" />
                      <span>Apply Fix to Editor</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs mb-2">
            <div className="p-2 rounded bg-red-950/30 border border-red-900/30 text-red-300">
              <span className="text-[10px] text-red-400 block mb-0.5">Original:</span>
              <code>{diagnostic.suggested_fix.original}</code>
            </div>

            <div className="p-2 rounded bg-emerald-950/30 border border-emerald-900/30 text-emerald-300">
              <span className="text-[10px] text-emerald-400 block mb-0.5">Correction:</span>
              <code>{diagnostic.suggested_fix.replacement}</code>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            {diagnostic.suggested_fix.explanation}
            {diagnostic.suggested_fix.assumptions && (
              <span className="text-slate-500 block mt-1 italic">
                Note: {diagnostic.suggested_fix.assumptions}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Learning Mode Accordion */}
      {diagnostic.learning_concept && (
        <div className="border-t border-slate-800/80 pt-3">
          <button
            onClick={() => setLearningOpen(!learningOpen)}
            className="w-full flex items-center justify-between text-xs text-sky-400 hover:text-sky-300 font-medium py-1 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Learning Mode: {diagnostic.learning_concept.title}</span>
            </div>
            {learningOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {learningOpen && (
            <div className="mt-2.5 p-3.5 rounded-lg bg-sky-950/20 border border-sky-900/40 text-xs text-slate-300 space-y-2.5">
              <p className="leading-relaxed">
                {diagnostic.learning_concept.explanation}
              </p>

              {diagnostic.learning_concept.example && (
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre overflow-x-auto">
                  {diagnostic.learning_concept.example}
                </div>
              )}

              <div className="flex items-start gap-2 pt-1 text-slate-400">
                <span className="text-amber-400 font-bold shrink-0">Prevention Habit:</span>
                <span>{diagnostic.learning_concept.prevention_tip}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
