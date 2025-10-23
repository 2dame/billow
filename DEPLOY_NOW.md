# 🚀 Deploy Billow NOW - Step by Step

## ✅ STEP 1: Run Database Migrations (3 minutes)

### Go to Supabase SQL Editor:
**URL:** https://supabase.com/dashboard/project/rrubmvcsvvgzycozlgac/sql/new

### Copy and paste this file:
**File:** `C:\Users\Damion\Documents\Projects\billow-final\supabase_migration.sql`

1. Open `supabase_migration.sql` in Notepad
2. **Select All** (Ctrl+A) and **Copy** (Ctrl+C)
3. Go to Supabase SQL Editor (link above)
4. **Paste** (Ctrl+V) in the editor
5. Click **"Run"** (bottom right green button)
6. Wait ~10 seconds
7. Should see "Success. No rows returned" ✅

---

## ✅ STEP 2: Deploy Backend on Render (5 minutes)

### Go to Render:
**URL:** https://dashboard.render.com/select-repo?type=web

### Settings:
- **Name:** `billow-api`
- **Root Directory:** `server`
- **Environment:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Instance Type:** Free

### Environment Variables (click "Add Environment Variable"):

```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:YX5JGXA34pcssDz5@db.rrubmvcsvvgzycozlgac.supabase.co:5432/postgres
JWT_SECRET=dveIpUMSK2arRkHuOlYAFCtPbomDZxW6njg4BfyJT75X39hiEzwVNq1s0LcG8Q
JWT_REFRESH_SECRET=AKrC01eywDU53mc9LR2YpWI6TZqaokNXJBPtO7SgH8jbfivFGuxM4lnVQzdEsh
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
ALLOWED_ORIGINS=https://billow.vercel.app
```

**⚠️ Note:** We'll update `ALLOWED_ORIGINS` after Vercel gives us the URL

### Click "Create Web Service"
- Wait 5-7 minutes for deploy
- **COPY YOUR BACKEND URL** (e.g., `https://billow-api.onrender.com`)
- **Test it:** Visit `https://your-backend-url.onrender.com/health`
- Should see: `{"status":"healthy","database":true,"timestamp":"..."}`

---

## ✅ STEP 3: Deploy Frontend on Vercel (2 minutes)

### Go to Vercel:
**URL:** https://vercel.com/new

### Import your repo:
- Select `2dame/billow` from GitHub
- Click **Import**

### Configure Project:
- **Project Name:** `billow`
- **Framework Preset:** Vite (should auto-detect)
- **Root Directory:** `client` ← IMPORTANT!
- **Build Command:** Leave default (`npm run build`)
- **Output Directory:** Leave default (`dist`)

### Environment Variables:
Click "Add" under Environment Variables:

```
VITE_API_URL=https://YOUR-RENDER-URL-HERE.onrender.com
```

**Replace with YOUR actual Render backend URL from Step 2!**

### Click "Deploy"
- Wait 2-3 minutes
- **COPY YOUR VERCEL URL** (e.g., `https://billow.vercel.app`)

---

## ✅ STEP 4: Update Backend CORS (1 minute)

### Go back to Render:
1. Click on your `billow-api` service
2. Go to **Environment** tab
3. Find `ALLOWED_ORIGINS`
4. Change it to: `https://your-actual-vercel-url.vercel.app`
5. Click **"Save Changes"**
6. Service will auto-redeploy (~1 minute)

---

## ✅ STEP 5: TEST YOUR LIVE APP! 🎉

### Visit your Vercel URL:
**Example:** `https://billow.vercel.app`

1. Click **"Continue as Guest"**
2. Should see the dashboard!
3. Try creating a task
4. Try Focus Mode
5. Write a reflection

**If it works:** 🎊 **YOU'RE LIVE!**

---

## 🐛 Troubleshooting

### "Network Error" in frontend:
- Check backend is running: visit `YOUR-BACKEND-URL/health`
- Check `ALLOWED_ORIGINS` in Render matches your Vercel URL exactly
- Check `VITE_API_URL` in Vercel environment variables

### Backend won't start on Render:
- Check "Logs" tab in Render dashboard
- Verify all environment variables are set
- Check DATABASE_URL is correct

### Database errors:
- Make sure SQL migration ran successfully in Supabase
- Check Supabase logs in Dashboard

---

## 📝 After Deployment

### Update GitHub README:
Once deployed, **edit README.md** and change:
```markdown
**🌐 [Live Demo](#) ·**
```
To:
```markdown
**🌐 [Live Demo](https://your-vercel-url.vercel.app) ·**
```

Then commit and push:
```powershell
git add README.md
git commit -m "docs: add live demo URL"
git push
```

---

## 🎯 Quick Reference

**Your URLs:**
- Frontend (Vercel): `https://billow.vercel.app` (your actual URL)
- Backend (Render): `https://billow-api.onrender.com` (your actual URL)
- Database (Supabase): `postgresql://postgres:YX5JGXA34pcssDz5@db.rrubmvcsvvgzycozlgac.supabase.co:5432/postgres`

**Files:**
- SQL Migration: `supabase_migration.sql` (in project root)
- This guide: `DEPLOY_NOW.md`

---

**🚀 Total time: ~10 minutes**

**You've got this!** Follow each step in order and you'll be live! 🌊

