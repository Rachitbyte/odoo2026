# EcoSphere - Design Decisions

## Next.js Project Structure
- Next.js application initialized directly in the root of `odoo2026` rather than in a subdirectory. This allows other team members to clone the repository and run dependencies directly from the repo root.
- The `src/` directory option was disabled for ease of directory structure consistency (all folders like `app`, `components`, `lib`, and `prisma` live in the root).

## Database Configuration (Prisma 7)
- Prisma 7 does not support `url` configuration directly in `schema.prisma`. Database URLs are configured using `prisma.config.ts`, reading from `process.env.DATABASE_URL`.
- The database sync uses `npx prisma db push` during development to dynamically map and evolve schemas on Neon.

## Native PostgreSQL pg Driver
- We selected the native `@prisma/adapter-pg` and standard `pg` Pool for the database adapter instead of Neon's serverless WebSocket pooler. Local development execution over WebSocket tunneling can be extremely slow and prone to firewalls/delays. Standard TCP socket pooling via `pg` solves local development timeouts and operates with instant query performance.
