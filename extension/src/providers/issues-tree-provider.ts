import * as vscode from 'vscode';
import { AnalysisResult, Issue } from '../services/analysis-service';

export class IssuesTreeProvider implements vscode.TreeDataProvider<IssueTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<IssueTreeItem | undefined | void> =
    new vscode.EventEmitter<IssueTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<IssueTreeItem | undefined | void> =
    this._onDidChangeTreeData.event;

  private issues: Issue[] = [];

  updateIssues(result: AnalysisResult): void {
    this.issues = result.issues;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: IssueTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: IssueTreeItem): Thenable<IssueTreeItem[]> {
    if (!element) {
      // Root level - group by severity
      const groupedBySeverity = this.groupBySeverity();
      return Promise.resolve(
        Object.entries(groupedBySeverity).map(
          ([severity, issues]) =>
            new IssueTreeItem(
              `${severity.toUpperCase()} (${issues.length})`,
              vscode.TreeItemCollapsibleState.Expanded,
              severity,
              issues
            )
        )
      );
    } else if (element.issues) {
      // Show issues under severity group
      return Promise.resolve(
        element.issues.map(
          (issue) =>
            new IssueTreeItem(
              `${issue.message} (Line ${issue.line})`,
              vscode.TreeItemCollapsibleState.None,
              undefined,
              undefined,
              issue
            )
        )
      );
    }

    return Promise.resolve([]);
  }

  private groupBySeverity(): Record<string, Issue[]> {
    const grouped: Record<string, Issue[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      info: [],
    };

    this.issues.forEach((issue) => {
      const severity = issue.severity.toLowerCase();
      if (grouped[severity]) {
        grouped[severity].push(issue);
      }
    });

    return grouped;
  }
}

class IssueTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly severity?: string,
    public readonly issues?: Issue[],
    public readonly issue?: Issue
  ) {
    super(label, collapsibleState);

    if (issue) {
      this.tooltip = this.formatTooltip(issue);
      this.iconPath = this.getIconForSeverity(issue.severity);
      this.command = {
        command: 'vscode.open',
        title: 'Open File',
        arguments: [
          vscode.Uri.file(issue.id),
          { selection: new vscode.Range(issue.line - 1, issue.column, issue.line - 1, issue.column) },
        ],
      };
    } else if (severity) {
      this.iconPath = this.getIconForSeverity(severity);
    }
  }

  private formatTooltip(issue: Issue): string {
    let tooltip = `${issue.message}\n\nSeverity: ${issue.severity}\nCategory: ${issue.category}`;

    if (issue.vulnerability) {
      tooltip += `\nVulnerability: ${issue.vulnerability}`;
    }
    if (issue.cwe) {
      tooltip += `\n${issue.cwe}`;
    }
    if (issue.owasp) {
      tooltip += `\n${issue.owasp}`;
    }

    return tooltip;
  }

  private getIconForSeverity(severity: string): vscode.ThemeIcon {
    switch (severity.toLowerCase()) {
      case 'critical':
        return new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
      case 'high':
        return new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
      case 'medium':
        return new vscode.ThemeIcon('info', new vscode.ThemeColor('editorInfo.foreground'));
      case 'low':
        return new vscode.ThemeIcon('question');
      default:
        return new vscode.ThemeIcon('circle-outline');
    }
  }
}
