import { IssueCategory, Severity, Issue } from '@astra/shared';
import { BaseAnalyzer, AnalyzerContext } from './base-analyzer';
import { ASTTraverser } from '../parsers/ast-traverser';
import { ASTNode } from '../parsers/base-parser';

export class CodeQualityAnalyzer extends BaseAnalyzer {
  name = 'CodeQualityAnalyzer';
  category = IssueCategory.CODE_SMELL;

  async analyze(context: AnalyzerContext): Promise<Issue[]> {
    const issues: Issue[] = [];
    const { parseResult } = context;
    const { ast, filePath, sourceCode } = parseResult;

    const declaredVariables = new Set<string>();
    const usedVariables = new Set<string>();

    ASTTraverser.traverse(ast, {
      // Track variable declarations
      VariableDeclarator: (node) => {
        if (node.id?.name) {
          declaredVariables.add(node.id.name);
        }
      },

      // Track function parameters and check for long parameter lists
      FunctionDeclaration: (node) => {
        node.params?.forEach((param: ASTNode) => {
          if (param.name) declaredVariables.add(param.name);
        });
        this.checkLongParameterList(node, filePath, sourceCode, issues);
      },

      FunctionExpression: (node) => {
        node.params?.forEach((param: ASTNode) => {
          if (param.name) declaredVariables.add(param.name);
        });
        this.checkLongParameterList(node, filePath, sourceCode, issues);
      },

      ArrowFunctionExpression: (node) => {
        node.params?.forEach((param: ASTNode) => {
          if (param.name) declaredVariables.add(param.name);
        });
      },

      // Track variable usage
      Identifier: (node) => {
        if (node.name) usedVariables.add(node.name);
      },

      // Magic numbers
      Literal: (node) => {
        this.checkMagicNumbers(node, filePath, sourceCode, issues);
      },

      // Empty catch blocks
      CatchClause: (node) => {
        this.checkEmptyCatchBlock(node, filePath, sourceCode, issues);
      },

      // Console statements
      CallExpression: (node) => {
        this.checkConsoleStatements(node, filePath, sourceCode, issues);
        this.checkDebuggerStatements(node, filePath, sourceCode, issues);
      },

      // TODO comments (for tracking)
      '*': (node) => {
        this.checkTodoComments(node, filePath, sourceCode, issues);
      },
    });

    // Check for unused variables
    for (const variable of declaredVariables) {
      if (!usedVariables.has(variable) && !variable.startsWith('_')) {
        const nodes = ASTTraverser.findNode(ast, (n) => n.id?.name === variable || n.name === variable);
        if (nodes) {
          const issue = this.createIssue(
            'unused-variable',
            `Variable '${variable}' is declared but never used.`,
            Severity.WARNING,
            IssueCategory.CODE_SMELL,
            nodes,
            filePath,
            {
              suggestions: ['Remove the unused variable', 'If intentional, prefix with underscore: _' + variable],
            }
          );
          issues.push(issue);
        }
      }
    }

    return issues;
  }

  private checkMagicNumbers(
    node: ASTNode,
    filePath: string,
    sourceCode: string,
    issues: Issue[]
  ): void {
    if (typeof node.value === 'number') {
      const value = node.value as number;

      // Ignore common values (0, 1, -1, 100) and array indices
      const ignoredValues = [0, 1, -1, 2, 10, 100];
      if (ignoredValues.includes(value)) return;

      // Check if it's used as array index
      const parent = node.parent;
      if (parent?.type === 'MemberExpression') return;

      const issue = this.createIssue(
        'magic-number',
        `Magic number ${value} should be replaced with a named constant.`,
        Severity.INFO,
        IssueCategory.CODE_SMELL,
        node,
        filePath,
        {
          codeSnippet: this.extractCodeSnippet(sourceCode, node),
          suggestions: [`Create a named constant like: const MEANINGFUL_NAME = ${value}`],
        }
      );

      issues.push(issue);
    }
  }

  private checkLongParameterList(
    node: ASTNode,
    filePath: string,
    sourceCode: string,
    issues: Issue[]
  ): void {
    const MAX_PARAMS = 4;
    const params = node.params || [];

    if (params.length > MAX_PARAMS) {
      const functionName = node.id?.name || '<anonymous>';
      const issue = this.createIssue(
        'long-parameter-list',
        `Function '${functionName}' has ${params.length} parameters (max: ${MAX_PARAMS}). Consider using an options object.`,
        Severity.INFO,
        IssueCategory.CODE_SMELL,
        node,
        filePath,
        {
          codeSnippet: this.extractCodeSnippet(sourceCode, node, 1),
          suggestions: ['Combine related parameters into an options object', 'Break function into smaller functions'],
        }
      );

      issues.push(issue);
    }
  }

  private checkEmptyCatchBlock(
    node: ASTNode,
    filePath: string,
    sourceCode: string,
    issues: Issue[]
  ): void {
    const catchBody = node.body?.body || [];

    if (catchBody.length === 0) {
      const issue = this.createIssue(
        'empty-catch-block',
        'Empty catch block. Silent failures can hide bugs.',
        Severity.WARNING,
        IssueCategory.CODE_SMELL,
        node,
        filePath,
        {
          codeSnippet: this.extractCodeSnippet(sourceCode, node),
          suggestions: ['Log the error', 'Handle the error appropriately', 'Rethrow if cannot handle'],
        }
      );

      issues.push(issue);
    }
  }

  private checkConsoleStatements(
    node: ASTNode,
    filePath: string,
    sourceCode: string,
    issues: Issue[]
  ): void {
    if (
      node.callee?.object?.name === 'console' &&
      ['log', 'debug', 'info', 'warn', 'error'].includes(node.callee?.property?.name)
    ) {
      const issue = this.createIssue(
        'console-statement',
        `Console statement found: console.${node.callee.property.name}(). Remove before production.`,
        Severity.INFO,
        IssueCategory.CODE_SMELL,
        node,
        filePath,
        {
          codeSnippet: this.extractCodeSnippet(sourceCode, node),
          suggestions: ['Use a proper logging library', 'Remove console statements before deployment'],
        }
      );

      issues.push(issue);
    }
  }

  private checkDebuggerStatements(
    node: ASTNode,
    filePath: string,
    sourceCode: string,
    issues: Issue[]
  ): void {
    if (node.type === 'DebuggerStatement') {
      const issue = this.createIssue(
        'debugger-statement',
        'Debugger statement found. Remove before production.',
        Severity.WARNING,
        IssueCategory.CODE_SMELL,
        node,
        filePath,
        {
          codeSnippet: this.extractCodeSnippet(sourceCode, node),
          suggestions: ['Remove debugger statement'],
        }
      );

      issues.push(issue);
    }
  }

  private checkTodoComments(
    node: ASTNode,
    filePath: string,
    sourceCode: string,
    issues: Issue[]
  ): void {
    // Check if node has comments
    const comments = node.leadingComments || node.trailingComments || [];

    for (const comment of comments) {
      if (comment.value && /TODO|FIXME|HACK|XXX/i.test(comment.value)) {
        const issue = this.createIssue(
          'todo-comment',
          `TODO/FIXME comment found: "${comment.value.trim()}". Consider creating a task.`,
          Severity.INFO,
          IssueCategory.CODE_SMELL,
          node,
          filePath,
          {
            suggestions: ['Create a task in your issue tracker', 'Address the TODO item'],
          }
        );

        issues.push(issue);
      }
    }
  }
}
