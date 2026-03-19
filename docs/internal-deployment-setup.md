# Internal Deployment Setup

## Why this setup

- The project is intended for internal and test-only use.
- The default path avoids cloud-specific dependencies.
- The system runs well as `web + Nest API + Postgres + local/shared upload storage`.

## Infrastructure baseline

1. Provision a PostgreSQL instance inside your internal environment.
2. Create a dedicated database and app user for this project.
3. Decide where uploaded files live:
   - local disk on the API host, or
   - a shared internal folder or NAS path writable by the API process.
4. Run the web app and API either:
   - on the same machine, or
   - on two internal hosts over the LAN.

## Recommended environment variables

- `DATABASE_URL`: main Postgres connection string for the Nest API runtime
- `DIRECT_URL`: direct Postgres connection string for Prisma migrations
- `JWT_SECRET`: app JWT secret for the current Nest auth flow
- `UPLOAD_DIR`: writable folder for contract documents
- `NEXT_PUBLIC_API_URL`: API base URL used by the web app
- `NEXT_PUBLIC_ENABLE_MOCK_FALLBACK`: keep `false` for normal internal use

## Local workflow

1. Fill `.env` from `.env.example`.
2. Run `cmd /c npm install`
3. Run `cmd /c npm run prisma:generate --workspace @contract/db`
4. Run `cmd /c npm run prisma:migrate --workspace @contract/db -- --name init`
5. Run `cmd /c npm run prisma:seed --workspace @contract/db`
6. Run `cmd /c npm run dev:api`
7. Run `cmd /c npm run dev:web`

## LAN deployment notes

1. Set `NEXT_PUBLIC_API_URL` to the internal API address reachable by browsers.
2. Make sure `UPLOAD_DIR` exists and is writable by the API process.
3. Keep database access limited to internal hosts only.
4. Back up both the Postgres database and the upload directory.

## Notes

- The current implementation still uses the Nest API for auth and business logic.
- Uploaded files are stored by the API on disk; they are not the primary system of record.
- Contract, partner, budget, audit, and alert data should remain in Postgres.
