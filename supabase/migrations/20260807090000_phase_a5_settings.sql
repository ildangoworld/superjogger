-- Phase A5: app settings + AI daily limit from settings

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint app_settings_key_known check (
    key in ('ai_model', 'ai_daily_limit', 'ai_base_url')
  )
);

create trigger app_settings_set_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;

-- Authenticated users may read settings (daily limit for analysis UI).
-- Writes go through service_role only.
create policy "app_settings_select_authenticated"
on public.app_settings for select
to authenticated
using (true);

grant select on table public.app_settings to authenticated;
grant all on table public.app_settings to service_role;

insert into public.app_settings (key, value) values
  ('ai_model', '""'::jsonb),
  ('ai_daily_limit', '3'::jsonb),
  ('ai_base_url', '""'::jsonb);

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
  v_limit integer := 3;
  v_limit_raw jsonb;
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

  select value into v_limit_raw
  from public.app_settings
  where key = 'ai_daily_limit';

  if found
     and jsonb_typeof(v_limit_raw) = 'number'
     and (v_limit_raw #>> '{}')::integer between 1 and 50 then
    v_limit := (v_limit_raw #>> '{}')::integer;
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

  if v_used >= v_limit then
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

alter function public.reserve_ai_analysis_slot(
  uuid, uuid, date, text, text, text
) owner to postgres;

grant execute on function public.reserve_ai_analysis_slot(
  uuid, uuid, date, text, text, text
) to authenticated, service_role;
