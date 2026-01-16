-- Sample seed data for local/dev QA
-- Run with service role (or supabase db execute) to bypass RLS on insert.
-- Make sure the staff emails exist in auth.users first (create users in Auth > Users).

-- Upsert profiles for existing auth users (by email)
insert into public.profiles (id, email, name, role)
select id, email, coalesce(raw_user_meta_data->>'name', email), 'staff'
from auth.users
where email in ('it.staff@example.com', 'manager@example.com')
on conflict (id) do update
  set email = excluded.email,
      name = excluded.name,
      role = excluded.role;

-- Sample borrow requests (it_owner resolved by email; null if not found)
insert into public.borrow_requests (
  ticket_id,
  borrower_name,
  borrower_email,
  department,
  asset_type,
  asset_label,
  reason,
  status,
  borrowed_at,
  due_at,
  it_owner,
  notes
)
values
  (
    'IT-1001',
    'Alex Reyes',
    'alex@example.com',
    'IT',
    'laptop',
    'LT-001',
    'Home connectivity issue',
    'borrowed',
    timezone('utc', now()) - interval '1 day',
    timezone('utc', now()) + interval '12 hour',
    (select id from public.profiles where email = 'it.staff@example.com'),
    'Due soon sample'
  ),
  (
    'IT-1002',
    'Jamie Cruz',
    'jamie@example.com',
    'Ops',
    'monitor',
    'MN-210',
    'Temporary desk setup',
    'overdue',
    timezone('utc', now()) - interval '3 day',
    timezone('utc', now()) - interval '1 day',
    (select id from public.profiles where email = 'it.staff@example.com'),
    'Overdue sample'
  ),
  (
    'IT-1003',
    'Rina Lopez',
    'rina@example.com',
    'Finance',
    'yubikey',
    'YK-09',
    'MFA replacement',
    'returned',
    timezone('utc', now()) - interval '7 day',
    timezone('utc', now()) - interval '3 day',
    (select id from public.profiles where email = 'manager@example.com'),
    'Returned sample'
  );

-- Optional activity log rows for seeded data (use first staff found)
insert into public.activity_log (borrow_request_id, action, actor_id, notes)
select br.id, 'seeded', p.id, 'Seed data'
from public.borrow_requests br
left join public.profiles p on p.email = 'it.staff@example.com'
where not exists (
  select 1 from public.activity_log al where al.borrow_request_id = br.id and al.action = 'seeded'
);
