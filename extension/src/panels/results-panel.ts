import * as vscode from 'vscode';
import { AnalysisResult } from '../services/analysis-service';

export class ResultsPanel {
  public static currentPanel: ResultsPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private static _result: AnalysisResult | null = null;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent();
  }

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (ResultsPanel.currentPanel) {
      ResultsPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'astraResults',
      'ASTra Analysis Results',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    ResultsPanel.currentPanel = new ResultsPanel(panel, extensionUri);
  }

  public static updateResults(result: AnalysisResult) {
    ResultsPanel._result = result;
    if (ResultsPanel.currentPanel) {
      ResultsPanel.currentPanel._panel.webview.html =
        ResultsPanel.currentPanel._getWebviewContent();
    }
  }

  private _getWebviewContent(): string {
    const result = ResultsPanel._result;

    if (!result) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
              .empty-state { text-align: center; padding: 60px 20px; color: #888; }
            </style>
          </head>
          <body>
            <div class="empty-state">
              <h2>No Analysis Results</h2>
              <p>Run an analysis to see results here</p>
            </div>
          </body>
        </html>
      `;
    }

    const issuesByCategory = this._groupByCategory(result.issues);
    const issuesBySeverity = this._groupBySeverity(result.issues);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              padding: 20px;
              background: var(--vscode-editor-background);
              color: var(--vscode-editor-foreground);
            }
            .header { margin-bottom: 30px; }
            h1 { font-size: 24px; margin-bottom: 10px; }
            .file-path { color: var(--vscode-descriptionForeground); font-size: 14px; }
            .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 30px; }
            .metric-card {
              background: var(--vscode-editor-inactiveSelectionBackground);
              padding: 16px;
              border-radius: 8px;
              border: 1px solid var(--vscode-panel-border);
            }
            .metric-label { font-size: 12px; color: var(--vscode-descriptionForeground); margin-bottom: 4px; }
            .metric-value { font-size: 24px; font-weight: 600; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; margin-bottom: 16px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 8px; }
            .issue-card {
              background: var(--vscode-editor-inactiveSelectionBackground);
              padding: 12px;
              margin-bottom: 12px;
              border-radius: 6px;
              border-left: 4px solid;
            }
            .issue-card.critical { border-left-color: #f85149; }
            .issue-card.high { border-left-color: #f97583; }
            .issue-card.medium { border-left-color: #ffab70; }
            .issue-card.low { border-left-color: #79b8ff; }
            .issue-card.info { border-left-color: #a2aabc; }
            .issue-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px; }
            .issue-message { font-weight: 500; flex: 1; }
            .severity-badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .severity-badge.critical { background: #f85149; color: white; }
            .severity-badge.high { background: #f97583; color: white; }
            .severity-badge.medium { background: #ffab70; color: black; }
            .severity-badge.low { background: #79b8ff; color: black; }
            .severity-badge.info { background: #a2aabc; color: white; }
            .issue-meta { font-size: 12px; color: var(--vscode-descriptionForeground); }
            .badge {
              display: inline-block;
              background: var(--vscode-badge-background);
              color: var(--vscode-badge-foreground);
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 11px;
              margin-left: 4px;
            }
            .suggestion {
              background: var(--vscode-textBlockQuote-background);
              border-left: 3px solid var(--vscode-textLink-foreground);
              padding: 12px;
              margin-top: 8px;
              border-radius: 4px;
              font-size: 13px;
            }
            .suggestion-header { font-weight: 600; margin-bottom: 4px; }
            .confidence { color: var(--vscode-descriptionForeground); font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Analysis Results</h1>
            <div class="file-path">${this._escapeHtml(result.filePath)}</div>
          </div>

          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Complexity</div>
              <div class="metric-value">${result.metrics.complexity.toFixed(2)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Maintainability</div>
              <div class="metric-value">${result.metrics.maintainability.toFixed(1)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Lines of Code</div>
              <div class="metric-value">${result.metrics.linesOfCode}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Comment Density</div>
              <div class="metric-value">${result.metrics.commentDensity.toFixed(1)}%</div>
            </div>
          </div>

          ${
            result.issues.length > 0
              ? `
            <div class="section">
              <h2 class="section-title">Issues (${result.issues.length})</h2>
              ${result.issues
                .map(
                  (issue) => `
                <div class="issue-card ${issue.severity.toLowerCase()}">
                  <div class="issue-header">
                    <div class="issue-message">${this._escapeHtml(issue.message)}</div>
                    <span class="severity-badge ${issue.severity.toLowerCase()}">${issue.severity}</span>
                  </div>
                  <div class="issue-meta">
                    Line ${issue.line}:${issue.column} • ${issue.category}
                    ${issue.vulnerability ? `<span class="badge">${issue.vulnerability}</span>` : ''}
                    ${issue.cwe ? `<span class="badge">${issue.cwe}</span>` : ''}
                    ${issue.owasp ? `<span class="badge">${issue.owasp}</span>` : ''}
                  </div>
                  ${this._renderSuggestion(issue.id, result.suggestions)}
                </div>
              `
                )
                .join('')}
            </div>
          `
              : '<div class="section"><p style="color: var(--vscode-descriptionForeground);">No issues found! 🎉</p></div>'
          }
        </body>
      </html>
    `;
  }

  private _groupByCategory(issues: any[]): Record<string, any[]> {
    return issues.reduce((acc, issue) => {
      if (!acc[issue.category]) {
        acc[issue.category] = [];
      }
      acc[issue.category].push(issue);
      return acc;
    }, {});
  }

  private _groupBySeverity(issues: any[]): Record<string, any[]> {
    return issues.reduce((acc, issue) => {
      if (!acc[issue.severity]) {
        acc[issue.severity] = [];
      }
      acc[issue.severity].push(issue);
      return acc;
    }, {});
  }

  private _renderSuggestion(issueId: string, suggestions: any[]): string {
    const suggestion = suggestions.find((s) => s.issueId === issueId);
    if (!suggestion) {
      return '';
    }

    return `
      <div class="suggestion">
        <div class="suggestion-header">💡 AI Suggestion</div>
        <div>${this._escapeHtml(suggestion.suggestion)}</div>
        <div class="confidence">Confidence: ${(suggestion.confidence * 100).toFixed(0)}%</div>
      </div>
    `;
  }

  private _escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  public dispose() {
    ResultsPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
