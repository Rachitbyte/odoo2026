# EcoSphere - Master Memory

## Project Overview
EcoSphere is a dark-themed ESG (Environmental, Social, Governance) Management Platform built using Next.js, Tailwind CSS, shadcn/ui, and Prisma with Neon PostgreSQL.

## Team & Owner Roles
- **Person 1 (Antigravity/User):** Foundation + Settings + Dashboard (Owner of settings, dashboard, seeding, and scores API).
- **Person 2:** Environmental Module (Carbon transactions, goals, product profiles, emission factors, auto calculation).
- **Person 3:** Social + Governance Modules (CSR activities, employee participations, policy acknowledgements, audits, compliance issues).
- **Person 4:** Gamification + Reports (Challenges, rewards, badges, leaderboard, custom report builder, PDF/CSV downloads).

## Technology Stack
- **Framework:** Next.js 16 (App Router)
- **React version:** React 19
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** Neon PostgreSQL via Prisma ORM 7.8
- **Charts:** Recharts
- **PDF Export:** jsPDF
- **CSV Export:** PapaParse
- **Auth:** None (Single User)

## Current Status
- Project initialized in workspace root.
- Prisma schema synced with Neon database via `npx prisma db push`.
- Database URL set in `.env`.
