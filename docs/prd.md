# Asset Borrow Log - Product Requirements

## Purpose
- Provide a controlled borrowing flow for IT-issued assets (headsets, YubiKeys, keyboards, etc.), ensure returns, and surface overdue items with reminders.
- Use React + Vite + shadcn UI for the frontend, Supabase for auth/db/email functions, and Render for hosting. Match the Yngen ITSM theme (`yngen-itsm/docs/theme.md`).

## Goals
- Single form to submit a borrowing request with required ticket ID and reason.
- Automatic borrow timestamp, generated request ID, and printable form with signature area.
- IT staff login to review requests in table or card view, track SLA, and flag overdue items.
- Daily email reminders to borrowers and IT for due/overdue items until returned.

## Non-Goals
- Full ITSM ticketing; assume ticket ID comes from an external system.
- Asset inventory lifecycle (purchase, depreciation) beyond borrow/return tracking.
- Mobile app; responsive web only.

## Users and Roles
- Employee/Borrower: fills the borrow form and signs the printed copy.
- IT Staff: authenticated; reviews, approves, marks returned, sets due dates, and monitors SLA/overdue.
- IT Manager (optional): same as staff plus reporting access.

## Core User Flows
- Submit request: borrower opens form (public) -> enters personal details + ticket ID + selects asset + reason -> borrow date/time auto-set -> due date defaults to +1 day (editable future date) -> submit -> confirm via magic link (email) -> success screen with print action (includes signature blocks).
- IT review: IT logs in -> dashboard shows SLA cards -> toggles list between cards/table -> filters/searches -> opens detail -> can mark as returned, extend due (requires reason), add notes -> status updates visible immediately and logged.
- Reminder loop: system checks due items daily -> sends email to borrower and IT until returned.

## Functional Requirements
- Unique Request ID: format `ABL-YYYYMMDD-XXXX` (Supabase generated).
- Access: Borrow form is public; requires email-based magic-link confirmation before submission is accepted. IT actions require Supabase auth (email/password or SSO).
- Fields (borrow form): Request ID (read-only), Borrower name, Email, Department, Ticket ID (required), Asset type (select), Asset label/serial (optional text), Reason (textarea), Due date/time (default +1 day, required future), Borrowed at (auto now), Return date/time (IT sets when returned), Status (`pending`, `approved`, `borrowed`, `returned`, `overdue`, `lost` optional).
- Validation: Ticket ID pattern `^[A-Za-z0-9-]{4,}$`; due date must be future; borrower email required and verified.
- Printing: post-submit screen and detail page include print stylesheet, signature lines for borrower and IT, request metadata, and placeholder logo (to be replaced later).
- Views: toggleable grid cards and table using the provided theme; search by user/asset/ticket; filter by status/due window; sort by due date.
- SLA Cards: counts for total active, due in 24h, overdue, returned this week, and average borrow duration.
- Overdue indicator: row/card border or badge turns red when `now > due_at` and status not `returned`.
- Status management: IT can set status transitions (approved -> borrowed -> returned; borrowed -> overdue; any non-returned -> lost) with required reasons for extend due date and for setting to lost.
- Extend due date: IT can extend due date with a required reason; change is logged. System prompts to reprint the updated agreement for signature and resubmission.
- Auth: Supabase email/password or SSO (if available) for IT staff; borrower form is public with email magic link.
- Audit trail: log every status change, due date change, and return event with timestamp/user in `activity_log`.
- Notifications: daily job (Supabase cron/Edge Function) checks due/overdue; sends templated emails to borrower and IT (includes ticket ID, asset, due date, action link).
- Accessibility: keyboard nav, focus states, semantic form controls; supports light/dark per theme.
- Performance: initial dashboard loads under 2s on standard broadband; pagination or infinite scroll for large lists.

## Data Model (Supabase)
- `borrow_requests`
  - `id` (uuid, PK), `request_code` (text, unique `ABL-...`)
  - `ticket_id` (text, required)
  - `borrower_name` (text), `borrower_email` (text), `department` (text)
  - `asset_type` (text enum: headset, yubikey, keyboard, mouse, laptop, monitor, lan_cable, hdmi, power_cable, projector, projector_screen, led_tv, flashdrive, ups, type_c_adaptor, nuc, other)
  - `asset_label` (text), `reason` (text)
  - `status` (text enum: pending, approved, borrowed, returned, overdue, lost)
  - `borrowed_at` (timestamptz, default now), `due_at` (timestamptz), `returned_at` (timestamptz)
  - `it_owner` (uuid FK to profiles), `notes` (text), `created_at`, `updated_at`
  - Indexes on `status`, `due_at`, `ticket_id`
- `activity_log`
  - `id` (uuid PK), `borrow_request_id` (FK), `action` (text), `actor_id` (uuid FK), `notes` (text), `created_at`
- `profiles`
  - `id` (uuid PK, Supabase auth user), `name`, `role` (staff, manager), `email`
- Optional lookup: `assets` table for common asset labels/serials.

## Permission Model
- Public form: create `borrow_requests` with status `pending` and requester data; no read access.
- Authenticated IT: read all requests; update status/due/notes; mark returned; delete only if status `pending`.
- Authenticated IT: read activity log; create activity entries on each change.

## Notifications and SLA Logic
- Scheduled job (daily, e.g., 08:00) queries `borrow_requests` where `status != 'returned'` and `now() > due_at`.
- Send email to borrower and IT owner with subject "Asset return overdue" including ticket ID, asset, due date, and a link to the request.
- Daily reminders continue until status = `returned`; if due is within next 24h, send "due soon" warning.
- SLA breach definition: overdue flag (`status=overdue` or computed `now > due_at`); dashboard uses this for red indicators.

## Printing Requirements
- Printable layout includes request header, borrower details, ticket ID, asset details, borrow/due timestamps, and status.
- Signature blocks: Borrower signature/date, IT signature/date.
- Print-specific CSS to hide navigation and keep theme typography/colors consistent.
- When due date is extended, prompt user to reprint and re-sign the updated agreement; keep both versions on file.

## Integrations
- Ticket ID comes from the external ITSM; validation is pattern-only unless future API is added.
- Email via Supabase (SMTP or Resend integration).

## Metrics
- Overdue rate, average borrow duration, number of reminders sent, on-time return percentage, per-asset borrow counts.

## Risks/Edge Cases
- Borrower email missing/invalid -> block submission.
- Timezone issues -> store all timestamps in UTC; display in local time.
- Lost item flow -> allow IT to set status `lost` (optional extension) and capture notes.
- Printing from mobile -> ensure responsive print view or instruct desktop print in UI.
