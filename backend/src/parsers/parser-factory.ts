import { Language } from '@astra/shared';
import { IParser, ParseResult } from './base-parser';
import { JavaScriptParser } from './javascript-parser';
import * as fs from 'fs/promises';

export class ParserFactory {
  private parsers: Map<Language, IParser> = new Map();

  /**
   * Get parser for a specific language (lazy loaded)
   */
  getParser(language: Language): IParser | undefined {
    // Lazy load parsers to avoid loading native modules at import time
    if (!this.parsers.has(language)) {
      this.initializeParser(language);
    }
    return this.parsers.get(language);
  }

  private initializeParser(language: Language): void {
    try {
      switch (language) {
        case Language.JAVASCRIPT:
        case Language.TYPESCRIPT:
          if (!this.parsers.has(language)) {
            this.parsers.set(language, new JavaScriptParser());
          }
          break;
        case Language.PYTHON:
          if (!this.parsers.has(language)) {
            // Dynamic import to avoid loading tree-sitter at module initialization
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { PythonParser } = require('./python-parser');
            this.parsers.set(language, new PythonParser());
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to initialize parser for ${language}:`, error);
      // Parser will remain undefined, allowing graceful degradation
    }
  }

  /**
   * Detect language from file path
   */
  detectLanguage(filePath: string): Language {
    const ext = filePath.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'js':
      case 'jsx':
      case 'mjs':
      case 'cjs':
        return Language.JAVASCRIPT;
      case 'ts':
      case 'tsx':
        return Language.TYPESCRIPT;
      case 'py':
        return Language.PYTHON;
      default:
        return Language.UNKNOWN;
    }
  }

  /**
   * Parse a file
   */
  async parseFile(filePath: string): Promise<ParseResult> {
    const code = await fs.readFile(filePath, 'utf-8');
    return this.parseCode(code, filePath);
  }

  /**
   * Parse code string
   */
  async parseCode(code: string, filePath: string): Promise<ParseResult> {
    const language = this.detectLanguage(filePath);

    if (language === Language.UNKNOWN) {
      throw new Error(`Unsupported file type: ${filePath}`);
    }

    const parser = this.getParser(language);

    if (!parser) {
      throw new Error(`No parser available for language: ${language}`);
    }

    return parser.parse(code, filePath);
  }

  /**
   * Check if a file is supported
   */
  isSupported(filePath: string): boolean {
    const language = this.detectLanguage(filePath);
    return language !== Language.UNKNOWN && this.parsers.has(language);
  }

  /**
   * Get all supported file extensions
   */
  getSupportedExtensions(): string[] {
    return ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'py'];
  }
}

// Singleton instance
export const parserFactory = new ParserFactory();
