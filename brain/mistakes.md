# EcoSphere - Mistakes & Bug Resolutions

## 1. Toast component deprecated
- **Bug**: `npx shadcn@latest add toast` failed because the toast component is deprecated.
- **Fix**: Replaced it with the `sonner` package, which is shadcn's recommended alternative.

## 2. Prisma 7 schema validation failure (P1012)
- **Bug**: Running `npx prisma db push` threw P1012 error indicating `url` is no longer supported in `schema.prisma` files.
- **Fix**: Removed `url = env("DATABASE_URL")` from the datasource block in `schema.prisma` and verified that Prisma 7 reads database config from `prisma.config.ts`.

## 3. Neon serverless WebSocket connection timeouts
- **Bug**: Using `@neondatabase/serverless` WebSocket Pool driver adapter locally in Node.js resulted in severe connection delays (taking minutes) and API load timeouts (500 errors).
- **Fix**: Replaced `@neondatabase/serverless` with `@prisma/adapter-pg` and native `pg` Pool driver. This connects directly via standard TCP, resolving the local execution timeouts instantly.
