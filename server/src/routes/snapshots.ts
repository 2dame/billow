import { Router } from 'express';
import { withUserContext } from '../db';
import { authenticate, AuthRequest } from '../middleware';
import { validate, createSnapshotSchema } from '../validators';

const router = Router();

router.use(authenticate);

/**
 * GET /snapshots
 * Get all snapshots for authenticated user
 */
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const { limit = '20', offset = '0' } = req.query;

    const result = await withUserContext(userId, async (client) => {
      return await client.query(
        `SELECT id, user_id, snapshot_date, data, created_at
         FROM snapshots
         WHERE user_id = $1
         ORDER BY snapshot_date DESC
         LIMIT $2 OFFSET $3`,
        [userId, parseInt(limit as string, 10), parseInt(offset as string, 10)]
      );
    });

    res.json({
      snapshots: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /snapshots
 * Create a new snapshot
 */
router.post('/', validate(createSnapshotSchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const { snapshotDate, data } = req.body;

    const result = await withUserContext(userId, async (client) => {
      return await client.query(
        `INSERT INTO snapshots (user_id, snapshot_date, data)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, snapshot_date, data, created_at`,
        [userId, snapshotDate || new Date().toISOString().split('T')[0], JSON.stringify(data)]
      );
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /snapshots/compare
 * Compare two snapshots
 */
router.get('/compare', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const { snapshotId1, snapshotId2 } = req.query;

    if (!snapshotId1 || !snapshotId2) {
      res.status(400).json({ error: 'Both snapshotId1 and snapshotId2 are required' });
      return;
    }

    const result = await withUserContext(userId, async (client) => {
      return await client.query(
        `SELECT id, snapshot_date, data
         FROM snapshots
         WHERE user_id = $1 AND id IN ($2, $3)
         ORDER BY snapshot_date ASC`,
        [userId, snapshotId1, snapshotId2]
      );
    });

    if (result.rows.length < 2) {
      res.status(404).json({ error: 'One or both snapshots not found' });
      return;
    }

    const [snapshot1, snapshot2] = result.rows;

    res.json({
      snapshot1,
      snapshot2,
      comparison: {
        tasksChange: (snapshot2.data.tasksCompleted || 0) - (snapshot1.data.tasksCompleted || 0),
        moodChange: (snapshot2.data.avgMood || 0) - (snapshot1.data.avgMood || 0)
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

