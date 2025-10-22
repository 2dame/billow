# Billow — Your data, reflected

[![CI](https://github.com/2dame/billow/actions/workflows/ci.yml/badge.svg)](https://github.com/2dame/billow/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org)

> A full-stack productivity & reflection app with intelligent insights, real-time Focus Mode, and production-grade database operations.

**🌐 [Live Demo](#) ·** **📖 [Documentation](./DB_OPS.md) ·** **🐛 [Report Bug](https://github.com/2dame/billow/issues) ·** **✨ [Request Feature](https://github.com/2dame/billow/issues)**

![Billow Dashboard](https://via.placeholder.com/800x450/0a0a0a/3b82f6?text=Billow+Dashboard+Preview)

---

## ✨ Features

### Core Functionality
- **Task Management** — Create, organize, and track tasks with priorities and due dates
- **Reflections (Echo Journal)** — Daily journaling with mood tracking
- **Weekly Insights** — Visualize productivity trends with Chart.js
- **Focus Mode** — Real-time Pomodoro timer with Socket.io
- **Snapshots** — Compare your progress over time
- **Weekly Digests** — Auto-generated summaries of your week

### Technical Highlights
- **PostgreSQL Advanced** — HASH + RANGE partitioning, RLS, materialized views, pg_cron
- **Authentication** — JWT with refresh tokens + guest login
- **Real-time** — Socket.io for live Focus Mode sync
- **Security** — Helmet, CORS allowlist, rate limiting, bcrypt
- **Validation** — Zod schemas on all write routes
- **CDC (Change Data Capture)** — Python consumer with wal2json
- **Production-ready** — Docker, CI/CD, health checks

## 🛠 Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite
- Tailwind CSS (matte black/grey theme)
- Chart.js + react-chartjs-2
- Socket.io-client
- Axios with auto token refresh

**Backend**
- Node.js 20 + Express + TypeScript
- PostgreSQL 15
- Socket.io
- JWT (jsonwebtoken)
- Zod validation
- Pino logger
- Helmet, CORS, rate limiting

**Database**
- PostgreSQL 15
- pg_cron extension
- wal2json (CDC)
- HASH partitioning (tasks)
- RANGE partitioning (user_activity)
- Row-Level Security (RLS)
- Materialized views

**DevOps**
- Docker + Docker Compose
- GitHub Actions CI
- Jest + Supertest

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Docker Desktop (optional but recommended)

### Local Setup (Docker)

```bash
# Clone repository
git clone https://github.com/2dame/billow.git
cd billow

# Start PostgreSQL with Docker
docker compose up -d

# Backend setup
cd server
cp .env.example .env
npm install
npm run db:migrate
npm run dev

# Frontend setup (new terminal)
cd ../client
npm install
npm run dev
```

Visit http://localhost:5173 and click **"Continue as Guest"** to explore!

### Environment Variables

**Server (.env)**
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://billow:billow@localhost:5432/billow
JWT_SECRET=your-secure-random-string
JWT_REFRESH_SECRET=another-secure-random-string
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Client (.env)**
```env
VITE_API_URL=http://localhost:5000
```

## 📦 Scripts

### Backend
```bash
npm run dev          # Development with hot reload
npm run build        # Compile TypeScript
npm start            # Production server
npm test             # Run Jest tests
npm run db:migrate   # Apply database migrations
```

### Frontend
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
```

## 🧪 Testing

```bash
cd server
npm test
```

Tests run against a real PostgreSQL instance with migrations applied.

## 📊 Database Operations

See [DB_OPS.md](./DB_OPS.md) for detailed documentation on:
- Schema design
- Partitioning strategy
- RLS policies
- pg_cron jobs
- CDC setup
- Performance tuning

## 🌐 Deployment

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Build settings:
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
   - Root directory: `client`
3. Environment: `VITE_API_URL=https://your-backend.com`

### Backend (Render / Fly.io)

**Render:**
1. Create new Web Service
2. Connect GitHub repo
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Root directory: `server`
6. Add environment variables
7. Add managed PostgreSQL database

**Fly.io:**
```bash
cd server
fly launch
fly postgres create
fly postgres attach <db-name>
fly deploy
```

### Database
- **Render Managed PostgreSQL** (recommended)
- **Neon** (serverless PostgreSQL)
- **Supabase** (if you need pg_cron)

> **Note:** CDC consumer requires wal2json extension — check provider support.

## 🔐 Security Checklist

- [x] JWT secret in environment variables
- [x] CORS allowlist (no wildcards in production)
- [x] Rate limiting on auth + write routes
- [x] Helmet security headers
- [x] Input validation with Zod
- [x] RLS policies on all user tables
- [x] Bcrypt password hashing (10 rounds)
- [x] No secrets in git history

## 📖 API Documentation

**Authentication**
- `POST /auth/register` — Create account
- `POST /auth/login` — Sign in
- `POST /auth/refresh` — Refresh access token
- `POST /auth/demo` — Guest login

**Tasks**
- `GET /tasks` — List tasks
- `POST /tasks` — Create task
- `PATCH /tasks/:id` — Update task
- `DELETE /tasks/:id` — Delete task

**Reflections**
- `GET /reflections` — List reflections
- `POST /reflections` — Create reflection

**Snapshots**
- `GET /snapshots` — List snapshots
- `POST /snapshots` — Create snapshot
- `GET /snapshots/compare` — Compare two snapshots

**Digests**
- `GET /digests` — List digests
- `POST /digests` — Generate digest

**Insights**
- `GET /insights/weekly` — Weekly summary from MV
- `GET /insights/dashboard` — Dashboard aggregates

**Health**
- `GET /health` — Service health check

## 🎨 UI Theme

Matte black and grey design with subtle blue accents:
- Background: `#0a0a0a`
- Cards: `#141414`
- Borders: `#1f1f1f`
- Text: `#e5e5e5`
- Accent: `#3b82f6`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

Built with modern best practices:
- Strict TypeScript
- RLS for multi-tenant security
- Partitioning for scale
- CDC for real-time aggregates
- Clean architecture

---

**Made with ❤️ by the Billow team**

Repository: https://github.com/2dame/billow

