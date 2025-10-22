# Billow — Executive Summary

**Tagline:** Your data, reflected  
**Category:** Productivity & Reflection SaaS  
**Tech Stack:** React + TypeScript + Node.js + PostgreSQL 15  
**Repository:** https://github.com/2dame/billow

---

## 🎯 Product Vision

Billow combines task management with reflective journaling to help users track productivity **and** emotional well-being. Unlike traditional to-do apps, Billow surfaces insights from your own data — showing how your mood correlates with task completion, identifying trends, and generating weekly digests automatically.

**Key differentiator:** Production-grade database architecture with real-time features, making it both a learning showcase and a deployable MVP.

---

## ✨ Core Features

### User-Facing
1. **Task Management** — Prioritized tasks with due dates, status tracking, and completion timestamps
2. **Echo Journal** — Daily reflections with 1-5 mood scoring
3. **Focus Mode** — Real-time Pomodoro timer with Socket.io live sync
4. **Weekly Insights** — Visualize tasks completed vs. average mood over 12 weeks (Chart.js)
5. **Snapshots** — Capture point-in-time metrics and compare progress
6. **Weekly Digests** — Auto-generated summaries stored for historical review
7. **Guest Login** — Instant access without account creation

### Technical Excellence
- **Security:** JWT auth with refresh tokens, RLS policies, rate limiting, Helmet, CORS allowlist
- **Scalability:** HASH partitioning (tasks), RANGE partitioning (user_activity), MV with pg_cron refresh
- **Real-time:** Socket.io for Focus Mode, CDC consumer for live aggregates
- **Validation:** Zod schemas on all write routes (strict TypeScript)
- **DevOps:** Docker Compose, GitHub Actions CI, Jest tests, Dockerfile for deployment

---

## 🛠 Architecture Highlights

### Frontend (React + Tailwind)
- **Matte black/grey theme** — Clean, modern, accessible (WCAG 2.1 conscious)
- **Axios with auto-refresh** — Seamless token renewal (< 60s expiration)
- **Chart.js** — Interactive insights visualization
- **Socket.io-client** — Real-time Focus Mode updates

### Backend (Node.js + Express)
- **TypeScript strict mode** — No implicit `any`, full type safety
- **Layered security** — Helmet → CORS → Rate limiting → JWT middleware
- **Structured logging** — Pino logger with pretty output in dev
- **Health checks** — `/health` endpoint for uptime monitoring

### Database (PostgreSQL 15)
- **Partitioning:**
  - HASH (tasks): 16 partitions for even write distribution
  - RANGE (user_activity): Monthly partitions, auto-create/prune via pg_cron
- **Row-Level Security:** All queries filtered by `current_app_user_id()` session variable
- **Materialized Views:** `mv_user_weekly_summary` refreshed hourly
- **CDC Pipeline:** Python consumer with wal2json → real-time `user_dashboard_aggregates`

### DevOps
- **CI:** GitHub Actions — lint, test, build (backend + frontend)
- **Testing:** Jest + Supertest with real Postgres service
- **Deployment:**
  - Frontend: Vercel (static build)
  - Backend: Render/Fly.io (Dockerfile included)
  - Database: Render/Neon managed PostgreSQL

---

## 📊 Data Model

**Core entities:**
- `users` → `user_settings`
- `tasks` (partitioned) → `goals` (many-to-many)
- `habits` → `habit_logs`
- `reflections` → explicit joins (`reflection_tasks`, `reflection_goals`)
- `snapshots` (JSONB)
- `user_activity` (partitioned, audit log)
- `digests` (JSONB weekly summaries)
- `user_dashboard_aggregates` (CDC target)

**Relationships:**
- One-to-many: user → tasks, user → reflections
- Many-to-many: goals ↔ tasks, reflections ↔ tasks/goals/habits

---

## 🚀 Deployment Readiness

### Checklist
- [x] All secrets in `.env` files (not committed)
- [x] CORS allowlist (no wildcards in production)
- [x] Rate limiting on auth + write routes
- [x] Input validation with Zod
- [x] RLS policies enforced
- [x] Health check endpoint
- [x] Docker Compose for local dev
- [x] Dockerfile for production
- [x] CI pipeline (GitHub Actions)
- [x] Tests passing

### Environment Variables Required
**Backend:**
- `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ALLOWED_ORIGINS`

**Frontend:**
- `VITE_API_URL`

