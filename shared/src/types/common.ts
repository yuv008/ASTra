// Common types used across the application

export enum Severity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

export enum Language {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  UNKNOWN = 'unknown',
}

export interface SourceLocation {
  line: number;
  column: number;
  offset?: number;
}

export interface SourceRange {
  start: SourceLocation;
  end: SourceLocation;
}

export interface FileInfo {
  path: string;
  language: Language;
  size: number;
  linesOfCode: number;
}

export interface AnalysisConfig {
  includePatterns?: string[];
  excludePatterns?: string[];
  rules?: Record<string, boolean | object>;
  enableAI?: boolean;
  aiModel?: string;
}
