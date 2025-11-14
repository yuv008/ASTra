import { Severity, SourceRange } from './common';

export enum IssueCategory {
  SECURITY = 'security',
  COMPLEXITY = 'complexity',
  CODE_SMELL = 'code-smell',
  BUG = 'bug',
  PERFORMANCE = 'performance',
  BEST_PRACTICE = 'best-practice',
  STYLE = 'style',
}

export interface Issue {
  id: string;
  ruleId: string;
  message: string;
  severity: Severity;
  category: IssueCategory;
  location: SourceRange;
  filePath: string;
  codeSnippet?: string;
  suggestions?: string[];
}

export interface SecurityIssue extends Issue {
  category: IssueCategory.SECURITY;
  vulnerability: string;
  cwe?: string; // Common Weakness Enumeration ID
  owasp?: string; // OWASP Top 10 category
}

export interface ComplexityIssue extends Issue {
  category: IssueCategory.COMPLEXITY;
  complexityScore: number;
  threshold: number;
}

export interface IssueStats {
  total: number;
  byCategory: Record<IssueCategory, number>;
  bySeverity: Record<Severity, number>;
}
