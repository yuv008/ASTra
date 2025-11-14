import axios, { AxiosInstance } from 'axios';
import * as vscode from 'vscode';

export interface AnalysisResult {
  filePath: string;
  language: string;
  issues: Issue[];
  metrics: Metrics;
  suggestions: Suggestion[];
}

export interface Issue {
  id: string;
  category: string;
  severity: string;
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  vulnerability?: string;
  cwe?: string;
  owasp?: string;
}

export interface Metrics {
  complexity: number;
  maintainability: number;
  linesOfCode: number;
  commentDensity: number;
}

export interface Suggestion {
  issueId: string;
  suggestion: string;
  confidence: number;
  reasoning?: string;
}

export class AnalysisService {
  private client: AxiosInstance;

  constructor() {
    const config = vscode.workspace.getConfiguration('astra');
    const serverUrl = config.get<string>('serverUrl', 'http://localhost:5000');

    this.client = axios.create({
      baseURL: serverUrl,
      timeout: 60000,
    });
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async analyzeFile(filePath: string, enableAI: boolean = true): Promise<AnalysisResult> {
    const response = await this.client.post('/api/analyze/file', {
      filePath,
      enableAI,
    });
    return response.data;
  }

  async analyzeProject(projectPath: string, enableAI: boolean = true): Promise<AnalysisResult> {
    const response = await this.client.post('/api/analyze/project', {
      projectPath,
      enableAI,
    });
    return response.data;
  }
}
