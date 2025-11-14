import { AISuggestion, SuggestionType, Issue, IssueCategory } from '@astra/shared';
import { OllamaClient } from './ollama-client';
import { ParseResult } from '../parsers/base-parser';
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
    return `You are a security expert. Analyze this security vulnerability and provide a SPECIFIC, ACTIONABLE fix with exact code.

**Security Issue:**
${issue.message}
Rule: ${issue.ruleId}

**Vulnerable Code:**
\`\`\`
${codeSnippet}
\`\`\`

**Required Response Format:**

1. **Vulnerability Explanation** (2-3 sentences):
   - What exactly makes this code vulnerable?
   - What attack vector does this enable?

2. **Secure Code Fix** (provide exact replacement code):
   \`\`\`
   // Show the EXACT fixed code here
   \`\`\`

3. **Why This Fix Works** (1-2 sentences):
   - Explain the security mechanism that prevents the vulnerability

Be SPECIFIC with code examples. Avoid generic advice like "sanitize input" - show HOW to sanitize it.`;
  }

  /**
   * Build refactoring prompt
   */
  private buildRefactoringPrompt(code: string, filePath: string): string {
    return `You are a senior software architect. Review this code and provide DETAILED, SPECIFIC refactoring suggestions with concrete examples.

**File:** ${filePath}

**Code:**
\`\`\`
${code.split('\n').slice(0, 50).join('\n')}
\`\`\`

**Required Response Format:**

Provide 2-3 refactoring suggestions. For EACH suggestion:

### [Refactoring Type]: Specific Action

**Current Problem:**
- Describe the exact issue (e.g., "The 85-line handleSubmit function contains 7 nested if-statements")
- Explain the impact (e.g., "This makes it difficult to test error handling in isolation")

**Specific Solution:**
- Provide a concrete refactoring step (e.g., "Extract validation logic into validateFormData() function")
- Show pseudocode or a brief code example if helpful

**Benefit:**
- Quantify improvement (e.g., "Reduces complexity from 15 to 5, improves testability")

Examples of good suggestions:
- "Extract the 3 database queries into a UserRepository class"
- "Replace the switch statement on type with a Strategy pattern using a handler map"
- "Combine the 5 boolean flags into a single state enum"

DO NOT give generic advice like "improve readability" - be SPECIFIC and ACTIONABLE.`;
  }

  /**
   * Build performance prompt
   */
  private buildPerformancePrompt(code: string): string {
    return `You are a performance optimization specialist. Analyze this code for SPECIFIC performance bottlenecks.

**Code:**
\`\`\`
${code.split('\n').slice(0, 40).join('\n')}
\`\`\`

**Required Response Format:**

Identify 1-2 performance issues. For EACH issue:

### Performance Issue: [Specific Problem]

**Current Code Problem:**
- Identify the exact bottleneck (e.g., "forEach loop on line 23 calls API for each item")
- Estimate impact (e.g., "O(n²) complexity with nested loops")

**Optimized Solution:**
- Provide specific optimization (e.g., "Batch all API calls using Promise.all()")
- Show example code snippet

**Performance Gain:**
- Quantify expected improvement (e.g., "Reduces from O(n²) to O(n), 10x faster for 100+ items")

Examples of good suggestions:
- "Replace array.filter().map() chain with single reduce() to avoid double iteration"
- "Cache the result of expensive calculateMetrics() since input doesn't change between renders"
- "Use memoization for the recursive fibonacci calculation"

Focus on: Algorithmic complexity, unnecessary operations, inefficient data structures, blocking operations.
Be SPECIFIC - avoid generic advice like "optimize loops".`;
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
