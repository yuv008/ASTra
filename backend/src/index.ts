import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { AnalysisService } from './api/analysis-service';

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

// Analyze a file
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
  console.log(`  - POST /api/analyze/file - Analyze a single file`);
  console.log(`  - POST /api/analyze/project - Analyze a project/directory`);
  console.log(`\n✨ Ready to analyze code!`);
});

export default app;
