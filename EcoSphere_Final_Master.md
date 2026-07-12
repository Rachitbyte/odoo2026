# EcoSphere — Final Master Build File
### 4 People | 7 Hours | One Repo | Read Everything Before Starting

---

## STACK (LOCKED — NO DISCUSSION)

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Neon (PostgreSQL via Prisma ORM) |
| Charts | Recharts |
| PDF Export | jsPDF |
| CSV Export | papaparse |
| Auth | None (skip for now, single user) |
| Deployment | Local only |

**Why this stack:** Works on Mac and Windows. One codebase. Neon is a free cloud PostgreSQL database — no local DB server to install on anyone's machine. Everyone connects to the same Neon DB via a connection string. Person 1 creates the Neon project and shares the URL with the team.

---

## FIRST 30 MINUTES — ALL 4 PEOPLE DO THIS TOGETHER

Person 1 runs these commands. Everyone else watches and then clones.

**Person 1 does this first (before anyone else starts):**

Step 1 — Create the Neon database:
- Go to https://neon.tech and sign up (free)
- Create a new project called "ecosphere"
- Copy the connection string — it looks like: `postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`
- Share this string in the group chat. Everyone needs it.

Step 2 — Set up the repo:
```bash
npx create-next-app@latest ecosphere --typescript --tailwind --app
cd ecosphere
npx shadcn@latest init
npx shadcn@latest add button card table badge dialog tabs toast
npm install prisma @prisma/client recharts jspdf papaparse lucide-react
npx prisma init --datasource-provider postgresql
```

Step 3 — Add the Neon connection string:
Create a `.env` file in the root and add:
```
DATABASE_URL="paste-the-neon-connection-string-here"
```

Step 4 — Push the schema and seed, then push to GitHub:
```bash
npx prisma db push
```

Then create the brain folder, commit everything, and push to GitHub.

**Everyone else clones the repo and runs:**
```bash
git clone [repo-url]
cd ecosphere
npm install
```

Create your own `.env` file in the root with the same Neon connection string Person 1 shared:
```
DATABASE_URL="paste-the-neon-connection-string-here"
```

Then run:
```bash
npx prisma generate
npm run dev
```

If it opens at `localhost:3000` — you're ready. Start your work.

⚠️ Never commit the `.env` file to GitHub. Person 1 must add `.env` to `.gitignore` before the first push.

---

## DATABASE SCHEMA — Person 1 pastes this into `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Department {
  id             Int          @id @default(autoincrement())
  name           String
  code           String       @unique
  head           String
  parentDeptId   Int?
  parentDept     Department?  @relation("DeptParent", fields: [parentDeptId], references: [id])
  children       Department[] @relation("DeptParent")
  employeeCount  Int          @default(0)
  status         String       @default("Active")
  createdAt      DateTime     @default(now())

  carbonTransactions  CarbonTransaction[]
  environmentalGoals  EnvironmentalGoal[]
  csrActivities       CSRActivity[]
  audits              Audit[]
  departmentScores    DepartmentScore[]
  policies            ESGPolicy[]
  productProfiles     ProductESGProfile[]
}

model Category {
  id        Int      @id @default(autoincrement())
  name      String
  type      String   // CSR_ACTIVITY or CHALLENGE
  status    String   @default("Active")
  createdAt DateTime @default(now())

  csrActivities CSRActivity[]
  challenges    Challenge[]
}

model EmissionFactor {
  id          Int      @id @default(autoincrement())
  name        String
  source      String   // Purchase | Manufacturing | Expense | Fleet
  factorValue Float
  unit        String
  createdAt   DateTime @default(now())

  carbonTransactions CarbonTransaction[]
}

model ProductESGProfile {
  id             Int        @id @default(autoincrement())
  productName    String
  productCode    String
  deptId         Int
  dept           Department @relation(fields: [deptId], references: [id])
  carbonFootprint Float     @default(0)
  recyclable     Boolean    @default(false)
  notes          String?
  createdAt      DateTime   @default(now())
}

model EnvironmentalGoal {
  id         Int        @id @default(autoincrement())
  name       String
  deptId     Int
  dept       Department @relation(fields: [deptId], references: [id])
  targetCo2  Float
  currentCo2 Float      @default(0)
  deadline   DateTime
  status     String     @default("Active")
  createdAt  DateTime   @default(now())
}

model ESGPolicy {
  id            Int      @id @default(autoincrement())
  title         String
  description   String
  version       String
  effectiveDate DateTime
  deptId        Int?
  dept          Department? @relation(fields: [deptId], references: [id])
  status        String   @default("Active")
  createdAt     DateTime @default(now())

  acknowledgements PolicyAcknowledgement[]
}

model Badge {
  id          Int      @id @default(autoincrement())
  name        String
  description String
  unlockRule  String
  icon        String   @default("🏆")
  createdAt   DateTime @default(now())
}

model Reward {
  id             Int      @id @default(autoincrement())
  name           String
  description    String
  pointsRequired Int
  stock          Int      @default(0)
  status         String   @default("Active")
  createdAt      DateTime @default(now())
}

