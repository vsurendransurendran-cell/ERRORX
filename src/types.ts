export type DiagnosticCategory =
  | 'syntax'
  | 'indentation'
  | 'name_error'
  | 'type_error'
  | 'runtime_risk'
  | 'bad_practice'
  | 'traceback'
  | 'security'
  | 'analysis';

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface ExplanationDetails {
  what_it_does: string;
  why_problematic: string;
  how_to_fix: string;
  concept_to_learn: string;
}

export interface SuggestedFix {
  original: string;
  replacement: string;
  explanation: string;
  assumptions?: string;
  full_patched_code?: string;
}

export interface LearningConcept {
  title: string;
  explanation: string;
  example: string;
  prevention_tip: string;
}

export interface DiagnosticItem {
  id: string;
  category: DiagnosticCategory;
  severity: DiagnosticSeverity;
  line: number | null;
  col: number | null;
  end_line?: number | null;
  end_col?: number | null;
  message: string;
  code_snippet?: string;
  frames?: Array<{
    file: string;
    line: number;
    function: string;
    code: string;
  }>;
  explanation: ExplanationDetails;
  suggested_fix?: SuggestedFix | null;
  learning_concept?: LearningConcept | null;
  confidence?: 'high' | 'medium' | 'low';
}

export interface AnalysisMetrics {
  total_lines: number;
  error_count: number;
  warning_count: number;
  info_count: number;
}

export interface AIExplanation {
  available: boolean;
  reason?: string;
  model?: string;
  source?: string;
  content?: string;
  generated_at?: string;
}

export interface AnalysisResponse {
  valid_syntax: boolean;
  diagnostics: DiagnosticItem[];
  metrics: AnalysisMetrics;
  has_suggested_fixes: boolean;
  traceback_diagnostic?: DiagnosticItem | null;
  ai_explanation?: AIExplanation | null;
  error?: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  codeSnippet: string;
  fullCode: string;
  traceback?: string;
  validSyntax: boolean;
  errorCount: number;
  warningCount: number;
  totalDiagnostics: number;
}

export interface TestResultItem {
  name: string;
  description: string;
  status: 'PASS' | 'FAIL';
  raw: string;
}

export interface TestSuiteResponse {
  success: boolean;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  tests: TestResultItem[];
  raw_output?: string;
}
