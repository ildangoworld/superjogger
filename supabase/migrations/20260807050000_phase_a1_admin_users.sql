-- Phase A1: admin users and menu permissions
-- First SUPER admin is bootstrapped from ADMIN_ID / ADMIN_PASSWORD
-- on /admin/login (no manual SQL seed required).

create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('SUPER', 'STAFF')),
  permissions text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_permissions_valid check (
    permissions <@ array[
      'dashboard',
      'members',
      'crews',
      'inquiries',
      'legal',
      'settings'
    ]::text[]
  )
);

create trigger admin_users_set_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;

-- Admins may read their own row (session / menu checks). Writes are service_role only.
create policy "admin_users_select_own"
on public.admin_users for select
to authenticated
using (auth.uid() = user_id);

grant select on table public.admin_users to authenticated;
grant all on table public.admin_users to service_role;
