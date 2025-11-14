import * as vscode from 'vscode';
import { AnalysisResult, Issue } from '../services/analysis-service';

export class DiagnosticsProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('astra');
  }

  updateDiagnostics(uri: vscode.Uri, result: AnalysisResult): void {
    const config = vscode.workspace.getConfiguration('astra');
    const showInlineErrors = config.get<boolean>('showInlineErrors', true);
    const minSeverity = config.get<string>('severityLevel', 'medium');

    if (!showInlineErrors) {
      return;
    }

    const diagnostics: vscode.Diagnostic[] = result.issues
      .filter((issue) => this.shouldShowIssue(issue, minSeverity))
      .map((issue) => this.issueToDiagnostic(issue));

    this.diagnosticCollection.set(uri, diagnostics);
  }

  private shouldShowIssue(issue: Issue, minSeverity: string): boolean {
    const severityOrder = ['info', 'low', 'medium', 'high', 'critical'];
    const issueSeverityIndex = severityOrder.indexOf(issue.severity.toLowerCase());
    const minSeverityIndex = severityOrder.indexOf(minSeverity.toLowerCase());

    return issueSeverityIndex >= minSeverityIndex;
  }

  private issueToDiagnostic(issue: Issue): vscode.Diagnostic {
    const line = Math.max(0, issue.line - 1); // Convert to 0-based
    const column = Math.max(0, issue.column);
    const endLine = issue.endLine ? issue.endLine - 1 : line;
    const endColumn = issue.endColumn || column + 1;

    const range = new vscode.Range(
      new vscode.Position(line, column),
      new vscode.Position(endLine, endColumn)
    );

    const diagnostic = new vscode.Diagnostic(
      range,
      this.formatMessage(issue),
      this.severityToVSCode(issue.severity)
    );

    diagnostic.source = 'ASTra';
    diagnostic.code = issue.vulnerability || issue.category;

    return diagnostic;
  }

  private formatMessage(issue: Issue): string {
    let message = issue.message;

    if (issue.vulnerability) {
      message = `[${issue.vulnerability}] ${message}`;
    }

    if (issue.cwe) {
      message += ` (${issue.cwe})`;
    }

    if (issue.owasp) {
      message += ` [${issue.owasp}]`;
    }

    return message;
  }

  private severityToVSCode(severity: string): vscode.DiagnosticSeverity {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return vscode.DiagnosticSeverity.Error;
      case 'medium':
        return vscode.DiagnosticSeverity.Warning;
      case 'low':
        return vscode.DiagnosticSeverity.Information;
      default:
        return vscode.DiagnosticSeverity.Hint;
    }
  }

  clear(): void {
    this.diagnosticCollection.clear();
  }
}
