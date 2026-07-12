# EcoSphere - Architecture

## Database Models (Prisma)
- **Department**: Organisation hierarchy. Contains name, code, head, parent department, employees count, status.
- **Category**: Classifications for CSR activities and gamification challenges.
- **EmissionFactor**: Multipliers to calculate CO2 footprint from quantities.
- **ProductESGProfile**: Details of product carbon footprints and recyclability.
- **EnvironmentalGoal**: Carbon target vs current carbon emissions per department.
- **ESGPolicy**: Policy documents with versions, effective dates, and acknowledgements.
- **Badge**: Unlocked badge types with rules.
- **Reward**: Point-redeemable stock items.
- **CarbonTransaction**: Logs of emissions per department and factor.
- **CSRActivity**: Community events.
- **EmployeeParticipation**: Logs of employee attendance in CSR activities.
- **Challenge**: Tasks with XP and deadlines.
- **ChallengeParticipation**: Progress, evidence, and status of employee challenges.
- **PolicyAcknowledgement**: Triggers when employees acknowledge policies.
- **Audit**: Scheduled inspections.
- **ComplianceIssue**: Discrepancies and severity found in audits.
- **DepartmentScore**: ESG score aggregates per department.
- **ESGConfig**: Global weights and toggles.

## API Routes Structure
### System/Core (Person 1)
- `GET /api/seed` - DB seeding endpoint.
- `GET /api/scores` - Calculates ESG scores using current weights.
- `GET, POST, PUT, DELETE /api/departments` - Department management.
- `GET, POST, PUT, DELETE /api/categories` - Category configurations.
- `GET, PUT /api/esg-config` - Platform configurations.
- `GET /api/recent-activity` - Logs recent transactions and activities.

### Environmental (Person 2)
- `GET, POST, PUT, DELETE /api/environmental/goals`
- `GET, POST /api/environmental/carbon-transactions`
- `GET, POST, PUT, DELETE /api/emission-factors`
- `GET, POST, PUT, DELETE /api/environmental/products`
- `POST /api/environmental/auto-calculate`

### Social & Governance (Person 3)
- `GET, POST, PUT, DELETE /api/social/activities`
- `GET, POST, PUT, DELETE /api/social/participation`
- `PUT /api/social/participation/[id]/approve`
- `PUT /api/social/participation/[id]/reject`
- `GET, POST, PUT, DELETE /api/governance/policies`
- `GET, POST /api/governance/acknowledgements`
- `GET, POST, PUT, DELETE /api/governance/audits`
- `GET, POST, PUT, DELETE /api/governance/compliance`
- `PUT /api/governance/compliance/[id]/resolve`

### Gamification & Reports (Person 4)
- `GET, POST, PUT, DELETE /api/gamification/challenges`
- `PUT /api/gamification/participation/[id]/approve`
- `PUT /api/gamification/participation/[id]/reject`
- `GET, POST, PUT, DELETE /api/gamification/badges`
- `GET, POST, PUT, DELETE /api/gamification/rewards`
- `POST /api/gamification/rewards/[id]/redeem`
- `GET /api/gamification/leaderboard`
- `POST /api/gamification/check-badges`
- `GET /api/reports/custom`
