import { AISuggestion, SuggestionType, Issue, IssueCategory } from '@astra/shared';
import { OllamaClient } from './ollama-client';
import { ParseResult } from '../parsers/base-parser';
import { FileAnalysisResult } from '@astra/shared';
import { v4 as uuidv4 } from 'uuid';

export interface AIReviewOptions {
  includeRefactoring?: boolean;
  includeSecurity?: boolean;
  includePerformance?: boolean;
  maxSuggestions?: number;
}

export class AICodeReviewer {
  private ollama: OllamaClient;

  constructor(ollama: OllamaClient) {
    this.ollama = ollama;
  }

  /**
   * Review code and generate AI suggestions
   */
  async reviewCode(
    parseResult: ParseResult,
    staticIssues: Issue[],
    options: AIReviewOptions = {}
  ): Promise<AISuggestion[]> {
    // Check if Ollama is available
    if (!await this.ollama.checkAvailability()) {
      console.warn('Ollama not available, skipping AI review');
      return [];
    }

    const suggestions: AISuggestion[] = [];

    // Review based on static issues
    if (staticIssues.length > 0 && options.includeSecurity !== false) {
      const securitySuggestions = await this.reviewSecurityIssues(parseResult, staticIssues);
      suggestions.push(...securitySuggestions);
    }

    // General code review
    if (options.includeRefactoring !== false) {
      const refactoringSuggestions = await this.reviewForRefactoring(parseResult);
      suggestions.push(...refactoringSuggestions);
    }

    // Performance review
    if (options.includePerformance) {
      const performanceSuggestions = await this.reviewPerformance(parseResult);
      suggestions.push(...performanceSuggestions);
    }

    // Limit suggestions
    const maxSuggestions = options.maxSuggestions || 5;
    return suggestions.slice(0, maxSuggestions);
  }

  /**
   * Review security issues and provide AI-powered explanations
   */
  private async reviewSecurityIssues(
    parseResult: ParseResult,
    issues: Issue[]
  ): Promise<AISuggestion[]> {
    const securityIssues = issues.filter((i) => i.category === IssueCategory.SECURITY);
    if (securityIssues.length === 0) return [];

    const suggestions: AISuggestion[] = [];

    // Review top 3 security issues
    for (const issue of securityIssues.slice(0, 3)) {
      const codeSnippet = issue.codeSnippet || '';
      const prompt = this.buildSecurityReviewPrompt(issue, codeSnippet);

      const response = await this.ollama.generate({
        prompt,
        system: 'You are a security-focused code reviewer. Provide concise, actionable security recommendations.',
        temperature: 0.3,
        maxTokens: 300,
      });

      if (response) {
        suggestions.push(this.createAISuggestion(
          SuggestionType.SECURITY_FIX,
          `Security Fix: ${issue.ruleId}`,
          response.response,
          'high',
          'medium',
          response.model
        ));
      }
    }

    return suggestions;
  }

  /**
   * Review code for refactoring opportunities
   */
  private async reviewForRefactoring(parseResult: ParseResult): Promise<AISuggestion[]> {
    const { sourceCode, filePath } = parseResult;

    // Only review files under 200 lines to avoid token limits
    const lines = sourceCode.split('\n');
    if (lines.length > 200) {
      return [];
    }

    const prompt = this.buildRefactoringPrompt(sourceCode, filePath);

    const response = await this.ollama.generate({
      prompt,
      system: 'You are an expert code reviewer focused on code quality and maintainability. Provide 2-3 specific, actionable refactoring suggestions.',
      temperature: 0.5,
      maxTokens: 400,
    });

    if (response) {
      const suggestions = this.parseRefactoringSuggestions(response.response, response.model);
      return suggestions;
    }

    return [];
  }

