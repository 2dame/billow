# Database Operations Guide

This document covers Billow's PostgreSQL database architecture, partitioning strategy, RLS implementation, CDC pipeline, and operational maintenance.

---

## 📐 Schema Design

### Core Tables

**users**
- Primary user accounts
- Bcrypt password hashing
- Guest user support (`is_guest` flag)

**user_settings**
- User preferences (timezone, theme, defaults)

**tasks** (HASH PARTITIONED)
- 16 partitions by `user_id`
- Supports horizontal scaling
- Auto-timestamp trigger

**goals**
- Long-term objectives
- Many-to-many with tasks via `goals_tasks`

**habits**
- Recurring activities
- Tracked via `habit_logs`

**reflections**
- Daily journaling entries
- Mood tracking (1-5 scale)
- Explicit associations: `reflection_tasks`, `reflection_goals`, `reflection_habits`

**snapshots**
- Point-in-time JSONB captures
- Compare progress over time

**user_activity** (RANGE PARTITIONED)
- Monthly partitions
- Activity logging and audit trail
- Auto-partition creation/pruning via pg_cron

**integrations**
- External service connections
- Credential references only (no secrets in DB)

**digests**
- Auto-generated weekly summaries
- Stored as JSONB

**user_dashboard_aggregates** (CDC target)
- Real-time aggregates updated via CDC consumer
- Composite PK: `(user_id, agg_date)`

---

## 🔀 Partitioning Strategy

### HASH Partitioning (tasks)

**Why:** Distribute load evenly across partitions for write-heavy workload.

**Configuration:**
```sql
CREATE TABLE tasks (...) PARTITION BY HASH (user_id);
-- 16 partitions (tasks_p0 to tasks_p15)
```

**Benefits:**
- Even data distribution
- Parallel query execution
- Index size reduction per partition

**Trade-offs:**
- Cannot easily drop old data (use RANGE if needed)
- Hash function cannot change without rebuild

### RANGE Partitioning (user_activity)

**Why:** Time-series data with natural aging.

**Configuration:**
```sql
CREATE TABLE user_activity (...) PARTITION BY RANGE (activity_date);
-- Monthly partitions: user_activity_YYYY_MM
```

**Benefits:**
- Drop old partitions cheaply (archive or delete)
- Partition pruning for date range queries
- Auto-creation via pg_cron

**Maintenance:**
- Create next month partition (1st of month)
- Prune partitions > 12 months old (2nd of month)

---

## 🔒 Row-Level Security (RLS)

### Architecture

All user-scoped tables enforce RLS with a single policy:
```sql
CREATE POLICY <table>_self_all ON <table>
FOR ALL
USING (user_id = current_app_user_id());
```

### Implementation

**Session variable approach:**
```sql
CREATE FUNCTION set_app_user(p_user_id UUID) RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', p_user_id::TEXT, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION current_app_user_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;
```

**Backend integration:**
```typescript
export async function withUserContext<T>(
  userId: string,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT set_app_user($1)', [userId]);
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### Security Notes

- `SECURITY DEFINER` allows non-superusers to set session variables
- Transaction-scoped (not persistent across queries)
- Backend verifies JWT before setting context

---

## ⏰ pg_cron Jobs

### Job 1: Refresh Materialized View (hourly)
```sql
SELECT cron.schedule(
  'refresh-weekly-summary',
  '0 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_weekly_summary$$
);
```

### Job 2: Create Next Month Partition (monthly)
```sql
SELECT cron.schedule(
  'create-next-month-partition',
  '0 0 1 * *',
  $$SELECT create_next_month_partition()$$
);
```

### Job 3: Prune Old Partitions (monthly)
```sql
SELECT cron.schedule(
  'prune-old-partitions',
  '0 0 2 * *',
  $$SELECT prune_old_activity_partitions()$$
);
```

### Job 4: Daily ANALYZE (optimize query planner)
```sql
SELECT cron.schedule(
  'daily-analyze',
  '0 2 * * *',
  $$
  ANALYZE tasks;
  ANALYZE user_activity;
  ANALYZE reflections;
  $$
);
```

**Management:**
```sql
-- List all jobs
SELECT * FROM cron.job;

