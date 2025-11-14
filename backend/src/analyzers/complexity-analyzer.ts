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
    const structure = this.analyzeFunctionStructure(node);

    // Check cyclomatic complexity
    if (complexity.cyclomaticComplexity > this.CYCLOMATIC_THRESHOLD) {
      const detailedMessage = this.buildComplexityMessage(
        functionName,
        complexity.cyclomaticComplexity,
        this.CYCLOMATIC_THRESHOLD,
        structure
      );

      const issue = this.createIssue(
        'high-cyclomatic-complexity',
        detailedMessage,
        Severity.WARNING,
        IssueCategory.COMPLEXITY,
        node,
        filePath,
        {
          codeSnippet: this.extractCodeSnippet(sourceCode, node),
          suggestions: this.generateComplexitySuggestions(structure),
        }
      ) as ComplexityIssue;

      issue.complexityScore = complexity.cyclomaticComplexity;
      issue.threshold = this.CYCLOMATIC_THRESHOLD;

      issues.push(issue);
    }

    // Check cognitive complexity
    if (complexity.cognitiveComplexity > this.COGNITIVE_THRESHOLD) {
      const detailedMessage = this.buildCognitiveComplexityMessage(
        functionName,
        complexity.cognitiveComplexity,
        this.COGNITIVE_THRESHOLD,
        structure
      );

      const issue = this.createIssue(
        'high-cognitive-complexity',
        detailedMessage,
        Severity.WARNING,
        IssueCategory.COMPLEXITY,
        node,
        filePath,
        {
          codeSnippet: this.extractCodeSnippet(sourceCode, node),
          suggestions: this.generateCognitiveSuggestions(structure, complexity.maxNesting),
        }
      ) as ComplexityIssue;

      issue.complexityScore = complexity.cognitiveComplexity;
      issue.threshold = this.COGNITIVE_THRESHOLD;

      issues.push(issue);
    }

    // Check nesting depth
    if (complexity.maxNesting > this.NESTING_THRESHOLD) {
      const detailedMessage = this.buildNestingMessage(
        functionName,
        complexity.maxNesting,
        this.NESTING_THRESHOLD,
        structure
      );

      const issue = this.createIssue(
        'excessive-nesting',
        detailedMessage,
        Severity.WARNING,
        IssueCategory.COMPLEXITY,
        node,
        filePath,
        {
          codeSnippet: this.extractCodeSnippet(sourceCode, node),
          suggestions: this.generateNestingSuggestions(structure, complexity.maxNesting),
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
        const detailedMessage = this.buildLengthMessage(
          functionName,
          length,
          this.FUNCTION_LENGTH_THRESHOLD,
          structure
        );

        const issue = this.createIssue(
          'long-function',
          detailedMessage,
          Severity.INFO,
          IssueCategory.COMPLEXITY,
          node,
          filePath,
          {
            codeSnippet: this.extractCodeSnippet(sourceCode, node, 1),
            suggestions: this.generateLengthSuggestions(structure, length),
          }
        ) as ComplexityIssue;

        issue.complexityScore = length;
        issue.threshold = this.FUNCTION_LENGTH_THRESHOLD;

        issues.push(issue);
      }
    }
  }

  private analyzeFunctionStructure(node: ASTNode) {
    const structure = {
      ifStatements: 0,
      loops: 0,
      switchStatements: 0,
      tryCatchBlocks: 0,
      logicalOperators: 0,
      returnStatements: 0,
      variableDeclarations: 0,
      functionCalls: 0,
      nestedFunctions: 0,
    };

    ASTTraverser.traverse(node, {
      IfStatement: () => structure.ifStatements++,
      ForStatement: () => structure.loops++,
      ForInStatement: () => structure.loops++,
      ForOfStatement: () => structure.loops++,
      WhileStatement: () => structure.loops++,
      DoWhileStatement: () => structure.loops++,
      SwitchStatement: () => structure.switchStatements++,
      TryStatement: () => structure.tryCatchBlocks++,
      LogicalExpression: () => structure.logicalOperators++,
      ReturnStatement: () => structure.returnStatements++,
      VariableDeclaration: () => structure.variableDeclarations++,
      CallExpression: () => structure.functionCalls++,
      FunctionDeclaration: () => structure.nestedFunctions++,
      FunctionExpression: () => structure.nestedFunctions++,
      ArrowFunctionExpression: () => structure.nestedFunctions++,
    });

    return structure;
  }

  private buildComplexityMessage(
    functionName: string,
    score: number,
    threshold: number,
    structure: ReturnType<typeof this.analyzeFunctionStructure>
  ): string {
    const parts = [
      `Function "${functionName}" has cyclomatic complexity of ${score} (threshold: ${threshold}).`,
    ];

    const contributors = [];
    if (structure.ifStatements > 0) contributors.push(`${structure.ifStatements} conditional(s)`);
    if (structure.loops > 0) contributors.push(`${structure.loops} loop(s)`);
    if (structure.switchStatements > 0) contributors.push(`${structure.switchStatements} switch statement(s)`);
    if (structure.logicalOperators > 0) contributors.push(`${structure.logicalOperators} logical operator(s)`);

    if (contributors.length > 0) {
      parts.push(`This is caused by: ${contributors.join(', ')}.`);
    }

    parts.push('High complexity increases the risk of bugs and makes the code harder to test and maintain.');

    return parts.join(' ');
  }

  private buildCognitiveComplexityMessage(
    functionName: string,
    score: number,
    threshold: number,
    structure: ReturnType<typeof this.analyzeFunctionStructure>
  ): string {
    const parts = [
      `Function "${functionName}" has cognitive complexity of ${score} (threshold: ${threshold}).`,
    ];

    if (structure.ifStatements > 2) {
      parts.push(`Contains ${structure.ifStatements} conditional statements which add cognitive load.`);
    }
    if (structure.loops > 1) {
      parts.push(`Has ${structure.loops} loops, especially problematic when nested.`);
    }

    parts.push('This function requires significant mental effort to understand the control flow.');

    return parts.join(' ');
  }

  private buildNestingMessage(
    functionName: string,
    depth: number,
    threshold: number,
    structure: ReturnType<typeof this.analyzeFunctionStructure>
  ): string {
    return `Function "${functionName}" has maximum nesting depth of ${depth} (threshold: ${threshold}). Deep nesting with ${structure.ifStatements} conditionals and ${structure.loops} loops makes the logic flow difficult to follow and error-prone.`;
  }

  private buildLengthMessage(
    functionName: string,
    length: number,
    threshold: number,
    structure: ReturnType<typeof this.analyzeFunctionStructure>
  ): string {
    const parts = [
      `Function "${functionName}" is ${length} lines long (threshold: ${threshold}).`,
    ];

    const complexityIndicators = [];
    if (structure.ifStatements > 0) complexityIndicators.push(`${structure.ifStatements} conditional blocks`);
    if (structure.loops > 0) complexityIndicators.push(`${structure.loops} loops`);
    if (structure.tryCatchBlocks > 0) complexityIndicators.push(`${structure.tryCatchBlocks} try-catch blocks`);

    if (complexityIndicators.length > 0) {
      parts.push(`It contains ${complexityIndicators.join(', ')}, suggesting multiple responsibilities.`);
    }

    if (structure.returnStatements > 1) {
      parts.push(`Multiple return points (${structure.returnStatements}) indicate complex control flow.`);
    }

    return parts.join(' ');
  }

  private generateComplexitySuggestions(structure: ReturnType<typeof this.analyzeFunctionStructure>): string[] {
    const suggestions = [];

    if (structure.ifStatements > 3) {
      suggestions.push(
        `Extract the ${structure.ifStatements} conditional branches into separate validation or processing functions with descriptive names`
      );
    }

    if (structure.loops > 1) {
      suggestions.push(
        `Convert the ${structure.loops} loops into separate iterator functions (e.g., processItems, filterData, transformResults)`
      );
    }

    if (structure.switchStatements > 0) {
      suggestions.push(
        'Replace switch statements with a strategy pattern or lookup table to reduce cyclomatic complexity'
      );
    }

    if (structure.logicalOperators > 5) {
      suggestions.push(
        'Extract complex boolean expressions into well-named predicate functions (e.g., isValidUser, hasRequiredPermissions)'
      );
    }

    if (suggestions.length === 0) {
      suggestions.push('Break this function into smaller, focused functions that each handle a single responsibility');
    }

    return suggestions;
  }

  private generateCognitiveSuggestions(
    structure: ReturnType<typeof this.analyzeFunctionStructure>,
    nesting: number
  ): string[] {
    const suggestions = [];

    if (nesting > 3) {
      suggestions.push(
        'Use early returns (guard clauses) to eliminate nested if-statements and flatten the code structure'
      );
      suggestions.push(
        'Extract nested conditional blocks into separate functions with clear names describing their purpose'
      );
    }

    if (structure.loops > 0 && structure.ifStatements > 0) {
      suggestions.push(
        'Separate data filtering/transformation (loops) from business logic (conditionals) into distinct functions'
      );
    }

    if (structure.tryCatchBlocks > 0) {
      suggestions.push(
        'Move error handling logic into a dedicated error handler function to separate concerns'
      );
    }

    if (suggestions.length === 0) {
      suggestions.push('Reduce nesting depth and simplify control flow to improve readability');
    }

    return suggestions;
  }

  private generateNestingSuggestions(
    structure: ReturnType<typeof this.analyzeFunctionStructure>,
    depth: number
  ): string[] {
    const suggestions = [];

    suggestions.push(
      `Reduce nesting from ${depth} levels by using early returns - invert conditions and return immediately when invalid`
    );

    if (structure.loops > 0 && structure.ifStatements > 0) {
      suggestions.push(
        'Extract loop bodies into separate functions, especially if they contain conditional logic'
      );
    }

    suggestions.push(
      'Apply the "Extract Method" refactoring to pull out nested blocks into well-named helper functions'
    );

    if (structure.ifStatements > 2) {
      suggestions.push(
        'Consider using polymorphism or a strategy pattern instead of deeply nested conditionals'
      );
    }

    return suggestions;
  }

  private generateLengthSuggestions(
    structure: ReturnType<typeof this.analyzeFunctionStructure>,
    length: number
  ): string[] {
    const suggestions = [];

    if (structure.tryCatchBlocks > 0) {
      suggestions.push(
        'Extract error handling logic into separate try-catch wrapper functions'
      );
    }

    if (structure.variableDeclarations > 5) {
      suggestions.push(
        'Group related variables into configuration objects or extract setup logic into an initialization function'
      );
    }

    if (structure.ifStatements > 0 || structure.loops > 0) {
      const sections = [];
      if (structure.ifStatements > 0) sections.push('validation/conditional');
      if (structure.loops > 0) sections.push('data processing');

      suggestions.push(
        `Split this ${length}-line function into smaller functions for ${sections.join(' and ')} logic`
      );
    }

    if (structure.returnStatements > 1) {
      suggestions.push(
        `Multiple return statements suggest different execution paths - extract each path into a separate function`
      );
    }

    if (suggestions.length === 0) {
      suggestions.push(
        'Apply the Single Responsibility Principle - identify distinct tasks and extract them into focused functions'
      );
    }

    return suggestions;
  }

  /**
   * Calculate cyclomatic complexity
   * Counts decision points: if, for, while, case, &&, ||, ?, etc.
   */
  private calculateCyclomaticComplexity(node: ASTNode): number {
    let complexity = 1; // Start with 1

    ASTTraverser.traverse(node, {
      IfStatement: () => { complexity++; },
      ConditionalExpression: () => { complexity++; },
      ForStatement: () => { complexity++; },
      ForInStatement: () => { complexity++; },
      ForOfStatement: () => { complexity++; },
      WhileStatement: () => { complexity++; },
      DoWhileStatement: () => { complexity++; },
      SwitchCase: (caseNode) => {
        if (caseNode.test) complexity++; // Don't count default case
      },
      CatchClause: () => { complexity++; },
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
