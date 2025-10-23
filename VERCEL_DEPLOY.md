# 🚀 Vercel Serverless Deployment Guide

## ✅ Conversion Complete

Your Billow backend has been successfully converted from Docker/Render to **Vercel Serverless Functions**.

**Commit:** `2b23cbb` - refactor: convert backend to Vercel serverless functions

---

## 📦 What Changed

| Component | Before | After |
|-----------|--------|-------|
| **Architecture** | Docker + Node server | Vercel serverless functions |
| **Server File** | `src/index.ts` (with `app.listen()`) | `src/app.ts` (Express app only) |
| **Entry Point** | N/A | `api/index.ts` (serverless handler) |
| **Socket.io** | ✅ Enabled | ⚠️ Disabled (see alternatives) |
| **Port** | 10000 (Render) | Dynamic (Vercel) |
| **Build** | Dockerfile | Vercel auto-build |

---

## ⚠️ Socket.io Focus Mode Disabled

**Why?** Serverless functions are stateless and short-lived. WebSocket connections require persistent server state.

**Alternatives:**
1. **Supabase Realtime** (Recommended) - Already using Supabase
2. **Ably** - Free tier: 6M messages/month
3. **Pusher** - Free tier: 100 connections
4. **Keep Socket.io on Render** - Hybrid approach (REST on Vercel, WebSockets on Render)

---

## 🚀 Deploy to Vercel - Step-by-Step

### **Step 1: Create Vercel Project**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository: `2dame/billow`
4. **Configure:**
   - **Framework Preset:** Other
   - **Root Directory:** `server` ⚠️ (Important if backend is in subfolder)
   - **Build Command:** Leave empty (Vercel auto-detects)
   - **Output Directory:** Leave empty
   - **Install Command:** `npm install`

### **Step 2: Add Environment Variables** ⚠️ **CRITICAL**

In Vercel → **Settings** → **Environment Variables**, add these:

#### **Required Variables** (App won't start without these)

```bash
DATABASE_URL=postgresql://postgres:YX5JGXA34pcssDz5@db.rrubmvcsvvgzycozlgac.supabase.co:5432/postgres
JWT_SECRET=dveIpUMSK2arRkHuOlYAFCtPbomDZxW6njg4BfyJT75X39hiEzwVNq1s0LcG8Q
JWT_REFRESH_SECRET=AKrC01eywDU53mc9LR2YpWI6TZqaokNXJBPtO7SgH8jbfivFGuxM4lnVQzdEsh
NODE_ENV=production
```

#### **Recommended Variables**

```bash
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### **CORS Variables** (Update after frontend deploys)

```bash
ALLOWED_ORIGINS=https://billow.vercel.app
CLIENT_URL=https://billow.vercel.app
```

**Note:** Initially, you can set `ALLOWED_ORIGINS=http://localhost:5173,https://billow.vercel.app` to test locally.

### **Step 3: Deploy**

1. Click **"Deploy"**
2. Wait ~2-3 minutes for build
3. Copy your backend URL: `https://your-backend-project.vercel.app`

### **Step 4: Test Deployment**

```bash
# Test health endpoint
curl https://your-backend-project.vercel.app/health

# Expected response:
{
  "status": "ok",
  "env": "production",
  "database": "connected",
  "timestamp": "2025-10-23T..."
}
```

### **Step 5: Update Frontend**

Update your frontend (client) `.env` or `.env.production`:

```bash
VITE_API_URL=https://your-backend-project.vercel.app
```

Then redeploy your frontend on Vercel.

### **Step 6: Update CORS (Important!)**

Once your frontend is deployed:

1. Go to Vercel → Your Backend Project → **Settings** → **Environment Variables**
2. Update `ALLOWED_ORIGINS` to include your frontend URL:
   ```
   ALLOWED_ORIGINS=https://billow.vercel.app,https://your-custom-domain.com
   ```
3. Redeploy backend to pick up changes

---

## 🧪 Local Development

Your local development setup still works!

```bash
cd server

# Start local server (port 5000)
npm run dev

# Test health endpoint
curl http://localhost:5000/health
```

**Note:** Local server uses `src/index.ts`, Vercel uses `api/index.ts`.

---