model CarbonTransaction {
  id               Int            @id @default(autoincrement())
  source           String
  refId            String?
  deptId           Int
  dept             Department     @relation(fields: [deptId], references: [id])
  emissionFactorId Int
  emissionFactor   EmissionFactor @relation(fields: [emissionFactorId], references: [id])
  quantity         Float
  co2Amount        Float
  transactionDate  DateTime
  createdAt        DateTime       @default(now())
}

model CSRActivity {
  id          Int        @id @default(autoincrement())
  title       String
  categoryId  Int
  category    Category   @relation(fields: [categoryId], references: [id])
  description String?
  deptId      Int
  dept        Department @relation(fields: [deptId], references: [id])
  date        DateTime
  open        Boolean    @default(true)
  createdAt   DateTime   @default(now())

  participations EmployeeParticipation[]
}

model EmployeeParticipation {
  id             Int         @id @default(autoincrement())
  employeeName   String
  activityId     Int
  activity       CSRActivity @relation(fields: [activityId], references: [id])
  proofUrl       String?
  approvalStatus String      @default("Pending")
  pointsEarned   Int         @default(0)
  completionDate DateTime?
  createdAt      DateTime    @default(now())
}

model Challenge {
  id               Int      @id @default(autoincrement())
  title            String
  categoryId       Int
  category         Category @relation(fields: [categoryId], references: [id])
  description      String?
  xp               Int      @default(100)
  difficulty       String   @default("Medium")
  evidenceRequired Boolean  @default(false)
  deadline         DateTime
  status           String   @default("Draft")
  createdAt        DateTime @default(now())

  participations ChallengeParticipation[]
}

model ChallengeParticipation {
  id             Int       @id @default(autoincrement())
  challengeId    Int
  challenge      Challenge @relation(fields: [challengeId], references: [id])
  employeeName   String
  progress       Int       @default(0)
  proofUrl       String?
  approvalStatus String    @default("Pending")
  xpAwarded      Int       @default(0)
  createdAt      DateTime  @default(now())
}

model PolicyAcknowledgement {
  id             Int       @id @default(autoincrement())
  policyId       Int
  policy         ESGPolicy @relation(fields: [policyId], references: [id])
  employeeName   String
  acknowledgedAt DateTime  @default(now())
  createdAt      DateTime  @default(now())
}

model Audit {
  id        Int        @id @default(autoincrement())
  title     String
  deptId    Int
  dept      Department @relation(fields: [deptId], references: [id])
  auditor   String
  date      DateTime
  findings  String?
  status    String     @default("Planned")
  createdAt DateTime   @default(now())

  complianceIssues ComplianceIssue[]
}

model ComplianceIssue {
  id          Int      @id @default(autoincrement())
  auditId     Int
  audit       Audit    @relation(fields: [auditId], references: [id])
  severity    String
  description String
  owner       String
  dueDate     DateTime
  status      String   @default("Open")
  createdAt   DateTime @default(now())
}

model DepartmentScore {
  id                 Int        @id @default(autoincrement())
  deptId             Int
  dept               Department @relation(fields: [deptId], references: [id])
  environmentalScore Float      @default(0)
  socialScore        Float      @default(0)
  governanceScore    Float      @default(0)
  totalScore         Float      @default(0)
  calculatedAt       DateTime   @default(now())
}

model ESGConfig {
  id                  Int     @id @default(autoincrement())
  autoEmissionCalc    Boolean @default(false)
  requireCsrEvidence  Boolean @default(false)
  autoBadgeAward      Boolean @default(false)
  emailAlerts         Boolean @default(false)
  envWeight           Float   @default(0.4)
  socialWeight        Float   @default(0.3)
  govWeight           Float   @default(0.3)
}
```

After creating this file run:
```bash
npx prisma db push
```

Then create `prisma/seed.ts` and run the seed (see Section 9 for seed data).

---

## BRAIN FOLDER — Person 1 creates this immediately after schema

```
brain/
├── master-memory.md
├── architecture.md
├── patterns.md
├── decisions.md
└── mistakes.md
```

**`master-memory.md`** — What the app is, who owns which module, current stack.
**`architecture.md`** — All DB models, all API routes. Update as new routes are added.
**`patterns.md`** — Reusable code patterns (modals, approval queues, score calc). Update after each reusable piece.
**`decisions.md`** — Why you made non-obvious choices. Update every time.
**`mistakes.md`** — Every bug and how you fixed it. Check here before asking AI to debug.

**Rule for everyone:** Before giving a new prompt to Antigravity, paste the relevant brain file contents at the top of your prompt so the AI has full context.

---

## DESIGN SYSTEM (all 4 people follow this exactly)

```
Background:      #0D0D0D
Surface cards:   #1A1A1A
Borders:         #2A2A2A
Text primary:    #FFFFFF
Text secondary:  #9CA3AF

Module colors:
  Environmental: #22C55E (green)
  Social:        #F97316 (orange)
  Governance:    #3B82F6 (blue)
  Gamification:  #A855F7 (purple)
  Reports:       #06B6D4 (cyan)

Status chip colors:
  Active:        green pill
  Draft:         gray pill
  Under Review:  amber pill
  Completed:     blue pill
  Archived:      dark gray pill
  Pending:       yellow pill
  Approved:      green pill
  Rejected:      red pill
  High severity: red pill
  Medium:        amber pill
  Low:           gray pill

