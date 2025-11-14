import { IssueCategory, Severity, SecurityIssue } from '@astra/shared';
import { BaseAnalyzer, AnalyzerContext } from './base-analyzer';
import { ASTTraverser } from '../parsers/ast-traverser';
import { ASTNode } from '../parsers/base-parser';

export class SecurityAnalyzer extends BaseAnalyzer {
  name = 'SecurityAnalyzer';
  category = IssueCategory.SECURITY;

  async analyze(context: AnalyzerContext): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const { parseResult } = context;
    const { ast, filePath, sourceCode } = parseResult;

    ASTTraverser.traverse(ast, {
      // SQL Injection detection in function calls
      CallExpression: (node) => {
        this.checkSQLInjection(node, filePath, sourceCode, issues);
        this.checkCommandInjection(node, filePath, sourceCode, issues);
      },

      // SQL Injection in string concatenations
      BinaryExpression: (node) => {
        this.checkSQLInjectionInExpression(node, filePath, sourceCode, issues);
      },

      // XSS detection
      JSXAttribute: (node) => {
        this.checkXSS(node, filePath, sourceCode, issues);
      },

      // Hardcoded secrets
      StringLiteral: (node) => {
        this.checkHardcodedSecrets(node, filePath, sourceCode, issues);
      },

      Literal: (node) => {
        this.checkHardcodedSecrets(node, filePath, sourceCode, issues);
      },

      // Eval usage
      Identifier: (node) => {
        this.checkDangerousFunctions(node, filePath, sourceCode, issues);
      },
    });

