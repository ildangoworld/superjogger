-- Phase 5: crews, membership, and secure crew board RPC

create table public.crews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 40),
  description text check (description is null or char_length(description) <= 200),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  invite_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crews_invite_code_unique unique (invite_code)
);

create table public.crew_members (
  crew_id uuid not null references public.crews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('OWNER', 'MEMBER')),
  joined_at timestamptz not null default now(),
  primary key (crew_id, user_id)
);

create index crews_owner_id_idx on public.crews (owner_id);
create index crew_members_user_id_idx on public.crew_members (user_id);

create trigger crews_set_updated_at
before update on public.crews
for each row execute function public.set_updated_at();

alter table public.crews enable row level security;
alter table public.crew_members enable row level security;

-- SECURITY DEFINER helpers avoid RLS recursion between crews <-> crew_members.
create or replace function public.is_crew_member(p_crew_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.crew_members
    where crew_id = p_crew_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_crew_owner(p_crew_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.crews
    where id = p_crew_id
      and owner_id = auth.uid()
  );
$$;

alter function public.is_crew_member(uuid) owner to postgres;
alter function public.is_crew_owner(uuid) owner to postgres;

revoke all on function public.is_crew_member(uuid) from public;
revoke all on function public.is_crew_owner(uuid) from public;
grant execute on function public.is_crew_member(uuid) to authenticated, service_role;
grant execute on function public.is_crew_owner(uuid) to authenticated, service_role;

create policy "crews_select_member"
on public.crews for select
to authenticated
using (public.is_crew_member(id));

create policy "crews_insert_own"
on public.crews for insert
to authenticated
with check (auth.uid() = owner_id);

create policy "crews_update_owner"
on public.crews for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "crews_delete_owner"
on public.crews for delete
to authenticated
using (auth.uid() = owner_id);

create policy "crew_members_select_same_crew"
on public.crew_members for select
to authenticated
using (public.is_crew_member(crew_id));

-- Membership inserts go through SECURITY DEFINER RPCs only.

create policy "crew_members_delete_self_or_owner"
on public.crew_members for delete
to authenticated
using (
  auth.uid() = user_id
  or public.is_crew_owner(crew_id)
);

create policy "crew_members_update_owner"
on public.crew_members for update
to authenticated
using (public.is_crew_owner(crew_id))
with check (public.is_crew_owner(crew_id));

grant select, insert, update, delete on table public.crews to authenticated;
grant select, insert, update, delete on table public.crew_members to authenticated;
grant all on table public.crews to service_role;
grant all on table public.crew_members to service_role;

create or replace function public.generate_crew_invite_code()
returns text
language plpgsql
as $$
declare
  v_code text;
  v_exists boolean;
begin
  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    select exists(
      select 1 from public.crews where invite_code = v_code
    ) into v_exists;
    exit when not v_exists;
  end loop;
  return v_code;
end;
$$;

create or replace function public.create_crew(
  p_name text,
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_crew_id uuid;
  v_code text;
  v_name text := trim(p_name);
  v_description text := nullif(trim(coalesce(p_description, '')), '');
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if v_name is null or char_length(v_name) < 1 or char_length(v_name) > 40 then
    return jsonb_build_object('ok', false, 'reason', 'INVALID_NAME');
  end if;

  if v_description is not null and char_length(v_description) > 200 then
    return jsonb_build_object('ok', false, 'reason', 'INVALID_DESCRIPTION');
  end if;

  v_code := public.generate_crew_invite_code();

  insert into public.crews (name, description, owner_id, invite_code)
  values (v_name, v_description, v_user_id, v_code)
  returning id into v_crew_id;

  insert into public.crew_members (crew_id, user_id, role)
  values (v_crew_id, v_user_id, 'OWNER');

  return jsonb_build_object(
    'ok', true,
    'crew_id', v_crew_id,
    'invite_code', v_code
  );
end;
$$;

create or replace function public.join_crew_by_invite_code(p_invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_crew public.crews%rowtype;
  v_code text := upper(trim(p_invite_code));
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if v_code is null or char_length(v_code) < 4 then
    return jsonb_build_object('ok', false, 'reason', 'INVALID_CODE');
  end if;

  select * into v_crew
  from public.crews
  where invite_code = v_code;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;

  if exists (
    select 1
    from public.crew_members
    where crew_id = v_crew.id
      and user_id = v_user_id
  ) then
    return jsonb_build_object(
      'ok', false,
      'reason', 'ALREADY_MEMBER',
      'crew_id', v_crew.id
    );
  end if;

  insert into public.crew_members (crew_id, user_id, role)
  values (v_crew.id, v_user_id, 'MEMBER');

  return jsonb_build_object('ok', true, 'crew_id', v_crew.id);
end;
$$;

create or replace function public.get_crew_board(
  p_crew_id uuid,
  p_week_start date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_week_end date := p_week_start + 6;
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1
    from public.crew_members
    where crew_id = p_crew_id
      and user_id = v_user_id
  ) then
    return jsonb_build_object('ok', false, 'reason', 'FORBIDDEN');
  end if;

  select coalesce(jsonb_agg(row_data order by (row_data->>'nickname')), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'user_id', m.user_id,
      'nickname', p.nickname,
      'avatar_url', p.avatar_url,
      'role', m.role,
      'target_count', g.target_count,
      'qualified_day_count', coalesce((
        select count(distinct w.local_date)::integer
        from public.workouts w
        where w.user_id = m.user_id
          and w.counts_for_daily_goal = true
          and w.local_date >= p_week_start
          and w.local_date <= v_week_end
      ), 0),
      'first_week_start', (
        select min(wg.week_start)::text
        from public.weekly_goals wg
        where wg.user_id = m.user_id
      ),
      'week_outcomes', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'week_start', wg.week_start,
            'goal_count', wg.target_count,
            'qualified_day_count', coalesce((
              select count(distinct w.local_date)::integer
              from public.workouts w
              where w.user_id = m.user_id
                and w.counts_for_daily_goal = true
                and w.local_date >= wg.week_start
                and w.local_date <= wg.week_start + 6
            ), 0)
          )
          order by wg.week_start
        )
        from public.weekly_goals wg
        where wg.user_id = m.user_id
      ), '[]'::jsonb)
    ) as row_data
    from public.crew_members m
    join public.profiles p on p.id = m.user_id
    left join public.weekly_goals g
      on g.user_id = m.user_id
     and g.week_start = p_week_start
    where m.crew_id = p_crew_id
  ) board;

  return jsonb_build_object(
    'ok', true,
    'week_start', p_week_start,
    'members', v_result
  );
end;
$$;

alter function public.generate_crew_invite_code() owner to postgres;
alter function public.create_crew(text, text) owner to postgres;
alter function public.join_crew_by_invite_code(text) owner to postgres;
alter function public.get_crew_board(uuid, date) owner to postgres;

grant execute on function public.generate_crew_invite_code() to postgres, service_role;
grant execute on function public.create_crew(text, text) to authenticated, service_role;
grant execute on function public.join_crew_by_invite_code(text) to authenticated, service_role;
grant execute on function public.get_crew_board(uuid, date) to authenticated, service_role;
