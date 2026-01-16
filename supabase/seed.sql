-- Sample seed data for local/dev QA
-- Run with service role (or supabase db push) to bypass RLS on insert.

-- Sample profiles (replace UUIDs with real auth user IDs in non-dev)
insert into public.profiles (id, email, name, role) values
  ('11111111-1111-1111-1111-111111111111', 'it.staff@example.com', 'IT Staff', 'staff'),
  ('22222222-2222-2222-2222-222222222222', 'manager@example.com', 'IT Manager', 'manager')
on conflict (id) do update
  set email = excluded.email,
      name = excluded.name,
      role = excluded.role;

-- Sample borrow requests
insert into public.borrow_requests (ticket_id, borrower_name, borrower_email, department, asset_type, asset_label, reason, status, borrowed_at, due_at, it_owner, notes)
values
  ('IT-1001', 'Alex Reyes', 'alex@example.com', 'IT', 'laptop', 'LT-001', 'Home connectivity issue', 'borrowed', timezone('utc', now()) - interval '1 day', timezone('utc', now()) + interval '12 hour', '11111111-1111-1111-1111-111111111111', 'Due soon sample'),
  ('IT-1002', 'Jamie Cruz', 'jamie@example.com', 'Ops', 'monitor', 'MN-210', 'Temporary desk setup', 'overdue', timezone('utc', now()) - interval '3 day', timezone('utc', now()) - interval '1 day', '11111111-1111-1111-1111-111111111111', 'Overdue sample'),
  ('IT-1003', 'Rina Lopez', 'rina@example.com', 'Finance', 'yubikey', 'YK-09', 'MFA replacement', 'returned', timezone('utc', now()) - interval '7 day', timezone('utc', now()) - interval '3 day', '22222222-2222-2222-2222-222222222222', 'Returned sample');

-- Optional activity log rows
insert into public.activity_log (borrow_request_id, action, actor_id, notes)
select id, 'seeded', '11111111-1111-1111-1111-111111111111', 'Seed data'
from public.borrow_requests
where action is distinct from 'seeded';
