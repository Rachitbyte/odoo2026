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
