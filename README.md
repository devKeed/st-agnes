# St Agnes Workspace

Monorepo workspace for:

- `backend/` (NestJS + Prisma API)
- `frontend/` (Next.js public/admin UI)

## Prerequisites

- Node.js 20+
- PostgreSQL running locally

## Environment setup

### Backend

1. Copy `backend/.env.example` to `backend/.env`
2. Set `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET`
3. Optional integrations (Google Calendar, Cloudinary, Resend) can stay empty for local development

### Frontend

1. Copy `frontend/.env.example` to `frontend/.env.local`
2. Keep `NEXT_PUBLIC_API_URL` as `http://localhost:3001/api` unless you changed backend host/port

## First-time setup

```bash
npm run install:all
cd backend
npx prisma migrate deploy
npx prisma db seed
```

## Run both apps together

From workspace root:

```bash
npm run dev
```

If you hit port-in-use errors on `3000` or `3001`:

```bash
npm run dev:reset
```

- Backend: `http://localhost:3001/api`
- Frontend: `http://localhost:3000`
- Swagger: `http://localhost:3001/api/docs`

## Build both apps

```bash
npm run build
```

## Production deployment

Use the full deployment guide here:

- [DEPLOYMENT.md](DEPLOYMENT.md)
