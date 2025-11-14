import { Ollama } from 'ollama';

export interface OllamaConfig {
  host?: string;
  model?: string;
}

export interface GenerateOptions {
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateResponse {
  response: string;
  model: string;
  totalDuration?: number;
}

export class OllamaClient {
  private ollama: Ollama;
  private defaultModel: string;
  private isAvailable: boolean = false;

  constructor(config: OllamaConfig = {}) {
    this.ollama = new Ollama({
      host: config.host || 'http://localhost:11434',
    });
    this.defaultModel = config.model || 'deepseek-coder:6.7b';
  }

  /**
   * Check if Ollama is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      await this.ollama.list();
      this.isAvailable = true;
      return true;
    } catch (error) {
      console.warn('Ollama not available:', (error as Error).message);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Get available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await this.ollama.list();
      return response.models.map((m) => m.name);
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }

  /**
   * Generate response from Ollama
   */
  async generate(options: GenerateOptions): Promise<GenerateResponse | null> {
    if (!this.isAvailable) {
      await this.checkAvailability();
      if (!this.isAvailable) {
        return null;
      }
    }

    try {
      const response = await this.ollama.generate({
        model: this.defaultModel,
        prompt: options.prompt,
        system: options.system,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || 500,
        },
        stream: false,
      });

      return {
        response: response.response,
        model: response.model,
        totalDuration: response.total_duration,
      };
    } catch (error) {
      console.error('Error generating response:', error);
      return null;
    }
  }

  /**
   * Generate with streaming
   */
  async *generateStream(options: GenerateOptions): AsyncGenerator<string> {
    if (!this.isAvailable) {
      await this.checkAvailability();
      if (!this.isAvailable) {
        return;
      }
    }

    try {
      const stream = await this.ollama.generate({
        model: this.defaultModel,
        prompt: options.prompt,
        system: options.system,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || 500,
        },
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.response) {
          yield chunk.response;
        }
      }
    } catch (error) {
      console.error('Error generating stream:', error);
    }
  }

  /**
   * Check if a specific model is available
   */
  async hasModel(modelName: string): Promise<boolean> {
    const models = await this.listModels();
    return models.some((m) => m.startsWith(modelName));
  }

  /**
   * Get the default model
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }

  /**
   * Set the default model
   */
  setDefaultModel(model: string): void {
    this.defaultModel = model;
  }

  /**
   * Is Ollama available?
   */
  isOllamaAvailable(): boolean {
    return this.isAvailable;
  }
}

// Singleton instance
export const ollamaClient = new OllamaClient();
