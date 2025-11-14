import * as vscode from 'vscode';
import { AnalysisResult, Metrics } from '../services/analysis-service';

export class MetricsTreeProvider implements vscode.TreeDataProvider<MetricTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<MetricTreeItem | undefined | void> =
    new vscode.EventEmitter<MetricTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<MetricTreeItem | undefined | void> =
    this._onDidChangeTreeData.event;

  private metrics: Metrics | null = null;

  updateMetrics(result: AnalysisResult): void {
    this.metrics = result.metrics;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: MetricTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<MetricTreeItem[]> {
    if (!this.metrics) {
      return Promise.resolve([]);
    }

    return Promise.resolve([
      new MetricTreeItem('Complexity', this.metrics.complexity.toFixed(2), this.getComplexityIcon(this.metrics.complexity)),
      new MetricTreeItem('Maintainability', this.metrics.maintainability.toFixed(1), this.getMaintainabilityIcon(this.metrics.maintainability)),
      new MetricTreeItem('Lines of Code', this.metrics.linesOfCode.toString(), new vscode.ThemeIcon('symbol-number')),
      new MetricTreeItem('Comment Density', `${this.metrics.commentDensity.toFixed(1)}%`, new vscode.ThemeIcon('comment')),
    ]);
  }

  private getComplexityIcon(complexity: number): vscode.ThemeIcon {
    if (complexity > 10) {
      return new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
    } else if (complexity > 5) {
      return new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
    }
    return new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
  }

  private getMaintainabilityIcon(maintainability: number): vscode.ThemeIcon {
    if (maintainability >= 80) {
      return new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
    } else if (maintainability >= 60) {
      return new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
    }
    return new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
  }
}

class MetricTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly value: string,
    public readonly iconPath: vscode.ThemeIcon
  ) {
    super(`${label}: ${value}`, vscode.TreeItemCollapsibleState.None);
    this.tooltip = `${label}: ${value}`;
  }
}
