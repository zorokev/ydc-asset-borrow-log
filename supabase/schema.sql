-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Request code generator: ABL-YYYYMMDD-XXXX
create sequence if not exists public.request_code_seq
  minvalue 1
  maxvalue 9999
  start with 1
  increment by 1
  cycle;

create or replace function public.generate_request_code() returns text as $$
declare
  seq int;
begin
  seq := nextval('public.request_code_seq');
  return 'ABL-' || to_char(timezone('UTC', now()), 'YYYYMMDD') || '-' || lpad(seq::text, 4, '0');
end;
$$ language plpgsql;

-- Profiles (IT + optional managers)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  name text,
  role text not null default 'staff' check (role in ('staff', 'manager', 'requester')),
  created_at timestamptz not null default timezone('utc', now())
);

-- Auto-provision a profile row when a new auth user is created
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::text, 'staff')
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(excluded.name, public.profiles.name),
        role = coalesce(excluded.role, public.profiles.role);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Helper: identify staff/manager roles
create or replace function public.is_staff(user_id uuid) returns boolean as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = user_id
      and p.role in ('staff', 'manager')
  );
$$ language sql stable;

-- Borrow requests
create table if not exists public.borrow_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique,
  ticket_id text not null,
  borrower_name text not null,
  borrower_email text not null,
  department text,
  asset_type text not null check (
    asset_type in (
      'headset',
      'yubikey',
      'keyboard',
      'mouse',
      'laptop',
      'monitor',
      'lan_cable',
      'hdmi',
      'power_cable',
      'projector',
      'projector_screen',
      'led_tv',
      'flashdrive',
      'ups',
      'type_c_adaptor',
      'nuc',
      'other'
    )
  ),
  asset_label text,
  reason text,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'borrowed', 'returned', 'overdue', 'lost')
  ),
  borrowed_at timestamptz not null default timezone('utc', now()),
  due_at timestamptz not null,
  returned_at timestamptz,
  it_owner uuid references public.profiles (id),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint borrow_requests_due_future check (due_at > borrowed_at)
);

create index if not exists borrow_requests_status_idx on public.borrow_requests (status);
create index if not exists borrow_requests_due_at_idx on public.borrow_requests (due_at);
create index if not exists borrow_requests_ticket_idx on public.borrow_requests (ticket_id);

-- Activity log
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  borrow_request_id uuid not null references public.borrow_requests (id) on delete cascade,
  action text not null,
  actor_id uuid references public.profiles (id),
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists activity_log_request_idx on public.activity_log (borrow_request_id);

-- Trigger: set request code and timestamps
create or replace function public.set_borrow_request_defaults() returns trigger as $$
begin
  new.borrower_email := lower(new.borrower_email);
  if new.request_code is null then
    new.request_code := public.generate_request_code();
  end if;
  if new.borrowed_at is null then
    new.borrowed_at := timezone('utc', now());
  end if;
  new.updated_at := timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_borrow_requests_defaults on public.borrow_requests;
create trigger trg_borrow_requests_defaults
  before insert or update on public.borrow_requests
  for each row
  execute procedure public.set_borrow_request_defaults();

-- Trigger: set overdue status when due_at is in the past and not returned
create or replace function public.set_overdue_status() returns trigger as $$
begin
  if (new.status != 'returned') and (new.due_at < timezone('utc', now())) then
    new.status := 'overdue';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_borrow_requests_overdue on public.borrow_requests;
create trigger trg_borrow_requests_overdue
  before insert or update on public.borrow_requests
  for each row
  execute procedure public.set_overdue_status();

-- RLS
alter table public.profiles enable row level security;
alter table public.borrow_requests enable row level security;
alter table public.activity_log enable row level security;

-- Profiles policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Staff can view profiles" on public.profiles;
create policy "Staff can view profiles" on public.profiles
  for select using (public.is_staff(auth.uid()));

drop policy if exists "Service role can manage profiles" on public.profiles;
create policy "Service role can manage profiles" on public.profiles
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Borrow requests policies
drop policy if exists "Borrower can create their request" on public.borrow_requests;
create policy "Borrower can create their request" on public.borrow_requests
  for insert
  with check (
    auth.role() = 'authenticated'
    and lower(coalesce(auth.jwt() ->> 'email', '')) = lower(borrower_email)
  );

drop policy if exists "Staff can read requests" on public.borrow_requests;
create policy "Staff can read requests" on public.borrow_requests
  for select
  using (public.is_staff(auth.uid()));

drop policy if exists "Staff can update requests" on public.borrow_requests;
create policy "Staff can update requests" on public.borrow_requests
  for update
  using (public.is_staff(auth.uid()))
  with check (true);

drop policy if exists "Staff can delete pending" on public.borrow_requests;
create policy "Staff can delete pending" on public.borrow_requests
  for delete
  using (public.is_staff(auth.uid()) and status = 'pending');

-- Activity log policies
drop policy if exists "Staff can read activity" on public.activity_log;
create policy "Staff can read activity" on public.activity_log
  for select
  using (public.is_staff(auth.uid()));

drop policy if exists "Staff can insert activity" on public.activity_log;
create policy "Staff can insert activity" on public.activity_log
  for insert
  with check (public.is_staff(auth.uid()));
