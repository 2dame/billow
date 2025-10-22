-- ===========================================================
-- Billow Database Schema
-- PostgreSQL 15+ with pg_cron and wal2json extensions
-- ===========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ===========================================================
-- Enums
-- ===========================================================

CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done', 'archived');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'paused', 'abandoned');
CREATE TYPE habit_frequency AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE reflection_type AS ENUM ('daily', 'weekly', 'monthly', 'custom');
CREATE TYPE integration_type AS ENUM ('google_calendar', 'todoist', 'notion', 'trello', 'slack');

-- ===========================================================
-- Helper Function: Updated At Trigger
-- ===========================================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================
-- Users & Settings
-- ===========================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  is_guest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_guest ON users(is_guest);

CREATE TRIGGER set_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  timezone VARCHAR(50) DEFAULT 'UTC',
  theme VARCHAR(20) DEFAULT 'dark',
  notification_enabled BOOLEAN DEFAULT TRUE,
  focus_mode_default_duration INT DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_user_settings_timestamp
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ===========================================================
-- Tasks (HASH Partitioned by user_id)
-- ===========================================================

CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status task_status DEFAULT 'todo',
  priority task_priority DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
) PARTITION BY HASH (user_id);

-- Create 16 hash partitions
DO $$
BEGIN
  FOR i IN 0..15 LOOP
    EXECUTE format(
      'CREATE TABLE tasks_p%s PARTITION OF tasks FOR VALUES WITH (MODULUS 16, REMAINDER %s)',
      i, i
    );
    EXECUTE format('CREATE INDEX idx_tasks_p%s_status ON tasks_p%s(status)', i, i);
    EXECUTE format('CREATE INDEX idx_tasks_p%s_due_date ON tasks_p%s(due_date)', i, i);
  END LOOP;
END $$;

CREATE TRIGGER set_tasks_timestamp
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- ===========================================================
-- Goals
-- ===========================================================

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status goal_status DEFAULT 'active',
  target_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);

CREATE TRIGGER set_goals_timestamp
BEFORE UPDATE ON goals
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE goals_tasks (
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  task_user_id UUID NOT NULL,
  task_id UUID NOT NULL,
  PRIMARY KEY (goal_id, task_user_id, task_id),
  FOREIGN KEY (task_user_id, task_id) REFERENCES tasks(user_id, id) ON DELETE CASCADE
);

-- ===========================================================
-- Habits
-- ===========================================================

CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  frequency habit_frequency DEFAULT 'daily',
  target_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_habits_user_id ON habits(user_id);

CREATE TRIGGER set_habits_timestamp
BEFORE UPDATE ON habits
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL,
  count INT DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_logged_date ON habit_logs(logged_date);

-- ===========================================================
-- Reflections
-- ===========================================================

CREATE TABLE reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type reflection_type DEFAULT 'daily',
  content TEXT NOT NULL,
  mood_score INT CHECK (mood_score >= 1 AND mood_score <= 5),
  reflection_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reflections_user_id ON reflections(user_id);
CREATE INDEX idx_reflections_date ON reflections(reflection_date);
CREATE INDEX idx_reflections_type ON reflections(type);

CREATE TRIGGER set_reflections_timestamp
BEFORE UPDATE ON reflections
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Reflection associations (explicit foreign keys)
CREATE TABLE reflection_tasks (
  reflection_id UUID REFERENCES reflections(id) ON DELETE CASCADE,
  task_user_id UUID NOT NULL,
  task_id UUID NOT NULL,
  PRIMARY KEY (reflection_id, task_user_id, task_id),
  FOREIGN KEY (task_user_id, task_id) REFERENCES tasks(user_id, id) ON DELETE CASCADE
);

CREATE TABLE reflection_goals (
  reflection_id UUID REFERENCES reflections(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  PRIMARY KEY (reflection_id, goal_id)
);

CREATE TABLE reflection_habits (
  reflection_id UUID REFERENCES reflections(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  PRIMARY KEY (reflection_id, habit_id)
);

-- ===========================================================
-- Snapshots
-- ===========================================================

CREATE TABLE snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snapshots_user_id ON snapshots(user_id);
CREATE INDEX idx_snapshots_date ON snapshots(snapshot_date);

-- ===========================================================
-- User Activity (RANGE Partitioned by month)
-- ===========================================================

CREATE TABLE user_activity (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  metadata JSONB,
  activity_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (activity_date, id)
) PARTITION BY RANGE (activity_date);

-- Create current month partition
DO $$
DECLARE
  start_date DATE := date_trunc('month', CURRENT_DATE);
  end_date DATE := date_trunc('month', CURRENT_DATE + INTERVAL '1 month');
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS user_activity_%s PARTITION OF user_activity FOR VALUES FROM (%L) TO (%L)',
    to_char(start_date, 'YYYY_MM'),
    start_date,
    end_date
  );
END $$;

CREATE INDEX idx_user_activity_user_id ON user_activity(user_id, activity_date);
CREATE INDEX idx_user_activity_type ON user_activity(activity_type);

-- ===========================================================
-- Integrations
-- ===========================================================

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  integration_type integration_type NOT NULL,
  credential_ref VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_integrations_user_id ON integrations(user_id);

CREATE TRIGGER set_integrations_timestamp
BEFORE UPDATE ON integrations
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

CREATE TABLE integration_token_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_integration_token_events_integration_id ON integration_token_events(integration_id);

-- ===========================================================
-- Nudges
-- ===========================================================

CREATE TABLE nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  nudge_type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nudges_user_id ON nudges(user_id);
CREATE INDEX idx_nudges_is_read ON nudges(is_read);

-- ===========================================================
-- Digests
-- ===========================================================

CREATE TABLE digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  digest_type VARCHAR(50) NOT NULL,
  content JSONB NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_digests_user_id ON digests(user_id);
CREATE INDEX idx_digests_period ON digests(period_start, period_end);

-- ===========================================================
-- CDC Target: User Dashboard Aggregates
-- ===========================================================

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

CREATE INDEX idx_dashboard_agg_date ON user_dashboard_aggregates(agg_date);

