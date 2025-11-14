import { IssueCategory, Severity, ComplexityIssue } from '@astra/shared';
import { BaseAnalyzer, AnalyzerContext } from './base-analyzer';
import { ASTTraverser } from '../parsers/ast-traverser';
import { ASTNode } from '../parsers/base-parser';

interface ComplexityResult {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  nestingDepth: number;
  maxNesting: number;
}

export class ComplexityAnalyzer extends BaseAnalyzer {
  name = 'ComplexityAnalyzer';
  category = IssueCategory.COMPLEXITY;

  // Thresholds
  private readonly CYCLOMATIC_THRESHOLD = 10;
  private readonly COGNITIVE_THRESHOLD = 15;
  private readonly NESTING_THRESHOLD = 4;
  private readonly FUNCTION_LENGTH_THRESHOLD = 50;

  async analyze(context: AnalyzerContext): Promise<ComplexityIssue[]> {
    const issues: ComplexityIssue[] = [];
    const { parseResult } = context;
    const { ast, filePath, sourceCode } = parseResult;

    // Find all functions
    ASTTraverser.traverse(ast, {
      FunctionDeclaration: (node) => {
        this.analyzeFunctionComplexity(node, filePath, sourceCode, issues);
      },
      FunctionExpression: (node) => {
        this.analyzeFunctionComplexity(node, filePath, sourceCode, issues);
      },
      ArrowFunctionExpression: (node) => {
        this.analyzeFunctionComplexity(node, filePath, sourceCode, issues);
      },
      MethodDefinition: (node) => {
        if (node.value) {
          this.analyzeFunctionComplexity(node.value, filePath, sourceCode, issues);
        }
      },
    });

    return issues;
  }

  private analyzeFunctionComplexity(
    node: ASTNode,
    filePath: string,
    sourceCode: string,
    issues: ComplexityIssue[]
  ): void {
    const functionName = this.getFunctionName(node);
    const complexity = this.calculateComplexity(node);

    // Check cyclomatic complexity
    if (complexity.cyclomaticComplexity > this.CYCLOMATIC_THRESHOLD) {
      const issue = this.createIssue(
        'high-cyclomatic-complexity',
        `Function "${functionName}" has cyclomatic complexity of ${complexity.cyclomaticComplexity} (threshold: ${this.CYCLOMATIC_THRESHOLD}). Consider breaking it into smaller functions.`,
        Severity.WARNING,
        IssueCategory.COMPLEXITY,
        node,
        filePath,
        {
          codeSnippet: this.extractCodeSnippet(sourceCode, node),
          suggestions: ['Break down into smaller functions', 'Extract complex conditionals into separate functions'],
        }
      ) as ComplexityIssue;

      issue.complexityScore = complexity.cyclomaticComplexity;
      issue.threshold = this.CYCLOMATIC_THRESHOLD;

      issues.push(issue);
    }

    // Check cognitive complexity
    if (complexity.cognitiveComplexity > this.COGNITIVE_THRESHOLD) {
      const issue = this.createIssue(
        'high-cognitive-complexity',
        `Function "${functionName}" has cognitive complexity of ${complexity.cognitiveComplexity} (threshold: ${this.COGNITIVE_THRESHOLD}). This function may be hard to understand.`,
        Severity.WARNING,
        IssueCategory.COMPLEXITY,
        node,
        filePath,
        {
          codeSnippet: this.extractCodeSnippet(sourceCode, node),
          suggestions: ['Simplify logic', 'Reduce nesting levels', 'Extract complex conditions'],
        }
      ) as ComplexityIssue;

      issue.complexityScore = complexity.cognitiveComplexity;
      issue.threshold = this.COGNITIVE_THRESHOLD;

      issues.push(issue);
    }

    // Check nesting depth
    if (complexity.maxNesting > this.NESTING_THRESHOLD) {
      const issue = this.createIssue(
        'excessive-nesting',
        `Function "${functionName}" has maximum nesting depth of ${complexity.maxNesting} (threshold: ${this.NESTING_THRESHOLD}). Deep nesting makes code harder to read.`,
        Severity.WARNING,
        IssueCategory.COMPLEXITY,
        node,
        filePath,
        {
          codeSnippet: this.extractCodeSnippet(sourceCode, node),
          suggestions: ['Use early returns to reduce nesting', 'Extract nested logic into separate functions'],
        }
      ) as ComplexityIssue;

      issue.complexityScore = complexity.maxNesting;
      issue.threshold = this.NESTING_THRESHOLD;

      issues.push(issue);
    }

    // Check function length
    if (node.loc) {
      const length = node.loc.end.line - node.loc.start.line;
      if (length > this.FUNCTION_LENGTH_THRESHOLD) {
        const issue = this.createIssue(
          'long-function',
          `Function "${functionName}" is ${length} lines long (threshold: ${this.FUNCTION_LENGTH_THRESHOLD}). Long functions are harder to maintain.`,
          Severity.INFO,
          IssueCategory.COMPLEXITY,
          node,
          filePath,
          {
            codeSnippet: this.extractCodeSnippet(sourceCode, node, 1),
            suggestions: ['Break into smaller, focused functions', 'Apply Single Responsibility Principle'],
          }
        ) as ComplexityIssue;

        issue.complexityScore = length;
        issue.threshold = this.FUNCTION_LENGTH_THRESHOLD;

        issues.push(issue);
      }
    }
  }