Font: Inter (default Next.js font)
All forms: open in shadcn Dialog (modal), never inline
Delete: always show confirmation dialog first
Success/Error: shadcn Toast notifications
Empty states: icon + message + CTA button
Tables: dark rows, white text, green hover highlight
```

---

## PERSON 1 — Foundation + Settings + Dashboard

**You are the critical path. No one else can start backend work until your schema is live on GitHub.**

### Timeline
- 0:00–0:45 → Repo setup + schema + migration + brain folder + push to GitHub
- 0:45–1:45 → Sidebar navigation + Settings module (Departments + Categories + ESG Config)
- 1:45–3:00 → Dashboard page (score cards + charts + recent activity + quick actions)
- 3:00–4:30 → Score calculation API + wire dashboard to real data
- 4:30–5:30 → Seed script with realistic data
- 5:30–6:30 → Help team with blockers + fix dashboard bugs
- 6:30–7:00 → Demo prep

### Antigravity Prompt — Copy and paste this exactly

```
You are building EcoSphere, a dark-themed ESG Management Platform using Next.js 14 App Router, Tailwind CSS, shadcn/ui, Prisma with Neon (PostgreSQL), and Recharts.
The database is Neon (cloud PostgreSQL). The DATABASE_URL is already set in the .env file. Do not change the datasource provider.

DESIGN SYSTEM:
- Background: #0D0D0D, Surface cards: #1A1A1A, Borders: #2A2A2A
- Text: white primary, #9CA3AF secondary
- Font: Inter
- All forms in shadcn Dialog modals
- Status chips as colored pill badges
- Dark tables with hover highlight

The Prisma schema is already set up. Models available: Department, Category, EmissionFactor, ProductESGProfile, EnvironmentalGoal, ESGPolicy, Badge, Reward, CarbonTransaction, CSRActivity, EmployeeParticipation, Challenge, ChallengeParticipation, PolicyAcknowledgement, Audit, ComplianceIssue, DepartmentScore, ESGConfig.

BUILD TASK 1 — SIDEBAR NAVIGATION:
Create a fixed left sidebar at app/components/Sidebar.tsx with these navigation items and their routes:
- Dashboard → /dashboard (icon: LayoutDashboard)
- Environmental → /environmental (icon: Leaf) with sub-items: Emission Factors, Product ESG Profile, Environmental Goals, Carbon Transactions
- Social → /social (icon: Users)
- Governance → /governance (icon: Shield)
- Gamification → /gamification (icon: Trophy)
- Reports → /reports (icon: BarChart2)
- Settings → /settings (icon: Settings)
Use lucide-react icons. Active item highlighted in green #22C55E. Sidebar background #111111.

BUILD TASK 2 — SETTINGS PAGE (/settings):
4 tabs using shadcn Tabs: Departments | Categories | ESG Configuration | Notification Settings

Departments tab:
- Table columns: Name | Code | Head | Parent Dept | Employees | Status (chip)
- Buttons: + New Department (green), Edit (per row), Delete (per row, with confirmation dialog)
- New/Edit modal fields: Name, Code, Head, Parent Department (dropdown of existing depts), Employee Count, Status (Active/Inactive)
- API routes: GET /api/departments, POST /api/departments, PUT /api/departments/[id], DELETE /api/departments/[id]

Categories tab:
- Table: Name | Type | Status
- CRUD same pattern as Departments
- Type dropdown: CSR_ACTIVITY or CHALLENGE
- API: GET /api/categories, POST, PUT, DELETE

ESG Configuration tab:
- 4 toggle switches with labels and descriptions:
  1. "Enable auto emission calculation" — "Carbon transactions are calculated automatically from operations"
  2. "Require evidence for all CSR activities" — "Participation cannot be approved without a proof file"
  3. "Auto-award badges on challenge completion" — "Badges assigned automatically when unlock rule is met"
  4. "Email alerts for new compliance issues" — "Send email when a new compliance issue is raised"
- On toggle change, call PUT /api/esg-config to save the value
- API: GET /api/esg-config, PUT /api/esg-config

Notification Settings tab:
- Just show a card: "Notification settings coming soon" with a bell icon

BUILD TASK 3 — DASHBOARD PAGE (/dashboard):
Top row — 4 score cards in a grid:
- Environmental Score: green border, shows score/100
- Social Score: orange border, shows score/100
- Governance Score: blue border, shows score/100
- Overall ESG Score: purple border, shows score/100
Fetch from GET /api/scores

Second row — two charts side by side:
- Left: "Emissions Trend (12 mo)" — Recharts LineChart, green line, dark background
- Right: "Department ESG Ranking" — Recharts BarChart, bars colored by dept, dark background
Fetch from GET /api/emissions-trend and GET /api/department-scores

Third row — two columns:
- Left: "Recent Activity" — list of last 5 events (colored bullet points)
- Right: "Quick Actions" — 3 buttons: "Log Carbon Data" (green, links to /environmental/carbon-transactions), "Start Challenge" (orange, links to /gamification/challenges), "View Reports" (outlined, links to /reports)
Fetch recent activity from GET /api/recent-activity