    return issues;
  }

  private checkSQLInjectionInExpression(
    node: ASTNode,
    filePath: string,
    sourceCode: string,
    issues: SecurityIssue[]
  ): void {
    // Check for SQL keywords in string concatenation
    if (node.operator === '+') {
      const hasStringLiteral = this.containsStringLiteral(node);
      if (hasStringLiteral) {
        const leftCode = this.getNodeCode(node.left, sourceCode);
        const rightCode = this.getNodeCode(node.right, sourceCode);
        const combinedCode = `${leftCode} ${rightCode}`.toUpperCase();

        const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FROM', 'WHERE', 'DROP', 'CREATE'];
        const hasSQLKeyword = sqlKeywords.some(keyword => combinedCode.includes(keyword));

        if (hasSQLKeyword) {
          const issue = this.createIssue(
            'sql-injection',
            'SQL query uses string concatenation. This is vulnerable to SQL injection.',
            Severity.ERROR,
            IssueCategory.SECURITY,
            node,
            filePath,
            {
              codeSnippet: this.extractCodeSnippet(sourceCode, node),
              suggestions: ['Use parameterized queries or prepared statements'],
            }
          ) as SecurityIssue;

          issue.vulnerability = 'SQL Injection';
          issue.cwe = 'CWE-89';
          issue.owasp = 'A03:2021 - Injection';

          issues.push(issue);
        }
      }
    }
  }

  private containsStringLiteral(node: ASTNode): boolean {
    if (node.type === 'StringLiteral' || node.type === 'Literal') return true;
    if (node.left && this.containsStringLiteral(node.left)) return true;
    if (node.right && this.containsStringLiteral(node.right)) return true;
    return false;
  }

  private getNodeCode(node: ASTNode, sourceCode: string): string {
    if (!node) return '';
    if (node.type === 'StringLiteral' && node.value) return String(node.value);
    if (node.type === 'Literal' && node.value) return String(node.value);
    if (node.type === 'Identifier') return node.name || '';
    if (node.range) {
      return sourceCode.substring(node.range[0], node.range[1]);
    }
    return '';
  }

  private checkSQLInjection(
    node: ASTNode,
    filePath: string,
    sourceCode: string,
    issues: SecurityIssue[]
  ): void {
    // Check for string concatenation in SQL queries
    if (node.callee?.property?.name === 'query' || node.callee?.property?.name === 'execute') {
      const firstArg = node.arguments?.[0];

      if (firstArg?.type === 'TemplateLiteral' && firstArg.expressions?.length > 0) {
        // Template literal with expressions - potential SQL injection
        const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FROM', 'WHERE'];
        const hasSQL = firstArg.quasis?.some((quasi: ASTNode) =>
          sqlKeywords.some(keyword => quasi.value?.raw?.toUpperCase().includes(keyword))
        );

        if (hasSQL) {
          const issue = this.createIssue(
            'sql-injection',
            'Potential SQL injection vulnerability. Use parameterized queries instead.',
            Severity.ERROR,
            IssueCategory.SECURITY,
            node,
            filePath,
            {
              codeSnippet: this.extractCodeSnippet(sourceCode, node),
              suggestions: ['Use parameterized queries or prepared statements'],
            }
          ) as SecurityIssue;

          issue.vulnerability = 'SQL Injection';
          issue.cwe = 'CWE-89';
          issue.owasp = 'A03:2021 - Injection';

          issues.push(issue);
        }
      }

      // Check for binary expressions (string concatenation)
      if (firstArg?.type === 'BinaryExpression' && firstArg.operator === '+') {
        const issue = this.createIssue(
          'sql-injection',
          'SQL query uses string concatenation. This is vulnerable to SQL injection.',
          Severity.ERROR,
          IssueCategory.SECURITY,
          node,
          filePath,
          {
            codeSnippet: this.extractCodeSnippet(sourceCode, node),
            suggestions: ['Use parameterized queries instead of string concatenation'],
          }
        ) as SecurityIssue;

        issue.vulnerability = 'SQL Injection';
        issue.cwe = 'CWE-89';
        issue.owasp = 'A03:2021 - Injection';

        issues.push(issue);
      }
    }
  }

  private checkCommandInjection(
    node: ASTNode,
    filePath: string,
    sourceCode: string,
    issues: SecurityIssue[]
  ): void {
    const dangerousFunctions = ['exec', 'execSync', 'spawn', 'spawnSync', 'execFile'];
    const funcName = node.callee?.name || node.callee?.property?.name;

    if (dangerousFunctions.includes(funcName)) {
      const firstArg = node.arguments?.[0];

      // Check if the command includes variables (template literals or concatenation)
      if (
        firstArg?.type === 'TemplateLiteral' ||
        (firstArg?.type === 'BinaryExpression' && firstArg.operator === '+')
      ) {
        const issue = this.createIssue(
          'command-injection',
          'Potential command injection vulnerability. Avoid using user input in system commands.',
          Severity.ERROR,
          IssueCategory.SECURITY,
          node,
          filePath,
          {
            codeSnippet: this.extractCodeSnippet(sourceCode, node),
            suggestions: ['Validate and sanitize all inputs', 'Use safer alternatives like spawn with array arguments'],
          }
        ) as SecurityIssue;

        issue.vulnerability = 'Command Injection';
        issue.cwe = 'CWE-78';
        issue.owasp = 'A03:2021 - Injection';

        issues.push(issue);
      }
    }
  }

  private checkXSS(
    node: ASTNode,
    filePath: string,
    sourceCode: string,
    issues: SecurityIssue[]
  ): void {
    // Check for dangerouslySetInnerHTML
    if (node.name?.name === 'dangerouslySetInnerHTML') {
      const issue = this.createIssue(
        'xss-danger',
        'Using dangerouslySetInnerHTML can lead to XSS vulnerabilities.',
        Severity.WARNING,
        IssueCategory.SECURITY,
        node,
        filePath,
        {
          codeSnippet: this.extractCodeSnippet(sourceCode, node),
          suggestions: ['Sanitize HTML before rendering', 'Use DOMPurify or similar library'],
        }
      ) as SecurityIssue;

      issue.vulnerability = 'Cross-Site Scripting (XSS)';
      issue.cwe = 'CWE-79';
      issue.owasp = 'A03:2021 - Injection';

      issues.push(issue);
    }
  }

  private checkHardcodedSecrets(
    node: ASTNode,
    filePath: string,
    sourceCode: string,
    issues: SecurityIssue[]
  ): void {
    const value = node.value;
    if (typeof value !== 'string') return;
    if (value.length < 8) return; // Ignore short strings

    // Patterns for detecting secrets
    const secretPatterns = [
      { regex: /^sk_live_[a-zA-Z0-9]{20,}$/i, name: 'API Key (Stripe-like)' },
      { regex: /^[a-zA-Z0-9]{32,}$/,  name: 'Long API Key or Token' },
      { regex: /-----BEGIN.*PRIVATE KEY-----/, name: 'Private Key' },
      { regex: /password|secret|token/i, name: 'Potential Secret', minLength: 15 },
    ];

    for (const pattern of secretPatterns) {
      const minLength = pattern.minLength || value.length;
      if (pattern.regex.test(value) && value.length >= minLength) {
        const issue = this.createIssue(
          'hardcoded-secret',
          `Potential hardcoded ${pattern.name} detected. Store secrets in environment variables or secure vaults.`,
          Severity.ERROR,
          IssueCategory.SECURITY,
          node,
          filePath,
          {
            codeSnippet: this.extractCodeSnippet(sourceCode, node),
            suggestions: ['Use environment variables (process.env)', 'Use a secrets management service'],
          }
        ) as SecurityIssue;

        issue.vulnerability = 'Hardcoded Secrets';
        issue.cwe = 'CWE-798';
        issue.owasp = 'A07:2021 - Identification and Authentication Failures';

        issues.push(issue);
        break; // Only report once per literal
      }
    }
  }

  private checkDangerousFunctions(
    node: ASTNode,
    filePath: string,
    sourceCode: string,
    issues: SecurityIssue[]
  ): void {
    const dangerousFunctions = ['eval', 'Function', 'setTimeout', 'setInterval'];

    if (dangerousFunctions.includes(node.name)) {
      const issue = this.createIssue(
        'dangerous-function',
        `Using ${node.name} with dynamic code can lead to code injection vulnerabilities.`,
        Severity.WARNING,
        IssueCategory.SECURITY,
        node,
        filePath,
        {
          codeSnippet: this.extractCodeSnippet(sourceCode, node),
          suggestions: ['Avoid using eval and similar functions', 'Use safer alternatives'],
        }
      ) as SecurityIssue;

      issue.vulnerability = 'Code Injection';
      issue.cwe = 'CWE-94';
      issue.owasp = 'A03:2021 - Injection';

      issues.push(issue);
    }
  }

  private findParentProperty(_node: ASTNode): string | null {
    // This is a simplified version - in real implementation, you'd track parent context
    return null;
  }
}
