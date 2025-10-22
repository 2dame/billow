import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import logger from './logger';
import { AuthPayload } from './middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

interface FocusSession {
  userId: string;
  duration: number;
  elapsed: number;
  interval?: NodeJS.Timeout;
}

const activeSessions = new Map<string, FocusSession>();

export function initializeSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.userId;
    logger.info({ userId, socketId: socket.id }, 'User connected to socket');

    /**
     * Start Focus Mode session
     */
    socket.on('focus:start', ({ duration }: { duration: number }) => {
      // Clean up existing session
      if (activeSessions.has(userId)) {
        const existing = activeSessions.get(userId)!;
        if (existing.interval) {
          clearInterval(existing.interval);
        }
      }

      const session: FocusSession = {
        userId,
        duration,
        elapsed: 0
      };

      // Tick every second
      session.interval = setInterval(() => {
        session.elapsed += 1;

        socket.emit('focus:tick', {
          elapsed: session.elapsed,
          remaining: session.duration - session.elapsed
        });

        // Complete when time is up
        if (session.elapsed >= session.duration) {
          if (session.interval) {
            clearInterval(session.interval);
          }
          socket.emit('focus:complete', {
            duration: session.duration
          });
          activeSessions.delete(userId);
          logger.info({ userId, duration }, 'Focus session completed');
        }
      }, 1000);

      activeSessions.set(userId, session);

      socket.emit('focus:started', {
        duration,
        elapsed: 0
      });

      logger.info({ userId, duration }, 'Focus session started');
    });

    /**
     * Pause Focus Mode session
     */
    socket.on('focus:pause', () => {
      const session = activeSessions.get(userId);
      if (session && session.interval) {
        clearInterval(session.interval);
        session.interval = undefined;
        socket.emit('focus:paused', { elapsed: session.elapsed });
        logger.info({ userId, elapsed: session.elapsed }, 'Focus session paused');
      }
    });

    /**
     * Resume Focus Mode session
     */
    socket.on('focus:resume', () => {
      const session = activeSessions.get(userId);
      if (session && !session.interval) {
        session.interval = setInterval(() => {
          session.elapsed += 1;

          socket.emit('focus:tick', {
            elapsed: session.elapsed,
            remaining: session.duration - session.elapsed
          });

          if (session.elapsed >= session.duration) {
            if (session.interval) {
              clearInterval(session.interval);
            }
            socket.emit('focus:complete', {
              duration: session.duration
            });
            activeSessions.delete(userId);
          }
        }, 1000);

        socket.emit('focus:resumed', { elapsed: session.elapsed });
        logger.info({ userId, elapsed: session.elapsed }, 'Focus session resumed');
      }
    });

    /**
     * Stop Focus Mode session
     */
    socket.on('focus:stop', () => {
      const session = activeSessions.get(userId);
      if (session) {
        if (session.interval) {
          clearInterval(session.interval);
        }
        socket.emit('focus:stopped', { elapsed: session.elapsed });
        activeSessions.delete(userId);
        logger.info({ userId, elapsed: session.elapsed }, 'Focus session stopped');
      }
    });

    /**
     * Disconnect cleanup
     */
    socket.on('disconnect', () => {
      const session = activeSessions.get(userId);
      if (session && session.interval) {
        clearInterval(session.interval);
        activeSessions.delete(userId);
      }
      logger.info({ userId, socketId: socket.id }, 'User disconnected from socket');
    });
  });

  return io;
}

