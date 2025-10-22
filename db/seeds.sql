-- ===========================================================
-- Seed Data for Development
-- ===========================================================

-- Demo user (password: demo1234)
INSERT INTO users (id, email, password_hash, display_name, is_guest)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@billow.dev',
  '$2a$10$Xk.ZkJ8L8qJ/5KxQk5ZF3.vZ0D0qZ3J7Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q',
  'Demo User',
  FALSE
);

INSERT INTO user_settings (user_id, timezone, theme)
VALUES ('00000000-0000-0000-0000-000000000001', 'America/New_York', 'dark');

-- Sample tasks
INSERT INTO tasks (id, user_id, title, description, status, priority, due_date)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Complete project proposal', 'Draft the Q4 proposal for the new feature', 'in_progress', 'high', CURRENT_DATE + 2),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Review pull requests', 'Review and merge pending PRs', 'todo', 'medium', CURRENT_DATE + 1),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Update documentation', 'Add API documentation for new endpoints', 'todo', 'low', CURRENT_DATE + 5),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Team meeting prep', NULL, 'done', 'medium', CURRENT_DATE - 1);

-- Sample goal
INSERT INTO goals (id, user_id, title, description, status, target_date)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'Launch MVP by end of quarter',
  'Complete all core features and deploy to production',
  'active',
  CURRENT_DATE + 30
);

-- Sample habit
INSERT INTO habits (id, user_id, title, description, frequency, target_count)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'Morning meditation',
  '10 minutes of mindfulness',
  'daily',
  1
);

-- Sample reflection
INSERT INTO reflections (user_id, type, content, mood_score, reflection_date)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'daily',
  'Great progress today. Completed the main feature and helped teammates with code review.',
  4,
  CURRENT_DATE
);

-- Refresh materialized view
REFRESH MATERIALIZED VIEW mv_user_weekly_summary;

