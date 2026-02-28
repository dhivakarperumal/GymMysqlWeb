# Vercel Deployment Guide (UI Only)

This document walks you through deploying the **Gyms Web App** using the Vercel web interface only – no CLI required. Follow the steps exactly from start to finish.

---

## 1. Prepare your repository

1. Ensure your project is committed to a Git hosting service (GitHub, GitLab, or Bitbucket). The folder structure should be:
   ```
   /
   ├─ api/           # Express server entry point used by Vercel
   ├─ backend/       # Local-only backend code (not deployed)
   ├─ frontend/      # Vite/React SPA
   ├─ vercel.json    # Build & routing configuration
   ```
2. Push all branches so the remote contains the latest code.

> ✔️ The repository must be public or accessible by the Vercel account you will use.

---

## 2. Sign in to Vercel

1. Open [https://vercel.com](https://vercel.com) in your browser.
2. Click **Log in** and choose your Git provider (GitHub, GitLab, or Bitbucket).
3. Authorize Vercel to access your repositories. You can limit access to just this project if desired.

---

## 3. Import your project

1. After logging in, click **New Project** from the dashboard.
2. **Import Git Repository** – select the repository containing your code.
3. Click **Import** on the chosen repo. Vercel will read your `package.json` and `vercel.json` automatically.

### Build & Output settings
- **Framework Preset**: Vercel should detect `Other` since this is a custom monorepo. That's fine.
- **Build Command**: should already be set to:
  ```bash
  cd frontend && NODE_ENV=production npm run build
  ```
- **Output Directory**: `frontend/dist`.
- **Install Command**: `npm install && npm install --prefix backend && npm install --prefix frontend` (should be auto-filled from `vercel.json`).

> If any field is blank or incorrect, you can type it manually.

4. Leave **Root Directory** as `/` (the repo root).
5. Click **Deploy**.

Vercel will start the first deployment; watch the logs for `build` and `install` steps. Once complete, you'll get a preview URL.

---

## 4. Configure environment variables

1. Within your project dashboard, open **Settings** → **Environment Variables**.
2. Add the following keys (values depend on your production environment):
   - `DATABASE_URL` (if using a direct Postgres URL) or
   - `SUPABASE_URL` and `SUPABASE_KEY` when using Supabase as the database
   - `POSTGRES_PRISMA_URL` (if used elsewhere)
   - `JWT_SECRET` (or whatever secret your auth uses)
   - Any other `process.env.*` variables referenced in server or client code.
3. Set the environment to **Production** and click **Add**.

*Tip:* You can also add variables for **Preview** and **Development** if needed.

---

## 5. Add custom domains (optional)

1. Go to **Domains** in the project settings.
2. Click **Add** and type your domain (e.g. `mygymapp.com`).
3. Follow the DNS instructions to point an `A` record or CNAME to Vercel.
4. Vercel will provision HTTPS automatically.

---

## 6. Test the deployment

1. Open the generated URL (something like `https://your-project.vercel.app`).
2. The React frontend should load immediately.
3. Use the browser or `curl` to hit API endpoints:
   - `GET /api/health` → should return `{status:"ok"}`.
   - `GET /api/db-status` → returns connection status (requires `DATABASE_URL`).
   - `POST /api/auth/login` and other routes should work once you have test data.
4. If the database isn’t initialized, call `POST /api/init-db` (only once) to create tables.

> 💡 Use the **Logs** tab in the Vercel dashboard to view request logs and errors.

---

## 7. Ongoing updates

- **Automatic deployments**: any push to the configured Git branch (usually `main`) triggers a new deployment.
- **Preview deployments**: open pull requests create preview URLs automatically.
- **Rollbacks**: in the dashboard’s **Deployments** list, choose a previous deployment and click **Rollback**.

---

## 8. Local mirror (optional)

To simulate the Vercel environment locally without CLI: you can run the same build commands manually.

```bash
# in repo root
npm install && npm install --prefix backend && npm install --prefix frontend
cd frontend && npm run build
# serve the frontend dist folder using any static server, and run api/index.js with node
```

—but this step is not required for deploying via the UI.

---

## Troubleshooting Tips

- **Build fails**: check logs for missing dependencies or syntax errors; ensure `frontend` build command works locally.
- **API returns 500**: verify environment variables and connectivity to the database. Use the `/api/db-status` endpoint to debug.
- **CORS issues**: adjust the allowed origins list in `api/index.js` or switch to more permissive middleware.
- **Large files**: if uploads hit size limits, adjust `express.json`/`urlencoded` limits.

---

By following these steps you'll have a working deployment running on Vercel with just the web UI. 🎉

Let me know if you want help automating any of the steps or dealing with specific errors!