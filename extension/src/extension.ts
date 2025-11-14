import * as vscode from 'vscode';
import { AnalysisService } from './services/analysis-service';
import { DiagnosticsProvider } from './providers/diagnostics-provider';
import { ResultsPanel } from './panels/results-panel';
import { IssuesTreeProvider } from './providers/issues-tree-provider';
import { MetricsTreeProvider } from './providers/metrics-tree-provider';

let analysisService: AnalysisService;
let diagnosticsProvider: DiagnosticsProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log('ASTra Code Analyzer is now active');

  // Initialize services
  analysisService = new AnalysisService();
  diagnosticsProvider = new DiagnosticsProvider();

  // Initialize tree view providers
  const issuesProvider = new IssuesTreeProvider();
  const metricsProvider = new MetricsTreeProvider();

  // Register tree views
  vscode.window.registerTreeDataProvider('astra-issues', issuesProvider);
  vscode.window.registerTreeDataProvider('astra-metrics', metricsProvider);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('astra.analyzeFile', async () => {
      await analyzeCurrentFile(issuesProvider, metricsProvider);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('astra.analyzeProject', async () => {
      await analyzeProject(issuesProvider, metricsProvider);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('astra.showResults', () => {
      ResultsPanel.createOrShow(context.extensionUri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('astra.startServer', async () => {
      await startAnalysisServer();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('astra.stopServer', async () => {
      await stopAnalysisServer();
    })
  );

  // Auto-analyze on save if enabled
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      const config = vscode.workspace.getConfiguration('astra');
      if (config.get('autoAnalyzeOnSave')) {
        await analyzeDocument(document, issuesProvider, metricsProvider);
      }
    })
  );

  // Check server status on activation
  checkServerStatus();
}

async function analyzeCurrentFile(
  issuesProvider: IssuesTreeProvider,
  metricsProvider: MetricsTreeProvider
) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active file to analyze');
    return;
  }

  await analyzeDocument(editor.document, issuesProvider, metricsProvider);
}

async function analyzeDocument(
  document: vscode.TextDocument,
  issuesProvider: IssuesTreeProvider,
  metricsProvider: MetricsTreeProvider
) {
  const config = vscode.workspace.getConfiguration('astra');
  const enableAI = config.get<boolean>('enableAI', true);

  // Get document content and file name
  const code = document.getText();
  const fileName = document.fileName || document.uri.path.split('/').pop() || 'untitled.js';

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'ASTra: Analyzing code...',
      cancellable: false,
    },
    async () => {
      try {
        // Analyze code content directly (works with unsaved files!)
        const result = await analysisService.analyzeCode(code, fileName, enableAI);

        // Update diagnostics
        diagnosticsProvider.updateDiagnostics(document.uri, result);

        // Update tree views
        issuesProvider.updateIssues(result);
        metricsProvider.updateMetrics(result);

        // Show results panel
        ResultsPanel.updateResults(result);

        vscode.window.showInformationMessage(
          `Analysis complete: ${result.issues.length} issues found`
        );
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `Analysis failed: ${error.message || 'Unknown error'}`
        );
      }
    }
  );
}

async function analyzeProject(
  issuesProvider: IssuesTreeProvider,
  metricsProvider: MetricsTreeProvider
) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('No workspace folder open');
    return;
  }

  const projectPath = workspaceFolders[0].uri.fsPath;
  const config = vscode.workspace.getConfiguration('astra');
  const enableAI = config.get<boolean>('enableAI', true);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'ASTra: Analyzing project...',
      cancellable: false,
    },
    async () => {
      try {
        const result = await analysisService.analyzeProject(projectPath, enableAI);

        // Update tree views with aggregated results
        issuesProvider.updateIssues(result);
        metricsProvider.updateMetrics(result);

        // Show results panel
        ResultsPanel.updateResults(result);

        vscode.window.showInformationMessage(
          `Project analysis complete: ${result.issues.length} total issues found`
        );
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `Project analysis failed: ${error.message || 'Unknown error'}`
        );
      }
    }
  );
}

async function checkServerStatus() {
  try {
    const isRunning = await analysisService.checkHealth();
    if (isRunning) {
      vscode.window.showInformationMessage('ASTra server is running');
    } else {
      const action = await vscode.window.showWarningMessage(
        'ASTra server is not running. Start it now?',
        'Start Server',
        'Dismiss'
      );
      if (action === 'Start Server') {
        await startAnalysisServer();
      }
    }
  } catch (error) {
    vscode.window.showWarningMessage(
      'Cannot connect to ASTra server. Please start it manually.'
    );
  }
}

async function startAnalysisServer() {
  const terminal = vscode.window.createTerminal('ASTra Server');
  terminal.show();

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders) {
    const astraPath = workspaceFolders[0].uri.fsPath;
    terminal.sendText(`cd "${astraPath}/backend" && npm start`);
    vscode.window.showInformationMessage('Starting ASTra server...');
  }
}

async function stopAnalysisServer() {
  vscode.window.showInformationMessage(
    'Please stop the server from the terminal or close the terminal window'
  );
}

export function deactivate() {
  diagnosticsProvider.clear();
}
