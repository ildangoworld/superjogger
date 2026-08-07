-- Phase 2: workouts and weekly summaries
-- local_date / qualifies_by_rule / counts_for_daily_goal are computed in app code.
-- active_analysis_id stays nullable without FK until Phase 4 analyses land.

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null
    check (category in ('RUNNING', 'WALKING', 'MIXED')),
  started_at timestamptz not null,
  local_date date not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  distance_meters integer not null check (distance_meters >= 0),
  perceived_exertion smallint not null check (perceived_exertion between 1 and 5),
  condition_score smallint not null check (condition_score between 1 and 5),
  has_pain boolean not null default false,
  pain_area text,
  pain_details text,
  average_heart_rate smallint
    check (
      average_heart_rate is null
      or average_heart_rate between 30 and 250
    ),
  cadence smallint
    check (cadence is null or cadence >= 0),
  step_count integer
    check (step_count is null or step_count >= 0),
  memo text,
  qualifies_by_rule boolean not null,
  counts_for_daily_goal boolean not null,
  active_analysis_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workouts_user_local_date_idx
  on public.workouts (user_id, local_date);

create index workouts_user_started_at_idx
  on public.workouts (user_id, started_at desc);

create index workouts_user_created_at_idx
  on public.workouts (user_id, created_at);

create table public.weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  goal_count smallint not null check (goal_count >= 0),
  qualified_day_count smallint not null check (qualified_day_count >= 0),
  goal_achieved boolean not null,
  workout_count integer not null check (workout_count >= 0),
  total_duration_seconds integer not null check (total_duration_seconds >= 0),
  total_distance_meters integer not null check (total_distance_meters >= 0),
  category_counts jsonb not null default '{}'::jsonb,
  average_exertion numeric,
  average_condition numeric,
  pain_record_count integer not null check (pain_record_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_summaries_user_week_unique unique (user_id, week_start)
);

create trigger workouts_set_updated_at
before update on public.workouts
for each row execute function public.set_updated_at();

create trigger weekly_summaries_set_updated_at
before update on public.weekly_summaries
for each row execute function public.set_updated_at();

alter table public.workouts enable row level security;
alter table public.weekly_summaries enable row level security;

create policy "workouts_select_own"
on public.workouts for select
to authenticated
using (auth.uid() = user_id);

create policy "workouts_insert_own"
on public.workouts for insert
to authenticated
with check (auth.uid() = user_id);

create policy "workouts_update_own"
on public.workouts for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "workouts_delete_own"
on public.workouts for delete
to authenticated
using (auth.uid() = user_id);

create policy "weekly_summaries_select_own"
on public.weekly_summaries for select
to authenticated
using (auth.uid() = user_id);

create policy "weekly_summaries_insert_own"
on public.weekly_summaries for insert
to authenticated
with check (auth.uid() = user_id);

create policy "weekly_summaries_update_own"
on public.weekly_summaries for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "weekly_summaries_delete_own"
on public.weekly_summaries for delete
to authenticated
using (auth.uid() = user_id);
