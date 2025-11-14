# 🚀 ASTra VS Code Extension - Setup & Usage Guide

## ✅ Quick Start (3 Steps)

### Step 1: Start the Backend Server

The extension requires the ASTra backend server to be running:

```bash
# Terminal 1 - Start backend server
cd backend
npm start
```

You should see:
```
🚀 Server running on http://localhost:5000
```

### Step 2: Open Extension in VS Code

```bash
# Open the extension folder in VS Code
code extension/
```

### Step 3: Launch Extension Development Host

In VS Code:
1. Press **`F5`** (or Run → Start Debugging)
2. A new VS Code window will open with "[Extension Development Host]" in the title
3. This is your test environment with the ASTra extension loaded!

## 🎯 Testing the Extension

### Create a Test File

In the Extension Development Host window, create a test file with some issues:

**`test-code.js`**:
```javascript
function processData(data) {
  // Long function with complexity issues
  if (data) {
    if (data.users) {
      for (let i = 0; i < data.users.length; i++) {
        if (data.users[i].active) {
          if (data.users[i].premium) {
            // SQL Injection vulnerability
            const query = "SELECT * FROM users WHERE id = " + data.users[i].id;
            console.log(query);

            // Hardcoded secret
            const API_KEY = "sk_live_1234567890abcdef";

            if (data.users[i].age > 18) {
              if (data.users[i].verified) {
                // eval usage - security issue
                eval(data.users[i].code);
              }
            }
          }
        }
      }
    }
  }
  return data;
}
```

### Analyze the File

**Method 1: Context Menu**
1. Right-click in the editor
2. Select **"ASTra: Analyze Current File"**

**Method 2: Command Palette**
1. Press `Cmd/Ctrl+Shift+P`
2. Type "ASTra: Analyze"
3. Select **"ASTra: Analyze Current File"**

### View Results

You'll see analysis results in **4 places**:

#### 1. **Inline Squiggly Lines**
- Red/yellow underlines appear directly in your code
- Hover over them to see issue details

#### 2. **Problems Panel** (`Cmd/Ctrl+Shift+M`)
```
Problems (15)
├─ test-code.js (15 errors, 3 warnings)
   ├─ [ASTra] SQL Injection: String concatenation in SQL query
   ├─ [ASTra] Hardcoded Secret: API key detected in code
   ├─ [ASTra] eval() usage: Avoid using eval() - security risk
   ├─ [ASTra] High Complexity: Function has 7 conditionals, 1 loop
   └─ ...
```

#### 3. **ASTra Sidebar** (Activity Bar Icon)
Click the ASTra icon in the left sidebar to see:
- **Issues Tree**: Organized by severity (Critical, High, Medium, Low)
- **Metrics View**:
  - Complexity: 15.0
  - Maintainability: 45.2
  - Lines of Code: 30
  - Comment Density: 10%

#### 4. **Detailed Results Panel**
- Run: `Cmd/Ctrl+Shift+P` → "ASTra: Show Analysis Results"
- Beautiful webview with:
  - Metrics cards
  - All issues with severity badges
  - AI suggestions (if Ollama is running)
  - CWE and OWASP classifications

## 🔧 Extension Settings

Open VS Code Settings (`Cmd/Ctrl+,`) and search for "ASTra":

```json
{
  // Backend server URL
  "astra.serverUrl": "http://localhost:5000",

  // Enable AI-powered suggestions (requires Ollama)
  "astra.enableAI": true,

  // Auto-analyze files when you save them
  "astra.autoAnalyzeOnSave": false,

  // Show inline error squiggles
  "astra.showInlineErrors": true,

  // Minimum severity to show (critical, high, medium, low, info)
  "astra.severityLevel": "medium"
}
```

### Enable Auto-Analyze on Save

For real-time analysis as you code:
1. Set `"astra.autoAnalyzeOnSave": true`
2. Now every time you save a file, it's automatically analyzed!

## 🤖 Enable AI Suggestions

For AI-powered fix recommendations:

1. **Install Ollama**: https://ollama.ai
2. **Pull a code model**:
   ```bash
   ollama pull codellama
   # or
   ollama pull deepseek-coder
   ```
3. **Verify Ollama is running**:
   ```bash
   ollama list
   ```
4. **Enable in settings**: `"astra.enableAI": true`

Now you'll get intelligent suggestions like:
```
💡 AI Suggestion (Confidence: 85%)

Replace string concatenation with parameterized query:

const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId]);

This prevents SQL injection by treating user input as data,
not executable code.
```

## 📋 Available Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `ASTra: Analyze Current File` | - | Analyze the active file |
| `ASTra: Analyze Entire Project` | - | Analyze all files in workspace |
| `ASTra: Show Analysis Results` | - | Open detailed results panel |
| `ASTra: Start Analysis Server` | - | Start backend server in terminal |