## 📋 Environment Variables Reference

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `DATABASE_URL` | ✅ YES | - | Supabase PostgreSQL connection |
| `JWT_SECRET` | ✅ YES | - | JWT access token signing key |
| `JWT_REFRESH_SECRET` | ✅ YES | - | JWT refresh token signing key |
| `NODE_ENV` | ✅ YES | `development` | Environment mode |
| `JWT_EXPIRES_IN` | Optional | `7d` | JWT access token lifespan |
| `JWT_REFRESH_EXPIRES_IN` | Optional | `30d` | JWT refresh token lifespan |
| `ALLOWED_ORIGINS` | ✅ YES | `localhost` | CORS allowed origins (comma-separated) |
| `CLIENT_URL` | Optional | - | Frontend URL for reference |
| `RATE_LIMIT_WINDOW_MS` | Optional | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Optional | `100` | Max requests per window |

---

## 🔍 Troubleshooting

### **1. CORS Errors**

**Symptom:** Frontend shows `Access-Control-Allow-Origin` errors

**Fix:**
```bash
# Update ALLOWED_ORIGINS in Vercel
ALLOWED_ORIGINS=https://billow.vercel.app,https://your-custom-domain.com
```

### **2. Database Connection Issues**

**Symptom:** `/health` returns `database: "disconnected"`

**Fixes:**
- Verify `DATABASE_URL` is correct in Vercel
- Check Supabase isn't paused (free tier)
- SSL is auto-enabled when `NODE_ENV=production`

### **3. 404 on API Routes**

**Symptom:** All routes return 404

**Fix:** Verify:
- `vercel.json` exists in `server/` directory
- `api/index.ts` exists
- Root Directory in Vercel is set to `server`

### **4. Build Fails**

**Symptom:** "Cannot find module '@vercel/node'"

**Fix:**
```bash
cd server
npm install --save-dev @vercel/node
git add package.json package-lock.json
git commit -m "fix: add @vercel/node dependency"
git push
```

### **5. Environment Variables Not Loading**

**Symptom:** "Missing required environment variables" in logs

**Fix:**
- Go to Vercel → Settings → Environment Variables
- Ensure all required vars are added
- Redeploy after adding vars

---

## 📊 Architecture Comparison

### **Before (Render + Docker)**
```
GitHub → Render Build → Docker Container → Node Server (Port 10000)
                                              ↓
                                         Socket.io
                                         Express API
                                         PostgreSQL
```

### **After (Vercel Serverless)**
```
GitHub → Vercel Build → Serverless Functions → Express API
                             ↓                     ↓
                        Auto-scaled            PostgreSQL
                        Cold starts
                        No WebSockets
```

---

## 🎯 Performance Characteristics

| Aspect | Render (Docker) | Vercel (Serverless) |
|--------|----------------|---------------------|
| **Cold Start** | No (always running) | Yes (~1-2s on free tier) |
| **Scaling** | Manual | Automatic |
| **Concurrency** | Limited by instance | Unlimited (per function) |
| **WebSockets** | ✅ Supported | ❌ Not supported |
| **Cost (Free)** | 750 hrs/month | Unlimited functions |
| **Uptime** | 99.9% | 99.99% |

---

## 🔄 Rolling Back

If you need to roll back to Docker/Render:

```bash
# Checkout previous commit
git checkout 71f4e7b

# Or revert the conversion
git revert 2b23cbb
```

---

## 📚 Additional Resources

- [Vercel Node.js Documentation](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)
- [Express on Vercel Guide](https://vercel.com/guides/using-express-with-vercel)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## ✅ Deployment Checklist

- [ ] Backend deployed to Vercel
- [ ] All environment variables added
- [ ] Health endpoint returns 200 OK
- [ ] Frontend `.env` updated with backend URL
- [ ] Frontend redeployed
- [ ] CORS updated with frontend URL
- [ ] API calls from frontend working
- [ ] Authentication flow tested
- [ ] Database queries working
- [ ] Rate limiting functional

---

## 🎉 Success Criteria

Your deployment is successful when:

1. ✅ `https://your-backend.vercel.app/health` returns:
   ```json
   {
     "status": "ok",
     "env": "production",
     "database": "connected"
   }
   ```

2. ✅ Frontend can make API calls without CORS errors

3. ✅ User registration/login works

4. ✅ Protected routes return data

5. ✅ Database queries execute successfully

---

**Questions?** Check the [Vercel Community](https://github.com/vercel/community/discussions) or open an issue on your repository.