BUILD TASK 4 — SCORE CALCULATION API:
Create GET /api/scores that:
1. Fetches all DepartmentScore records
2. Fetches ESGConfig for weights (default env=0.4, social=0.3, gov=0.3)
3. For each dept: totalScore = (envScore × envWeight) + (socialScore × socialWeight) + (govScore × govWeight)
4. Overall ESG score = average of all dept totalScores
5. Returns: { overallScore, envScore, socialScore, govScore, departmentScores: [{deptName, totalScore}] }

BUILD TASK 5 — SEED API:
Create GET /api/seed that when called, inserts this data if tables are empty:
Departments: Manufacturing (MFC, head: S. Nair, 134 employees), Logistics (LOG, head: R. Iyer, 58 employees, parent: Manufacturing), Corporate (COR, head: A. Mehta, 41 employees)
Categories: Tree Plantation (CSR_ACTIVITY), Blood Donation (CSR_ACTIVITY), Beach Cleanup (CSR_ACTIVITY), ESG Workshop (CSR_ACTIVITY), Sustainability Sprint (CHALLENGE), Recycle Challenge (CHALLENGE), Commute Green (CHALLENGE)
ESGConfig: one row with all defaults
DepartmentScores: Manufacturing (env:75, social:80, gov:70), Logistics (env:60, social:88, gov:82), Corporate (env:82, social:74, gov:88)
EmissionFactors: Diesel Fleet (Fleet, 2.68, kg CO2/L), Grid Electricity (Manufacturing, 0.82, kg CO2/kWh), Air Travel (Expense, 0.255, kg CO2/km)
Badges: Green Beginner (unlockRule: "XP >= 100", icon: 🌱), Carbon Saver (unlockRule: "XP >= 500", icon: ♻️), Sustainability Champion (unlockRule: "Completed Challenges >= 3", icon: 🏆), Team Player (unlockRule: "CSR Activities >= 2", icon: 🤝)

Build each task one at a time. Show me the result after each task before moving to the next.
```

### Brain folder — update after each task
- After Task 1 (schema live) → `architecture.md`: list all models
- After Task 3 (dashboard) → `patterns.md`: how Recharts is used (copy the chart component pattern)
- After Task 4 (score API) → `decisions.md`: "Score calculation is done in the API route, not in the DB — simpler to maintain and avoids complex raw SQL"
- Any bug → `mistakes.md` immediately

---

## PERSON 2 — Environmental Module

**Wait for Person 1 to push the schema to GitHub before wiring any APIs. Build UI with mock/hardcoded data first.**

### Timeline
- 0:30–1:30 → Environmental Goals page (full CRUD)
- 1:30–2:30 → Carbon Transactions page (table + manual add form)
- 2:30–3:30 → Emission Factors page + Product ESG Profile page
- 3:30–4:30 → Wire all 4 pages to real Prisma API routes
- 4:30–5:30 → Auto emission calculation toggle logic
- 5:30–6:30 → Environmental Dashboard tab (summary cards + mini charts)
- 6:30–7:00 → Polish + demo prep

### Antigravity Prompt — Copy and paste this exactly

```
You are building the Environmental module of EcoSphere, a dark-themed ESG Management Platform.

Tech stack: Next.js 14 App Router, Tailwind CSS, shadcn/ui, Prisma (Neon PostgreSQL), Recharts.
Database is Neon (cloud PostgreSQL). DATABASE_URL is already in .env. Do not change the datasource.

DESIGN SYSTEM:
- Background: #0D0D0D, Surface: #1A1A1A, Borders: #2A2A2A
- Module accent color: Green #22C55E
- Text: white primary, #9CA3AF secondary
- Status chips: Active=green pill, On Track=blue pill, Completed=gray pill
- All forms in shadcn Dialog modals. Delete needs confirmation dialog.
- Tables: dark rows, hover highlight

Prisma models you will use: EnvironmentalGoal, CarbonTransaction, EmissionFactor, ProductESGProfile, Department, ESGConfig.

BUILD IN THIS ORDER:

TASK 1 — ENVIRONMENTAL GOALS PAGE at /environmental/goals:
Module tabs at top: Emission Factors | Product ESG Profile | Carbon Transactions | Environmental Goals | Dashboard

Goals tab content:
- Table columns: Name | Department | Target CO₂ (kg) | Current CO₂ (kg) | Progress (shadcn Progress bar, auto-calc as currentCo2/targetCo2 × 100) | Deadline | Status chip
- Buttons above table: + New Goal (green), Edit (per row), Delete (per row), Export (dropdown: PDF, CSV)
- New/Edit modal fields: Name, Department (dropdown from GET /api/departments), Target CO₂, Current CO₂, Deadline (date picker), Status
- API routes to create:
  GET /api/environmental/goals — fetch all with dept name
  POST /api/environmental/goals — create new
  PUT /api/environmental/goals/[id] — update
  DELETE /api/environmental/goals/[id] — delete
- Export CSV: use papaparse to convert table data to CSV and trigger download
- Export PDF: use jsPDF to create a simple table PDF and trigger download

