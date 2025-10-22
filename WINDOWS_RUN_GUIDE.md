# 🪟 Windows Run Guide for Billow

Complete step-by-step instructions for running Billow on Windows 10/11.

---

## 🚀 Quick Start (Copy & Paste)

### 1️⃣ Start Database
```powershell
# From billow-final directory
docker compose up -d
Start-Sleep -Seconds 10
docker compose ps
```

### 2️⃣ Setup & Run Backend
```powershell
# Setup
cd server
Copy-Item .env.example .env
npm install

# Run migrations
$env:DATABASE_URL="postgresql://billow:billow@localhost:5432/billow"
npm run db:migrate

# Start server
npm run dev
```

### 3️⃣ Start Frontend (New PowerShell Window)
```powershell
cd C:\Users\Damion\Documents\Projects\billow-final\client
npm install
npm run dev
```

### 4️⃣ Open Browser
Visit: http://localhost:5173

Click **"Continue as Guest"** to explore!

---

## 📋 Full Step-by-Step Guide

### Prerequisites Check

```powershell
# Check Node.js version (should be 20+)
node --version

# Check Docker
docker --version

# Check if Docker Desktop is running
docker ps
```

---

### Step 1: Database Setup

```powershell
# Navigate to project
cd C:\Users\Damion\Documents\Projects\billow-final

# Start PostgreSQL + pgAdmin
docker compose up -d

# Wait for database to be healthy
Start-Sleep -Seconds 10

# Verify containers are running
docker compose ps
```

**Expected output:**
```
NAME              IMAGE            STATUS
billow_db         postgres:15      Up (healthy)
billow_pgadmin    dpage/pgadmin4   Up
```

---

### Step 2: Backend Setup

```powershell
# Navigate to server directory
cd server

# Create environment file
Copy-Item .env.example .env

# Install dependencies
npm install

# Set database URL for migration
$env:DATABASE_URL="postgresql://billow:billow@localhost:5432/billow"

# Run database migrations
npm run db:migrate
```

**Expected migration output:**
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

**Start the backend server:**
```powershell
npm run dev
```

**Expected output:**
```
🚀 Billow server running on port 5000
📊 Environment: development
🔗 Health check: http://localhost:5000/health
```

**Test the backend (new PowerShell window):**
```powershell
Invoke-RestMethod -Uri http://localhost:5000/health
```

Should return: `{ status: "healthy", database: true }`

---

### Step 3: Frontend Setup

**Open a NEW PowerShell window:**

```powershell
# Navigate to client directory
cd C:\Users\Damion\Documents\Projects\billow-final\client

# Install dependencies
npm install

# Start development server
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

---

### Step 4: Access the Application

1. Open your browser to: http://localhost:5173
2. You'll see the Billow login page
3. Click **"Continue as Guest"**
4. You should now see the Dashboard with:
   - ✅ Tasks tab with sample tasks
   - ✅ Insights tab with chart
   - ✅ Focus tab with timer
   - ✅ Journal tab for reflections
   - ✅ Snapshots tab
   - ✅ Digest tab

---

## ✅ Feature Verification

### Test Tasks
1. Go to **Tasks** tab
2. Add a new task: "Test my new task"
3. Click ✓ Complete button
4. Task moves to "Completed" section
5. Click Delete to remove

### Test Focus Mode
1. Go to **Focus** tab
2. Set duration to 1 minute
3. Click "Start Focus Session"
4. Watch the timer count down
5. Alert shows when complete

### Test Reflections (Echo Journal)
1. Go to **Journal** tab
2. Write: "Great progress today!"
3. Select a mood (click an emoji)
4. Click "Save Reflection"
5. Reflection appears in "Past Reflections"

### Test Insights Chart
1. Go to **Insights** tab
2. Chart should display with sample data
3. Shows "Tasks Completed" and "Avg Mood" lines
4. Summary cards below chart

### Test Snapshots
1. Go to **Snapshots** tab
2. Click "📸 Take Snapshot"
3. Snapshot created with current stats
4. If you have 2+ snapshots, comparison shows

### Test Weekly Digest
1. Go to **Digest** tab
2. Click "📋 Generate Digest"
3. Digest created with weekly summary
4. Shows tasks completed, mood, reflections

---

## 🧪 Run Tests

```powershell
cd C:\Users\Damion\Documents\Projects\billow-final\server
npm test
```

**Expected output:**
```
PASS  src/__tests__/tasks.test.ts
  Tasks API
    POST /tasks
      ✓ should create a new task
      ✓ should fail without authentication
      ✓ should fail with invalid data
    GET /tasks
      ✓ should get all tasks for user
      ✓ should filter tasks by status
    ...

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
```

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to Docker daemon"
**Solution:**
```powershell
# Open Docker Desktop application
# Wait for it to fully start
# Try again
docker ps
```

### Problem: "Port 5000 is already in use"
**Solution:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or use a different port by editing server/.env:
# PORT=5001
```

