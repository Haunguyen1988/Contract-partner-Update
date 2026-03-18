# Contract Management App MVP

Monorepo for the internal PR COR contract management MVP defined by the BRD and implementation plan.

## Workspace structure

- `apps/web`: Next.js Vietnamese-first internal web UI
- `apps/api`: NestJS API and scheduler
- `packages/db`: Prisma schema, seed, and database exports
- `packages/shared`: shared domain enums, types, validation schemas, and helpers
- `packages/ui`: reusable React UI primitives
- `templates`: CSV import templates for legacy migration
- `docs`: MVP user guide, rollout checklist, and technical notes

## Core MVP scope

- Internal authentication and role-based access control
- Partner management with duplicate checking and owner assignment
- Contract registry with document upload and activation validation
- Budget allocation and overrun policy control
- Expiry alerts and dashboards
- Audit logging and CSV validation for migration

## Quick start

1. Copy `.env.example` to `.env`.
2. Create a Supabase project and a dedicated `prisma` DB user.
3. Put the Supabase session pooler string (`5432`) into both `DATABASE_URL` and `DIRECT_URL` for local development.
4. Install dependencies: `cmd /c npm install`
5. Generate Prisma client: `cmd /c npm run prisma:generate --workspace @contract/db`
6. Run migrations against Supabase: `cmd /c npm run prisma:migrate --workspace @contract/db -- --name init`
7. Seed demo data into Supabase: `cmd /c npm run prisma:seed --workspace @contract/db`
8. Start the API: `cmd /c npm run dev:api`
9. Start the web app: `cmd /c npm run dev:web`

No Docker is required for the default development path anymore.
For a future serverless backend, switch runtime `DATABASE_URL` to the transaction pooler on `6543`.
The web app now prefers live API data by default. Keep `NEXT_PUBLIC_ENABLE_MOCK_FALLBACK="false"` for normal work, and only enable it if you intentionally want UI demo data while the API is offline.

## Default demo accounts

- `admin@prcor.local` / `Admin@123`
- `manager@prcor.local` / `Manager@123`
- `staff@prcor.local` / `Staff@123`

## Notes

- Currency is `VND`.
- Dates are handled in Vietnam business format.
- Database hosting target is Supabase Postgres.
- Notifications are in-app only for MVP.
- Web deployment target is Vercel once the webapp is accepted.
- Phase 2 workflow, deliverables, acceptance, payment operations, and ERP integrations are intentionally excluded from this code path.
- Setup guidance for Supabase and Vercel lives in `docs/supabase-vercel-setup.md`.
