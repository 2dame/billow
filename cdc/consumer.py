#!/usr/bin/env python3
"""
CDC Consumer for Billow
Consumes wal2json logical replication stream and updates aggregate tables.

Requirements:
- psycopg2-binary
- Python 3.10+

Setup:
1. Enable logical replication in PostgreSQL:
   ALTER SYSTEM SET wal_level = logical;
   (restart postgres)

2. Install wal2json extension

3. Create replication slot:
   SELECT * FROM pg_create_logical_replication_slot('billow_slot', 'wal2json');

4. Run this script with DATABASE_URL environment variable
"""

import os
import sys
import json
import time
from datetime import date
from typing import Any, Dict

try:
    import psycopg2
    from psycopg2 import sql
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
except ImportError:
    print("Error: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)


DATABASE_URL = os.environ.get("DATABASE_URL")
REPLICATION_SLOT = "billow_slot"
POLL_INTERVAL = 5  # seconds


def connect_db():
    """Connect to PostgreSQL database."""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable not set")
    return psycopg2.connect(DATABASE_URL)


def process_change(change: Dict[str, Any], conn) -> None:
    """
    Process a single change event and update aggregate table.

    Args:
        change: The decoded wal2json change event
        conn: Database connection
    """
    kind = change.get("kind")
    table = change.get("table")

    if kind not in ("insert", "update", "delete"):
        return

    # Only process relevant tables
    if table not in ("tasks", "reflections"):
        return

    columns = {col["name"]: col["value"] for col in change.get("columnvalues", [])}
    user_id = columns.get("user_id")
    
    if not user_id:
        return

    # Determine aggregation date
    agg_date = date.today().isoformat()
    if table == "tasks" and "completed_at" in columns:
        # Use completion date if available
        completed_at = columns.get("completed_at")
        if completed_at:
            agg_date = completed_at.split("T")[0]
    elif table == "reflections" and "reflection_date" in columns:
        agg_date = columns.get("reflection_date")

    with conn.cursor() as cur:
        # Recalculate aggregates for user and date
        cur.execute(
            """
            INSERT INTO user_dashboard_aggregates (user_id, agg_date, tasks_completed, tasks_created, reflections_count, avg_mood)
            SELECT 
                $1 as user_id,
                $2 as agg_date,
                COUNT(*) FILTER (WHERE status = 'done') as tasks_completed,
                COUNT(*) as tasks_created,
                (SELECT COUNT(*) FROM reflections WHERE user_id = $1 AND reflection_date = $2) as reflections_count,
                (SELECT AVG(mood_score) FROM reflections WHERE user_id = $1 AND reflection_date = $2) as avg_mood
            FROM tasks
            WHERE user_id = $1
              AND DATE(created_at) = $2
            ON CONFLICT (user_id, agg_date) DO UPDATE SET
                tasks_completed = EXCLUDED.tasks_completed,
                tasks_created = EXCLUDED.tasks_created,
                reflections_count = EXCLUDED.reflections_count,
                avg_mood = EXCLUDED.avg_mood,
                last_updated = NOW()
            """,
            (user_id, agg_date)
        )
        conn.commit()
        print(f"✓ Updated aggregates for user {user_id[:8]}... on {agg_date}")


def consume_changes():
    """Main CDC consumer loop."""
    conn = connect_db()
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)

    print(f"🔄 Starting CDC consumer for slot: {REPLICATION_SLOT}")
    print(f"📊 Polling every {POLL_INTERVAL}s")

    try:
        with conn.cursor() as cur:
            while True:
                # Read from replication slot
                cur.execute(
                    sql.SQL(
                        "SELECT lsn, data FROM pg_logical_slot_peek_changes(%s, NULL, NULL, 'format-version', '2')"
                    ),
                    [REPLICATION_SLOT]
                )

                changes = cur.fetchall()

                if not changes:
                    time.sleep(POLL_INTERVAL)
                    continue

                for lsn, data in changes:
                    try:
                        payload = json.loads(data)
                        for change in payload.get("change", []):
                            process_change(change, conn)
                    except Exception as e:
                        print(f"⚠️  Error processing change: {e}")

                # Advance replication slot
                cur.execute(
                    sql.SQL("SELECT pg_logical_slot_get_changes(%s, NULL, NULL)"),
                    [REPLICATION_SLOT]
                )

                time.sleep(POLL_INTERVAL)

    except KeyboardInterrupt:
        print("\n🛑 Shutting down CDC consumer...")
    except Exception as e:
        print(f"❌ Error in CDC consumer: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Billow CDC Consumer")
    print("=" * 60)
    
    try:
        consume_changes()
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)

