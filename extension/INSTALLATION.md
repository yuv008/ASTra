# Installing and Using the ASTra VS Code Extension

## 🚀 Quick Start

### Step 1: Install Extension Dependencies

```bash
cd extension
npm install
```

### Step 2: Build the Extension

```bash
npm run build
```

### Step 3: Install in VS Code

**Option A: Development Mode (Recommended for testing)**

1. Open VS Code
2. Press `F5` or go to Run → Start Debugging
3. This will open a new VS Code window with the extension loaded
4. You can make changes and reload the extension window (`Cmd/Ctrl+R`)

**Option B: Install from VSIX (For production use)**

1. Package the extension:
   ```bash
   npm run package
   ```
   This creates `astra-code-analyzer-1.0.0.vsix`

2. Install the VSIX file in VS Code:
   - Open VS Code
   - Go to Extensions view (`Cmd/Ctrl+Shift+X`)
   - Click the `...` menu → "Install from VSIX..."
   - Select the generated `.vsix` file

**Option C: Publish to VS Code Marketplace**

1. Get a Personal Access Token from Azure DevOps
2. Create a publisher account at https://marketplace.visualstudio.com
3. Publish:
   ```bash
   vsce publish
   ```

### Step 4: Start the Backend Server

The extension requires the ASTra backend server to be running:

```bash
# From the project root
cd backend
npm start
```

The server will start on `http://localhost:5000`

### Step 5: Configure Extension (Optional)

Open VS Code Settings (`Cmd/Ctrl+,`) and search for "ASTra":

```json
{
  "astra.serverUrl": "http://localhost:5000",
  "astra.enableAI": true,
  "astra.autoAnalyzeOnSave": false,
  "astra.showInlineErrors": true,
  "astra.severityLevel": "medium"
}
```

## 📖 Using the Extension

### Analyzing a File

**Method 1: Context Menu**
1. Right-click in any `.js`, `.ts`, or `.py` file
2. Select "ASTra: Analyze Current File"

**Method 2: Command Palette**
1. Press `Cmd/Ctrl+Shift+P`
2. Type "ASTra: Analyze Current File"
3. Press Enter

### Analyzing a Project

**Method 1: Explorer Context Menu**
1. Right-click on a folder in the Explorer
2. Select "ASTra: Analyze Entire Project"

**Method 2: Command Palette**
1. Press `Cmd/Ctrl+Shift+P`
2. Type "ASTra: Analyze Entire Project"
3. Press Enter

### Viewing Results

#### 1. Inline Diagnostics
- Issues appear as red/yellow squiggly lines in your code
- Hover over them to see details
- View all issues in the Problems panel (`Cmd/Ctrl+Shift+M`)

#### 2. Issues Tree View
- Click the ASTra icon in the Activity Bar (left sidebar)
- Browse issues organized by severity: Critical, High, Medium, Low, Info
- Click an issue to jump to its location in code

#### 3. Metrics View
- Located in the ASTra sidebar (below Issues tree)
- Shows:
  - Complexity score
  - Maintainability index
  - Lines of code
  - Comment density

#### 4. Detailed Results Panel
- Use Command Palette → "ASTra: Show Analysis Results"
- Beautiful webview showing:
  - All metrics in card format
  - Complete issue list with severity badges
  - AI suggestions (if Ollama is running)
  - CWE and OWASP classifications

## 🔧 Extension Commands

| Command | Description |
|---------|-------------|
| `ASTra: Analyze Current File` | Analyze the active file |
| `ASTra: Analyze Entire Project` | Analyze all files in workspace |
| `ASTra: Show Analysis Results` | Open detailed results panel |
| `ASTra: Start Analysis Server` | Start backend server in terminal |
| `ASTra: Stop Analysis Server` | Instructions to stop server |

## ⚙️ Configuration Options

### `astra.serverUrl`
- **Type**: `string`
- **Default**: `"http://localhost:5000"`
- **Description**: URL of the ASTra analysis server

### `astra.enableAI`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable AI-powered suggestions (requires Ollama)

### `astra.autoAnalyzeOnSave`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Automatically analyze file when you save it

### `astra.showInlineErrors`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Show issues as inline diagnostics in the editor

### `astra.severityLevel`
- **Type**: `string`
- **Options**: `"critical"`, `"high"`, `"medium"`, `"low"`, `"info"`
- **Default**: `"medium"`
- **Description**: Minimum severity level to display

## 🤖 Setting Up AI Features (Optional)

For AI-powered code suggestions:

1. Install Ollama from https://ollama.ai
2. Pull a code model:
   ```bash
   ollama pull codellama
   ```
3. Ensure Ollama is running (it starts automatically on Mac/Windows)
4. Set `astra.enableAI` to `true` in VS Code settings

## 🐛 Troubleshooting

### Extension Not Activating
- Check that you're in a workspace with `.js`, `.ts`, or `.py` files
- Reload VS Code window (`Cmd/Ctrl+Shift+P` → "Reload Window")

### Cannot Connect to Server
- Ensure the backend server is running: `cd backend && npm start`
- Check that port 5000 is not in use by another application
- Verify `astra.serverUrl` setting matches your server URL

### No AI Suggestions
- Install and start Ollama: https://ollama.ai
- Pull a code model: `ollama pull codellama`
- Check backend logs to see if Ollama connection is successful
- Ensure `astra.enableAI` is set to `true`

### Inline Diagnostics Not Showing
- Check that `astra.showInlineErrors` is `true`
- Verify the severity level filter (`astra.severityLevel`)
- Open Problems panel (`Cmd/Ctrl+Shift+M`) to see all issues

## 📁 Extension Structure

```
extension/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── services/
│   │   └── analysis-service.ts   # Backend API client
│   ├── providers/
│   │   ├── diagnostics-provider.ts   # Inline error diagnostics
│   │   ├── issues-tree-provider.ts   # Issues sidebar tree
│   │   └── metrics-tree-provider.ts  # Metrics sidebar tree
│   └── panels/
│       └── results-panel.ts      # Webview results panel
├── resources/
│   └── icon.svg                  # Extension icon
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Extension documentation
```

## 🔄 Development Workflow

1. Make changes to TypeScript files in `src/`
2. Run `npm run build` to compile (or `npm run watch` for auto-compile)
3. Press `F5` to launch Extension Development Host
4. Test your changes in the new VS Code window
5. Reload the extension window (`Cmd/Ctrl+R`) after rebuilding

## 📦 Publishing Checklist

Before publishing to VS Code Marketplace:

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` with new features
- [ ] Test all commands and features
- [ ] Verify extension works with latest VS Code
- [ ] Optimize bundle size if needed
- [ ] Add screenshots to README
- [ ] Create publisher account
- [ ] Run `vsce package` to test packaging
- [ ] Run `vsce publish` to publish

## 🎯 Tips

- **Keyboard Shortcuts**: Assign custom shortcuts to frequently used commands
- **Auto-Analyze**: Enable `autoAnalyzeOnSave` for real-time feedback
- **Severity Filter**: Adjust `severityLevel` to reduce noise
- **Multiple Workspaces**: Extension works across multiple workspace folders

---

**Need Help?** Open an issue on GitHub: https://github.com/yuv008/ASTra/issues
