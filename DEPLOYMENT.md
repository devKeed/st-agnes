# St Agnes Deployment Guide

This guide deploys:
- `frontend/` to **Vercel**
- `backend/` to **Render**
- PostgreSQL on **Render Postgres** (or any managed Postgres)

## Production profile (not test)

Use these minimum tiers for real users:
- Render Web Service: **Starter or higher** (avoid sleep/cold starts)
- Render PostgreSQL: **Starter or higher** (persistent + backups)
- Vercel: **Pro recommended** for production traffic and team controls

Do not use free-tier database for long-term production.

## 1) Create production database

Create a managed PostgreSQL database and copy the connection string.

Required backend variable:
- `DATABASE_URL=postgresql://...`

## 2) Deploy backend (Render)

Create a new **Web Service** from this repo with:
- **Root Directory**: `backend`
- **Build Command**: `npm ci && npx prisma generate && npm run build`
- **Start Command**: `npx prisma migrate deploy && npm run start:prod`

Set environment variables in Render:

### Required
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `PORT=3001`
- `TIMEZONE=Africa/Lagos`

### Required for CORS/frontend
- `FRONTEND_URL=https://<your-vercel-domain>`

### Optional integrations
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI=https://<your-backend-domain>/api/calendar/callback`
- `GOOGLE_CALENDAR_ID`
- `GOOGLE_OAUTH_STATE_SECRET`
- `GOOGLE_ADD_CLIENT_AS_ATTENDEE=false`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM=St Agnes <bookings@your-domain.com>`

### Seed admin (optional)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`

After first successful deploy, run seed once (Render Shell):

```bash
npx prisma db seed
```

## 3) Deploy frontend (Vercel)

Import the same repo in Vercel with:
- **Root Directory**: `frontend`
- Framework preset: Next.js

Set environment variable:
- `NEXT_PUBLIC_API_URL=https://<your-backend-domain>/api`

Deploy.

## 4) Connect frontend URL to backend CORS

Once Vercel gives your final production URL, update backend variable:
- `FRONTEND_URL=https://<your-production-frontend-domain>`

Redeploy backend.

## 5) Smoke tests

Backend:
- `GET https://<backend-domain>/api/docs`

Frontend:
- Open home page
- Submit a booking
- Login to admin
- Verify uploads (if Cloudinary configured)

## 6) Custom domains (optional)

- Point frontend domain to Vercel
- Point backend API domain to Render
- Update:
  - `NEXT_PUBLIC_API_URL`
  - `FRONTEND_URL`
  - `GOOGLE_REDIRECT_URI` (if calendar OAuth is enabled)

## Notes

- Backend already reads `PORT` and enables CORS from `FRONTEND_URL`.
- Frontend already reads `NEXT_PUBLIC_API_URL`.
- Build has been validated locally with `npm run build` from repository root.

## Go-live hardening checklist

- [ ] Use strong, unique secrets for `JWT_SECRET`, `JWT_REFRESH_SECRET`, and (if used) `GOOGLE_OAUTH_STATE_SECRET`
- [ ] Set `FRONTEND_URL` to only your real production domain (no wildcard)
- [ ] Set custom domains for frontend and backend
- [ ] Enable TLS/HTTPS (default on Render + Vercel)
- [ ] Configure database backups and confirm restore process
- [ ] Seed admin once, then rotate `ADMIN_PASSWORD` to a long unique value
- [ ] If Swagger should be private, restrict access at edge/network level
- [ ] Validate booking flow, admin login, email delivery, and uploads in production domain
