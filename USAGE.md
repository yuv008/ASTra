# ASTra Usage Guide

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- npm >= 9
- (Optional) Ollama for AI-powered suggestions

### Installation

```bash
# Install dependencies
npm install

# Build shared types
cd shared && npm run build && cd ..

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies (when implemented)
cd frontend && npm install && cd ..
```

### Running the Backend

```bash
# Development mode with auto-reload
npm run dev:backend

# Production mode
npm run build:backend
npm run start:backend
```

The API will be available at `http://localhost:5000`

## 📡 API Endpoints

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Analyze a Single File
```bash
curl -X POST http://localhost:5000/api/analyze/file \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "/path/to/your/file.js",
    "enableAI": false
  }'
```

### Analyze a Project/Directory
```bash
curl -X POST http://localhost:5000/api/analyze/project \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "/path/to/your/project",
    "enableAI": false
  }'
```

### Check Ollama Status
```bash
curl http://localhost:5000/api/ollama/status
```

## 🤖 Using Ollama for AI Suggestions

### Install Ollama
```bash
# On Linux/macOS
curl -fsSL https://ollama.com/install.sh | sh

# Pull a code model
ollama pull deepseek-coder:6.7b
# or
ollama pull codellama:7b
```

### Enable AI in Analysis
```bash
curl -X POST http://localhost:5000/api/analyze/file \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "/path/to/your/file.js",
    "enableAI": true
  }'
```

## 🔍 What Gets Analyzed

### Security Issues
- SQL Injection vulnerabilities
- XSS (Cross-Site Scripting)
- Hardcoded secrets and API keys
- Command injection
- Dangerous function usage (eval, etc.)

### Code Quality
- Cyclomatic complexity
- Cognitive complexity
- Nesting depth
- Function length
- Magic numbers
- Long parameter lists
- Empty catch blocks
- Console statements
- Unused variables

### Metrics
- Maintainability Index (0-100)
- Technical Debt (estimated minutes)
- Grade (A-F)
- Lines of code
- Complexity scores

## 📊 Response Format

```json
{
  "file": {
    "path": "/path/to/file.js",
    "language": "javascript",
    "size": 1234,
    "linesOfCode": 50
  },
  "issues": [
    {
      "id": "uuid",
      "ruleId": "sql-injection",
      "message": "SQL query uses string concatenation...",
      "severity": "error",
      "category": "security",
      "location": {
        "start": { "line": 10, "column": 5 },
        "end": { "line": 10, "column": 50 }
      },
      "codeSnippet": "...",
      "suggestions": ["Use parameterized queries"],
      "vulnerability": "SQL Injection",
      "cwe": "CWE-89",
      "owasp": "A03:2021 - Injection"
    }
  ],
  "suggestions": [
    {
      "id": "uuid",
      "type": "security-fix",
      "title": "Fix SQL Injection",
      "description": "...",
      "impact": "high",
      "effort": "medium",
      "source": "ai",
      "model": "deepseek-coder:6.7b",
      "confidence": 0.8
    }
  ],
  "metrics": {
    "complexity": 5.2,
    "maintainability": 75,
    "linesOfCode": 50
  }
}
```

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- tests/parsers.test.ts
npm test -- tests/analyzers.test.ts

# Run with coverage
npm run test:coverage
```

## 📝 Supported Languages

- JavaScript (.js, .jsx, .mjs, .cjs)
- TypeScript (.ts, .tsx)
- Python (.py)

## 🎯 Example Use Cases

### 1. Pre-commit Hook
Analyze changed files before committing:
```bash
#!/bin/bash
for file in $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|ts)$'); do
  result=$(curl -s -X POST http://localhost:5000/api/analyze/file \
    -H "Content-Type: application/json" \
    -d "{\"filePath\": \"$file\"}")

  # Check for critical issues
  errors=$(echo $result | jq '.issues | map(select(.severity == "error")) | length')
  if [ "$errors" -gt 0 ]; then
    echo "❌ Found $errors critical issues in $file"
    exit 1
  fi
done
```

### 2. CI/CD Integration
Add to `.github/workflows/code-analysis.yml`:
```yaml
name: Code Analysis
on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install ASTra
        run: npm install
      - name: Start Analysis Server
        run: npm run dev:backend &
      - name: Analyze Project
        run: |
          sleep 5
          curl -X POST http://localhost:5000/api/analyze/project \
            -H "Content-Type: application/json" \
            -d '{"projectPath": "."}'
```

### 3. VS Code Integration (Future)
Could be integrated as a VS Code extension for real-time analysis.

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port in backend/src/index.ts or use env variable
PORT=3001 npm run dev:backend
```

### Ollama Not Detected
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama service
ollama serve
```

### Parser Errors
Make sure your code files are valid syntax. The parser will report errors for malformed code.

## 📚 Architecture

```
ASTra/
├── backend/           # Analysis engine & API
│   ├── parsers/      # AST parsing (Babel, Tree-sitter)
│   ├── analyzers/    # Static analysis rules
│   ├── ml/           # Ollama AI integration
│   └── api/          # REST API
├── frontend/         # React dashboard (to be implemented)
└── shared/           # Shared TypeScript types
```

## 🤝 Contributing

This project demonstrates:
- AST parsing and traversal
- Static code analysis
- Local AI integration
- RESTful API design
- TypeScript best practices

Perfect for portfolios and technical interviews!

## 📄 License

MIT
