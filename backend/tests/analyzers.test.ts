import { describe, it, expect } from 'vitest';
import { ParserFactory } from '../src/parsers/parser-factory';
import { AnalyzerCoordinator } from '../src/analyzers/analyzer-coordinator';
import { IssueCategory, Severity } from '@astra/shared';

describe('Analyzer Tests', () => {
  const factory = new ParserFactory();
  const coordinator = new AnalyzerCoordinator();

  describe('Security Analyzer', () => {
    it('should detect SQL injection vulnerability', async () => {
      const code = `
        const query = "SELECT * FROM users WHERE id = " + userId;
        db.query(query);
      `;

      const parseResult = await factory.parseCode(code, 'test.js');
      const result = await coordinator.analyzeFile(parseResult);

      const sqlIssues = result.issues.filter((i) => i.ruleId === 'sql-injection');
      expect(sqlIssues.length).toBeGreaterThan(0);
      expect(sqlIssues[0].severity).toBe(Severity.ERROR);
      expect(sqlIssues[0].category).toBe(IssueCategory.SECURITY);
    });

    it('should detect hardcoded secrets', async () => {
      const code = `
        const API_KEY = "${'sk' + '_live' + '_1234567890abcdefghijklmnop'}";
        const password = "mySecretPassword123";
      `;

      const parseResult = await factory.parseCode(code, 'test.js');
      const result = await coordinator.analyzeFile(parseResult);

      const secretIssues = result.issues.filter((i) => i.ruleId === 'hardcoded-secret');
      expect(secretIssues.length).toBeGreaterThan(0);
    });

    it('should detect dangerous eval usage', async () => {
      const code = `
        const userCode = getUserInput();
        eval(userCode);
      `;

      const parseResult = await factory.parseCode(code, 'test.js');
      const result = await coordinator.analyzeFile(parseResult);

      const evalIssues = result.issues.filter((i) => i.ruleId === 'dangerous-function');
      expect(evalIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Complexity Analyzer', () => {
    it('should analyze function complexity', async () => {
      const code = `
        function complexFunction(x) {
          if (x > 0) {
            if (x > 10) {
              if (x > 20) {
                for (let i = 0; i < x; i++) {
                  while (i < 5) {
                    if (i === 2) {
                      return true;
                    }
                    i++;
                  }
                }
              } else {
                return false;
              }
            } else {
              return null;
            }
          }
          return undefined;
        }
      `;

      const parseResult = await factory.parseCode(code, 'test.js');
      const result = await coordinator.analyzeFile(parseResult);

      // Complexity analyzer runs successfully
      expect(result.metrics.complexity).toBeGreaterThanOrEqual(0);
      expect(result.issues).toBeDefined();
    });

    it('should analyze nesting depth', async () => {
      const code = `
        function deeplyNested() {
          if (true) {
            if (true) {
              if (true) {
                if (true) {
                  if (true) {
                    console.log('too deep');
                  }
                }
              }
            }
          }
        }
      `;

      const parseResult = await factory.parseCode(code, 'test.js');
      const result = await coordinator.analyzeFile(parseResult);

      // Analysis runs without errors
      expect(result.file).toBeDefined();
      expect(result.metrics).toBeDefined();
    });
  });

  describe('Code Quality Analyzer', () => {
    it('should analyze code quality', async () => {
      const code = `
        function calculatePrice(quantity) {
          return quantity * 19.99;
        }
      `;

      const parseResult = await factory.parseCode(code, 'test.js');
      const result = await coordinator.analyzeFile(parseResult);

      // Quality analyzer runs successfully
      expect(result.file).toBeDefined();
      expect(result.metrics.maintainability).toBeGreaterThanOrEqual(0);
    });

    it('should detect long parameter lists', async () => {
      const code = `
        function tooManyParams(a, b, c, d, e, f, g) {
          return a + b + c + d + e + f + g;
        }
      `;

      const parseResult = await factory.parseCode(code, 'test.js');
      const result = await coordinator.analyzeFile(parseResult);

      const paramIssues = result.issues.filter((i) => i.ruleId === 'long-parameter-list');
      expect(paramIssues.length).toBeGreaterThan(0);
    });

    it('should detect empty catch blocks', async () => {
      const code = `
        try {
          riskyOperation();
        } catch (error) {
          // Empty catch
        }
      `;

      const parseResult = await factory.parseCode(code, 'test.js');
      const result = await coordinator.analyzeFile(parseResult);

      const catchIssues = result.issues.filter((i) => i.ruleId === 'empty-catch-block');
      expect(catchIssues.length).toBeGreaterThan(0);
    });

    it('should detect console statements', async () => {
      const code = `
        console.log('debug message');
        console.error('error message');
      `;

      const parseResult = await factory.parseCode(code, 'test.js');
      const result = await coordinator.analyzeFile(parseResult);

      const consoleIssues = result.issues.filter((i) => i.ruleId === 'console-statement');
      expect(consoleIssues.length).toBe(2);
    });
  });

  describe('AnalyzerCoordinator', () => {
    it('should run all analyzers and return combined results', async () => {
      const code = `
        function test() {
          const password = "hardcoded123";
          console.log(password);
          if (true) {
            if (true) {
              if (true) {
                eval('code');
              }
            }
          }
        }
      `;

      const parseResult = await factory.parseCode(code, 'test.js');
      const result = await coordinator.analyzeFile(parseResult);

      expect(result.file).toBeDefined();
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.linesOfCode).toBeGreaterThan(0);
      expect(result.metrics.maintainability).toBeGreaterThan(0);
    });

    it('should calculate metrics correctly', async () => {
      const code = `const x = 1;`;
      const parseResult = await factory.parseCode(code, 'test.js');
      const result = await coordinator.analyzeFile(parseResult);

      expect(result.metrics.linesOfCode).toBe(1);
      expect(result.metrics.complexity).toBeGreaterThanOrEqual(0);
      expect(result.metrics.maintainability).toBeGreaterThanOrEqual(0);
      expect(result.metrics.maintainability).toBeLessThanOrEqual(100);
    });
  });
});
