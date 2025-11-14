export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  nestingDepth: number;
  linesOfCode: number;
  maintainabilityIndex: number;
}

export interface CodeMetrics {
  totalFiles: number;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  functions: number;
  classes: number;
  averageComplexity: number;
}

export interface QualityMetrics {
  maintainabilityIndex: number; // 0-100
  technicalDebt: number; // minutes
  duplicateLines: number;
  duplicatePercentage: number;
  testCoverage?: number;
}

export interface Grade {
  score: number; // 0-100
  letter: 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
}

export interface ProjectMetrics {
  code: CodeMetrics;
  quality: QualityMetrics;
  complexity: ComplexityMetrics;
  grade: Grade;
  timestamp: number;
}

export interface TrendData {
  timestamp: number;
  maintainabilityIndex: number;
  issueCount: number;
  complexity: number;
}