### Problem: "Port 5173 is already in use"
**Solution:**
```powershell
# Find and kill process
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Problem: Database migration fails
**Solution:**
```powershell
# Reset database
docker compose down -v
docker compose up -d
Start-Sleep -Seconds 15

# Try migration again
cd server
$env:DATABASE_URL="postgresql://billow:billow@localhost:5432/billow"
npm run db:migrate
```

### Problem: "Module not found" errors
**Solution:**
```powershell
# Reinstall dependencies
cd server
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Same for client
cd ..\client
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Problem: Frontend shows "Network Error"
**Solution:**
1. Check backend is running: http://localhost:5000/health
2. Check CORS settings in `server/.env`:
   ```
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
   ```
3. Restart backend server

---

## 🔍 Advanced: Database Inspection

### Using pgAdmin (Web UI)
1. Visit: http://localhost:5050
2. Login:
   - Email: `admin@billow.dev`
   - Password: `admin`
3. Add Server:
   - Name: `Billow Local`
   - Host: `billow_db`
   - Port: `5432`
   - User: `billow`
   - Password: `billow`

### Using Command Line
```powershell
# Connect to database
docker exec -it billow_db psql -U billow -d billow

# Inside psql:
# List tables
\dt

# View tasks
SELECT * FROM tasks LIMIT 5;

# View partitions
\d+ tasks

# Check RLS policies
\d+ tasks

# View weekly insights
SELECT * FROM mv_user_weekly_summary LIMIT 10;

# Exit
\q
```

---

## 📊 Verify Advanced Features

### Check Partitions
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

**Expected:** 16 `tasks_p*` partitions + 1 `user_activity_*` partition

### Check pg_cron Jobs
```sql
SELECT jobid, jobname, schedule, command
FROM cron.job
ORDER BY jobid;
```

**Expected:** 4 jobs (MV refresh, partition create/prune, analyze)

---

## 🛑 Stop Everything

```powershell
# Stop frontend (Ctrl+C in terminal)
# Stop backend (Ctrl+C in terminal)

# Stop database
cd C:\Users\Damion\Documents\Projects\billow-final
docker compose down

# To remove all data (optional)
docker compose down -v
```

---

## 📦 Project Structure

```
billow-final/
├── .github/workflows/ci.yml    # GitHub Actions CI
├── cdc/
│   ├── consumer.py             # CDC consumer (Python)
│   └── requirements.txt
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/             # Login, Dashboard
│   │   ├── api.ts             # Axios + token refresh
│   │   ├── auth.tsx           # Auth context
│   │   └── styles.css         # Tailwind styles
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── db/                         # Database scripts
│   ├── schema.sql             # Tables, partitions
│   ├── functions.sql          # RLS functions
│   ├── rls_policies.sql       # Security policies
│   ├── mv.sql                 # Materialized views
│   ├── cron_jobs.sql          # pg_cron jobs
│   ├── seeds.sql              # Sample data
│   └── migrate.sh             # Migration script
├── server/                     # Node.js backend
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   ├── __tests__/         # Jest tests
│   │   ├── db.ts              # Database pool + RLS
│   │   ├── middleware.ts      # Auth, errors
│   │   ├── validators.ts      # Zod schemas
│   │   └── sockets.ts         # Focus Mode
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── docker-compose.yml          # Local dev stack
├── README.md                   # Main documentation
├── DB_OPS.md                   # Database guide
├── EXEC_SUMMARY.md             # Executive summary
├── RUN_CHECKLIST.md            # Run verification
└── WINDOWS_RUN_GUIDE.md        # This file!
```

---

## 🚀 Next Steps

### Local Development
- ✅ Application running locally
- 📝 Make changes to code (hot reload enabled)
- 🧪 Run tests: `npm test` in server directory
- 🔍 Check logs in terminal windows

### Create Your Own Account
1. Click "Sign Out" (if logged in as guest)
2. Click "Don't have an account? Sign up"
3. Enter email and password
4. Your data will be isolated via RLS policies

### Deploy to Production
See [README.md](./README.md) for:
- **Frontend:** Deploy to Vercel
- **Backend:** Deploy to Render or Fly.io
- **Database:** Use managed PostgreSQL

---

## 📚 Documentation

- **README.md** — Features, tech stack, deployment
- **DB_OPS.md** — Database architecture, partitioning, RLS, CDC
- **EXEC_SUMMARY.md** — Product vision, business case
- **RUN_CHECKLIST.md** — Acceptance tests

---

## 🎉 You're All Set!

Your Billow application is now running locally with:
- ✅ PostgreSQL with HASH + RANGE partitioning
- ✅ Row-Level Security (RLS) enforced
- ✅ JWT authentication with refresh tokens
- ✅ Real-time Focus Mode (Socket.io)
- ✅ Weekly insights with Chart.js
- ✅ Materialized views + pg_cron
- ✅ Complete CI/CD pipeline
- ✅ Production-ready Docker setup

**Enjoy building with Billow!** 🌊

---

**Questions or Issues?**
- Check [README.md](./README.md)
- Open GitHub issue: https://github.com/2dame/billow/issues

