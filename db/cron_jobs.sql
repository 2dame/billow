-- ===========================================================
-- pg_cron Jobs
-- ===========================================================

-- Note: pg_cron jobs are managed by the cron extension
-- These must be run manually or via migration script

-- ===========================================================
-- Job 1: Refresh Materialized View (hourly)
-- ===========================================================

SELECT cron.schedule(
  'refresh-weekly-summary',
  '0 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_weekly_summary$$
);

-- ===========================================================
-- Job 2: Create Next Month Partition (monthly, 1st at midnight)
-- ===========================================================

SELECT cron.schedule(
  'create-next-month-partition',
  '0 0 1 * *',
  $$SELECT create_next_month_partition()$$
);

-- ===========================================================
-- Job 3: Prune Old Partitions (monthly, 2nd at midnight)
-- ===========================================================

SELECT cron.schedule(
  'prune-old-partitions',
  '0 0 2 * *',
  $$SELECT prune_old_activity_partitions()$$
);

-- ===========================================================
-- Job 4: Autovacuum Tuning (run analyze on large tables daily)
-- ===========================================================

SELECT cron.schedule(
  'daily-analyze',
  '0 2 * * *',
  $$
  ANALYZE tasks;
  ANALYZE user_activity;
  ANALYZE reflections;
  $$
);

-- To list all cron jobs:
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('job-name');

