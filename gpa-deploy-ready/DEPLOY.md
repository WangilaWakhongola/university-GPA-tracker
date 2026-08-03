# Deploying GPACalc

Backend → Render (free tier works). Frontend → Vercel (free tier works).
Total time: ~15 minutes. You'll need a GitHub account with this repo pushed to it.

---

## 0. Push to GitHub

```bash
cd gpa-calculator
git init
git add .
git commit -m "Initial commit"
```
Create a new repo on GitHub, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/gpa-calculator.git
git push -u origin main
```

---

## 1. Backend → Render

1. Go to https://dashboard.render.com → **New** → **Web Service**
2. Connect your GitHub repo
3. Fill in:
   - **Root directory**: `backend`
   - **Runtime**: Python 3
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `gunicorn -w 4 -b 0.0.0.0:$PORT "app:create_app()"`
4. Add environment variables (Render dashboard → Environment):
   | Key | Value |
   |---|---|
   | `JWT_SECRET_KEY` | `b02021e3310b489835d9c2fecbff80ad0a90a6a9a73db16b696e0674f8bc30c` (generated for you below — or make your own) |
   | `FLASK_ENV` | `production` |
5. Click **Create Web Service**. Wait for the build — you'll get a URL like `https://gpa-calculator-api.onrender.com`.
6. **Test it**: visit `https://YOUR-BACKEND-URL.onrender.com/api/stats/scales` in a browser. You should see JSON grading scale data. If you get an error, check the Render logs tab.

### About the database
By default this uses SQLite, which **resets on every redeploy on Render's free tier** — fine for a demo, not for real users. To make it persistent:
- **Option A (simplest)**: Render → your service → **Disks** → add a 1GB persistent disk mounted at `/opt/render/project/src/backend/instance`. SQLite data now survives redeploys.
- **Option B (recommended for real use)**: Render → **New** → **PostgreSQL** (free tier available) → copy the **Internal Database URL** it gives you → add it as the `DATABASE_URL` environment variable on your backend service. The app already knows how to use it — no code changes needed.

---

## 2. Frontend → Vercel

1. Go to https://vercel.com/new → import the same GitHub repo
2. Fill in:
   - **Root directory**: `frontend`
   - **Framework preset**: Vite (auto-detected)
   - **Build command**: `npm run build` (default)
   - **Output directory**: `dist` (default)
3. Add environment variable:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://YOUR-BACKEND-URL.onrender.com/api` |
4. Deploy. You'll get a URL like `https://gpa-calculator.vercel.app`.

---

## 3. Lock down CORS (do this after both are live)

Go back to Render → your backend service → Environment → add:
| Key | Value |
|---|---|
| `FRONTEND_URL` | `https://gpa-calculator.vercel.app` (your actual Vercel URL) |

Redeploy the backend. This restricts the API to only accept requests from your real frontend instead of any origin.

---

## 4. Verify it works end to end

1. Visit your Vercel URL
2. Click **Register**, create an account (pick a region — this sets your grading scale)
3. Add a semester, add a course, confirm the GPA and classification badge appear
4. Try the **Upload transcript (PDF)** flow if you have a sample transcript
5. Toggle dark mode, resize to mobile width to check the sidebar drawer

If registration/login fails, it's almost always one of:
- `VITE_API_URL` missing `/api` at the end, or pointing to the wrong host
- CORS blocking the request (check `FRONTEND_URL` matches your Vercel URL exactly, including `https://`)
- Backend still cold-starting (Render free tier sleeps after inactivity — first request can take ~30s)

---

## What changed in this version vs. the uploaded zip

- `backend/app.py`: `DATABASE_URL` env var now switches to Postgres in production (SQLite stays the local dev default); `JWT_SECRET_KEY` now hard-fails on startup in production if unset instead of silently using a dev key; CORS now restricts to `FRONTEND_URL` when set.
- `backend/requirements.txt`: added `psycopg2-binary` so the Postgres path actually works.
- `backend/.env.example`: documents the new vars.