### Assign Keyboard Shortcuts

1. `Cmd/Ctrl+K Cmd/Ctrl+S` to open Keyboard Shortcuts
2. Search for "ASTra"
3. Assign shortcuts (e.g., `Ctrl+Alt+A` for Analyze File)

## 🐛 Troubleshooting

### Extension Not Activating

**Check:**
- Are you in a workspace with `.js`, `.ts`, or `.py` files?
- Try: `Cmd/Ctrl+Shift+P` → "Reload Window"

### Cannot Connect to Server

**Error:** "Cannot connect to ASTra server"

**Fix:**
1. Check backend is running: `curl http://localhost:5000/health`
2. Should return: `{"status":"ok"}`
3. If not, start it: `cd backend && npm start`

### No Inline Diagnostics

**Check settings:**
- `astra.showInlineErrors` = `true`
- `astra.severityLevel` isn't filtering everything out
- Open Problems panel to see all issues: `Cmd/Ctrl+Shift+M`

### No AI Suggestions

**Check Ollama:**
```bash
# Is Ollama running?
ollama list

# Pull a model if needed
ollama pull codellama

# Test it
ollama run codellama "Write a hello world in JavaScript"
```

### ASTra Icon Not in Sidebar

**Fix:**
- Right-click on Activity Bar → Check "ASTra Analyzer"
- Or press `Cmd/Ctrl+Shift+P` → "View: Open View" → Search "ASTra"

## 🎨 Example Workflow

Here's a typical workflow using the extension:

```javascript
// 1. Write code with issues
function login(username, password) {
  const query = "SELECT * FROM users WHERE name='" + username + "'";
  // ... problematic code
}

// 2. Save file (Ctrl+S)
// → If autoAnalyzeOnSave is on, analysis runs automatically

// 3. See red squiggly line under SQL query
// → Hover to see: "[ASTra] SQL Injection: String concatenation in SQL query"

// 4. Open Problems panel (Ctrl+Shift+M)
// → See all 5 issues listed

// 5. Click issue to jump to location

// 6. View detailed analysis
// → Cmd+Shift+P → "ASTra: Show Analysis Results"
// → See AI suggestion: "Use parameterized queries with prepared statements"

// 7. Fix the code
const query = "SELECT * FROM users WHERE name = ?";
db.query(query, [username]);

// 8. Save again
// → Issues disappear! ✅
```

## 📊 What Gets Analyzed

### Security Issues (15+ patterns)
- SQL Injection
- XSS vulnerabilities
- Hardcoded secrets/API keys
- eval() usage
- Command injection
- Path traversal
- Insecure randomness
- Weak cryptography

### Complexity Issues
- Cyclomatic complexity
- Cognitive complexity
- Excessive nesting
- Long functions
- Too many parameters

### Code Quality
- Unused variables
- Dead code
- Code duplication
- Magic numbers
- Inconsistent naming

## 🚀 Making Changes to the Extension

If you modify the extension code:

### Auto-rebuild on changes:
```bash
npm run watch
```

### Manual rebuild:
```bash
npm run build
```

### Reload in Extension Development Host:
- Press `Cmd/Ctrl+R` in the Extension Development Host window

## 📦 Packaging for Distribution

To create a `.vsix` file for installation:

```bash
# Install vsce if needed
npm install -g @vscode/vsce

# Package the extension
npm run package

# This creates: astra-code-analyzer-1.0.0.vsix
```

Install the `.vsix`:
1. VS Code → Extensions view
2. Click `...` menu → "Install from VSIX..."
3. Select the `.vsix` file

## ✨ Tips & Tricks

### Tip 1: Filter by Severity
Set `"astra.severityLevel": "high"` to only see critical/high severity issues

### Tip 2: Analyze on Open
Add to settings:
```json
"astra.autoAnalyzeOnSave": true
```

### Tip 3: Multi-file Analysis
Right-click on a folder → "ASTra: Analyze Entire Project"

### Tip 4: Keyboard Shortcuts
Assign shortcuts for frequent commands:
- `Ctrl+Alt+A` - Analyze File
- `Ctrl+Alt+R` - Show Results

### Tip 5: AI Suggestions
Enable Ollama for context-aware, code-specific suggestions instead of generic advice

## 🎓 Next Steps

1. ✅ Try analyzing the example code above
2. ✅ Explore all 4 result views (inline, problems, sidebar, panel)
3. ✅ Enable auto-analyze on save
4. ✅ Install Ollama for AI suggestions
5. ✅ Analyze your own project code
6. ✅ Customize settings to your preferences

## 🆘 Need Help?

- **Issues**: https://github.com/yuv008/ASTra/issues
- **Docs**: `extension/README.md` and `extension/INSTALLATION.md`

---

**Enjoy better code quality right in your IDE!** 🎉
