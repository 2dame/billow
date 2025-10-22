#!/bin/bash
# ===========================================================
# Billow Database Migration Script
# ===========================================================

set -e

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "🔧 Starting database migration..."

echo "📦 Applying schema..."
psql "$DATABASE_URL" -f "$(dirname "$0")/schema.sql"

echo "⚙️  Creating functions..."
psql "$DATABASE_URL" -f "$(dirname "$0")/functions.sql"

echo "🔒 Setting up RLS policies..."
psql "$DATABASE_URL" -f "$(dirname "$0")/rls_policies.sql"

echo "📊 Creating materialized views..."
psql "$DATABASE_URL" -f "$(dirname "$0")/mv.sql"

echo "⏰ Setting up cron jobs..."
psql "$DATABASE_URL" -f "$(dirname "$0")/cron_jobs.sql" || echo "⚠️  pg_cron jobs may need manual setup"

echo "🌱 Seeding demo data..."
psql "$DATABASE_URL" -f "$(dirname "$0")/seeds.sql"

echo "✅ Migration complete!"

