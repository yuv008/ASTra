import { Issue } from './issues';
import { Suggestion } from './suggestions';
import { ProjectMetrics } from './metrics';
import { FileInfo } from './common';

export enum AnalysisStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface AnalysisResult {
  id: string;
  status: AnalysisStatus;
  projectPath: string;
  files: FileInfo[];
  issues: Issue[];
  suggestions: Suggestion[];
  metrics: ProjectMetrics;
  startTime: number;
  endTime?: number;
  duration?: number;
  error?: string;
}

export interface FileAnalysisResult {
  file: FileInfo;
  issues: Issue[];
  suggestions: Suggestion[];
  metrics: {
    complexity: number;
    maintainability: number;
    linesOfCode: number;
  };
}

export interface AnalysisRequest {
  path: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  enableAI?: boolean;
  aiModel?: string;
}

export interface AnalysisProgress {
  id: string;
  status: AnalysisStatus;
  filesAnalyzed: number;
  totalFiles: number;
  currentFile?: string;
  percentage: number;
}