TASK 2 — CARBON TRANSACTIONS PAGE at /environmental/carbon-transactions:
- Table columns: Source | Department | Emission Factor | Quantity | CO₂ Amount (kg) | Date
- Button: + New Transaction (manual entry)
- Manual add modal fields: Source (dropdown: Purchase/Manufacturing/Expense/Fleet), Department (dropdown), Emission Factor (dropdown from GET /api/emission-factors), Quantity, Date
- On submit: co2Amount = quantity × emissionFactor.factorValue (calculate this before saving)
- Check ESGConfig.autoEmissionCalc from GET /api/esg-config. If true, show a green info banner at top: "Auto emission calculation is ON — transactions are generated automatically from linked operations."
- API routes: GET /api/environmental/carbon-transactions, POST /api/environmental/carbon-transactions

TASK 3 — EMISSION FACTORS PAGE at /environmental/emission-factors:
- Table: Name | Source | Factor Value | Unit
- Full CRUD with modal. Modal fields: Name, Source (dropdown), Factor Value (number), Unit
- API routes: GET /api/emission-factors, POST, PUT /api/emission-factors/[id], DELETE /api/emission-factors/[id]

TASK 4 — PRODUCT ESG PROFILE PAGE at /environmental/product-esg:
- Table: Product Name | Code | Department | Carbon Footprint (kg) | Recyclable (Yes/No chip) | Notes
- Full CRUD with modal
- API routes: GET /api/environmental/products, POST, PUT, DELETE

TASK 5 — AUTO EMISSION CALCULATION:
Create a function at /api/environmental/auto-calculate (POST):
- Fetch all EmissionFactors
- Generate 5 sample transactions (hardcoded source records simulating purchases/fleet/expenses)
- For each: co2Amount = quantity × emissionFactor.factorValue
- Save as CarbonTransaction records
- Return count of created transactions
Add a button on the Carbon Transactions page: "Run Auto Calculation" (only visible when ESGConfig.autoEmissionCalc = true). On click, call this API and refresh the table.

TASK 6 — ENVIRONMENTAL DASHBOARD TAB at /environmental/dashboard:
- 3 summary cards: Total CO₂ This Month (sum from CarbonTransaction), Goals On Track (count where status=Active), Top Emitting Dept (dept with highest total co2)
- Recharts BarChart: CO₂ by Department (group CarbonTransactions by deptId, sum co2Amount)
- Recharts LineChart: Monthly CO₂ trend (group by month, sum co2Amount)

Build one task at a time. Show result before next task.
```

### Brain folder — update after each task
- After Task 1 → `patterns.md`: copy the modal + CRUD + API pattern (all other pages follow this)
- After Task 2 → `decisions.md`: "CO2 calculation done on frontend before POST to avoid extra API call"
- After Task 5 → `decisions.md`: "Auto calc uses hardcoded source records for demo — real app would pull from ERP tables"
- Any schema field mismatch → `mistakes.md` + message Person 1 immediately

---

## PERSON 3 — Social + Governance Modules

**You have the most pages. Prioritize Social first — it's more visually impressive for demo. Build UI with mock data first, wire APIs after Person 1 pushes schema.**

### Timeline
- 0:30–1:30 → CSR Activities CRUD + Employee Participation table
- 1:30–2:30 → Participation Approval Queue with Approve/Reject
- 2:30–3:30 → Governance: Policies CRUD + Policy Acknowledgements
- 3:30–4:30 → Audits CRUD + Compliance Issues table
- 4:30–5:30 → Wire all pages to real APIs
- 5:30–6:30 → Compliance overdue flagging logic
- 6:30–7:00 → Polish

### Antigravity Prompt — Copy and paste this exactly

```
You are building the Social and Governance modules of EcoSphere, a dark-themed ESG Management Platform.

Tech stack: Next.js 14 App Router, Tailwind CSS, shadcn/ui, Prisma (Neon PostgreSQL).
Database is Neon (cloud PostgreSQL). DATABASE_URL is already in .env. Do not change the datasource.

DESIGN SYSTEM:
- Background: #0D0D0D, Surface: #1A1A1A, Borders: #2A2A2A
- Social module color: Orange #F97316
- Governance module color: Blue #3B82F6
- Text: white primary, #9CA3AF secondary
- Status chips as colored pill badges
- All forms in shadcn Dialog modals. Delete needs confirmation.
- Tables: dark rows, hover highlight

Prisma models: CSRActivity, EmployeeParticipation, ESGPolicy, PolicyAcknowledgement, Audit, ComplianceIssue, Category, Department, ESGConfig.

BUILD IN THIS ORDER:

TASK 1 — SOCIAL MODULE: CSR ACTIVITIES PAGE at /social/activities:
Tabs at top: CSR Activities | Employee Participation | Diversity Dashboard

CSR Activities tab:
- Table: Title | Category | Department | Date | Open (Yes/No chip)
- Buttons: + New Activity (orange), Edit (per row), Delete (per row, confirmation)
- Modal fields: Title, Category (dropdown from GET /api/categories?type=CSR_ACTIVITY), Department (dropdown), Description, Date, Open (toggle)
- API routes: GET /api/social/activities, POST /api/social/activities, PUT /api/social/activities/[id], DELETE /api/social/activities/[id]

