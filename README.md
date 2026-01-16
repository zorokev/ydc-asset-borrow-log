# Asset Borrow Log

React + Vite + TypeScript + shadcn UI, themed to Yngen ITSM, backed by Supabase. Tracks borrowed IT assets with public magic-link form, IT dashboard (card/table views, SLA cards, overdue cues), printable agreements with signatures, activity log, and reminder emails.

## Stack
- React, Vite, TypeScript, Tailwind + shadcn UI
- Supabase (Auth, Postgres, RLS, email)
- Vitest + Testing Library
- GitHub Actions: CI (test/build) and daily reminders

## Setup
1) Install deps: `npm install`
2) Env: copy `.env.example` to `.env.local` and set:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server jobs)
   - `SMTP_FROM`, `RESEND_API_KEY` (for reminders; leave blank to dry-run)
3) Run dev server: `npm run dev`
4) Tests: `npm test`
5) Build: `npm run build`

## Supabase
- Apply schema: run `supabase/schema.sql` in SQL Editor or `supabase db push`.
- Auth: enable magic link; IT staff/manager users go in Supabase Auth; trigger auto-creates `profiles` rows. Set `profiles.role` to `staff` or `manager`.
- Seed (dev/demo): create auth users for `it.staff@example.com` and `manager@example.com`, then run `supabase/seed.sql` in SQL Editor (service role). Swap emails to your real staff if desired.

## Reminders (Resend)
- Script: `npm run reminders` (dry-run logs if `RESEND_API_KEY` is empty).
- Scheduler: `.github/workflows/reminders.yml` runs daily at 23:00 UTC; set GitHub secrets:
  - `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `SMTP_FROM`
- Emails: borrowers (due/overdue) and IT staff (summary). Uses `SMTP_FROM` as sender.

## CI
- `.github/workflows/ci.yml` runs tests and build on push/PR to `main`.

## Key UI Paths
- Borrow form: `/request` (public, magic-link gated submit, default +1 day due, print-ready).
- Dashboard: `/dashboard` (IT-only guard, search/filter, pagination, card/table views, actions).
- Request detail: `/request/:id` (IT-only, status/extend/lost, activity log, print view).

## Printing
- Print-friendly styles hide chrome and include signature blocks; detail page and post-submit views are printable. Add your logo at `public/logo.png` (already added).
