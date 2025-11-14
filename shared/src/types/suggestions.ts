import { SourceRange } from './common';

export enum SuggestionType {
  REFACTOR = 'refactor',
  SECURITY_FIX = 'security-fix',
  PERFORMANCE = 'performance',
  BEST_PRACTICE = 'best-practice',
  SIMPLIFICATION = 'simplification',
}

export interface CodeFix {
  description: string;
  oldCode: string;
  newCode: string;
  location: SourceRange;
}

export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  reasoning?: string;
  fixes?: CodeFix[];
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  source: 'rule-based' | 'ai';
  confidence?: number; // 0-1 for AI suggestions
}

export interface AISuggestion extends Suggestion {
  source: 'ai';
  model: string;
  confidence: number;
  alternativeApproaches?: string[];
}