TASK 2 — EMPLOYEE PARTICIPATION PAGE at /social/participation:
Two sub-tabs within the Employee Participation tab: All Participation | Approval Queue

All Participation sub-tab:
- Table: Employee | Activity | Proof (clickable "View" link if exists) | Points Earned | Status chip | Completion Date
- Button: + New Participation (modal: Employee Name, Activity dropdown, Proof URL optional, Completion Date)

Approval Queue sub-tab:
- Shows only records where approvalStatus = Pending
- Table: Employee | Activity | Proof (clickable link) | Approve button (green) | Reject button (red)
- On Approve:
  1. Check ESGConfig.requireCsrEvidence from GET /api/esg-config
  2. If requireCsrEvidence = true AND proofUrl is empty: show error toast "Proof file required before approval"
  3. Otherwise: set approvalStatus = Approved, pointsEarned = 50, completionDate = today
  4. Show success toast "Participation approved"
- On Reject: set approvalStatus = Rejected. Show toast "Participation rejected"
- API routes: PUT /api/social/participation/[id]/approve, PUT /api/social/participation/[id]/reject

Diversity Dashboard sub-tab:
- Just show 3 hardcoded placeholder cards: "Female Employees: 42%", "Training Completion: 78%", "Avg Tenure: 3.2 years"
- Label them as "Demo Data"

TASK 3 — GOVERNANCE MODULE: POLICIES PAGE at /governance/policies:
Tabs at top: Policies | Policy Acknowledgements | Audits | Compliance Issues

Policies tab:
- Table: Title | Version | Effective Date | Department | Status chip
- Full CRUD modal. Modal fields: Title, Description, Version, Effective Date (date picker), Department (optional dropdown), Status (Active/Archived)
- API: GET /api/governance/policies, POST, PUT /api/governance/policies/[id], DELETE

TASK 4 — POLICY ACKNOWLEDGEMENTS at /governance/acknowledgements:
- Table: Employee | Policy | Acknowledged At
- + New Acknowledgement modal: Employee Name (text input), Policy (dropdown from GET /api/governance/policies)
- On submit: save with acknowledgedAt = now()
- API: GET /api/governance/acknowledgements, POST /api/governance/acknowledgements

TASK 5 — AUDITS PAGE at /governance/audits:
- Table: Title | Department | Auditor | Date | Findings (truncated text) | Status chip (Completed=blue, Under Review=amber, Planned=gray)
- Full CRUD modal. Fields: Title, Department (dropdown), Auditor (text), Date, Findings (textarea), Status
- API: GET /api/governance/audits, POST, PUT /api/governance/audits/[id], DELETE

TASK 6 — COMPLIANCE ISSUES PAGE at /governance/compliance:
- Table: Description (truncated) | Severity chip (High=red, Medium=amber, Low=gray) | Department (from linked audit) | Owner | Due Date | Status chip | Overdue badge
- Overdue badge: if dueDate < today AND status = Open → show red "⚠ Overdue" badge next to the row status
- + New Issue modal fields: Audit (dropdown from GET /api/governance/audits), Severity (High/Medium/Low dropdown), Description (textarea), Owner (text — REQUIRED), Due Date (date picker — REQUIRED). Show validation error if Owner or Due Date is empty.
- Resolve button per row: sets status = Resolved
- API: GET /api/governance/compliance, POST /api/governance/compliance, PUT /api/governance/compliance/[id]/resolve

Build one task at a time. Show result before next task.
```

### Brain folder — update after each task
- After Task 2 (approval queue) → `patterns.md`: document the approval pattern (Person 4 reuses this for challenge participation)
- After Task 6 (overdue logic) → `decisions.md`: "Overdue is computed client-side by comparing dueDate to new Date() — simple and fast enough for this scale"
- Schema mismatch → `mistakes.md` + message Person 1

---

## PERSON 4 — Gamification + Reports

**Challenges are the most complex part of the entire app — the lifecycle has 5 states. Start there. Reports are mostly UI — build them last.**

### Timeline
- 0:30–1:45 → Challenges CRUD with full lifecycle state machine
- 1:45–2:45 → Challenge Participation (table + approval queue)
- 2:45–3:30 → Badges CRUD + Leaderboard
- 3:30–4:00 → Rewards CRUD
- 4:00–5:00 → Wire all to real APIs
- 5:00–5:45 → Badge auto-award logic
- 5:45–6:30 → Reports: 4 report cards with PDF/CSV export
- 6:30–7:00 → Custom Report Builder UI

### Antigravity Prompt — Copy and paste this exactly

```
You are building the Gamification and Reports modules of EcoSphere, a dark-themed ESG Management Platform.

Tech stack: Next.js 14 App Router, Tailwind CSS, shadcn/ui, Prisma (Neon PostgreSQL), jsPDF, papaparse.
Database is Neon (cloud PostgreSQL). DATABASE_URL is already in .env. Do not change the datasource.

