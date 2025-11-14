import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { AnalysisService } from './api/analysis-service';
import { codebaseChatService } from './ml/codebase-chat-service';
import { groqClient } from './ml/groq-client';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const analysisService = new AnalysisService();

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Check Ollama status
app.get('/api/ollama/status', async (req: Request, res: Response) => {
  try {
    const status = await analysisService.checkOllamaStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check Ollama status',
      message: (error as Error).message,
    });
  }
});

// Analyze code content directly (for unsaved files, in-memory analysis)
app.post('/api/analyze/code', async (req: Request, res: Response) => {
  try {
    const { code, fileName, language, enableAI } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'code is required' });
    }

    const result = await analysisService.analyzeCode(code, {
      fileName: fileName || 'untitled.js',
      language,
      enableAI,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Analysis failed',
      message: (error as Error).message,
    });
  }
});

// Analyze a file from disk
app.post('/api/analyze/file', async (req: Request, res: Response) => {
  try {
    const { filePath, enableAI } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'filePath is required' });
    }

    const result = await analysisService.analyzeFile(filePath, { enableAI });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Analysis failed',
      message: (error as Error).message,
    });
  }
});

// Chat with codebase using Groq
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, context, conversationHistory, projectPath } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    // Find relevant code if projectPath is provided
    let codeContext = context;
    if (projectPath && !context) {
      codeContext = await codebaseChatService.findRelevantCode(message, projectPath);
    }

    const response = await codebaseChatService.chat({
      message,
      context: codeContext,
      conversationHistory,
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Chat failed',
      message: (error as Error).message,
    });
  }
});

// Get Groq status
app.get('/api/groq/status', async (req: Request, res: Response) => {
  const isAvailable = await groqClient.checkAvailability();
  res.json({
    available: isAvailable,
    models: groqClient.getAvailableModels(),
    message: isAvailable
      ? 'Groq is ready'
      : 'GROQ_API_KEY not set. Get your free key at https://console.groq.com/keys',
  });
});

// Analyze a directory/project
app.post('/api/analyze/project', async (req: Request, res: Response) => {
  try {
    const { projectPath, enableAI, includePatterns, excludePatterns } = req.body;

    if (!projectPath) {
      return res.status(400).json({ error: 'projectPath is required' });
    }

    const result = await analysisService.analyzeDirectory(projectPath, {
      enableAI,
      includePatterns,
      excludePatterns,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Analysis failed',
      message: (error as Error).message,
    });
  }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ASTra Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 API Documentation: http://localhost:${PORT}/api/health`);
  console.log(`\n🔍 Available endpoints:`);
  console.log(`  - GET  /api/health - Health check`);
  console.log(`  - GET  /api/ollama/status - Check Ollama availability`);
  console.log(`  - GET  /api/groq/status - Check Groq availability`);
  console.log(`  - POST /api/chat - Chat with codebase using Groq`);
  console.log(`  - POST /api/analyze/code - Analyze code content`);
  console.log(`  - POST /api/analyze/file - Analyze a single file`);
  console.log(`  - POST /api/analyze/project - Analyze a project/directory`);
  console.log(`\n✨ Ready to analyze code and chat with your codebase!`);
});

export default app;
