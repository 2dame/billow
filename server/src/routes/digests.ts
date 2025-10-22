import { Router } from 'express';
import { withUserContext } from '../db';
import { authenticate, AuthRequest } from '../middleware';
import { validate, createDigestSchema } from '../validators';

const router = Router();

router.use(authenticate);

/**
 * GET /digests
 * Get all digests for authenticated user
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const { digestType, limit = '10', offset = '0' } = req.query;

    let query = `
      SELECT id, user_id, digest_type, content, period_start, period_end, created_at
      FROM digests
      WHERE user_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (digestType) {
      query += ` AND digest_type = $${paramIndex}`;
      params.push(digestType);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

    const result = await withUserContext(userId, async (client) => {
      return await client.query(query, params);
    });

    res.json({
      digests: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /digests
 * Generate and store a new digest
 */
router.post('/', validate(createDigestSchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const { digestType, periodStart, periodEnd } = req.body;

    // Generate digest content based on data
    const result = await withUserContext(userId, async (client) => {
      // Fetch tasks completed in period
      const tasksResult = await client.query(
        `SELECT COUNT(*) as completed_count
         FROM tasks
         WHERE user_id = $1 AND status = 'done'
           AND completed_at >= $2 AND completed_at < $3`,
        [userId, periodStart, periodEnd]
      );

      // Fetch reflections in period
      const reflectionsResult = await client.query(
        `SELECT COUNT(*) as reflection_count, AVG(mood_score) as avg_mood
         FROM reflections
         WHERE user_id = $1
           AND reflection_date >= $2 AND reflection_date <= $3`,
        [userId, periodStart, periodEnd]
      );

      const tasksCompleted = parseInt(tasksResult.rows[0].completed_count, 10);
      const reflectionCount = parseInt(reflectionsResult.rows[0].reflection_count, 10);
      const avgMood = parseFloat(reflectionsResult.rows[0].avg_mood) || 0;

      const content = {
        summary: `You completed ${tasksCompleted} tasks and wrote ${reflectionCount} reflections.`,
        tasksCompleted,
        reflectionCount,
        avgMood: avgMood.toFixed(2),
        periodStart,
        periodEnd
      };

      // Store digest
      const digestResult = await client.query(
        `INSERT INTO digests (user_id, digest_type, content, period_start, period_end)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, user_id, digest_type, content, period_start, period_end, created_at`,
        [userId, digestType, JSON.stringify(content), periodStart, periodEnd]
      );

      return digestResult.rows[0];
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;

