import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

/**
 * Validation middleware factory
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      } else {
        next(error);
      }
    }
  };
}

// ============================================================
// Auth Schemas
// ============================================================

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1).max(100).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// ============================================================
// Task Schemas
// ============================================================

export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()
});

// ============================================================
// Reflection Schemas
// ============================================================

export const createReflectionSchema = z.object({
  type: z.enum(['daily', 'weekly', 'monthly', 'custom']).optional(),
  content: z.string().min(1).max(10000),
  moodScore: z.number().int().min(1).max(5).optional(),
  reflectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  taskIds: z.array(z.string().uuid()).optional(),
  goalIds: z.array(z.string().uuid()).optional(),
  habitIds: z.array(z.string().uuid()).optional()
});

// ============================================================
// Snapshot Schemas
// ============================================================

export const createSnapshotSchema = z.object({
  snapshotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  data: z.record(z.any())
});

// ============================================================
// Digest Schemas
// ============================================================

export const createDigestSchema = z.object({
  digestType: z.string().min(1).max(50),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

