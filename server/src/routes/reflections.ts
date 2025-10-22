import { Router } from 'express';
import { withUserContext } from '../db';
import { authenticate, AuthRequest } from '../middleware';
import { validate, createReflectionSchema } from '../validators';

const router = Router();

router.use(authenticate);

/**
 * GET /reflections
 * Get all reflections for authenticated user
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const { type, limit = '50', offset = '0' } = req.query;

    let query = `
      SELECT id, user_id, type, content, mood_score, reflection_date,
             created_at, updated_at
      FROM reflections
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    query += ` ORDER BY reflection_date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

    const result = await withUserContext(userId, async (client) => {
      return await client.query(query, params);
    });

    res.json({
      reflections: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /reflections
 * Create new reflection
 */
router.post('/', validate(createReflectionSchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const { type, content, moodScore, reflectionDate, taskIds, goalIds, habitIds } = req.body;

    const result = await withUserContext(userId, async (client) => {
      // Create reflection
      const reflectionResult = await client.query(
        `INSERT INTO reflections (user_id, type, content, mood_score, reflection_date)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, user_id, type, content, mood_score, reflection_date, created_at, updated_at`,
        [
          userId,
          type || 'daily',
          content,
          moodScore || null,
          reflectionDate || new Date().toISOString().split('T')[0]
        ]
      );

      const reflection = reflectionResult.rows[0];

      // Associate tasks
      if (taskIds && taskIds.length > 0) {
        for (const taskId of taskIds) {
          await client.query(
            'INSERT INTO reflection_tasks (reflection_id, task_user_id, task_id) VALUES ($1, $2, $3)',
            [reflection.id, userId, taskId]
          );
        }
      }

      // Associate goals
      if (goalIds && goalIds.length > 0) {
        for (const goalId of goalIds) {
          await client.query(
            'INSERT INTO reflection_goals (reflection_id, goal_id) VALUES ($1, $2)',
            [reflection.id, goalId]
          );
        }
      }

      // Associate habits
      if (habitIds && habitIds.length > 0) {
        for (const habitId of habitIds) {
          await client.query(
            'INSERT INTO reflection_habits (reflection_id, habit_id) VALUES ($1, $2)',
            [reflection.id, habitId]
          );
        }
      }

      return reflection;
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;

