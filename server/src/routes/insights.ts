import { Router } from 'express';
import pool from '../db';
import { authenticate, AuthRequest } from '../middleware';

const router = Router();

router.use(authenticate);

/**
 * GET /insights/weekly
 * Get weekly summary insights from materialized view
 */
router.get('/weekly', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const { weeks = '12' } = req.query;

    const result = await pool.query(
      `SELECT user_id, week_start, tasks_completed, tasks_total, avg_mood, reflections_count
       FROM mv_user_weekly_summary
       WHERE user_id = $1
       ORDER BY week_start DESC
       LIMIT $2`,
      [userId, parseInt(weeks as string, 10)]
    );

    res.json({
      insights: result.rows
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /insights/dashboard
 * Get current dashboard aggregates
 */
router.get('/dashboard', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const { days = '30' } = req.query;

    const result = await pool.query(
      `SELECT agg_date, tasks_completed, tasks_created, reflections_count, avg_mood
       FROM user_dashboard_aggregates
       WHERE user_id = $1
         AND agg_date >= CURRENT_DATE - $2::int
       ORDER BY agg_date DESC`,
      [userId, parseInt(days as string, 10)]
    );

    res.json({
      aggregates: result.rows
    });
  } catch (error) {
    next(error);
  }
});

export default router;

