import { parse } from '@babel/parser';
import { Language } from '@astra/shared';
import { BaseParser, ParseResult, ASTNode } from './base-parser';

export class JavaScriptParser extends BaseParser {
  supports(language: Language): boolean {
    return language === Language.JAVASCRIPT || language === Language.TYPESCRIPT;
  }

  async parse(code: string, filePath: string): Promise<ParseResult> {
    const language = this.detectLanguage(filePath);

    if (!this.supports(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties',
          'objectRestSpread',
          'asyncGenerators',
          'dynamicImport',
          'optionalChaining',
          'nullishCoalescingOperator',
        ],
        errorRecovery: true,
      }) as unknown as ASTNode;

      return this.createParseResult(ast, language, code, filePath);
    } catch (error) {
      throw new Error(`Parse error in ${filePath}: ${(error as Error).message}`);
    }
  }
}
