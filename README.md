# Billow

Full-stack productivity application with task and goal tracking. React frontend, Node.js/Express API, PostgreSQL database, JWT authentication.

**Live:** [billow.vercel.app](https://billow.vercel.app) *(or update with your deploy URL)*

## Stack

**Frontend:** React, React Router, Axios  
**Backend:** Node.js, Express  
**Database:** PostgreSQL  
**Auth:** JWT (JSON Web Tokens)  
**Deploy:** Vercel (frontend), Railway / Render (API)

## Architecture

Decoupled frontend and backend. The API is stateless — authentication is handled via JWT on every protected request, no server-side sessions. The React app communicates with the API through a central Axios instance that attaches the token from localStorage on each request.

```
/client          React app
/server          Express API
  /routes        Route definitions
  /middleware    Auth validation, error handling
  /controllers   Business logic
  /db            PostgreSQL queries and migrations
```

## Running Locally

**Prerequisites:** Node.js 18+, PostgreSQL

```bash
# Clone and install
git clone https://github.com/2dame/billow.git
cd billow

# Backend
cd server
cp .env.example .env    # fill in DB credentials and JWT secret
npm install
npm run migrate
npm start               # runs on :5000

# Frontend (separate terminal)
cd ../client
npm install
npm start               # runs on :3000
```

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | — | Create account |
| POST | /api/auth/login | — | Login, returns JWT |
| GET | /api/tasks | Required | Get user tasks |
| POST | /api/tasks | Required | Create task |
| PUT | /api/tasks/:id | Required | Update task |
| DELETE | /api/tasks/:id | Required | Delete task |

## Notes

Built end-to-end: schema design, auth implementation, API layer, frontend integration, deployment configuration, and cross-layer debugging (network → API → auth → database). The goal was production-grade architecture patterns, not just a working demo.