-- Unschedule
SELECT cron.unschedule('job-name');
```

---

## 📊 Materialized Views

### mv_user_weekly_summary

**Purpose:** Pre-aggregate weekly stats for insights chart.

**Definition:**
```sql
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

CREATE UNIQUE INDEX idx_mv_user_weekly_summary ON mv_user_weekly_summary(user_id, week_start);
```

**Refresh:** Hourly via pg_cron (CONCURRENTLY to avoid locks).

**Query:**
```sql
SELECT * FROM mv_user_weekly_summary WHERE user_id = $1 ORDER BY week_start DESC LIMIT 12;
```

---

## 🔄 Change Data Capture (CDC)

### Setup

**1. Enable logical replication:**
```sql
ALTER SYSTEM SET wal_level = logical;
-- Restart PostgreSQL
```

**2. Create replication slot:**
```sql
SELECT * FROM pg_create_logical_replication_slot('billow_slot', 'wal2json');
```

**3. Run Python consumer:**
```bash
cd cdc
pip install -r requirements.txt
DATABASE_URL=postgresql://... python consumer.py
```

### Architecture

1. **wal2json** decodes WAL → JSON
2. **Consumer** reads from replication slot
3. **Aggregates** updated in `user_dashboard_aggregates`

### Target Table

```sql
CREATE TABLE user_dashboard_aggregates (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agg_date DATE NOT NULL,
  tasks_completed INT DEFAULT 0,
  tasks_created INT DEFAULT 0,
  reflections_count INT DEFAULT 0,
  avg_mood NUMERIC(3,2),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, agg_date)
);
```

### Monitoring

```sql
-- Check replication lag
SELECT * FROM pg_replication_slots WHERE slot_name = 'billow_slot';

-- View pending changes
SELECT COUNT(*) FROM pg_logical_slot_peek_changes('billow_slot', NULL, NULL);
```

---

## 🎯 Performance Tuning

### Indexes

**Hot paths:**
- `tasks(user_id, status)`
- `tasks(user_id, due_date)`
- `reflections(user_id, reflection_date)`
- `user_activity(user_id, activity_date)`

**Materialized view:**
- `UNIQUE INDEX (user_id, week_start)` for fast lookups

### Autovacuum

**Current settings (recommended):**
```sql
ALTER TABLE tasks SET (autovacuum_vacuum_scale_factor = 0.05);
ALTER TABLE reflections SET (autovacuum_vacuum_scale_factor = 0.1);
```

**Monitor:**
```sql
SELECT schemaname, tablename, last_vacuum, last_autovacuum
FROM pg_stat_user_tables
ORDER BY last_autovacuum DESC;
```

### Connection Pooling

**Backend pool config:**
```typescript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

**Production:** Use PgBouncer for connection pooling.

---

## 🔍 Monitoring Queries

### Table sizes
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Partition info
```sql
SELECT
  parent.relname AS parent_table,
  child.relname AS partition_name,
  pg_size_pretty(pg_relation_size(child.oid)) AS size
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relname IN ('tasks', 'user_activity')
ORDER BY parent.relname, child.relname;
```

### Slow queries
```sql
SELECT
  query,
  calls,
  total_exec_time / 1000 AS total_time_sec,
  mean_exec_time / 1000 AS mean_time_sec
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
ORDER BY total_exec_time DESC
LIMIT 10;
```

---

## 🚨 Troubleshooting

### RLS not working
- Ensure `current_app_user_id()` returns valid UUID
- Check `set_app_user()` called in transaction
- Verify policies exist: `\d+ <table>`

### Partition creation failed
- Check function exists: `\df create_next_month_partition`
- Manually create: `SELECT create_next_month_partition();`
- Verify pg_cron job: `SELECT * FROM cron.job;`

### CDC consumer stalled
- Check replication slot: `SELECT * FROM pg_replication_slots;`
- View lag: `SELECT confirmed_flush_lsn FROM pg_replication_slots WHERE slot_name = 'billow_slot';`
- Restart consumer with clean state (advances slot)

---

## 📚 References

- [PostgreSQL Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [pg_cron Extension](https://github.com/citusdata/pg_cron)
- [wal2json Documentation](https://github.com/eulerto/wal2json)

---

**Questions?** Open an issue on GitHub or check the README.

