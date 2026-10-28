import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Trash2, 
  Copy, 
  Check, 
  FileCode, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  Sparkles,
  Info
} from 'lucide-react';
import { PRESETS, CodePreset } from '../constants/presets';

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  traceback: string;
  setTraceback: (tb: string) => void;
  enableAi: boolean;
  setEnableAi: (val: boolean) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  highlightedLine: number | null;
  aiConfigured: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  setCode,
  traceback,
  setTraceback,
  enableAi,
  setEnableAi,
  onAnalyze,
  isAnalyzing,
  highlightedLine,
  aiConfigured
}) => {
  const [copied, setCopied] = useState(false);
  const [showTraceback, setShowTraceback] = useState(Boolean(traceback.trim()));
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Synchronize line numbers
  const lines = code.split('\n');
  const lineCount = Math.max(1, lines.length);

  // Tab key handles 4 spaces indentation instead of losing focus
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);

      // Restore cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = PRESETS.find(p => p.id === presetId);
    if (found) {
      setCode(found.code);
      if (found.traceback) {
        setTraceback(found.traceback);
        setShowTraceback(true);
      } else {
        setTraceback('');
        setShowTraceback(false);
      }
    }
  };

  const handleClear = () => {
    setCode('');
    setTraceback('');
    setSelectedPresetId('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1322] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Editor Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-slate-200">Python Source Editor</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 font-mono">{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 font-mono">{code.length} chars</span>
        </div>

        {/* Preset Selector & Action Buttons */}
        <div className="flex items-center gap-2">
          <select
            value={selectedPresetId}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-md px-2.5 py-1 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
            title="Load sample error scenarios"
          >
            <option value="">Load Error Preset...</option>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.category}: {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Copy source code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleClear}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
            title="Clear editor"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Textarea with Line Numbers */}
      <div className="relative flex-1 min-h-[300px] flex font-mono text-sm bg-[#0a0f1d] overflow-hidden">
        {/* Line Numbers Gutter */}
        <div className="w-12 select-none py-3 text-right pr-3 bg-[#0a0f1d] text-slate-600 border-r border-slate-800/80 font-mono text-xs leading-6 overflow-hidden">
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const isTarget = highlightedLine === lineNum;
            return (
              <div 
                key={i} 
                className={`transition-colors ${isTarget ? 'text-red-400 font-bold bg-red-950/40' : ''}`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Text Input Area */}
        <div className="relative flex-1 h-full">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="# Paste or type Python code here...
# Example:
def calculate_area(radius):
    if radius <= 0
        return 0
    return 3.14159 * radius ** 2"
            spellCheck={false}
            className="w-full h-full p-3 bg-transparent text-slate-200 resize-none font-mono text-sm leading-6 focus:outline-none focus:ring-0 selection:bg-sky-900/60"
          />
        </div>
      </div>

      {/* Optional Traceback Input Drawer */}
      <div className="border-t border-slate-800 bg-[#0d1424]">
        <button
          onClick={() => setShowTraceback(!showTraceback)}
          className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium">Runtime Traceback / Stack Trace (Optional)</span>
            {traceback.trim() && (
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.2 rounded border border-amber-500/20">
                Provided
              </span>
            )}
          </div>
          {showTraceback ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showTraceback && (
          <div className="p-3 border-t border-slate-800/60 bg-[#090d18]">
            <p className="text-xs text-slate-400 mb-1.5">
              Paste the error traceback output from terminal or console to diagnose the runtime exception:
            </p>
            <textarea
              value={traceback}
              onChange={(e) => setTraceback(e.target.value)}
              placeholder="Traceback (most recent call last):
  File 'app.py', line 12, in <module>
    item = items[5]
IndexError: list index out of range"
              rows={4}
              className="w-full p-2.5 bg-slate-950 text-slate-300 font-mono text-xs rounded border border-slate-800 focus:outline-none focus:border-sky-500 resize-y"
            />
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/95 border-t border-slate-800">
        {/* AI Explanations Toggle */}
        <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={enableAi}
            onChange={(e) => setEnableAi(e.target.checked)}
            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-700 bg-slate-800"
          />
          <div className="flex items-center gap-1.5">
            <Sparkles className={`w-3.5 h-3.5 ${enableAi ? 'text-amber-400' : 'text-slate-500'}`} />
            <span className={enableAi ? 'font-medium text-slate-100' : 'text-slate-400'}>
              AI Explanation (Gemini 3.8 Flash)
            </span>
          </div>
        </label>

        {/* Submit Analyze Button */}
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || (!code.trim() && !traceback.trim())}
          className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg text-white transition-all shadow-md ${
            isAnalyzing || (!code.trim() && !traceback.trim())
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-sky-600 hover:bg-sky-500 active:bg-sky-700 cursor-pointer border border-sky-400/30'
          }`}
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Analyzing AST...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Analyze Python Code</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
