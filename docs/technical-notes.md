# Technical Notes

- API prefix: `/api`
- Auth: internal JWT login backed by Prisma user records
- Database: Prisma on self-hosted or internally managed Postgres
- Storage: local disk or shared internal storage via `UPLOAD_DIR`
- Scheduler: daily contract expiry alert sync at `01:00`
- Deployment direction: internal-only web + API, either on one host or over the local network
- Data model is prepared for later extension into approvals, deliverables, acceptance, payment, and richer reporting