  /**
   * Review code for performance improvements
   */
  private async reviewPerformance(parseResult: ParseResult): Promise<AISuggestion[]> {
    const { sourceCode } = parseResult;

    // Check for common performance patterns
    const hasLoops = /for\s*\(|while\s*\(|\.map\(|\.filter\(|\.reduce\(/g.test(sourceCode);
    const hasAsyncOps = /async|await|Promise|fetch/g.test(sourceCode);

    if (!hasLoops && !hasAsyncOps) {
      return []; // Skip if no performance-relevant patterns
    }

    const prompt = this.buildPerformancePrompt(sourceCode);

    const response = await this.ollama.generate({
      prompt,
      system: 'You are a performance optimization expert. Identify 1-2 key performance improvements.',
      temperature: 0.4,
      maxTokens: 300,
    });

    if (response) {
      return [this.createAISuggestion(
        SuggestionType.PERFORMANCE,
        'Performance Optimization',
        response.response,
        'medium',
        'medium',
        response.model
      )];
    }

    return [];
  }

  /**
   * Build security review prompt
   */
  private buildSecurityReviewPrompt(issue: Issue, codeSnippet: string): string {
    return `Analyze this security issue and provide a specific fix:

Issue: ${issue.message}
Rule: ${issue.ruleId}

Code:
\`\`\`
${codeSnippet}
\`\`\`

Provide:
1. Brief explanation of the vulnerability
2. Specific code fix
3. Why this fix is secure

Be concise (max 200 words).`;
  }

  /**
   * Build refactoring prompt
   */
  private buildRefactoringPrompt(code: string, filePath: string): string {
    return `Review this code for refactoring opportunities:

File: ${filePath}

\`\`\`
${code.split('\n').slice(0, 50).join('\n')}
\`\`\`

Suggest 2-3 specific improvements focusing on:
- Code complexity
- Readability
- Maintainability
- Best practices

Format each suggestion as:
[Type]: Brief description
Reasoning: Why this improves the code`;
  }

  /**
   * Build performance prompt
   */
  private buildPerformancePrompt(code: string): string {
    return `Analyze this code for performance improvements:

\`\`\`
${code.split('\n').slice(0, 40).join('\n')}
\`\`\`

Identify 1-2 key performance bottlenecks and suggest specific optimizations.
Focus on algorithmic efficiency, unnecessary operations, and async patterns.`;
  }

  /**
   * Parse refactoring suggestions from AI response
   */
  private parseRefactoringSuggestions(response: string, model: string): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const lines = response.split('\n');

    let currentSuggestion: Partial<AISuggestion> | null = null;

    for (const line of lines) {
      if (line.match(/^\[.*\]:/)) {
        // Save previous suggestion
        if (currentSuggestion && currentSuggestion.title) {
          suggestions.push(this.createAISuggestion(
            SuggestionType.REFACTOR,
            currentSuggestion.title,
            currentSuggestion.description || '',
            'medium',
            'medium',
            model
          ));
        }

        // Start new suggestion
        const title = line.replace(/^\[.*\]:\s*/, '').trim();
        currentSuggestion = { title, description: '' };
      } else if (currentSuggestion && line.trim()) {
        currentSuggestion.description = (currentSuggestion.description || '') + line.trim() + ' ';
      }
    }

    // Save last suggestion
    if (currentSuggestion && currentSuggestion.title) {
      suggestions.push(this.createAISuggestion(
        SuggestionType.REFACTOR,
        currentSuggestion.title,
        currentSuggestion.description || '',
        'medium',
        'medium',
        model
      ));
    }

    return suggestions;
  }

  /**
   * Create AI suggestion object
   */
  private createAISuggestion(
    type: SuggestionType,
    title: string,
    description: string,
    impact: 'low' | 'medium' | 'high',
    effort: 'low' | 'medium' | 'high',
    model: string
  ): AISuggestion {
    return {
      id: uuidv4(),
      type,
      title,
      description: description.trim(),
      impact,
      effort,
      source: 'ai',
      model,
      confidence: 0.8, // Default confidence
    };
  }
}
