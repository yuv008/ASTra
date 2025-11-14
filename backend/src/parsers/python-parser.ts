import Parser from 'tree-sitter';
import Python from 'tree-sitter-python';
import { Language } from '@astra/shared';
import { BaseParser, ParseResult, ASTNode } from './base-parser';

export class PythonParser extends BaseParser {
  private parser: Parser;

  constructor() {
    super();
    this.parser = new Parser();
    this.parser.setLanguage(Python);
  }

  supports(language: Language): boolean {
    return language === Language.PYTHON;
  }

  async parse(code: string, filePath: string): Promise<ParseResult> {
    const language = this.detectLanguage(filePath);

    if (!this.supports(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    try {
      const tree = this.parser.parse(code);
      const ast = this.convertTreeSitterToAST(tree.rootNode);

      return this.createParseResult(ast, language, code, filePath);
    } catch (error) {
      throw new Error(`Parse error in ${filePath}: ${(error as Error).message}`);
    }
  }

  private convertTreeSitterToAST(node: Parser.SyntaxNode): ASTNode {
    const ast: ASTNode = {
      type: node.type,
      loc: {
        start: {
          line: node.startPosition.row + 1,
          column: node.startPosition.column,
        },
        end: {
          line: node.endPosition.row + 1,
          column: node.endPosition.column,
        },
      },
      range: [node.startIndex, node.endIndex],
      text: node.text,
      children: [],
    };

    // Convert children
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        ast.children.push(this.convertTreeSitterToAST(child));
      }
    }

    return ast;
  }
}
