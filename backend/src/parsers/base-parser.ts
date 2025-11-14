import { Language } from '@astra/shared';

// Base AST node type
export interface ASTNode {
  type: string;
  loc?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  range?: [number, number];
  [key: string]: any;
}

// Parser result
export interface ParseResult {
  ast: ASTNode;
  language: Language;
  sourceCode: string;
  filePath: string;
}

// Base parser interface
export interface IParser {
  parse(code: string, filePath: string): Promise<ParseResult>;
  supports(language: Language): boolean;
  detectLanguage(filePath: string): Language;
}

// Abstract base parser class
export abstract class BaseParser implements IParser {
  abstract parse(code: string, filePath: string): Promise<ParseResult>;
  abstract supports(language: Language): boolean;

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

  protected createParseResult(
    ast: ASTNode,
    language: Language,
    sourceCode: string,
    filePath: string
  ): ParseResult {
    return { ast, language, sourceCode, filePath };
  }
}
