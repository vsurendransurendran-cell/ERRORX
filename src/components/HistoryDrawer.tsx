import React from 'react';
import { History, Trash2, ArrowRight, RotateCcw, Download, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { HistoryEntry } from '../types';

interface HistoryDrawerProps {
  history: HistoryEntry[];
  onLoadHistory: (entry: HistoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
  onBackToAnalyzer: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  onLoadHistory,
  onDeleteEntry,
  onClearAll,
  onBackToAnalyzer
}) => {
  const exportAsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `errorx_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Local Analysis History</h2>
            <p className="text-xs text-slate-400">
              Stored securely in your browser's local sandbox storage ({history.length} records)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <>
              <button
                onClick={exportAsJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
                title="Export history as JSON file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={onClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-colors border border-red-800/60"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </>
          )}

          <button
            onClick={onBackToAnalyzer}
            className="px-3.5 py-1.5 text-xs rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors"
          >
            Back to Editor
          </button>
        </div>
      </div>

      {/* History Items List */}
      {history.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-[#0d1322] space-y-3">
          <History className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No Past Analyses Stored</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you analyze Python code snippets, snapshots are automatically retained locally in browser storage so you can review previous debugging sessions.
          </p>
          <button
            onClick={onBackToAnalyzer}
            className="mt-2 inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500"
          >
            Start Analyzing Code
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col justify-between p-4 rounded-xl border border-slate-800 bg-[#0d1322] hover:border-slate-700 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {entry.validSyntax ? (
                      <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" /> Syntax Valid
                      </span>
                    ) : (
                      <span className="text-[10px] bg-red-950/60 text-red-400 border border-red-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" /> Syntax Error
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400 font-mono">
                      {entry.errorCount} errors · {entry.warningCount} warnings
                    </span>
                  </div>
                </div>

                {/* Code Preview */}
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/60 font-mono text-xs text-slate-300 whitespace-pre overflow-hidden text-ellipsis max-h-24 leading-5 mb-3">
                  {entry.codeSnippet || '# (Empty source code)'}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs">
                <button
                  onClick={() => onDeleteEntry(entry.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded hover:bg-slate-800"
                  title="Delete record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onLoadHistory(entry)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 font-medium transition-colors cursor-pointer"
                >
                  <span>Reopen in Editor</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
