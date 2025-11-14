import Groq from 'groq-sdk';

export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface GroqChatResponse {
  message: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class GroqClient {
  private client: Groq | null = null;
  private apiKey: string | null = null;
  private defaultModel = 'llama-3.1-70b-versatile'; // Fast and capable

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Try to get API key from environment
    this.apiKey = process.env.GROQ_API_KEY || null;

    if (this.apiKey) {
      this.client = new Groq({
        apiKey: this.apiKey,
      });
      console.log('✅ Groq client initialized');
    } else {
      console.warn('⚠️  GROQ_API_KEY not found. Set it in .env file or environment variables');
      console.log('💡 Get your free API key at: https://console.groq.com/keys');
    }
  }

  async checkAvailability(): Promise<boolean> {
    return this.client !== null && this.apiKey !== null;
  }

  async chat(messages: GroqChatMessage[], options: GroqChatOptions = {}): Promise<GroqChatResponse> {
    if (!this.client) {
      throw new Error('Groq client not initialized. Please set GROQ_API_KEY environment variable.');
    }

    const model = options.model || this.defaultModel;
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens || 2000;

    try {
      const chatCompletion = await this.client.chat.completions.create({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        model,
        temperature,
        max_tokens: maxTokens,
        top_p: 1,
        stream: false,
      });

      const responseMessage = chatCompletion.choices[0]?.message?.content || '';

      return {
        message: responseMessage,
        model: chatCompletion.model,
        usage: {
          promptTokens: chatCompletion.usage?.prompt_tokens || 0,
          completionTokens: chatCompletion.usage?.completion_tokens || 0,
          totalTokens: chatCompletion.usage?.total_tokens || 0,
        },
      };
    } catch (error: any) {
      console.error('Groq API error:', error);
      throw new Error(`Groq API error: ${error.message}`);
    }
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return [
      'llama-3.1-70b-versatile',    // Recommended - fast & capable
      'llama-3.1-8b-instant',       // Very fast for simple tasks
      'mixtral-8x7b-32768',         // Good for long context
      'gemma2-9b-it',               // Google's Gemma
    ];
  }

  /**
   * Set API key dynamically
   */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new Groq({ apiKey });
    console.log('✅ Groq API key updated');
  }
}

// Singleton instance
export const groqClient = new GroqClient();
