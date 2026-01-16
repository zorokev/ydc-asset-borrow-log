# Supabase Setup

## Environment
- Copy `.env.example` to `.env.local` (or `.env`) and set:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (for server jobs/Edge Functions)
  - `SUPABASE_PROJECT_REF` (for CLI)
  - `SMTP_FROM`, `RESEND_API_KEY` (or your SMTP provider)

## Schema and RLS
- Apply `supabase/schema.sql` in the SQL editor or via CLI:
  - `supabase db push --file supabase/schema.sql`
- Tables: `profiles`, `borrow_requests`, `activity_log`.
- Helpers:
  - `generate_request_code()` produces `ABL-YYYYMMDD-XXXX`.
  - `is_staff()` checks `profiles.role` in (`staff`, `manager`).
- RLS:
  - Borrowers (authenticated via magic link) can insert if `jwt.email` matches `borrower_email`.
  - Staff/manager can read/update/delete (delete only when `pending`).
  - Activity log visible/insertable by staff/manager.

## Magic Link Auth
- Enable email OTP/magic link in Supabase Auth settings.
- Borrower flow: call `supabase.auth.signInWithOtp({ email })` before insert; proceed with submission only when session email matches `borrower_email`.
- IT staff: create users in Auth; the `handle_new_auth_user` trigger will auto-create a `profiles` row. Update `profiles.role` to `staff` or `manager` as needed.

## Defaults and Constraints
- Default status `pending`, overdue auto-applied when `due_at` is past (unless returned).
- `borrowed_at` defaults to `now()`, `due_at` must be future (`due_at > borrowed_at`).
- `borrower_email` lowercased by trigger; unique `request_code` enforced.
