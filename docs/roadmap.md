# Asset Borrow Log - Roadmap

## Progress Log
- 2026-01-16: Vite + React + TypeScript scaffold in place; Tailwind/shadcn wiring added with Yngen ITSM theme tokens; base UI components (button, card, badge, input, label, textarea, separator) ready.
- 2026-01-16: Supabase schema + RLS draft added (`supabase/schema.sql`); env template + client stub added; magic-link setup notes documented in `docs/supabase.md`.
- 2026-01-16: Router shell added with placeholder pages for home, borrow form, dashboard, and request detail; layout header/navigation aligned to theme; build verified.
- 2026-01-16: Added shadcn components (select, dropdown, tabs, table, avatar, dialog, scroll-area, tooltip, toggle); borrow form now validated with react-hook-form + zod and posts to Supabase; dashboard/detail placeholders enriched; build green.
- 2026-01-16: Magic-link gating added to borrow form (signInWithOtp + session check); submit disabled until session email matches; toasts added; schema order fixed for profiles function; env populated.
- 2026-01-16: Dashboard now includes card/table views, SLA stat cards, overdue/due-soon cues, and action menus (stubbed to Supabase); detail page has printable summary with signature blocks and overdue highlight.
- 2026-01-16: Dashboard wired to Supabase fetch (with mock fallback), action handlers for return/extend/lost call Supabase updates + activity logs; loader/toast flow validated via build.
- 2026-01-16: Detail view now loads by ID via Supabase (with placeholder fallback), shows activity log feed, and has dialogs for return/extend/lost; print header hidden; schema restored.
- 2026-01-16: Dashboard actions now use dialogs (no prompts) for return/extend/lost; detail/activity dialogs wired to Supabase status updates + activity log inserts; print tweaks applied.
- 2026-01-16: Added chunk splitting (vendor/supabase/ui) to reduce main bundle; enhanced print styling and print-only header in detail view.
- 2026-01-16: Print-only footer added to detail view; print layout refined with signature sizing and page margin rules.
- 2026-01-16: Added print-only header stamp in layout to show printed timestamp across pages.
- 2026-01-16: Added dashboard print-only note and SLA snapshot.
- 2026-01-16: Added Vitest + RTL; initial borrow form tests (validation gate) passing.
- 2026-01-16: Added dashboard SLA print snapshot test; Supabase hook updated with toasts.
- 2026-01-16: Added detail view test (request/ticket/activity render); test suite now 4 passing.
- 2026-01-16: Action menus hardened (stop-prop + aria labels), print snapshot cleaned to ASCII separators, dashboard action test stabilized; all Vitest suites green.
- 2026-01-16: Env templates aligned to the live Supabase project values; local + example files consistent.
- 2026-01-16: Added auto-provision trigger for profiles on new auth users; added Resend-based reminder script + scheduled GitHub Action.
- 2026-01-16: Added IT route guard, dashboard search/filter/pagination, and CI workflow (test + build).
- 2026-01-16: Added YDC logo asset; seed script now resolves staff IDs by email to avoid FK errors.

## Status Summary
- Phase 0: Done
- Phase 1: Backend schema/RLS implemented; seeding pending
- Phase 2: Done
- Phase 3: Done
- Phase 4: Mostly done (guard added; search/filter/pagination added; full live data wiring in all views ongoing)
- Phase 5: In progress (reminder cron/email scaffolded via GitHub Action + Resend script; SMTP/Resend keys still needed)
- Phase 6: In progress (RTL coverage in place for form/dashboard/detail; CI workflow added; UAT and reminder logic tests pending)

## Phase 0 - Foundations
- Create repo/scaffold with Vite + React + TypeScript; add shadcn UI and import Yngen ITSM theme tokens/components. ✅
- Setup environments: local `.env` for Supabase (project URL/key), Render deploy targets, SMTP/Resend for email. ✅ (SMTP keys still to fill)
- Lock request ID format, SLA definitions, and asset type enum list (headset, yubikey, keyboard, mouse, laptop, monitor, lan cable, HDMI, power cable, projector, projector screen, LED TV, flashdrive, UPS, Type C adaptor, NUC, other). ✅

## Phase 1 - Backend (Supabase)
- Define schema: `borrow_requests`, `activity_log`, `profiles`, optional `assets` lookup; add indexes on `status`, `due_at`, `ticket_id`. ✅
- Implement functions/triggers: generate `request_code`, set `borrowed_at` default, auto-flag `status` to `overdue` when `now > due_at`. ✅
- RLS: public insert-only on `borrow_requests` with validation; IT role read/update; log changes in `activity_log`. ✅
- Seed data: sample assets, demo requests for UI development. ⏳

## Phase 2 - UI Shell & Theme
- Layout: header, sidebar, theme toggle using imported theme; routing for `/request`, `/dashboard`, `/request/:id`. ✅ (theme toggle minimal)
- Shared components: search/filter bar, card/table toggle, status badges, SLA stat cards, modals following theme patterns. ✅ (search/filter to be implemented with data)
- Global utilities: date formatting, request ID display, class helpers. ✅ (basic formatting; more can be added)

## Phase 3 - Borrow Form & Print
- Build public borrow form with validation (ticket ID pattern, future due date defaulting to +1 day, required email). ✅
- Magic-link flow to confirm borrower email before accepting submission. ✅
- Submission flow: create request via Supabase, show confirmation with print-ready view and signature blocks (placeholder logo). ✅ (detail page covers print; success view still to polish)
- Print stylesheet to hide chrome and keep theme typography; export/print path accessible from detail page and after due-date changes (prompt reprint on extensions). ✅ (print refinements ongoing)

## Phase 4 - IT Dashboard & Detail
- Auth gate with Supabase; session management and protected routes. ⏳ (needs IT-only route guard)
- Dashboard: SLA cards (active, due soon, overdue, returned this week, avg duration), filters/search/sort, card and table views with overdue indicators. ✅ (filters/search/pagination pending)
- Detail view: status changes, due date edits (requires reason + reprint prompt), return action, lost status, notes; show activity log. ✅
- Pagination or infinite scroll for large datasets. ⏳

## Phase 5 - Notifications & Jobs
- Implement daily cron/Edge Function querying due/overdue requests; send borrower + IT emails with action links. ⏳
- Add "due soon" (within 24h) and "overdue" templates; ensure idempotent sends per day. ⏳
- Observability: log send outcomes; retry/backoff for failures. ⏳

## Phase 6 - QA & Launch
- Tests: form validation, request code generation, RLS enforcement smoke tests, reminder query logic. ⏳ (Vitest/RTL scaffold added; borrow form + dashboard snapshot tests passing; more coverage needed)
- UAT with sample data; verify light/dark modes and print output. ⏳
- CI/CD to Render; configure environment variables and secrets. ⏳
- Runbook: on-call steps for failed jobs, rotating SMTP keys, manual override for lost items. ⏳
