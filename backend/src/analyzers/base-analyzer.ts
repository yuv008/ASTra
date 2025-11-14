import { Issue, IssueCategory, Severity } from '@astra/shared';
import { ParseResult, ASTNode } from '../parsers/base-parser';
import { v4 as uuidv4 } from 'uuid';

export interface AnalyzerContext {
  parseResult: ParseResult;
  issues: Issue[];
  options?: Record<string, any>;
}

export interface IAnalyzer {
  name: string;
  category: IssueCategory;
  analyze(context: AnalyzerContext): Promise<Issue[]>;
}

export abstract class BaseAnalyzer implements IAnalyzer {
  abstract name: string;
  abstract category: IssueCategory;

  abstract analyze(context: AnalyzerContext): Promise<Issue[]>;

  protected createIssue(
    ruleId: string,
    message: string,
    severity: Severity,
    category: IssueCategory,
    node: ASTNode,
    filePath: string,
    options?: Partial<Issue>
  ): Issue {
    const issue: Issue = {
      id: uuidv4(),
      ruleId,
      message,
      severity,
      category,
      location: {
        start: node.loc?.start || { line: 0, column: 0 },
        end: node.loc?.end || { line: 0, column: 0 },
      },
      filePath,
      ...options,
    };

    return issue;
  }

  protected extractCodeSnippet(sourceCode: string, node: ASTNode, context: number = 2): string {
    if (!node.loc) return '';

    const lines = sourceCode.split('\n');
    const startLine = Math.max(0, node.loc.start.line - context - 1);
    const endLine = Math.min(lines.length, node.loc.end.line + context);

    return lines.slice(startLine, endLine).join('\n');
  }
}
