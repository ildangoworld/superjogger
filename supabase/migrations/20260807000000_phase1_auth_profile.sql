-- Phase 1: auth profile foundation
-- Account deletion policy (application-enforced):
-- 1) User requests deletion while authenticated.
-- 2) Server deletes auth.users via service role.
-- 3) profiles and dependent rows cascade-delete.
-- 4) Session cookies are cleared after deletion.

create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null,
  avatar_url text,
  timezone text not null default 'Asia/Seoul',
  recommendation_detail text not null default 'LIGHT'
    check (recommendation_detail in ('LIGHT', 'DETAILED')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_nickname_unique unique (nickname),
  constraint profiles_nickname_length check (
    char_length(nickname) between 2 and 20
  )
);

create table public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  experience_level text
    check (
      experience_level is null
      or experience_level in ('BEGINNER', 'RETURNING', 'REGULAR', 'ADVANCED')
    ),
  primary_goal text
    check (
      primary_goal is null
      or primary_goal in ('HABIT', 'HEALTH', 'STRESS_RELIEF', 'ENJOYMENT')
    ),
  available_weekdays smallint[]
    check (
      available_weekdays is null
      or (
        cardinality(available_weekdays) between 1 and 7
        and available_weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
      )
    ),
  baseline_weekly_frequency numeric(3, 1)
    check (
      baseline_weekly_frequency is null
      or (
        baseline_weekly_frequency >= 0
        and baseline_weekly_frequency <= 7
      )
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.weekly_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  target_count smallint not null check (target_count between 1 and 7),
  recommended_count smallint check (
    recommended_count is null
    or recommended_count between 1 and 7
  ),
  recommendation_reason text,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_goals_user_week_unique unique (user_id, week_start)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

create trigger weekly_goals_set_updated_at
before update on public.weekly_goals
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_nickname text;
  candidate text;
  suffix integer := 0;
begin
  base_nickname := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''),
    'jogger_' || substr(replace(new.id::text, '-', ''), 1, 8)
  );

  candidate := left(base_nickname, 20);

  while exists (
    select 1 from public.profiles p where p.nickname = candidate
  ) loop
    suffix := suffix + 1;
    candidate := left(base_nickname, 16) || '_' || suffix::text;
  end loop;

  insert into public.profiles (id, nickname)
  values (new.id, candidate);

  insert into public.user_preferences (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.weekly_goals enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "user_preferences_select_own"
on public.user_preferences for select
to authenticated
using (auth.uid() = user_id);

create policy "user_preferences_update_own"
on public.user_preferences for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "weekly_goals_select_own"
on public.weekly_goals for select
to authenticated
using (auth.uid() = user_id);

create policy "weekly_goals_insert_own"
on public.weekly_goals for insert
to authenticated
with check (auth.uid() = user_id);

create policy "weekly_goals_update_own"
on public.weekly_goals for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
