import axios from 'axios';
import { AnalysisResult, FileAnalysisResult } from '@astra/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface AnalyzeFileRequest {
  filePath: string;
  enableAI?: boolean;
}

export interface AnalyzeProjectRequest {
  projectPath: string;
  enableAI?: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
}

export interface OllamaStatus {
  available: boolean;
  model: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
}

export const api = {
  // Health check
  async getHealth(): Promise<HealthResponse> {
    const response = await apiClient.get('/api/health');
    return response.data;
  },

  // Check Ollama status
  async getOllamaStatus(): Promise<OllamaStatus> {
    const response = await apiClient.get('/api/ollama/status');
    return response.data;
  },

  // Analyze a single file
  async analyzeFile(request: AnalyzeFileRequest): Promise<FileAnalysisResult> {
    const response = await apiClient.post('/api/analyze/file', request);
    return response.data;
  },

  // Analyze a project/directory
  async analyzeProject(request: AnalyzeProjectRequest): Promise<AnalysisResult> {
    const response = await apiClient.post('/api/analyze/project', request);
    return response.data;
  },
};
