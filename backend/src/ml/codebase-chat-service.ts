import { groqClient, GroqChatMessage } from './groq-client';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ChatRequest {
  message: string;
  context?: string;
  conversationHistory?: GroqChatMessage[];
  includeCodebase?: boolean;
}

export interface ChatResponse {
  message: string;
  context?: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class CodebaseChatService {
  private codebaseContext: Map<string, string> = new Map();
  private maxContextFiles = 5;
  private maxContextLength = 8000;

  /**
   * Chat with the codebase using Groq
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Check if Groq is available
    const isAvailable = await groqClient.checkAvailability();
    if (!isAvailable) {
      throw new Error(
        'Groq is not configured. Please set GROQ_API_KEY environment variable. ' +
        'Get your free API key at: https://console.groq.com/keys'
      );
    }

    // Build messages array
    const messages: GroqChatMessage[] = [];

    // System message with codebase context
    const systemMessage = this.buildSystemMessage(request.context);
    messages.push({
      role: 'system',
      content: systemMessage,
    });

    // Add conversation history if provided
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      messages.push(...request.conversationHistory);
    }

    // Add user message
    messages.push({
      role: 'user',
      content: request.message,
    });

    // Call Groq
    const response = await groqClient.chat(messages, {
      temperature: 0.7,
      maxTokens: 2000,
    });

    return {
      message: response.message,
      context: request.context,
      model: response.model,
      usage: response.usage,
    };
  }

  /**
   * Find relevant code files based on query
   */
  async findRelevantCode(query: string, projectPath: string): Promise<string> {
    const relevantFiles: string[] = [];
    const keywords = this.extractKeywords(query);

    try {
      // Search for files matching keywords
      const files = await this.searchFiles(projectPath, keywords);
      relevantFiles.push(...files.slice(0, this.maxContextFiles));

      // Read and combine file contents
      const codeContext: string[] = [];
      let totalLength = 0;

      for (const file of relevantFiles) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const relativePath = path.relative(projectPath, file);

          const fileContext = `\n---\nFile: ${relativePath}\n\`\`\`\n${content.slice(0, 2000)}\n\`\`\`\n`;

          if (totalLength + fileContext.length > this.maxContextLength) {
            break;
          }

          codeContext.push(fileContext);
          totalLength += fileContext.length;
        } catch (error) {
          console.error(`Error reading file ${file}:`, error);
        }
      }

      return codeContext.join('\n');
    } catch (error) {
      console.error('Error finding relevant code:', error);
      return '';
    }
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    // Remove common words and extract meaningful terms
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'how', 'what', 'where', 'when', 'why',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'can', 'could', 'should', 'would', 'will', 'this', 'that',
    ]);

    const words = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Search for files containing keywords
   */
  private async searchFiles(projectPath: string, keywords: string[]): Promise<string[]> {
    const matchingFiles: { file: string; score: number }[] = [];

    try {
      const files = await this.getAllCodeFiles(projectPath);

      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const contentLower = content.toLowerCase();

          // Calculate relevance score
          let score = 0;
          for (const keyword of keywords) {
            const matches = contentLower.match(new RegExp(keyword, 'g'));
            if (matches) {
              score += matches.length;
            }
          }

          if (score > 0) {
            matchingFiles.push({ file, score });
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

      // Sort by score and return top matches
      return matchingFiles
        .sort((a, b) => b.score - a.score)
        .map(item => item.file);
    } catch (error) {
      console.error('Error searching files:', error);
      return [];
    }
  }

  /**
   * Get all code files in project
   */
  private async getAllCodeFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    const excludeDirs = new Set(['node_modules', 'dist', 'build', '.git', 'coverage']);
    const codeExtensions = new Set(['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs']);

    async function scan(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            if (!excludeDirs.has(entry.name)) {
              await scan(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (codeExtensions.has(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }

    await scan(dirPath);
    return files;
  }

  /**
   * Build system message with codebase context
   */
  private buildSystemMessage(codeContext?: string): string {
    let systemMessage = `You are ASTra, an expert AI coding assistant with deep knowledge of software development, architecture, and best practices.

You help developers by:
- Answering questions about their codebase
- Explaining how code works
- Suggesting improvements and refactoring
- Helping debug issues
- Providing code examples

Be concise, accurate, and helpful. When referencing code, use specific file names and line numbers if available.`;

    if (codeContext && codeContext.trim().length > 0) {
      systemMessage += `\n\n**Codebase Context:**\n${codeContext}\n\nUse this context to provide specific, relevant answers.`;
    }

    return systemMessage;
  }
}

// Singleton instance
export const codebaseChatService = new CodebaseChatService();
