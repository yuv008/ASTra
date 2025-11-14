# ASTra - AI Code Analyzer

**Local-first AI code review and static analysis directly in VS Code**

ASTra brings powerful code analysis capabilities directly into your IDE, featuring:

## ✨ Features

- 🔍 **Real-time Code Analysis** - Analyze files and entire projects with one click
- 🛡️ **Security Vulnerability Detection** - Identifies SQL injection, XSS, hardcoded secrets, and more
- 📊 **Code Metrics** - Track complexity, maintainability, and code quality metrics
- 🤖 **AI-Powered Suggestions** - Get intelligent fix recommendations using local LLM (Ollama)
- 🎯 **Inline Diagnostics** - See issues directly in your code with VSCode problems panel
- 📈 **Issues Tree View** - Browse all issues organized by severity
- 🔬 **Detailed Analysis Panel** - Beautiful webview showing comprehensive analysis results
- 🌐 **Multi-Language Support** - JavaScript, TypeScript, and Python

## 🚀 Getting Started

### Prerequisites

1. **Backend Server**: The ASTra analysis server must be running
2. **Ollama (Optional)**: For AI-powered suggestions, install [Ollama](https://ollama.ai)

### Installation

1. Install the extension from VS Code Marketplace
2. Start the ASTra backend server:
   ```bash
   cd backend
   npm start
   ```
3. The extension will automatically connect to `http://localhost:5000`

## 📖 Usage

### Analyze Current File
- Right-click in editor → **ASTra: Analyze Current File**
- Or use Command Palette (`Cmd/Ctrl+Shift+P`) → **ASTra: Analyze Current File**

### Analyze Entire Project
- Right-click on folder in Explorer → **ASTra: Analyze Entire Project**
- Or use Command Palette → **ASTra: Analyze Entire Project**

### View Results
- **Inline Diagnostics**: Issues appear in VS Code Problems panel
- **Issues Tree**: Click ASTra icon in Activity Bar to see issues organized by severity
- **Metrics Tree**: View code metrics in the sidebar
- **Detailed Panel**: Use **ASTra: Show Analysis Results** for comprehensive view

## ⚙️ Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `astra.serverUrl` | URL of the ASTra analysis server | `http://localhost:5000` |
| `astra.enableAI` | Enable AI-powered code suggestions | `true` |
| `astra.autoAnalyzeOnSave` | Automatically analyze file on save | `false` |
| `astra.showInlineErrors` | Show inline error diagnostics | `true` |
| `astra.severityLevel` | Minimum severity level to show | `medium` |

## 🔧 Commands

- `ASTra: Analyze Current File` - Analyze the currently open file
- `ASTra: Analyze Entire Project` - Analyze all files in the workspace
- `ASTra: Show Analysis Results` - Open detailed results panel
- `ASTra: Start Analysis Server` - Start the backend server
- `ASTra: Stop Analysis Server` - Stop the backend server

## 🛡️ Security Detection

ASTra detects 15+ vulnerability patterns including:

- **Injection Attacks**: SQL Injection, Command Injection, Path Traversal
- **XSS Vulnerabilities**: Cross-Site Scripting
- **Sensitive Data**: Hardcoded Secrets, API Keys
- **Insecure Practices**: eval() usage, weak crypto
- **And more...**

Each vulnerability is mapped to CWE and OWASP classifications.

## 📊 Code Metrics

- **Cyclomatic Complexity** - Measures code complexity
- **Cognitive Complexity** - Advanced complexity considering nesting
- **Maintainability Index** - 0-100 score for code maintainability
- **Comment Density** - Percentage of commented code
- **Lines of Code** - Total LOC count

## 🤝 Contributing

This extension is part of the ASTra project. See the main repository for contribution guidelines.

## 📝 License

MIT License - See LICENSE file for details

## 🔗 Links

- [GitHub Repository](https://github.com/yuv008/ASTra)
- [Report Issues](https://github.com/yuv008/ASTra/issues)
- [Documentation](https://github.com/yuv008/ASTra#readme)

---

**Made with ❤️ for developers who care about code quality**
