-- ===========================================================
-- Materialized Views
-- ===========================================================

-- ===========================================================
-- View: Reflection Mood Scored (helper view)
-- ===========================================================

CREATE OR REPLACE VIEW reflection_mood_scored AS
SELECT
  r.user_id,
  r.reflection_date,
  r.mood_score,
  r.type,
  r.created_at
FROM reflections r
WHERE r.mood_score IS NOT NULL;

-- ===========================================================
-- Materialized View: User Weekly Summary
-- ===========================================================

CREATE MATERIALIZED VIEW mv_user_weekly_summary AS
SELECT
  t.user_id,
  date_trunc('week', t.created_at::date)::date AS week_start,
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done') AS tasks_completed,
  COUNT(DISTINCT t.id) AS tasks_total,
  AVG(r.mood_score) AS avg_mood,
  COUNT(DISTINCT r.id) AS reflections_count
FROM tasks t
LEFT JOIN reflections r ON r.user_id = t.user_id
  AND date_trunc('week', r.reflection_date) = date_trunc('week', t.created_at::date)
WHERE t.created_at >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY t.user_id, week_start
ORDER BY t.user_id, week_start DESC;

-- Create index for fast lookups
CREATE UNIQUE INDEX idx_mv_user_weekly_summary ON mv_user_weekly_summary(user_id, week_start);

