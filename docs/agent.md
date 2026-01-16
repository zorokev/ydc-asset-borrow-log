# Asset Borrow Log - Agent Charter

## Mission
Ship a Supabase-backed Asset Borrow Log (React + Vite + shadcn UI) that matches the Yngen ITSM theme (`../Yngen IT Service Management System/yngen-itsm/docs/theme.md`) and delivers borrow/return tracking with overdue alerts.

## Scope of Work
- Scaffold frontend with Vite + React + TypeScript; install shadcn UI with the ITSM theme variables/components.
- Implement public borrow form (email magic-link confirmation, required ticket ID, auto borrow timestamp, default +1 day due date, reason, asset selection) with printable confirmation/signature layout and placeholder logo.
- Implement IT-authenticated dashboard (Supabase auth) with card/table toggle, filters, SLA stat cards, and overdue indicators.
- Implement request detail view with status updates, extend-due (requires reason + reprint prompt), notes, return action, and lost status option.
- Add scheduled reminder emails (Supabase Edge Function/cron) for due/overdue items to borrower and IT.
- Wire audit logging for status changes, due date changes, and returns.

## Constraints and Standards
- Visuals must copy theme tokens, spacing, and component patterns from `yngen-itsm` (badge variants, cards, table layout, modal patterns).
- Use Supabase for auth, database, storage (if attachments), and email delivery; host on Render.
- Data integrity: enforce future due date, unique `request_code`, required borrower email, and ticket ID pattern.
- Accessibility: keyboard navigation, focus styles, ARIA labels on form inputs/actions.
- Security: Supabase RLS; public insert-only for borrow form; IT role required for reads/updates.

## Inputs
- Theme reference: `../Yngen IT Service Management System/yngen-itsm/docs/theme.md`
- Stack: React, Vite, TypeScript, Supabase, Render, shadcn UI
- PRD: `docs/prd.md`

## Outputs
- Running web app with public borrow form and IT dashboard.
- Daily reminder job deployed and configurable.
- Print-friendly request page with signature blocks.
- Documentation: setup steps, env vars, deployment instructions, and RLS policy notes.

## Definition of Done
- All PRD functional requirements met; UI matches theme in light/dark.
- Supabase schema, RLS, and Edge Function for reminders deployed; magic-link flow active for public form.
- IT dashboard shows SLA cards and overdue signals; card/table views work.
- Form submission generates `request_code`, writes to DB, requests email confirmation, and provides printable view (with reprint guidance on due-date changes).
- Tests or checks for form validation, request ID generation, and reminder query logic.
