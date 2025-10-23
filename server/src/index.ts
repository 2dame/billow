// server/src/index.ts - Local development server only (not used by Vercel)
import { createServer } from 'http';
import app from './app';
import logger from './logger';
// import { initializeSocket } from './sockets'; // ⚠️ Disabled for serverless

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// ⚠️ Socket.io initialization (only for local dev if you uncomment)
// initializeSocket(httpServer);

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

