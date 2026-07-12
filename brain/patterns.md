# EcoSphere - Reusable Patterns

## Styling System (Theme)
- **Background**: `#0D0D0D`
- **Surface Cards**: `#1A1A1A`
- **Borders**: `#2A2A2A`
- **Text**: Primary `#FFFFFF`, Secondary `#9CA3AF`
- **Hover Highlights**: `#22C55E` green hover on table rows.
- **Accents**:
  - Environmental: `#22C55E` (Green)
  - Social: `#F97316` (Orange)
  - Governance: `#3B82F6` (Blue)
  - Gamification: `#A855F7` (Purple)
  - Reports: `#06B6D4` (Cyan)

## Modal and Form Handling
- All forms must open in a shadcn `Dialog` (modal) layout. Do not use inline forms.
- Deletions must request user confirmation first before executing the API request.
- Toast notifications must be used to report success/error states (e.g. `sonner` client-side).

## Table Pattern
- Style: Dark tables with white text. Apply `hover:bg-green-900/10` or a green border highlight on hover.

## Approval Queue Pattern (reuse for Person 4 - Challenge Participation)
Used in: `/social` → Employee Participation tab → "Approval Queue" sub-tab.
Person 4 should replicate this for `/gamification` → Challenge Participation approvals.

### Logic Flow
1. Filter records client-side: `items.filter(i => i.approvalStatus === "Pending")`.
2. Show badge count on the tab: `Approval Queue (N)` where N = pending count.
3. **Approve path**:
   - `PUT /api/social/participation/[id]/approve`
   - Server checks `ESGConfig.requireCsrEvidence` from `prisma.eSGConfig.findFirst()`.
   - If `requireEvidence === true` AND `proofUrl` is null/empty → return `{ error: "Proof file required before approval" }` with status 422.
   - Otherwise → set `approvalStatus = "Approved"`, `pointsEarned = 50`, `completionDate = new Date()`.
   - Client reads response: if `!res.ok` → `toast.error(data.error)`, else `toast.success("Participation approved!")`.
4. **Reject path**:
   - `PUT /api/social/participation/[id]/reject`
   - Simply set `approvalStatus = "Rejected"`.
   - Client: `toast.success("Participation rejected")`.
5. After either action: re-fetch the full participation list to update both the table and queue count.