DESIGN SYSTEM:
- Background: #0D0D0D, Surface: #1A1A1A, Borders: #2A2A2A
- Gamification color: Purple #A855F7
- Reports color: Cyan #06B6D4
- Text: white primary, #9CA3AF secondary
- Status chips as colored pill badges
- All forms in shadcn Dialog modals.

Prisma models: Challenge, ChallengeParticipation, Badge, Reward, EmployeeParticipation, Category, ESGConfig, DepartmentScore, Department.

BUILD IN THIS ORDER:

TASK 1 — CHALLENGES PAGE at /gamification/challenges:
Tabs at top: Challenges | Challenge Participation | Badges | Rewards | Leaderboard

Challenges tab:
- Filter row of tab-style buttons: All | Active | Under Review | Completed | Archived (filter the displayed cards)
- Each challenge shown as a card (NOT a table). Card contains:
  - Title (large)
  - Category chip (purple)
  - Difficulty chip: Easy=green, Medium=amber, Hard=red
  - XP badge (purple, e.g. "XP: 200")
  - Deadline (small gray text)
  - Status chip
  - Status action buttons (see below)
  - "Join Challenge" button (outlined)

Status transition buttons (show based on current status):
- If Draft: show "Activate" button → sets status = Active
- If Active: show "Submit for Review" button → sets status = Under Review
- If Under Review: show "Mark Completed" button (green) + "Reactivate" button (outlined) → sets status = Completed or Active
- Any status except Archived: show "Archive" button (red, with confirmation dialog) → sets status = Archived

+ New Challenge button (purple). Modal fields: Title, Category (dropdown type=CHALLENGE), Description, XP (number), Difficulty (Easy/Medium/Hard), Evidence Required (toggle), Deadline (date picker), Status starts as Draft.

API routes:
GET /api/gamification/challenges — fetch all with category
POST /api/gamification/challenges — create
PUT /api/gamification/challenges/[id] — update (including status changes)
DELETE /api/gamification/challenges/[id] — delete (with confirmation)

TASK 2 — CHALLENGE PARTICIPATION at /gamification/challenge-participation:
Two sub-tabs: All Participation | Approval Queue

All Participation:
- Table: Employee | Challenge | Progress (Progress bar 0-100%) | Proof (link) | Status chip | XP Awarded
- + New Participation modal: Employee Name (text), Challenge (dropdown of Active challenges), Progress (0-100 slider), Proof URL

Approval Queue (shows Pending only):
- Table: Employee | Challenge | Progress | Proof (link) | Approve button | Reject button
- On Approve:
  1. Set approvalStatus = Approved
  2. Set xpAwarded = challenge.xp
  3. Check ESGConfig.autoBadgeAward. If true, call POST /api/gamification/check-badges with { employeeName }
  4. Show success toast "Challenge approved — XP awarded!"
- On Reject: set approvalStatus = Rejected
- API: PUT /api/gamification/participation/[id]/approve, PUT /api/gamification/participation/[id]/reject

TASK 3 — BADGES PAGE at /gamification/badges:
- Grid of cards (not table). Each card: Icon (large emoji), Name, Description, Unlock Rule (small gray text), Edit + Delete buttons
- + New Badge modal: Name, Description, Unlock Rule (text, e.g. "XP >= 500"), Icon (emoji text input)
- API: GET /api/gamification/badges, POST, PUT /api/gamification/badges/[id], DELETE

TASK 4 — REWARDS PAGE at /gamification/rewards:
- Table: Name | Description | Points Required | Stock | Status chip (Active=green, Out of Stock=red)
- If stock = 0, auto-show "Out of Stock" red chip regardless of status field
- + New Reward modal: Name, Description, Points Required, Stock, Status
- Redeem button per row: show confirmation "Redeem [Name] for [X] points?" → on confirm: decrement stock by 1, show toast "Reward redeemed!"
- API: GET /api/gamification/rewards, POST, PUT /api/gamification/rewards/[id], POST /api/gamification/rewards/[id]/redeem

TASK 5 — LEADERBOARD PAGE at /gamification/leaderboard:
- Toggle at top: Employee View | Department View
- Employee View table: Rank | 🥇🥈🥉 medal for top 3 | Employee Name | Total XP (sum of xpAwarded from ChallengeParticipation where approved) | Challenges Completed (count) | CSR Points (sum of pointsEarned from EmployeeParticipation where approved)
- Department View table: Rank | Department | Total Score (from DepartmentScore) | Environmental Score | Social Score | Governance Score
- Sort by Total XP descending (Employee) or Total Score descending (Department)
- API: GET /api/gamification/leaderboard?view=employee|department

TASK 6 — BADGE AUTO-AWARD API:
Create POST /api/gamification/check-badges with body { employeeName: string }:
1. Sum all xpAwarded from ChallengeParticipation where employeeName matches AND approvalStatus = Approved → totalXP
2. Count ChallengeParticipation where employeeName matches AND approvalStatus = Approved → completedChallenges
3. Count EmployeeParticipation where employeeName matches AND approvalStatus = Approved → csrCount
4. Fetch all Badges
5. For each badge, parse unlockRule string:
   - If unlockRule contains "XP >= N": check totalXP >= N
   - If unlockRule contains "Completed Challenges >= N": check completedChallenges >= N
   - If unlockRule contains "CSR Activities >= N": check csrCount >= N
