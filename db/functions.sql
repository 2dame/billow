-- ===========================================================
-- Billow Database Functions
-- ===========================================================

-- ===========================================================
-- RLS: Set App User Context
-- ===========================================================

CREATE OR REPLACE FUNCTION set_app_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', p_user_id::TEXT, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to get current user ID from session
CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===========================================================
-- Partition Management: Create Next Month
-- ===========================================================

CREATE OR REPLACE FUNCTION create_next_month_partition()
RETURNS VOID AS $$
DECLARE
  next_month DATE := date_trunc('month', CURRENT_DATE + INTERVAL '2 months');
  end_month DATE := date_trunc('month', CURRENT_DATE + INTERVAL '3 months');
  partition_name TEXT := 'user_activity_' || to_char(next_month, 'YYYY_MM');
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF user_activity FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    next_month,
    end_month
  );
  RAISE NOTICE 'Created partition: %', partition_name;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================
-- Partition Management: Prune Old Partitions (>12 months)
-- ===========================================================

CREATE OR REPLACE FUNCTION prune_old_activity_partitions()
RETURNS VOID AS $$
DECLARE
  cutoff_date DATE := date_trunc('month', CURRENT_DATE - INTERVAL '12 months');
  partition_record RECORD;
BEGIN
  FOR partition_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename LIKE 'user_activity_%'
      AND tablename < 'user_activity_' || to_char(cutoff_date, 'YYYY_MM')
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS %I', partition_record.tablename);
    RAISE NOTICE 'Dropped old partition: %', partition_record.tablename;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

