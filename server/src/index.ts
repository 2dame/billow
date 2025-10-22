import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import logger from './logger';
import { errorHandler, notFoundHandler } from './middleware';
import { checkDatabaseHealth } from './db';
import { initializeSocket } from './sockets';

// Routes
import authRoutes from './routes/auth';
import tasksRoutes from './routes/tasks';
import reflectionsRoutes from './routes/reflections';
import snapshotsRoutes from './routes/snapshots';
import digestsRoutes from './routes/digests';
import insightsRoutes from './routes/insights';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// ============================================================
// Security & Parsing
// ============================================================

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
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
    status: dbHealthy ? 'healthy' : 'unhealthy',
    database: dbHealthy,
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

// ============================================================
// Socket.io
// ============================================================

initializeSocket(httpServer);

// ============================================================
// Start Server
// ============================================================

httpServer.listen(PORT, () => {
  logger.info(`🚀 Billow server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;

