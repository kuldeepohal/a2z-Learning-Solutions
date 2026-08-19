# A2Z Learning Solutions — Production Backend

Fastify + PostgreSQL API for persistent student accounts, chapter progress, assessments, analytics and monetization.

## Run locally

```bash
cd backend
npm install
createdb a2z_learning
psql "$DATABASE_URL" -f db/schema.sql
cp .env.example .env
npm run dev
```

Health check: `GET /health`

## Core API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/chapters?grade=6`
- `GET /api/chapters/:id`
- `POST /api/progress`
- `GET /api/dashboard`
- `POST /api/assessments/submit`
- `GET /api/analytics/overview`
- `GET /api/analytics/chapter/:id`
- `GET /api/admin/revenue`

## Production payment integration

Keep Razorpay secrets server-side. The existing website payment endpoints should be migrated so successful Razorpay captures create an idempotent `payments` record, linked to the authenticated student/subscription. Never trust client-supplied amount or plan values; resolve price from a server-side plan table before creating an order.

## Security

JWT authentication, password hashing with bcrypt, CORS, rate limiting, parameterized PostgreSQL queries, and environment-based secrets are included in the foundation.