### Deployment Steps
1. **Frontend:** Connect repo → Vercel → Set `VITE_API_URL`
2. **Backend:** Deploy to Render/Fly.io → Add env vars → Attach managed Postgres
3. **Database:** Run migrations via `npm run db:migrate`
4. **CDC (optional):** Deploy `consumer.py` as separate service with wal2json enabled

---

## 💡 Business Potential

### Target Audience
- **Productivity enthusiasts** seeking emotional tracking
- **Mental health-conscious users** who journal + track tasks
- **Developers** learning modern full-stack patterns

### Monetization Paths
1. **Freemium:** Basic features free, premium insights/integrations paid
2. **Teams:** Shared workspaces with aggregated team insights
3. **Integrations:** Connect to Todoist, Notion, Google Calendar (OAuth)
4. **API access:** Let power users export/sync data

### Growth Levers
- **Referral program:** "Invite friends, unlock premium features"
- **Public snapshots:** Share weekly summaries on social media
- **Mobile app:** React Native version for on-the-go journaling

---

## 📈 Technical Scalability

### Current Capacity
- **Tasks table:** HASH partitioning supports millions of rows per user
- **User activity:** RANGE partitioning with auto-pruning (12-month retention)
- **Connection pooling:** 20 concurrent connections (increase with PgBouncer)

### Future Optimizations
1. **Read replicas** for analytics queries (MV refresh)
2. **Redis cache** for frequently accessed user settings
3. **S3 storage** for large JSONB snapshots
4. **GraphQL** for flexible client queries
5. **Multi-region** with PostGIS for geo-based insights

---

## 🎨 Design Philosophy

### UI/UX
- **Matte black/grey palette** — Reduces eye strain, modern aesthetic
- **Subtle animations** — Fade-in, slide-up (no distracting motion)
- **Empty states** — Friendly messages when no data exists
- **Accessibility** — High contrast, keyboard navigation, ARIA labels

### Code Quality
- **Strict TypeScript** — Catch errors at compile time
- **Single Responsibility** — Each route file handles one resource
- **DRY principles** — Shared middleware, validators, DB helpers
- **Comments** — JSDoc for public functions, inline for complex logic

---

## 🏆 Competitive Advantages

| Feature | Billow | Todoist | Notion | Habitica |
|---------|--------|---------|--------|----------|
| Task Management | ✅ | ✅ | ✅ | ✅ |
| Mood Tracking | ✅ | ❌ | ❌ | ❌ |
| Real-time Focus | ✅ | ❌ | ❌ | ❌ |
| Insights Chart | ✅ | Limited | ❌ | Limited |
| Self-hosted | ✅ | ❌ | ❌ | ❌ |
| Open Source | ✅ | ❌ | ❌ | ✅ |

**Unique combo:** Task management + emotional tracking + real-time features + production DB ops

---

## 📚 Learning Outcomes

Developers studying this codebase will learn:
- **Database partitioning** (HASH + RANGE)
- **Row-Level Security** implementation
- **JWT refresh token flow**
- **Socket.io real-time patterns**
- **CDC with PostgreSQL**
- **Zod validation**
- **Docker multi-container apps**
- **GitHub Actions CI/CD**

---

## 🔮 Roadmap

### Phase 1 (MVP) — ✅ Complete
- Task CRUD, reflections, Focus Mode, insights chart
- JWT auth + guest login
- Docker + CI

### Phase 2 (Enhancements)
- Mobile app (React Native)
- Habit tracking with streak counters
- Integrations (Google Calendar, Todoist)
- Team workspaces

### Phase 3 (Scale)
- AI-powered insights ("You're most productive on Tuesdays")
- Voice journaling (speech-to-text)
- Public API with rate limiting
- White-label SaaS for organizations

---

## 📞 Contact

**Developer:** Damion Broussard  
**GitHub:** https://github.com/2dame/billow  
**License:** MIT

**Status:** Production-ready MVP  
**Last Updated:** October 2025

---

## 📊 Key Metrics (Post-Launch Targets)

- **Users:** 1,000 in first 3 months
- **Retention:** 40% DAU/MAU
- **Performance:** < 200ms API response (p95)
- **Uptime:** 99.5% SLA
- **Test Coverage:** > 80%

---

**Summary:** Billow is a fully functional, production-grade productivity app that combines emotional tracking with technical excellence. It's ready to deploy, scale, and monetize — or serve as a portfolio showcase of modern full-stack development.

