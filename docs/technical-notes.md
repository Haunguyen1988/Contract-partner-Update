# Technical Notes

- API prefix: `/api`
- Auth: internal JWT login backed by Prisma user records
- Database: Prisma on Supabase Postgres using session pooler (`5432`) for current local/Node runtime and migrations
- Future serverless option: use transaction pooler (`6543`) only when the backend itself becomes serverless or auto-scaling
- Storage: local disk for dev via `UPLOAD_DIR`, abstractable for object storage later
- Scheduler: daily contract expiry alert sync at `01:00`
- Deployment direction: web on Vercel, database on Supabase, API can stay as a separate Node service until we later collapse or migrate it
- Data model is prepared for later extension into approvals, deliverables, acceptance, payment, and richer reporting
