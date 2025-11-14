import { describe, it, expect } from 'vitest';
import { ParserFactory } from '../src/parsers/parser-factory';
import { ASTTraverser } from '../src/parsers/ast-traverser';
import { Language } from '@astra/shared';

describe('Parser Tests', () => {
  const factory = new ParserFactory();

  describe('JavaScript Parser', () => {
    it('should parse simple JavaScript code', async () => {
      const code = `
        function add(a, b) {
          return a + b;
        }
      `;

      const result = await factory.parseCode(code, 'test.js');

      expect(result.language).toBe(Language.JAVASCRIPT);
      expect(result.ast).toBeDefined();
      expect(result.ast.type).toBe('File');
    });

    it('should parse TypeScript with types', async () => {
      const code = `
        function greet(name: string): string {
          return 'Hello, ' + name;
        }
      `;

      const result = await factory.parseCode(code, 'test.ts');

      expect(result.language).toBe(Language.TYPESCRIPT);
      expect(result.ast).toBeDefined();
    });

    it('should find function declarations', async () => {
      const code = `
        function foo() {}
        function bar() {}
        const baz = () => {};
      `;

      const result = await factory.parseCode(code, 'test.js');
      const functions = ASTTraverser.findNodes(result.ast, 'FunctionDeclaration');

      expect(functions.length).toBe(2);
    });
  });

  describe('Python Parser', () => {
    it('should parse simple Python code', async () => {
      const parser = factory.getParser(Language.PYTHON);
      if (!parser) {
        console.log('⚠️  Skipping Python parser test - tree-sitter not available');
        return;
      }

      const code = `
def add(a, b):
    return a + b
      `;

      const result = await factory.parseCode(code, 'test.py');

      expect(result.language).toBe(Language.PYTHON);
      expect(result.ast).toBeDefined();
    });

    it('should parse Python class', async () => {
      const parser = factory.getParser(Language.PYTHON);
      if (!parser) {
        console.log('⚠️  Skipping Python parser test - tree-sitter not available');
        return;
      }

      const code = `
class Calculator:
    def add(self, a, b):
        return a + b
      `;

      const result = await factory.parseCode(code, 'test.py');

      expect(result.ast).toBeDefined();
      expect(result.sourceCode).toContain('class Calculator');
    });
  });

  describe('Parser Factory', () => {
    it('should detect language from file extension', () => {
      expect(factory.detectLanguage('test.js')).toBe(Language.JAVASCRIPT);
      expect(factory.detectLanguage('test.ts')).toBe(Language.TYPESCRIPT);
      expect(factory.detectLanguage('test.py')).toBe(Language.PYTHON);
      expect(factory.detectLanguage('test.txt')).toBe(Language.UNKNOWN);
    });

    it('should check if file is supported', () => {
      expect(factory.isSupported('test.js')).toBe(true);
      expect(factory.isSupported('test.ts')).toBe(true);
      expect(factory.isSupported('test.py')).toBe(true);
      expect(factory.isSupported('test.txt')).toBe(false);
    });

    it('should return supported extensions', () => {
      const extensions = factory.getSupportedExtensions();
      expect(extensions).toContain('js');
      expect(extensions).toContain('ts');
      expect(extensions).toContain('py');
    });
  });

  describe('AST Traverser', () => {
    it('should traverse all nodes', async () => {
      const code = 'const x = 1 + 2;';
      const result = await factory.parseCode(code, 'test.js');

      let nodeCount = 0;
      ASTTraverser.traverse(result.ast, {
        '*': () => {
          nodeCount++;
        },
      });

      expect(nodeCount).toBeGreaterThan(0);
    });

    it('should find specific node types', async () => {
      const code = 'const x = 1; const y = 2;';
      const result = await factory.parseCode(code, 'test.js');

      const declarations = ASTTraverser.findNodes(result.ast, 'VariableDeclaration');
      expect(declarations.length).toBe(2);
    });
  });
});
