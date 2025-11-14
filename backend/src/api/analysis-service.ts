import { AnalysisResult, AnalysisStatus, FileAnalysisResult, ProjectMetrics } from '@astra/shared';
import { ParserFactory } from '../parsers/parser-factory';
import { AnalyzerCoordinator } from '../analyzers/analyzer-coordinator';
import { AICodeReviewer } from '../ml/ai-code-reviewer';
import { ollamaClient } from '../ml/ollama-client';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface AnalysisOptions {
  enableAI?: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
  fileName?: string;
  language?: string;
}

export class AnalysisService {
  private parserFactory: ParserFactory;
  private analyzerCoordinator: AnalyzerCoordinator;
  private aiReviewer: AICodeReviewer;

  constructor() {
    this.parserFactory = new ParserFactory();
    this.analyzerCoordinator = new AnalyzerCoordinator();
    this.aiReviewer = new AICodeReviewer(ollamaClient);
  }

  /**
   * Analyze code content directly (for unsaved/in-memory files)
   */
  async analyzeCode(code: string, options: AnalysisOptions = {}): Promise<FileAnalysisResult> {
    const fileName = options.fileName || 'untitled.js';

    // Parse the code
    const parseResult = await this.parserFactory.parseCode(code, fileName);

    // Run static analysis
    const analysisResult = await this.analyzerCoordinator.analyzeFile(parseResult);

    // Run AI review if enabled
    if (options.enableAI) {
      const aiSuggestions = await this.aiReviewer.reviewCode(
        parseResult,
        analysisResult.issues
      );
      analysisResult.suggestions.push(...aiSuggestions);
    }

    return analysisResult;
  }

  /**
   * Analyze a single file from disk
   */
  async analyzeFile(filePath: string, options: AnalysisOptions = {}): Promise<FileAnalysisResult> {
    // Parse the file
    const parseResult = await this.parserFactory.parseFile(filePath);

    // Run static analysis
    const analysisResult = await this.analyzerCoordinator.analyzeFile(parseResult);

    // Run AI review if enabled
    if (options.enableAI) {
      const aiSuggestions = await this.aiReviewer.reviewCode(
        parseResult,
        analysisResult.issues
      );
      analysisResult.suggestions.push(...aiSuggestions);
    }

    return analysisResult;
  }

  /**
   * Analyze a directory
   */
  async analyzeDirectory(directoryPath: string, options: AnalysisOptions = {}): Promise<AnalysisResult> {
    const analysisId = uuidv4();
    const startTime = Date.now();

    const result: AnalysisResult = {
      id: analysisId,
      status: AnalysisStatus.RUNNING,
      projectPath: directoryPath,
      files: [],
      issues: [],
      suggestions: [],
      metrics: this.createEmptyMetrics(),
      startTime,
    };

    try {
      // Find all supported files
      const files = await this.findFiles(directoryPath, options);

      // Analyze each file
      for (const file of files) {
        try {
          const fileResult = await this.analyzeFile(file, options);

          result.files.push(fileResult.file);
          result.issues.push(...fileResult.issues);
          result.suggestions.push(...fileResult.suggestions);
        } catch (error) {
          console.error(`Error analyzing ${file}:`, error);
        }
      }

      // Calculate project metrics
      result.metrics = this.calculateProjectMetrics(result);
      result.status = AnalysisStatus.COMPLETED;
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;

    } catch (error) {
      result.status = AnalysisStatus.FAILED;
      result.error = (error as Error).message;
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;
    }

    return result;
  }

  /**
   * Find all supported files in directory
   */
  private async findFiles(
    directoryPath: string,
    _options: AnalysisOptions
  ): Promise<string[]> {
    const files: string[] = [];
    const supportedExtensions = this.parserFactory.getSupportedExtensions();

    const traverse = async (currentPath: string) => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        // Skip node_modules, .git, etc.
        if (entry.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
            await traverse(fullPath);
          }
        } else {
          const ext = path.extname(entry.name).slice(1);
          if (supportedExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    await traverse(directoryPath);
    return files;
  }

  /**
   * Calculate project-level metrics
   */
  private calculateProjectMetrics(result: AnalysisResult): ProjectMetrics {
    const totalLines = result.files.reduce((sum, f) => sum + f.linesOfCode, 0);
    const totalIssues = result.issues.length;
    const avgComplexity = result.files.length > 0
      ? result.files.reduce((sum, f) => sum + (f as any).metrics?.complexity || 0, 0) / result.files.length
      : 0;

    // Calculate maintainability index (0-100)
    const issueWeight = totalIssues * 2;
    const complexityWeight = avgComplexity * 5;
    const maintainabilityIndex = Math.max(0, Math.min(100, 100 - issueWeight - complexityWeight));

    // Calculate grade
    const grade = this.calculateGrade(maintainabilityIndex);

    return {
      code: {
        totalFiles: result.files.length,
        totalLines,
        codeLines: Math.floor(totalLines * 0.8), // Estimate
        commentLines: Math.floor(totalLines * 0.1), // Estimate
        blankLines: Math.floor(totalLines * 0.1), // Estimate
        functions: 0, // Would need deeper analysis
        classes: 0, // Would need deeper analysis
        averageComplexity: avgComplexity,
      },
      quality: {
        maintainabilityIndex,
        technicalDebt: totalIssues * 5, // 5 minutes per issue estimate
        duplicateLines: 0,
        duplicatePercentage: 0,
      },
      complexity: {
        cyclomaticComplexity: avgComplexity,
        cognitiveComplexity: avgComplexity * 1.2,
        nestingDepth: 0,
        linesOfCode: totalLines,
        maintainabilityIndex,
      },
      grade,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate grade from maintainability index
   */
  private calculateGrade(score: number): { score: number; letter: 'A' | 'B' | 'C' | 'D' | 'F'; label: string } {
    let letter: 'A' | 'B' | 'C' | 'D' | 'F';
    let label: string;

    if (score >= 80) {
      letter = 'A';
      label = 'Excellent';
    } else if (score >= 60) {
      letter = 'B';
      label = 'Good';
    } else if (score >= 40) {
      letter = 'C';
      label = 'Fair';
    } else if (score >= 20) {
      letter = 'D';
      label = 'Poor';
    } else {
      letter = 'F';
      label = 'Critical';
    }

    return { score, letter, label };
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(): ProjectMetrics {
    return {
      code: {
        totalFiles: 0,
        totalLines: 0,
        codeLines: 0,
        commentLines: 0,
        blankLines: 0,
        functions: 0,
        classes: 0,
        averageComplexity: 0,
      },
      quality: {
        maintainabilityIndex: 0,
        technicalDebt: 0,
        duplicateLines: 0,
        duplicatePercentage: 0,
      },
      complexity: {
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        nestingDepth: 0,
        linesOfCode: 0,
        maintainabilityIndex: 0,
      },
      grade: { score: 0, letter: 'F', label: 'Not analyzed' },
      timestamp: Date.now(),
    };
  }

  /**
   * Check Ollama availability
   */
  async checkOllamaStatus() {
    return {
      available: await ollamaClient.checkAvailability(),
      model: ollamaClient.getDefaultModel(),
    };
  }
}