  /**
   * Calculate cyclomatic complexity
   * Counts decision points: if, for, while, case, &&, ||, ?, etc.
   */
  private calculateCyclomaticComplexity(node: ASTNode): number {
    let complexity = 1; // Start with 1

    ASTTraverser.traverse(node, {
      IfStatement: () => complexity++,
      ConditionalExpression: () => complexity++,
      ForStatement: () => complexity++,
      ForInStatement: () => complexity++,
      ForOfStatement: () => complexity++,
      WhileStatement: () => complexity++,
      DoWhileStatement: () => complexity++,
      SwitchCase: (caseNode) => {
        if (caseNode.test) complexity++; // Don't count default case
      },
      CatchClause: () => complexity++,
      LogicalExpression: (logicalNode) => {
        if (logicalNode.operator === '&&' || logicalNode.operator === '||') {
          complexity++;
        }
      },
    });

    return complexity;
  }

  /**
   * Calculate cognitive complexity (more sophisticated metric)
   * Takes into account nesting levels and logical operators
   */
  private calculateCognitiveComplexity(node: ASTNode): number {
    let complexity = 0;
    let nestingLevel = 0;

    const incrementors = [
      'IfStatement',
      'ConditionalExpression',
      'ForStatement',
      'ForInStatement',
      'ForOfStatement',
      'WhileStatement',
      'DoWhileStatement',
      'SwitchCase',
      'CatchClause',
    ];

    ASTTraverser.traverse(node, {
      '*': {
        enter: (astNode) => {
          if (incrementors.includes(astNode.type)) {
            complexity += 1 + nestingLevel;
            nestingLevel++;
          }
        },
        exit: (astNode) => {
          if (incrementors.includes(astNode.type)) {
            nestingLevel--;
          }
        },
      },
      LogicalExpression: (logicalNode) => {
        if (logicalNode.operator === '&&' || logicalNode.operator === '||') {
          complexity++;
        }
      },
    });

    return complexity;
  }

  /**
   * Calculate maximum nesting depth
   */
  private calculateNestingDepth(node: ASTNode): number {
    let maxDepth = 0;
    let currentDepth = 0;

    const nestingNodes = [
      'IfStatement',
      'ForStatement',
      'ForInStatement',
      'ForOfStatement',
      'WhileStatement',
      'DoWhileStatement',
      'TryStatement',
      'SwitchStatement',
    ];

    ASTTraverser.traverse(node, {
      '*': {
        enter: (astNode) => {
          if (nestingNodes.includes(astNode.type)) {
            currentDepth++;
            maxDepth = Math.max(maxDepth, currentDepth);
          }
        },
        exit: (astNode) => {
          if (nestingNodes.includes(astNode.type)) {
            currentDepth--;
          }
        },
      },
    });

    return maxDepth;
  }

  private calculateComplexity(node: ASTNode): ComplexityResult {
    return {
      cyclomaticComplexity: this.calculateCyclomaticComplexity(node),
      cognitiveComplexity: this.calculateCognitiveComplexity(node),
      nestingDepth: this.calculateNestingDepth(node),
      maxNesting: this.calculateNestingDepth(node),
    };
  }

  private getFunctionName(node: ASTNode): string {
    // Function declaration
    if (node.id?.name) {
      return node.id.name;
    }

    // Method definition
    if (node.key?.name) {
      return node.key.name;
    }

    // Arrow function or anonymous
    return '<anonymous>';
  }
}
