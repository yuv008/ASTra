# 💬 Chat with Codebase - Setup Guide

ASTra now includes a **chat interface** powered by **Groq AI** (similar to Cursor's chat feature) that lets you ask questions about your codebase in natural language!

## 🚀 Quick Setup (2 Steps)

### Step 1: Get Groq API Key (Free!)

1. Go to https://console.groq.com/keys
2. Sign up for a free account (no credit card required)
3. Create a new API key
4. Copy the key

**Why Groq?**
- ✅ **Free tier** with generous limits
- ✅ **Ultra-fast** responses (faster than OpenAI)
- ✅ **Llama 3.1 70B** model - very capable
- ✅ No local installation needed (unlike Ollama)

### Step 2: Set API Key

Create a `.env` file in the `backend/` directory:

```bash
cd backend
echo "GROQ_API_KEY=your_api_key_here" > .env
```

Or copy the example:
```bash
cp .env.example .env
# Then edit .env and add your key
```

**That's it!** Restart the backend server and you're ready to chat!

## 🎯 How to Use

### Method 1: Chat Button (Easiest)

1. Open any code file in VS Code
2. Look for the **💬 icon** in the top-right corner of the editor
3. Click it to open the chat panel
4. Start asking questions!

### Method 2: Command Palette

1. Press `Cmd/Ctrl+Shift+P`
2. Type "ASTra: Chat"
3. Select **"ASTra: Chat with Codebase"**

### Method 3: Right-click Menu

1. Right-click anywhere in the editor
2. Select **"ASTra: Chat with Codebase"**

## 💡 Example Questions

The chat understands your codebase! Try asking:

### **Understanding Code**
```
How does the authentication system work?
```
```
Explain what the AnalysisService class does
```
```
Walk me through the code flow when a user logs in
```

### **Finding Issues**
```
What security vulnerabilities should I fix first?
```
```
Are there any performance bottlenecks in this project?
```
```
Find all places where we're not handling errors properly
```

### **Refactoring Help**
```
How can I improve the structure of the parser module?
```
```
Suggest a better way to organize these utility functions
```
```
Should I extract this logic into a separate service?
```

### **Code Improvement**
```
How can I make this function more readable?
```
```
What design patterns would work well here?
```
```
How should I handle these edge cases?
```

### **Learning**
```
Explain the complexity analyzer in simple terms
```
```
What's the difference between cyclomatic and cognitive complexity?
```
```
How does the AST traversal work?
```

## 🔥 Advanced Features

### **Automatic Code Context**

When you ask a question, ASTra automatically:
1. Searches your codebase for relevant files
2. Extracts code snippets related to your question
3. Includes them as context for the AI
4. Gives you specific, code-aware answers!

**Example:**
```
You: "How does error handling work in the analyzers?"

ASTra: Based on the code in src/analyzers/base-analyzer.ts,
errors are handled using try-catch blocks. Here's the pattern:

[Shows actual code from your project]

This allows graceful degradation when parsers fail...
```

### **Conversation History**

- The chat remembers previous messages
- You can have back-and-forth conversations
- Ask follow-up questions
- Clear history with "Clear Chat" button

### **Code Formatting**

Responses automatically format:
- **Code blocks** with syntax highlighting
- `Inline code` for functions/variables
- **Bold** and *italic* text
- File paths and line numbers

## ⚙️ Configuration

### Available Models

Groq provides several models (default: `llama-3.1-70b-versatile`):

| Model | Speed | Quality | Best For |
|-------|-------|---------|----------|
| `llama-3.1-70b-versatile` | Fast | High | General use (default) |
| `llama-3.1-8b-instant` | Very Fast | Good | Simple questions |
| `mixtral-8x7b-32768` | Fast | High | Long context (32K tokens) |
| `gemma2-9b-it` | Fast | Good | Alternative option |

### Check Groq Status

```bash
curl http://localhost:5000/api/groq/status
```

Response:
```json
{
  "available": true,
  "models": ["llama-3.1-70b-versatile", ...],
  "message": "Groq is ready"
}
```

## 🎨 Chat UI Features

### Keyboard Shortcuts
- **Enter** - Send message
- **Shift+Enter** - New line in message
- Auto-resize textarea as you type

### Visual Features
- VS Code theme integration (dark/light)
- Smooth animations
- Thinking indicator while processing
- Timestamp for each message
- Example questions on first open

### Clear & Restart
Click "Clear Chat" button to:
- Reset conversation history
- Start fresh
- Free up context window

## 🐛 Troubleshooting

### "Groq is not configured"

**Problem:** GROQ_API_KEY not set

**Fix:**
```bash
cd backend
echo "GROQ_API_KEY=your_key_here" > .env
# Restart backend server
npm start
```

### "Cannot connect to server"

**Problem:** Backend not running

**Fix:**
```bash
cd backend
npm start
```

### "Chat button not visible"

**Fix:**
1. Reload VS Code window (`Cmd/Ctrl+Shift+P` → "Reload Window")
2. Make sure extension is activated (open a `.js/.ts/.py` file)
3. Check extension is running (press F5 in extension folder)

### No code context in responses

**Problem:** Project path not detected

**Fix:**
- Make sure you've opened a workspace folder in VS Code
- Not just a single file - use File → Open Folder

### Rate limit errors

**Problem:** Exceeded Groq free tier limits

**Solution:**
- Wait a few minutes
- Or upgrade to Groq paid plan (very cheap)
- Or switch to different model with higher limits

## 📊 How It Works (Technical)

### 1. Query Processing
```
User Question → Extract Keywords → Search Codebase
```

### 2. Context Retrieval (RAG)
```
Find Relevant Files → Read Code → Build Context
```

### 3. AI Generation
```
Context + History + Question → Groq API → Answer
```

### 4. Response Formatting
```
Markdown → HTML → Display in Chat UI
```

### Code Search Algorithm
1. Extract meaningful keywords from question
2. Search all code files (excluding node_modules, dist, etc.)
3. Score files by keyword frequency
4. Select top 5 most relevant files
5. Include up to 8000 characters of context
6. Send to Groq with question

## 🔒 Privacy & Security

### What Gets Sent to Groq?
- Your question
- Relevant code snippets from your project
- Conversation history (last few messages)

### What Doesn't Get Sent?
- Your entire codebase
- Files not related to the question
- Environment variables or secrets
- node_modules or dependencies

### Local-First Approach
- Code search happens locally
- Only relevant snippets sent to Groq
- Full codebase stays on your machine

## 💰 Cost

**Groq Free Tier:**
- 14,400 requests/day
- 6 million tokens/minute
- More than enough for daily use!

**Estimated Usage:**
- Average chat: ~500-2000 tokens
- Daily limit: ~7,000+ chats
- **Cost: $0** (free tier)

## 🎓 Tips & Tricks

### Tip 1: Be Specific
❌ "Improve this code"
✅ "How can I reduce the complexity of the processData function?"

### Tip 2: Reference Files
❌ "How does it work?"
✅ "How does the security analyzer in analyzers/security-analyzer.ts work?"

### Tip 3: Ask Follow-ups
```
You: How does authentication work?
AI: [Explains auth system]
You: What about password hashing?
AI: [Explains hashing, remembering context]
```

### Tip 4: Request Code Examples
```
Show me how to add a new analyzer
```
```
Give me an example of using the parser factory
```

### Tip 5: Use for Learning
```
Explain what AST means and why we use it
```
```
What are the benefits of this architecture?
```

## 🆚 Comparison with Other Tools

| Feature | ASTra Chat | Cursor | GitHub Copilot Chat |
|---------|------------|--------|---------------------|
| **Cost** | Free | $20/month | $10/month |
| **Speed** | Very Fast (Groq) | Fast | Medium |
| **Privacy** | Local search | Cloud | Cloud |
| **Codebase Context** | ✅ RAG | ✅ | ✅ |
| **Custom Setup** | ✅ | ❌ | ❌ |
| **Model Choice** | ✅ 4 models | ❌ | ❌ |
| **Open Source** | ✅ | ❌ | ❌ |

## 🚀 Next Steps

1. ✅ Get Groq API key
2. ✅ Set it in `.env` file
3. ✅ Restart backend server
4. ✅ Click chat button in VS Code
5. ✅ Ask your first question!

---

**Enjoy chatting with your codebase!** 💬✨

Get your free Groq API key: https://console.groq.com/keys
