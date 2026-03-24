# PR COR Partner Contract Admin

Starter workspace for an internal PR COR partner contract management app.

This setup adds two standalone services at the repository root:

- `frontend/`: Next.js 14 App Router + Tailwind CSS + shadcn/ui-style component setup
- `backend/`: FastAPI + Supabase-ready API

Existing folders under `apps/`, `packages/`, and other legacy paths were left untouched.

## Tech Stack

- Frontend: Next.js 14, App Router, Tailwind CSS, shadcn/ui configuration
- Backend: Python FastAPI
- Database: Existing Supabase project
- Deploy: Vercel for frontend, Railway for backend

## Folder Structure

```text
frontend/
  app/
    budgets/
    contracts/
    partners/
    payments/
    profiles/
    globals.css
    layout.tsx
    page.tsx
  components/
    ui/
  lib/
  .env.example
  components.json
  next.config.mjs
  package.json
  tailwind.config.ts

backend/
  app/
    api/
      routes/
    core/
    schemas/
    services/
    main.py
  .env.example
  requirements.txt
```

## Environment Setup

### Frontend

Copy `frontend/.env.example` to `frontend/.env.local` and fill in:

```bash
NEXT_PUBLIC_APP_NAME=PR COR Contract Admin
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are optional in the current starter.
They are included so the frontend can later add direct Supabase auth or storage usage if needed.

### Backend

Copy `backend/.env.example` to `backend/.env` and fill in:

```bash
APP_NAME=PR COR Partner Contract API
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000
API_V1_PREFIX=/api/v1
FRONTEND_ORIGIN=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

Use `SUPABASE_SERVICE_ROLE_KEY` for the backend whenever possible.

## Install And Run

### Frontend

```bash
cd frontend
npm install
npm run dev
```

If PowerShell blocks `npm`, use:

```bash
npm.cmd install
npm.cmd run dev
```

Frontend runs at [http://localhost:3000](http://localhost:3000).

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at [http://localhost:8000](http://localhost:8000).
Swagger docs are available at [http://localhost:8000/docs](http://localhost:8000/docs).

## Available API Endpoints

- `GET /api/v1/health`
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/profiles`
- `GET /api/v1/partners`
- `GET /api/v1/contracts`
- `GET /api/v1/payments`
- `GET /api/v1/budget_allocations`

The backend reads directly from the existing Supabase tables:

- `profiles`
- `partners`
- `contracts`
- `payments`
- `budget_allocations`

## Deployment Notes

### Vercel

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output: default Next.js output
- Required env:
  - `NEXT_PUBLIC_API_BASE_URL`

### Railway

- Root Directory: `backend`
- Start Command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

- Required env:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `FRONTEND_ORIGIN`

## Current Starter Scope

- Dashboard summary from Supabase table counts
- Generic data preview pages for profiles, partners, contracts, payments, and budget allocations
- FastAPI routes that stay bootable even before real env values are filled in
- Clean separation for Vercel frontend and Railway backend deployment

## Suggested Next Steps

1. Add auth and role mapping against `profiles`.
2. Lock down table schemas and replace generic preview tables with typed views/forms.
3. Add create/update/delete flows for partners, contracts, and payments.
4. Add document upload, approval workflow, and audit log.
