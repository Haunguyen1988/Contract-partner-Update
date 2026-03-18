# Supabase + Vercel Setup

## Why this setup

- The project no longer depends on local Docker for PostgreSQL.
- Supabase provides hosted Postgres for Prisma migrations, seed data, and application queries.
- Vercel is the target platform for the Next.js webapp once the UI is approved.

## Supabase database setup

1. Create a Supabase project.
2. In SQL Editor, create a dedicated `prisma` database user with privileges for the `public` schema.
3. From the Supabase `Connect` panel, copy:
   - The transaction pooler string on port `6543` for `DATABASE_URL`
   - The session/direct string on port `5432` for `DIRECT_URL`
4. Keep runtime traffic on the pooled connection and schema changes on the direct connection.

## Recommended environment variables

- `DATABASE_URL`: Supabase pooled runtime string with `pgbouncer=true&connection_limit=1`
- `DIRECT_URL`: Supabase direct/session string for Prisma migrations
- `JWT_SECRET`: app JWT secret for current Nest auth flow
- `NEXT_PUBLIC_API_URL`: API base URL used by the webapp
- `NEXT_PUBLIC_SUPABASE_URL`: reserved for later direct Supabase SSR integration
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: reserved for later direct Supabase SSR integration

## Local workflow

1. Fill `.env` from `.env.example`.
2. Run `cmd /c npm install`
3. Run `cmd /c npm run prisma:generate --workspace @contract/db`
4. Run `cmd /c npm run prisma:migrate --workspace @contract/db -- --name init`
5. Run `cmd /c npm run prisma:seed --workspace @contract/db`
6. Run `cmd /c npm run dev:api`
7. Run `cmd /c npm run dev:web`

## Vercel workflow for the webapp

1. Import the repository into Vercel.
2. Add the required environment variables in Project Settings.
3. Use `vercel env pull` if you want the Development variables copied down locally.
4. Redeploy after every environment variable change.

## Notes

- The current implementation still uses the Nest API for auth and business logic.
- This means Vercel hosts the webapp first, while the API can remain on another Node host until we decide whether to migrate the backend into serverless route handlers or keep the split architecture.
