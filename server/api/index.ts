// server/api/index.ts - Vercel serverless function entry point
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/app';

// Vercel expects a default export function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel handles routing automatically, just pass through to Express
  return app(req as any, res as any);
}

