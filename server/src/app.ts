// server/src/app.ts - Express app without server (for Vercel serverless)
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import logger from './logger';
import { errorHandler, notFoundHandler } from './middleware';
import { checkDatabaseHealth } from './db';
// ⚠️ Socket.io disabled for serverless compatibility
// import { initializeSocket } from './sockets';

// Routes
import authRoutes from './routes/auth';
import tasksRoutes from './routes/tasks';
import reflectionsRoutes from './routes/reflections';
import snapshotsRoutes from './routes/snapshots';
import digestsRoutes from './routes/digests';
import insightsRoutes from './routes/insights';

const app = express();

// ============================================================
// Environment Variables Validation (Optional in serverless)
// ============================================================

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  logger.warn(`⚠️  Missing required environment variables: ${missingVars.join(', ')}`);
  // Don't exit in serverless - let it fail on first request with proper error
}

// ============================================================
// Security & Parsing
// ============================================================

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'https://billow.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// Rate Limiting
// ============================================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many requests, please try again later' }
});

const writeLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: { error: 'Rate limit exceeded' }
});

// ============================================================
// Routes
// ============================================================

app.get('/health', async (req, res) => {
  const dbHealthy = await checkDatabaseHealth();
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'ok' : 'unhealthy',
    env: process.env.NODE_ENV || 'development',
    database: dbHealthy ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.use('/auth', authLimiter, authRoutes);
app.use('/tasks', writeLimiter, tasksRoutes);
app.use('/reflections', writeLimiter, reflectionsRoutes);
app.use('/snapshots', writeLimiter, snapshotsRoutes);
app.use('/digests', writeLimiter, digestsRoutes);
app.use('/insights', insightsRoutes);

// ============================================================
// Error Handling
// ============================================================

app.use(notFoundHandler);
app.use(errorHandler);

// ⚠️ Socket.io removed for serverless compatibility
// To enable real-time features, integrate Supabase Realtime, Ably, or Pusher

export default app;

