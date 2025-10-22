-- ===========================================================
-- Row Level Security Policies
-- ===========================================================

-- Enable RLS on user-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dashboard_aggregates ENABLE ROW LEVEL SECURITY;

-- ===========================================================
-- Users
-- ===========================================================

CREATE POLICY users_self_select ON users
FOR SELECT
USING (id = current_app_user_id());

CREATE POLICY users_self_update ON users
FOR UPDATE
USING (id = current_app_user_id());

-- ===========================================================
-- User Settings
-- ===========================================================

CREATE POLICY user_settings_self_all ON user_settings
FOR ALL
USING (user_id = current_app_user_id());

-- ===========================================================
-- Tasks
-- ===========================================================

CREATE POLICY tasks_self_all ON tasks
FOR ALL
USING (user_id = current_app_user_id());

-- ===========================================================
-- Goals
-- ===========================================================

CREATE POLICY goals_self_all ON goals
FOR ALL
USING (user_id = current_app_user_id());

-- ===========================================================
-- Habits
-- ===========================================================

CREATE POLICY habits_self_all ON habits
FOR ALL
USING (user_id = current_app_user_id());

CREATE POLICY habit_logs_self_all ON habit_logs
FOR ALL
USING (user_id = current_app_user_id());

-- ===========================================================
-- Reflections
-- ===========================================================

CREATE POLICY reflections_self_all ON reflections
FOR ALL
USING (user_id = current_app_user_id());

-- ===========================================================
-- Snapshots
-- ===========================================================

CREATE POLICY snapshots_self_all ON snapshots
FOR ALL
USING (user_id = current_app_user_id());

-- ===========================================================
-- User Activity
-- ===========================================================

CREATE POLICY user_activity_self_all ON user_activity
FOR ALL
USING (user_id = current_app_user_id());

-- ===========================================================
-- Integrations
-- ===========================================================

CREATE POLICY integrations_self_all ON integrations
FOR ALL
USING (user_id = current_app_user_id());

-- ===========================================================
-- Nudges
-- ===========================================================

CREATE POLICY nudges_self_all ON nudges
FOR ALL
USING (user_id = current_app_user_id());

-- ===========================================================
-- Digests
-- ===========================================================

CREATE POLICY digests_self_all ON digests
FOR ALL
USING (user_id = current_app_user_id());

-- ===========================================================
-- User Dashboard Aggregates
-- ===========================================================

CREATE POLICY dashboard_agg_self_all ON user_dashboard_aggregates
FOR ALL
USING (user_id = current_app_user_id());

