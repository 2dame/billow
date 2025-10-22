import { Router } from 'express';
import { withUserContext } from '../db';
import { authenticate, AuthRequest } from '../middleware';
import { validate, createTaskSchema, updateTaskSchema } from '../validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /tasks
 * Get all tasks for authenticated user
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const { status, priority, limit = '100', offset = '0' } = req.query;

    let query = `
      SELECT id, user_id, title, description, status, priority, due_date,
             completed_at, created_at, updated_at
      FROM tasks
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

    const result = await withUserContext(userId, async (client) => {
      return await client.query(query, params);
    });

    res.json({
      tasks: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /tasks/:id
 * Get single task by ID
 */
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const result = await withUserContext(userId, async (client) => {
      return await client.query(
        `SELECT id, user_id, title, description, status, priority, due_date,
                completed_at, created_at, updated_at
         FROM tasks
         WHERE user_id = $1 AND id = $2`,
        [userId, id]
      );
    });

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /tasks
 * Create new task
 */
router.post('/', validate(createTaskSchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const { title, description, status, priority, dueDate } = req.body;

    const result = await withUserContext(userId, async (client) => {
      return await client.query(
        `INSERT INTO tasks (user_id, title, description, status, priority, due_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, user_id, title, description, status, priority, due_date,
                   completed_at, created_at, updated_at`,
        [userId, title, description || null, status || 'todo', priority || 'medium', dueDate || null]
      );
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /tasks/:id
 * Update task
 */
router.patch('/:id', validate(updateTaskSchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { title, description, status, priority, dueDate } = req.body;

    const updates: string[] = [];
    const params: any[] = [userId, id];
    let paramIndex = 3;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
      
      // Auto-set completed_at when status becomes 'done'
      if (status === 'done') {
        updates.push(`completed_at = NOW()`);
      } else {
        updates.push(`completed_at = NULL`);
      }
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      params.push(priority);
    }
    if (dueDate !== undefined) {
      updates.push(`due_date = $${paramIndex++}`);
      params.push(dueDate);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    const result = await withUserContext(userId, async (client) => {
      return await client.query(
        `UPDATE tasks
         SET ${updates.join(', ')}
         WHERE user_id = $1 AND id = $2
         RETURNING id, user_id, title, description, status, priority, due_date,
                   completed_at, created_at, updated_at`,
        params
      );
    });

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /tasks/:id
 * Delete task
 */
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const result = await withUserContext(userId, async (client) => {
      return await client.query(
        'DELETE FROM tasks WHERE user_id = $1 AND id = $2 RETURNING id',
        [userId, id]
      );
    });

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

