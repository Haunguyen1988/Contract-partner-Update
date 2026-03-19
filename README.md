# Contract Management App MVP

Monorepo for the internal PR COR contract management MVP defined by the BRD and implementation plan.

## Workspace structure

- `apps/web`: Next.js internal web UI
- `apps/api`: NestJS API and scheduler
- `packages/core`: reusable server-side domain services for internal backends
- `packages/db`: Prisma schema, seed, and database exports
- `packages/shared`: shared domain enums, types, validation schemas, and helpers
- `packages/ui`: reusable React UI primitives
- `templates`: CSV import templates for legacy migration
- `docs`: user guide, rollout checklist, and deployment notes

## Core MVP scope

- Internal authentication and role-based access control
- Partner management with duplicate checking and owner assignment
- Contract registry with document upload and activation validation
- Budget allocation and overrun policy control
- Expiry alerts and dashboards
- Audit logging and CSV validation for migration

## Quick start

1. Copy `.env.example` to `.env`.
2. Provision an internal PostgreSQL database and a dedicated app user.
3. Put the internal Postgres connection string into both `DATABASE_URL` and `DIRECT_URL`.
4. Install dependencies: `cmd /c npm install`
5. Generate Prisma client: `cmd /c npm run prisma:generate --workspace @contract/db`
6. Run migrations: `cmd /c npm run prisma:migrate --workspace @contract/db -- --name init`
7. Seed demo data: `cmd /c npm run prisma:seed --workspace @contract/db`
8. Start the API: `cmd /c npm run dev:api`
9. Start the web app: `cmd /c npm run dev:web`

No cloud service is required for the default internal deployment path.
Use `UPLOAD_DIR` for local disk or a shared internal folder that the API process can write to.
The web app prefers live API data by default. Keep `NEXT_PUBLIC_ENABLE_MOCK_FALLBACK="false"` for normal work, and only enable it if you intentionally want UI demo data while the API is offline.

## Default demo accounts

- `admin@prcor.local` / `Admin@123`
- `manager@prcor.local` / `Manager@123`
- `staff@prcor.local` / `Staff@123`

## Notes

- Currency is `VND`.
- Dates are handled in Vietnam business format.
- Database hosting target is self-hosted or internally managed Postgres.
- Notifications are in-app only for MVP.
- Deployment target is internal-only: same machine or LAN-hosted web + API.
- Phase 2 workflow, deliverables, acceptance, payment operations, and ERP integrations are intentionally excluded from this code path.
- Setup guidance for internal deployment lives in `docs/internal-deployment-setup.md`.
