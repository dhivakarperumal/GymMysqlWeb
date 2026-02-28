# Vercel Deployment Setup Guide

## 🚨 Critical: Environment Variables Required

### 1. **Database Connection** (REQUIRED)
You MUST set this on Vercel Dashboard → Project Settings → Environment Variables:

```
Name: POSTGRES_PRISMA_URL
Value: postgresql://user:password@ep-xxx.us-east-1.postgres.vercel-storage.com/verceldb?sslmode=require
```

**Or if using a different Postgres provider:**
```
Name: DATABASE_URL
Value: postgresql://user:password@host:5432/database?sslmode=require
```

### 2. **JWT Configuration**
```
Name: JWT_SECRET
Value: ecommerce_secret_key_2024_very_secure_random_string

Name: JWT_EXPIRES_IN
Value: 7d

Name: NODE_ENV
Value: production
```

---

## 🔍 Troubleshooting Steps

### Step 1: Test Database Connection
After setting env vars and redeploying, visit:
```
https://dhiva-deva-new-my-gym-2hs3.vercel.app/api/db-status
```

**Expected response if working:**
```json
{
  "status": "connected",
  "timestamp": "2026-02-28T...",
  "dbTime": "2026-02-28T..."
}
```

**If response shows `"status": "disconnected"`:**
- ❌ Environment variables NOT set on Vercel
- Go to Vercel Dashboard → Project Settings → Environment Variables
- Add `POSTGRES_PRISMA_URL` or `DATABASE_URL`
- Click "Redeploy"

**If response shows connection error:**
- ❌ Connection string is invalid or database is unreachable
- Check Vercel Postgres connection string is correct
- Verify SSL mode is enabled (`?sslmode=require`)

---

### Step 2: Run Database Migrations (First Time Only)

Once database is connected, create the required tables by visiting:
```
https://dhiva-deva-new-my-gym-2hs3.vercel.app/api/init-db
```

**This will create:**
- `users` table (for login/register)
- `products`, `members`, `plans`, `facilities` tables
- All other app tables

---

### Step 3: Test Authentication

**Register a new user:**
```bash
curl -X POST https://dhiva-deva-new-my-gym-2hs3.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "password": "Test@123",
    "username": "testuser"
  }'
```

**Login with that user:**
```bash
curl -X POST https://dhiva-deva-new-my-gym-2hs3.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@gmail.com",
    "password": "Test@123"
  }'
```

Should return: `{ "token": "eyJ...", "user": { "id": 1, "email": "test@gmail.com", ... } }`

---

## 📋 Checklist

- [ ] Set `POSTGRES_PRISMA_URL` on Vercel
- [ ] Set `JWT_SECRET` on Vercel
- [ ] Set `JWT_EXPIRES_IN` on Vercel
- [ ] Set `NODE_ENV=production` on Vercel
- [ ] Redeploy on Vercel
- [ ] Test `/api/db-status` → should show `"connected"`
- [ ] Test `/api/init-db` → should create tables (do this once)
- [ ] Test `/api/auth/register` → should create user
- [ ] Test `/api/auth/login` → should return token

---

## 🔗 Useful Links

- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Connection String Format](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [Deployment Logs](https://vercel.com/dashboard/projects) → Select project → Deployments → Latest deployment → Logs tab

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| 500 error on `/api/auth/login` | Database not connected (see Step 1) |
| 500 error on `/api/auth/register` | Database tables don't exist (run /api/init-db) |
| CSP frame error | Already fixed in latest commit |
| MIME type module error | Already fixed in latest commit |
| `vite: command not found` | Already fixed in latest commit |

---

## 🚀 After Environment Variables Are Set

1. Go to Vercel Dashboard
2. Find your project: "DhivaDevaNewMyGym"
3. Click "Settings" → "Environment Variables"
4. Add all variables from section "🚨 Critical"
5. Click "Redeploy" on the latest deployment
6. Wait ~2-3 minutes for build to complete
7. Test the endpoints above
