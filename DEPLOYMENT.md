# Panic Ring — Deployment Guide

## Architecture

```
Netlify (Frontend)  ──→  Render.com (Backend API)
      React SPA            Node.js + Express + SQLite
      port 443              port 10000
```

---

## Step 1 — Deploy the Backend on Render

1. Go to **https://render.com** → Sign up / Log in
2. Click **New → Web Service**
3. Connect your GitHub repo (push this project to GitHub first)
4. Set these fields:
   - **Name**: `panic-ring-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Add **Environment Variables** in Render dashboard:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | *(click "Generate" for a random secret)* |
| `FRONTEND_URL` | `https://your-site.netlify.app` *(update after Netlify deploy)* |
| `BACKEND_URL` | `https://panic-ring-backend.onrender.com` *(your Render URL)* |
| `PAYFAST_SANDBOX` | `true` *(change to `false` for live payments)* |
| `PAYFAST_MERCHANT_ID` | `10000100` *(sandbox — replace for live)* |
| `PAYFAST_MERCHANT_KEY` | `46f0cd694581a` *(sandbox — replace for live)* |
| `PAYFAST_PASSPHRASE` | `jt7NOE43FZPn` *(sandbox — replace for live)* |

6. Click **Deploy**. Wait ~2 min for build.
7. Copy your Render URL: `https://panic-ring-backend.onrender.com`

> **Persistent Data on Free Tier**: Render free tier uses ephemeral storage.
> The database is stored in `/tmp` and resets on restart. To persist data:
> - Upgrade to a paid Render plan and add a **Disk** mounted at `/data`
> - Set env var `DATA_DIR=/data`

---

## Step 2 — Deploy the Frontend on Netlify

### Option A: Netlify UI (Easiest)

1. Go to **https://app.netlify.com** → **Add new site → Import an existing project**
2. Connect your GitHub repo
3. Set these build settings:
   - **Base directory**: *(leave empty — project root)*
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Add **Environment Variables** (Site settings → Environment variables):

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://panic-ring-backend.onrender.com` |

5. Click **Deploy site**

### Option B: Netlify CLI

```bash
# Install CLI
npm install -g netlify-cli

# Login
netlify login

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

---

## Step 3 — Update CORS

After Netlify gives you a URL (e.g. `https://panic-ring-abc123.netlify.app`):

1. Go to **Render dashboard → panic-ring-backend → Environment**
2. Update `FRONTEND_URL` to your actual Netlify URL
3. Click **Save changes** — Render will redeploy automatically

---

## Step 4 — Test the Deployment

Visit your Netlify URL and verify:
- [ ] Home page loads
- [ ] Register a new account
- [ ] Login works
- [ ] SOS button activates and creates an alert
- [ ] Map shows your location
- [ ] `/api/health` on your Render URL returns `{"status":"ok"}`

---

## Custom Domain (Optional)

1. In Netlify: **Domain settings → Add custom domain**
2. Point your DNS to Netlify's nameservers
3. Update `FRONTEND_URL` in Render to your custom domain

---

## Environment Variables Summary

### Frontend (Netlify)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Your Render backend URL |

### Backend (Render)
| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render sets this automatically) |
| `JWT_SECRET` | Long random secret for JWT signing |
| `FRONTEND_URL` | Your Netlify URL (for CORS) |
| `BACKEND_URL` | Your Render URL (for PayFast callbacks) |
| `DATA_DIR` | `/data` (if using Render Disk for persistence) |
| `PAYFAST_SANDBOX` | `true` / `false` |
| `PAYFAST_MERCHANT_ID` | From payfast.co.za |
| `PAYFAST_MERCHANT_KEY` | From payfast.co.za |
| `PAYFAST_PASSPHRASE` | From payfast.co.za |
