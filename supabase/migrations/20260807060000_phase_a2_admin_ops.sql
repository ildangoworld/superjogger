-- Phase A2: admin audit log for destructive operations

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

create index admin_audit_logs_actor_id_idx
  on public.admin_audit_logs (actor_id);

alter table public.admin_audit_logs enable row level security;

-- No authenticated policies: writes/reads go through service_role only.
grant all on table public.admin_audit_logs to service_role;
