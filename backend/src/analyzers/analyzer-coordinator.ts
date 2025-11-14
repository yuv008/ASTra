import { Issue, FileAnalysisResult, FileInfo, ComplexityIssue } from '@astra/shared';
import { ParseResult } from '../parsers/base-parser';
import { IAnalyzer, AnalyzerContext } from './base-analyzer';
import { SecurityAnalyzer } from './security-analyzer';
import { ComplexityAnalyzer } from './complexity-analyzer';
import { CodeQualityAnalyzer } from './code-quality-analyzer';

export class AnalyzerCoordinator {
  private analyzers: IAnalyzer[];

  constructor() {
    this.analyzers = [
      new SecurityAnalyzer(),
      new ComplexityAnalyzer(),
      new CodeQualityAnalyzer(),
    ];
  }

  /**
   * Run all analyzers on a parsed file
   */
  async analyzeFile(parseResult: ParseResult): Promise<FileAnalysisResult> {
    const issues: Issue[] = [];
    const context: AnalyzerContext = {
      parseResult,
      issues,
    };

    // Run all analyzers
    for (const analyzer of this.analyzers) {
      try {
        const analyzerIssues = await analyzer.analyze(context);
        issues.push(...analyzerIssues);
      } catch (error) {
        console.error(`Error running ${analyzer.name}:`, error);
      }
    }

    // Calculate metrics
    const metrics = this.calculateFileMetrics(parseResult, issues);

    const fileInfo: FileInfo = {
      path: parseResult.filePath,
      language: parseResult.language,
      size: parseResult.sourceCode.length,
      linesOfCode: parseResult.sourceCode.split('\n').length,
    };

    return {
      file: fileInfo,
      issues,
      suggestions: [], // Will be populated by suggestion engine
      metrics,
    };
  }

  /**
   * Calculate file-level metrics
   */
  private calculateFileMetrics(parseResult: ParseResult, issues: Issue[]) {
    const { sourceCode } = parseResult;
    const lines = sourceCode.split('\n');
    const linesOfCode = lines.length;

    // Calculate average complexity from complexity issues
    const complexityIssues = issues.filter((i) => i.category === 'complexity') as ComplexityIssue[];
    const avgComplexity = complexityIssues.length > 0
      ? complexityIssues.reduce((sum, i) => sum + (i.complexityScore || 0), 0) / complexityIssues.length
      : 1;

    // Simple maintainability index calculation
    // MI = max(0, (171 - 5.2 * ln(V) - 0.23 * G - 16.2 * ln(L)) * 100 / 171)
    // Simplified version based on issues
    const issueWeight = issues.length * 2;
    const maintainability = Math.max(0, 100 - issueWeight - avgComplexity * 2);

    return {
      complexity: avgComplexity,
      maintainability,
      linesOfCode,
    };
  }

  /**
   * Add a custom analyzer
   */
  addAnalyzer(analyzer: IAnalyzer): void {
    this.analyzers.push(analyzer);
  }

  /**
   * Get all registered analyzers
   */
  getAnalyzers(): IAnalyzer[] {
    return this.analyzers;
  }
}