6. For qualifying badges, return { unlockedBadges: [{name, icon}] }
7. On the frontend, after calling this API, show a toast for each unlocked badge: "🏆 Badge Unlocked: [Name] [Icon]"

TASK 7 — REPORTS PAGE at /reports:
4 report cards in a 2x2 grid. Each card has: Title, description text, Generate button.

Card 1 — Environmental Report:
On Generate: fetch all CarbonTransactions + EnvironmentalGoals → create PDF with jsPDF showing totals per dept, goals progress table → trigger download as environmental-report.pdf

Card 2 — Social Report:
On Generate: fetch CSRActivities + EmployeeParticipation totals → PDF with activity list and participation counts → download as social-report.pdf

Card 3 — Governance Report:
On Generate: fetch Audits + ComplianceIssues → PDF with audit list and open issues highlighted → download as governance-report.pdf

Card 4 — ESG Summary:
On Generate: fetch scores from GET /api/scores → PDF with overall score, dept breakdown table, and all 3 pillar scores → download as esg-summary.pdf

All PDFs: use jsPDF. Dark-ish style: black background, white text, colored section headers.

TASK 8 — CUSTOM REPORT BUILDER at /reports/custom:
Filter bar with dropdowns: Date Range (start + end date pickers) | Department (dropdown) | Module (Environmental/Social/Governance/Gamification) | Employee (text input) | ESG Category (dropdown)
"Run Report" button → calls GET /api/reports/custom with filter params → shows results in a table below
Export buttons: Export PDF | Export Excel (use papaparse + Blob for CSV, rename to .xlsx for demo) | Export CSV

Build one task at a time. Show result before next task.
```

### Brain folder — update after each task
- After Task 1 (challenge lifecycle) → `patterns.md`: "Challenge status machine — status transitions are done via PUT /api/gamification/challenges/[id] with { status: newStatus }. Buttons shown conditionally based on current status."
- After Task 6 (badge logic) → `decisions.md`: "Badge unlock rules parsed as plain strings client-side — fragile but fast to build. Real app would use structured rule objects."
- After Task 7 (reports) → `patterns.md`: "PDF generation pattern with jsPDF — copy this for any other export"
- Any bug with XP totals → `mistakes.md`

---

## SEED DATA — Person 1 builds this, everyone benefits

Create `/api/seed` GET endpoint. When hit, inserts all this if DB is empty:

**Departments:** Manufacturing (MFC, S. Nair, 134), Logistics (LOG, R. Iyer, 58, parent=Manufacturing), Corporate (COR, A. Mehta, 41)

**Categories:** Tree Plantation (CSR_ACTIVITY), Blood Donation (CSR_ACTIVITY), Beach Cleanup (CSR_ACTIVITY), ESG Workshop (CSR_ACTIVITY), Sustainability Sprint (CHALLENGE), Recycle Challenge (CHALLENGE), Commute Green (CHALLENGE)

**EmissionFactors:** Diesel Fleet (Fleet, 2.68, kg CO2/L), Grid Electricity (Manufacturing, 0.82, kg CO2/kWh), Air Travel (Expense, 0.255, kg CO2/km)

**Badges:** Green Beginner (XP >= 100, 🌱), Carbon Saver (XP >= 500, ♻️), Sustainability Champion (Completed Challenges >= 3, 🏆), Team Player (CSR Activities >= 2, 🤝)

**DepartmentScores:** Manufacturing (env:75, social:80, gov:70, total:75.5), Logistics (env:60, social:88, gov:82, total:75), Corporate (env:82, social:74, gov:88, total:81.4)

**ESGConfig:** one row, all toggles false, weights 0.4/0.3/0.3

**Employees to use as names throughout:** Aditi Rao, Karan Shah, Priya Mehta, Rahul Joshi, Sara Iyer

**Add a "Seed Database" button in the Settings page (ESG Config tab) that calls GET /api/seed**

---

## DEMO FLOW — Practice this at 6:30

One person drives. Do not freestyle. 3–4 minutes total.

1. Dashboard → show 4 scores + emission trend chart + dept ranking
2. Environmental → Goals → show progress bars on 3 goals
3. Environmental → Carbon Transactions → show auto-calc banner
4. Social → Participation → Approval Queue → approve one entry (show toast)
5. Governance → Compliance Issues → show one red "⚠ Overdue" badge
6. Gamification → Challenges → activate a Draft challenge
7. Gamification → Leaderboard → show dept ranking
8. Reports → ESG Summary → click Generate → show PDF download
9. Settings → ESG Config → toggle auto emission calc

---

## TEAM RULES

- **Every 90 min:** 5-minute sync. What's done, what's next, any blocker.
- **Schema changes:** Ask Person 1 first. Never alter the DB unilaterally.
- **Stuck for 20+ minutes:** Ask the team. Do not silently struggle.
- **At hour 5:** Every module must be visible in the browser with real data. If not, cut features.
- **Build order priority:** Working CRUD > Business logic > Polish. Never polish an unfinished feature.
- **Reports is last.** Do not touch Reports until all other modules are working.
