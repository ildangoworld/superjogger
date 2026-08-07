-- Phase 4: AI analysis tables, usage slots, and atomic reserve RPCs

create table public.workout_analyses (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null
    check (status in ('PENDING', 'COMPLETED', 'FAILED', 'STALE')),
  trigger_type text not null
    check (trigger_type in ('AUTO', 'REANALYZE')),
  summary text,
  intensity_interpretation text,
  trend text,
  next_workout_suggestion text,
  safety_notice text,
  trend_summary text,
  risk_level text
    check (
      risk_level is null
      or risk_level in ('NONE', 'CAUTION', 'HIGH')
    ),
  model_name text,
  prompt_version text not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_analyses_user_created_idx
  on public.workout_analyses (user_id, created_at desc);

create index workout_analyses_workout_idx
  on public.workout_analyses (workout_id, created_at desc);

create table public.ai_analysis_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  usage_local_date date not null,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  analysis_id uuid references public.workout_analyses (id) on delete set null,
  trigger_type text not null
    check (trigger_type in ('AUTO', 'REANALYZE')),
  status text not null
    check (status in ('RESERVED', 'CONSUMED', 'RELEASED')),
  request_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_analysis_usage_request_key_unique unique (request_key)
);

create index ai_analysis_usage_user_date_status_idx
  on public.ai_analysis_usage (user_id, usage_local_date, status);

create table public.user_trend_state (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  latest_trend_summary text,
  source_analysis_id uuid references public.workout_analyses (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.workouts
  add constraint workouts_active_analysis_id_fkey
  foreign key (active_analysis_id)
  references public.workout_analyses (id)
  on delete set null;

create trigger workout_analyses_set_updated_at
before update on public.workout_analyses
for each row execute function public.set_updated_at();

create trigger ai_analysis_usage_set_updated_at
before update on public.ai_analysis_usage
for each row execute function public.set_updated_at();

create trigger user_trend_state_set_updated_at
before update on public.user_trend_state
for each row execute function public.set_updated_at();

alter table public.workout_analyses enable row level security;
alter table public.ai_analysis_usage enable row level security;
alter table public.user_trend_state enable row level security;

create policy "workout_analyses_select_own"
on public.workout_analyses for select
to authenticated
using (auth.uid() = user_id);

create policy "workout_analyses_insert_own"
on public.workout_analyses for insert
to authenticated
with check (auth.uid() = user_id);

create policy "workout_analyses_update_own"
on public.workout_analyses for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "workout_analyses_delete_own"
on public.workout_analyses for delete
to authenticated
using (auth.uid() = user_id);

create policy "ai_analysis_usage_select_own"
on public.ai_analysis_usage for select
to authenticated
using (auth.uid() = user_id);

create policy "ai_analysis_usage_insert_own"
on public.ai_analysis_usage for insert
to authenticated
with check (auth.uid() = user_id);

create policy "ai_analysis_usage_update_own"
on public.ai_analysis_usage for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "ai_analysis_usage_delete_own"
on public.ai_analysis_usage for delete
to authenticated
using (auth.uid() = user_id);

create policy "user_trend_state_select_own"
on public.user_trend_state for select
to authenticated
using (auth.uid() = user_id);

create policy "user_trend_state_insert_own"
on public.user_trend_state for insert
to authenticated
with check (auth.uid() = user_id);

create policy "user_trend_state_update_own"
on public.user_trend_state for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_trend_state_delete_own"
on public.user_trend_state for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on table public.workout_analyses to authenticated;
grant select, insert, update, delete on table public.ai_analysis_usage to authenticated;
grant select, insert, update, delete on table public.user_trend_state to authenticated;

grant all on table public.workout_analyses to service_role;
grant all on table public.ai_analysis_usage to service_role;
grant all on table public.user_trend_state to service_role;

create or replace function public.reserve_ai_analysis_slot(
  p_user_id uuid,
  p_workout_id uuid,
  p_usage_local_date date,
  p_trigger_type text,
  p_request_key text,
  p_prompt_version text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used integer;
  v_analysis_id uuid;
  v_usage_id uuid;
  v_existing public.ai_analysis_usage%rowtype;
begin
  if auth.uid() is distinct from p_user_id
     and auth.role() is distinct from 'service_role' then
    raise exception 'not authorized';
  end if;

  if p_trigger_type not in ('AUTO', 'REANALYZE') then
    raise exception 'invalid trigger_type';
  end if;

  select * into v_existing
  from public.ai_analysis_usage
  where request_key = p_request_key;

  if found then
    return jsonb_build_object(
      'ok', true,
      'analysis_id', v_existing.analysis_id,
      'usage_id', v_existing.id,
      'idempotent', true,
      'status', v_existing.status
    );
  end if;

  perform pg_advisory_xact_lock(
    hashtext(p_user_id::text),
    hashtext(p_usage_local_date::text)
  );

  select count(*)::integer into v_used
  from public.ai_analysis_usage
  where user_id = p_user_id
    and usage_local_date = p_usage_local_date
    and status in ('RESERVED', 'CONSUMED');

  if v_used >= 3 then
    return jsonb_build_object('ok', false, 'reason', 'LIMIT');
  end if;

  if not exists (
    select 1
    from public.workouts
    where id = p_workout_id
      and user_id = p_user_id
  ) then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;

  insert into public.workout_analyses (
    workout_id,
    user_id,
    status,
    trigger_type,
    prompt_version
  )
  values (
    p_workout_id,
    p_user_id,
    'PENDING',
    p_trigger_type,
    p_prompt_version
  )
  returning id into v_analysis_id;

  insert into public.ai_analysis_usage (
    user_id,
    usage_local_date,
    workout_id,
    analysis_id,
    trigger_type,
    status,
    request_key
  )
  values (
    p_user_id,
    p_usage_local_date,
    p_workout_id,
    v_analysis_id,
    p_trigger_type,
    'RESERVED',
    p_request_key
  )
  returning id into v_usage_id;

  return jsonb_build_object(
    'ok', true,
    'analysis_id', v_analysis_id,
    'usage_id', v_usage_id,
    'idempotent', false,
    'status', 'RESERVED'
  );
end;
$$;

create or replace function public.finalize_ai_analysis_usage(
  p_usage_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.ai_analysis_usage%rowtype;
begin
  if p_status not in ('CONSUMED', 'RELEASED') then
    raise exception 'invalid status';
  end if;

  select * into v_row
  from public.ai_analysis_usage
  where id = p_usage_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;

  if auth.uid() is distinct from v_row.user_id
     and auth.role() is distinct from 'service_role' then
    raise exception 'not authorized';
  end if;

  if v_row.status <> 'RESERVED' then
    return jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'status', v_row.status
    );
  end if;

  update public.ai_analysis_usage
  set status = p_status
  where id = p_usage_id;

  return jsonb_build_object('ok', true, 'status', p_status);
end;
$$;

alter function public.reserve_ai_analysis_slot(
  uuid, uuid, date, text, text, text
) owner to postgres;

alter function public.finalize_ai_analysis_usage(uuid, text) owner to postgres;

grant execute on function public.reserve_ai_analysis_slot(
  uuid, uuid, date, text, text, text
) to authenticated, service_role;

grant execute on function public.finalize_ai_analysis_usage(uuid, text)
  to authenticated, service_role;
