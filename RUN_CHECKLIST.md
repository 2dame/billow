# 🚀 Billow Run Checklist

Follow these steps to run Billow locally on Windows.

---

## ✅ Prerequisites

- [x] Node.js 20+ installed
- [x] Docker Desktop installed and running
- [x] Git installed
- [x] PowerShell or WSL

---

## 📦 Step 1: Start PostgreSQL

```powershell
# In billow-final directory
docker compose up -d
```

Wait 10 seconds for PostgreSQL to initialize, then verify:
```powershell
docker compose ps
```

You should see `billow_db` as `healthy`.

---

## 🗄️ Step 2: Setup Database

```powershell
cd server
Copy-Item .env.example .env
```

**Edit `.env` if needed** (default values work for local development).

Run migrations:
```powershell
$env:DATABASE_URL="postgresql://billow:billow@localhost:5432/billow"
npm install
npm run db:migrate
```

Expected output:
```
🔧 Starting database migration...
📦 Applying schema...
⚙️  Creating functions...
🔒 Setting up RLS policies...
📊 Creating materialized views...
⏰ Setting up cron jobs...
🌱 Seeding demo data...
✅ Migration complete!
```

---

## 🔧 Step 3: Start Backend Server

```powershell
# Still in server/ directory
npm run dev
```

Expected output:
```
🚀 Billow server running on port 5000
📊 Environment: development
🔗 Health check: http://localhost:5000/health
```

**Test health check:**
```powershell
# In new terminal
Invoke-RestMethod -Uri http://localhost:5000/health
```

Should return: `{ status: "healthy", database: true, timestamp: "..." }`

---

## 🎨 Step 4: Start Frontend Client

Open **new terminal**:

```powershell
cd billow-final\client
npm install
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h to show help
```

---

## 🎉 Step 5: Access the Application

1. Open browser: http://localhost:5173
2. Click **"Continue as Guest"**
3. You should see the Dashboard with:
   - Tasks tab (with sample tasks from seeds)
   - Insights, Focus Mode, Journal, Snapshots, Digest tabs

---

## ✅ Acceptance Tests

### Test 1: Guest Login
- [x] Click "Continue as Guest" → Dashboard loads
- [x] Badge shows "Guest" next to username

### Test 2: Task CRUD
- [x] Add task: "Test task" → Appears in list
- [x] Mark as complete → Moves to "Completed" section
- [x] Delete task → Removed from list

### Test 3: Reflections (Echo Journal)
- [x] Navigate to "Journal" tab
- [x] Write reflection + select mood → Saves successfully
- [x] Reflection appears in "Past Reflections"

### Test 4: Focus Mode
- [x] Navigate to "Focus" tab
- [x] Set duration (e.g., 1 minute)
- [x] Start session → Timer counts down
- [x] Completes with alert notification

### Test 5: Insights Chart
- [x] Navigate to "Insights" tab
- [x] Chart renders with sample data (if seeds ran)
- [x] Shows "Tasks Completed" and "Avg Mood" lines

### Test 6: Snapshots
- [x] Navigate to "Snapshots" tab
- [x] Click "Take Snapshot" → Creates snapshot
- [x] Shows tasks completed and mood data

### Test 7: Weekly Digest
- [x] Navigate to "Digest" tab
- [x] Click "Generate Digest" → Creates summary
- [x] Shows aggregated stats

---

## 🧪 Run Tests

```powershell
cd server
npm test
```

Expected: All tests pass (tasks.test.ts)

---

## 🐛 Troubleshooting

### Database connection failed
```powershell
# Check if Postgres is running
docker compose ps

# View logs
docker compose logs db

# Restart
docker compose restart db
```

### Port already in use
```powershell
# Backend (5000)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Frontend (5173)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Migration fails
```powershell
# Drop and recreate database
docker compose down -v
docker compose up -d
# Wait 10 seconds, then run migration again
```

### JWT errors
- Ensure `.env` has `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Restart backend server after editing `.env`

### Socket.io not connecting (Focus Mode)
- Check backend logs for Socket.io connection
- Verify CORS settings in server `.env`
- Clear browser cache and reload

---

## 🔍 Health Checks

**Backend:**
```powershell
Invoke-RestMethod -Uri http://localhost:5000/health
```

**Database:**
```powershell
docker exec -it billow_db psql -U billow -d billow -c "SELECT COUNT(*) FROM users;"
```

**pgAdmin (optional):**
- Visit http://localhost:5050
- Login: `admin@billow.dev` / `admin`
- Add server: `billow_db`, user: `billow`, password: `billow`

---

## 📊 Verify Database Features

### Check Partitions
```sql
SELECT
  parent.relname AS parent_table,
  child.relname AS partition_name
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relname IN ('tasks', 'user_activity')
ORDER BY parent.relname, child.relname;
```

Expected: 16 `tasks_p*` partitions + 1 `user_activity_*` partition

### Check RLS Policies
```sql
\d+ tasks
```

Expected: Shows RLS enabled + policy `tasks_self_all`

### Check Materialized View
```sql
SELECT * FROM mv_user_weekly_summary LIMIT 5;
```

Expected: Returns weekly aggregates (may be empty if no tasks created yet)

### Check pg_cron Jobs
```sql
SELECT * FROM cron.job;
```

Expected: 4 jobs (refresh MV, create/prune partitions, analyze)

---

## 🎯 Production Deployment

See [README.md](./README.md) for:
- Vercel deployment (frontend)
- Render/Fly.io deployment (backend)
- Managed PostgreSQL setup
- Environment variable configuration

---

## 🛑 Cleanup

```powershell
# Stop all services
docker compose down

# Remove volumes (deletes all data)
docker compose down -v
```

---

## 📞 Need Help?

- **GitHub Issues:** https://github.com/2dame/billow/issues
- **Documentation:** [README.md](./README.md), [DB_OPS.md](./DB_OPS.md)
- **Email:** (add your email if desired)

---

**All tests passed?** You're ready to deploy! 🚀

