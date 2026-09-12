// BroFocus Backend - Main Application Entry Point
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

// Routes
import authRoutes from './routes/auth';
import scheduleRoutes from './routes/schedule';
import tasksRoutes from './routes/tasks';
import engagementRoutes from './routes/engagement';
import analyticsRoutes from './routes/analytics';
import assistantRoutes from './routes/assistant';
import multimodalRoutes from './routes/multimodal';
import integrationsRoutes from './routes/integrations';
import publicRoutes from './routes/public';
import workspaceRoutes from './routes/workspace';
import contactRoutes from './routes/contact';

// Middleware
import { apiLimiter } from './middleware/rateLimiter';
import { isAIAvailable } from './services/geminiService';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── Middleware Stack ─────────────────────────────────────────────────────────

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Global rate limiting
app.use('/api', apiLimiter);

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/schedule', scheduleRoutes);
app.use('/api/v1/tasks', tasksRoutes);
app.use('/api/v1/engagement', engagementRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/assistant', assistantRoutes);
app.use('/api/v1/multimodal', multimodalRoutes);
app.use('/api/v1/integrations', integrationsRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/workspace', workspaceRoutes);
app.use('/api/v1/contact', contactRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    platform: 'BroFocus API',
    ai_available: isAIAvailable(),
    uptime_seconds: Math.floor(process.uptime()),
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🚀 BroFocus API v1.0.0',
    docs: '/health',
    endpoints: [
      'POST /api/v1/auth/login',
      'POST /api/v1/auth/demo',
      'GET  /api/v1/tasks',
      'POST /api/v1/tasks',
      'GET  /api/v1/schedule/timeline',
      'POST /api/v1/schedule/scan-context',
      'POST /api/v1/schedule/smart-plan',
      'GET  /api/v1/analytics/trends',
      'GET  /api/v1/analytics/progress-bar',
      'POST /api/v1/assistant/chat',
      'POST /api/v1/assistant/web-search',
      'POST /api/v1/multimodal/voice',
      'POST /api/v1/multimodal/vision',
      'GET  /api/v1/integrations/status',
      'POST /api/v1/integrations/connect/:provider',
      'GET  /api/v1/engagement/morning-kickoff',
      'GET  /api/v1/engagement/evening-wrap',
    ],
  });
});

// ─── Error Handling ───────────────────────────────────────────────────────────

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);

  if (err.message?.includes('Unsupported file type')) {
    return res.status(400).json({ error: err.message });
  }

  if (err.message?.includes('File too large')) {
    return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
  }

  return res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   🚀  BroFocus API Server Started     ║');
  console.log('╠═══════════════════════════════════════╣');
  console.log(`║   Port:  http://localhost:${PORT}       ║`);
  console.log(`║   AI:    ${isAIAvailable() ? '✅ Gemini Connected   ' : '⚠️  Simulation Mode   '} ║`);
  console.log(`║   Env:   ${process.env.NODE_ENV || 'development'}              ║`);
  console.log('╚═══════════════════════════════════════╝\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Closed successfully.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

export default app;
