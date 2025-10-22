import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import logger from '../logger';
import { validate, registerSchema, loginSchema } from '../validators';
import { AuthRequest } from '../middleware';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    // Check if user exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, is_guest)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, display_name, is_guest, created_at`,
      [email, passwordHash, displayName || null, false]
    );

    const user = result.rows[0];

    // Create default settings
    await pool.query(
      'INSERT INTO user_settings (user_id) VALUES ($1)',
      [user.id]
    );

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, isGuest: false },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    logger.info({ userId: user.id, email }, 'User registered');

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        isGuest: user.is_guest
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/login
 * Login existing user
 */
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query(
      'SELECT id, email, password_hash, display_name, is_guest FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0];

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, isGuest: user.is_guest },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    logger.info({ userId: user.id, email }, 'User logged in');

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        isGuest: user.is_guest
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };

    // Fetch user
    const result = await pool.query(
      'SELECT id, email, is_guest FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0];

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, isGuest: user.is_guest },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ accessToken });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Refresh token expired' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid refresh token' });
    } else {
      next(error);
    }
  }
});

/**
 * POST /auth/demo
 * Create guest user (Continue as Guest)
 */
router.post('/demo', async (req, res, next) => {
  try {
    const guestEmail = `guest_${Date.now()}@billow.local`;
    const guestPassword = Math.random().toString(36).slice(2);
    const passwordHash = await bcrypt.hash(guestPassword, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, is_guest)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, display_name, is_guest`,
      [guestEmail, passwordHash, 'Guest User', true]
    );

    const user = result.rows[0];

    await pool.query(
      'INSERT INTO user_settings (user_id) VALUES ($1)',
      [user.id]
    );

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, isGuest: true },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    logger.info({ userId: user.id }, 'Guest user created');

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        isGuest: user.is_guest
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
});

export default router;

