# EcoSphere — Team Setup & Coordination Guide

Welcome team! The project foundation (Person 1 task) has been set up, verified, and pushed to the `main` branch. Follow these steps to clone the repo, set up your local workspace, and begin working on your respective modules (Person 2, Person 3, Person 4).

---

## 1. Local Workspace Setup

Run these commands in your terminal to clone and configure the project:

```bash
# Clone the repository
git clone https://github.com/Rachitbyte/odoo2026.git
cd odoo2026

# Install dependencies (use legacy-peer-deps for React 19 compatibility)
npm install --legacy-peer-deps
```

### Configure environment variables:
Create a `.env` file in the project root directory and add the connection string shared by Person 1:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Sync local types and run:
Generate the local Prisma Client types and start the development server:

```bash
# Generate Prisma Client
npx prisma generate

# Run the Next.js development server
npm run dev
```

The application will be running at `http://localhost:3000/dashboard`.

---

## 2. Platform Architecture & Brain Folder

We have initialized a **`brain/`** folder containing core metadata and coordination rules. **Before writing any code or prompting your AI coding assistant (Antigravity), read the files in the brain folder:**

- [master-memory.md](file:///c:/Users/Hello/OneDrive/Desktop/odoo2026/brain/master-memory.md): Stack details, roles, and module overview.
- [architecture.md](file:///c:/Users/Hello/OneDrive/Desktop/odoo2026/brain/architecture.md): List of database models and planned API routes for all modules.
- [patterns.md](file:///c:/Users/Hello/OneDrive/Desktop/odoo2026/brain/patterns.md): Reusable UI/UX guidelines (background colors, toast triggers, modal handlers).
- [decisions.md](file:///c:/Users/Hello/OneDrive/Desktop/odoo2026/brain/decisions.md): Critical database and driver configuration choices.
- [mistakes.md](file:///c:/Users/Hello/OneDrive/Desktop/odoo2026/brain/mistakes.md): Bugs we resolved during foundation setup (e.g. Prisma 7 schema requirements).

---

## 3. Critical Developer Guidelines (Read Before Starting)

1. **Database Schema:** 
   - The database schema is already live on the Neon cloud DB. **Do not modify `prisma/schema.prisma` without syncing with the team first.**
   - In Prisma 7, the `url` property is removed from `schema.prisma` and handled in `prisma.config.ts`. Run `npx prisma db push` only if schema changes are agreed upon.

2. **Database Driver Adapter:**
   - To prevent local WebSocket cold-start timeouts (which took minutes to load), we configured the Native PostgreSQL `pg` Pool adapter (`@prisma/adapter-pg`) in `lib/prisma.ts`.
   - Always import and use the shared client instance: `import { prisma } from "@/lib/prisma"`. Do not instantiate `new PrismaClient()` directly in your routes.

3. **Seeding:**
   - The seed logic is fully automated. If your database tables are empty, navigate to `/settings`, select the **ESG Configuration** tab, and click **Seed Database** to populate mock departments, categories, default configuration parameters, scores, emission factors, and badges.

4. **Next.js 16/15 Route Handler Parameters:**
   - In the Next.js version in use, dynamic route parameters are Promises. When implementing route handlers, you must `await` params. Example:
     ```typescript
     export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
       const { id } = await params;
       // ...
     }
     ```

5. **Branching Strategy:**
   - Branch off `main` for your respective modules:
     - Person 2: `environmental-module`
     - Person 3: `social-governance-module`
     - Person 4: `gamification-reports`
