# ASTra - Local-First AI Code Review & Static Analysis Platform

> A powerful, privacy-focused code analysis tool combining static analysis with local AI capabilities. Think SonarQube meets GitHub Copilot, but completely offline.

## 🚀 Features

- ✅ **Local-First**: All analysis runs on your machine, no cloud dependencies
- 🔒 **Security Analysis**: Detect SQL injection, XSS, hardcoded secrets, and more
- 📊 **Code Quality Metrics**: Cyclomatic complexity, maintainability index, code smells
- 🤖 **AI-Powered Suggestions**: Local LLM integration via Ollama for intelligent code review
- 🔍 **Multi-Language Support**: JavaScript, TypeScript, Python (extensible)
- 📈 **Developer Dashboard**: Beautiful UI with metrics visualization
- 💻 **Integrated Code Editor**: Monaco-based editor with inline diagnostics
- 🔄 **Git Integration**: Analyze repositories, track changes over time
- ⚡ **Fast & Efficient**: Incremental analysis, caching, parallel processing

## 🏗️ Tech Stack

**Backend:**
- Node.js + TypeScript + Express
- AST Parsers: Babel, Esprima, Tree-sitter
- Ollama for local AI
- SQLite for storage

**Frontend:**
- React 18 + TypeScript
- Vite for blazing-fast builds
- Monaco Editor
- TailwindCSS + Recharts

## 📦 Installation

### Prerequisites
- Node.js >= 18
- npm >= 9
- (Optional) Ollama for AI features

### Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd ASTra

# Install dependencies
npm install

# Start development servers
npm run dev
```

Frontend will run on `http://localhost:3000`
Backend API on `http://localhost:5000`

### Optional: Enable AI Features

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a code model
ollama pull deepseek-coder:6.7b
# or
ollama pull codellama:7b
```

## 🎯 Usage

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only

# Build
npm run build            # Build all packages

# Test
npm test                 # Run all tests
npm run test:coverage    # With coverage

# Lint
npm run lint             # Lint all packages
npm run lint:fix         # Auto-fix issues
```

## 📁 Project Structure

```
astra/
├── backend/           # Analysis engine & API
│   ├── src/
│   │   ├── parsers/   # AST parsing logic
│   │   ├── analyzers/ # Static analysis engines
│   │   ├── rules/     # Analysis rules
│   │   ├── ml/        # Ollama integration
│   │   ├── git/       # Git operations
│   │   ├── api/       # REST endpoints
│   │   └── storage/   # Database layer
│   └── tests/
├── frontend/          # React dashboard
│   └── src/
│       ├── components/
│       ├── pages/
│       └── services/
└── shared/            # Shared types
```

## 🧪 Analysis Capabilities

### Security
- SQL Injection detection
- XSS vulnerabilities
- Hardcoded secrets
- Path traversal
- Unsafe eval/exec

### Code Quality
- Cyclomatic complexity
- Cognitive complexity
- Code duplication
- Dead code detection
- Unused variables/imports
- Magic numbers

### Best Practices
- Naming conventions
- Error handling patterns
- Async/await usage
- Type safety

## 🤖 AI Integration

ASTra uses Ollama for intelligent code suggestions:
- Context-aware refactoring
- Performance optimization recommendations
- Security vulnerability explanations
- Best practice suggestions with reasoning

All processing happens locally - your code never leaves your machine.

## 📊 Metrics

- **Maintainability Index**: 0-100 score
- **Technical Debt**: Estimated time to fix issues
- **Grade System**: A-F rating
- **Trend Analysis**: Track improvements over time

## 🧑‍💻 Development

```bash
# Run tests in watch mode
npm run test:watch

# Type checking
cd backend && npm run build
cd frontend && npm run build

# Clean build artifacts
npm run clean
```

## 🤝 Contributing

Contributions welcome! This project is ideal for learning about:
- AST parsing and compiler design
- Static analysis techniques
- Local AI integration
- Full-stack TypeScript development

## 📝 License

MIT

## 🎓 Learning Resources

This project demonstrates:
- Building developer tools
- Working with ASTs
- Implementing static analysis
- Local LLM integration
- Full-stack TypeScript architecture
- Monorepo management

Perfect for portfolios and technical interviews!

---

Built with ❤️ for developers who value privacy and code quality
