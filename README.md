# St Agnes – Production-Ready Booking Platform

Monorepo with:
- NestJS API (backend-first architecture)
- Next.js App Router web app (SEO-friendly pages + functional admin UI)

## 1) Tech Stack

- Backend: Node.js + NestJS + Prisma + PostgreSQL
- Frontend: Next.js (App Router, SSR-ready)
- Integrations: Google Calendar API, Resend email

## 2) Monorepo Structure

- apps/api
- apps/web
- packages/shared-types

## 3) Backend Highlights

- Clean layering: `controller -> service -> repository`
- Admin auth: email/password + JWT
- Booking domain supports:
	- multi-item rentals (`booking_items`)
	- max 5 rental items per booking
	- all-or-nothing rental availability checks
	- transactional locking checks for booking + item conflicts
	- UTC persistence with business timezone support
- Legal versioning:
	- Terms and Privacy versioned independently
	- booking stores accepted `terms_version_id` and `privacy_version_id`
- Self-service flows:
	- secure single-use token
	- token valid until appointment start time
	- reschedule/cancel blocked when `<= 24h` before appointment

## 4) Frontend Highlights

- SSR/SEO routes: home, rentals, terms, privacy
- Functional booking flow UI:
	- select up to 5 rentals
	- fetch availability
	- submit booking with dual legal acceptance
- Booking management page for cancel/reschedule by secure token link
- Admin pages:
	- login
	- booking list
	- publish new Terms/Privacy versions

## 5) Local Setup

1. Install dependencies:
	 - `npm install`
2. Copy env files:
	 - `apps/api/.env.example` -> `apps/api/.env`
	 - `apps/web/.env.example` -> `apps/web/.env.local`
3. Generate Prisma client:
	 - `npm run -w api db:generate`
4. Apply migrations:
	 - `npm run -w api db:migrate`
5. Start both apps:
	 - `npm run dev`

## 6) Build and Test

- API build: `npm run -w api build`
- Web build: `npm run -w web build`
- API tests: `npm run -w api test -- --runInBand`

## 7) Deployment

- Frontend: Vercel (`apps/web`)
- Backend: Railway (`apps/api`)
- Database: Neon or Railway PostgreSQL

Environment variables must be configured per environment (dev/staging/prod), especially:
- `DATABASE_URL`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

## 8) Current Status

Backend core, booking correctness rules, legal versioning, calendar/email integration hooks, functional UI, and baseline tests are implemented.