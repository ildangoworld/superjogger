-- Crew join requests, public/private visibility, and approval RPCs

alter table public.crews
  add column if not exists is_public boolean not null default true;

create index if not exists crews_is_public_idx
  on public.crews (is_public)
  where is_public = true;

create table if not exists public.crew_join_requests (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  message text check (message is null or char_length(message) <= 200),
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create unique index if not exists crew_join_requests_pending_unique
  on public.crew_join_requests (crew_id, user_id)
  where status = 'PENDING';

create index if not exists crew_join_requests_crew_status_idx
  on public.crew_join_requests (crew_id, status, created_at desc);

create index if not exists crew_join_requests_user_id_idx
  on public.crew_join_requests (user_id);

alter table public.crew_join_requests enable row level security;

create policy "crew_join_requests_select_self_or_owner"
on public.crew_join_requests for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_crew_owner(crew_id)
);

-- Inserts/updates go through SECURITY DEFINER RPCs only.

create or replace function public.create_crew(
  p_name text,
  p_description text default null,
  p_is_public boolean default true
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

  insert into public.crews (name, description, owner_id, invite_code, is_public)
  values (v_name, v_description, v_user_id, v_code, coalesce(p_is_public, true))
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

create or replace function public.list_public_crews()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'description', c.description,
          'member_count', (
            select count(*)::int
            from public.crew_members cm
            where cm.crew_id = c.id
          ),
          'is_member', exists (
            select 1
            from public.crew_members m
            where m.crew_id = c.id
              and m.user_id = v_user_id
          ),
          'pending_request', exists (
            select 1
            from public.crew_join_requests r
            where r.crew_id = c.id
              and r.user_id = v_user_id
              and r.status = 'PENDING'
          )
        )
        order by c.created_at desc
      )
      from public.crews c
      where c.is_public = true
    ),
    '[]'::jsonb
  );
end;
$$;

create or replace function public.get_crew_preview_by_invite_code(p_invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_crew public.crews%rowtype;
  v_code text := upper(trim(p_invite_code));
  v_member_count int;
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

  select count(*)::int into v_member_count
  from public.crew_members
  where crew_id = v_crew.id;

  return jsonb_build_object(
    'ok', true,
    'crew', jsonb_build_object(
      'id', v_crew.id,
      'name', v_crew.name,
      'description', v_crew.description,
      'is_public', v_crew.is_public,
      'invite_code', v_crew.invite_code,
      'member_count', v_member_count,
      'is_member', exists (
        select 1 from public.crew_members
        where crew_id = v_crew.id and user_id = v_user_id
      ),
      'pending_request', exists (
        select 1 from public.crew_join_requests
        where crew_id = v_crew.id
          and user_id = v_user_id
          and status = 'PENDING'
      )
    )
  );
end;
$$;

create or replace function public.get_crew_public_preview(p_crew_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_crew public.crews%rowtype;
  v_member_count int;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select * into v_crew
  from public.crews
  where id = p_crew_id;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;

  if not v_crew.is_public and not public.is_crew_member(v_crew.id) then
    return jsonb_build_object('ok', false, 'reason', 'FORBIDDEN');
  end if;

  select count(*)::int into v_member_count
  from public.crew_members
  where crew_id = v_crew.id;

  return jsonb_build_object(
    'ok', true,
    'crew', jsonb_build_object(
      'id', v_crew.id,
      'name', v_crew.name,
      'description', v_crew.description,
      'is_public', v_crew.is_public,
      'invite_code', case
        when public.is_crew_member(v_crew.id) then v_crew.invite_code
        else null
      end,
      'member_count', v_member_count,
      'is_member', public.is_crew_member(v_crew.id),
      'pending_request', exists (
        select 1 from public.crew_join_requests
        where crew_id = v_crew.id
          and user_id = v_user_id
          and status = 'PENDING'
      ),
      'is_owner', public.is_crew_owner(v_crew.id)
    )
  );
end;
$$;

create or replace function public.request_join_crew(
  p_message text default null,
  p_crew_id uuid default null,
  p_invite_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_crew public.crews%rowtype;
  v_code text := upper(trim(coalesce(p_invite_code, '')));
  v_message text := nullif(trim(coalesce(p_message, '')), '');
  v_request_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if v_message is not null and char_length(v_message) > 200 then
    return jsonb_build_object('ok', false, 'reason', 'INVALID_MESSAGE');
  end if;

  if p_crew_id is not null then
    select * into v_crew from public.crews where id = p_crew_id;
  elsif v_code <> '' then
    select * into v_crew from public.crews where invite_code = v_code;
  else
    return jsonb_build_object('ok', false, 'reason', 'INVALID_TARGET');
  end if;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;

  if not v_crew.is_public then
    if p_invite_code is null
      or v_crew.invite_code <> upper(trim(p_invite_code)) then
      return jsonb_build_object('ok', false, 'reason', 'FORBIDDEN');
    end if;
  end if;

  if exists (
    select 1 from public.crew_members
    where crew_id = v_crew.id and user_id = v_user_id
  ) then
    return jsonb_build_object('ok', false, 'reason', 'ALREADY_MEMBER', 'crew_id', v_crew.id);
  end if;

  if exists (
    select 1 from public.crew_join_requests
    where crew_id = v_crew.id
      and user_id = v_user_id
      and status = 'PENDING'
  ) then
    return jsonb_build_object('ok', false, 'reason', 'ALREADY_PENDING', 'crew_id', v_crew.id);
  end if;

  insert into public.crew_join_requests (crew_id, user_id, message, status)
  values (v_crew.id, v_user_id, v_message, 'PENDING')
  returning id into v_request_id;

  return jsonb_build_object(
    'ok', true,
    'request_id', v_request_id,
    'crew_id', v_crew.id
  );
end;
$$;

create or replace function public.list_crew_join_requests(p_crew_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if not public.is_crew_owner(p_crew_id) then
    return jsonb_build_object('ok', false, 'reason', 'FORBIDDEN');
  end if;

  return jsonb_build_object(
    'ok', true,
    'requests', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', r.id,
            'user_id', r.user_id,
            'nickname', p.nickname,
            'avatar_url', p.avatar_url,
            'message', r.message,
            'status', r.status,
            'created_at', r.created_at
          )
          order by r.created_at asc
        )
        from public.crew_join_requests r
        join public.profiles p on p.id = r.user_id
        where r.crew_id = p_crew_id
          and r.status = 'PENDING'
      ),
      '[]'::jsonb
    )
  );
end;
$$;

create or replace function public.decide_crew_join_request(
  p_request_id uuid,
  p_decision text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.crew_join_requests%rowtype;
  v_decision text := upper(trim(p_decision));
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if v_decision not in ('APPROVED', 'REJECTED') then
    return jsonb_build_object('ok', false, 'reason', 'INVALID_DECISION');
  end if;

  select * into v_request
  from public.crew_join_requests
  where id = p_request_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NOT_FOUND');
  end if;

  if not public.is_crew_owner(v_request.crew_id) then
    return jsonb_build_object('ok', false, 'reason', 'FORBIDDEN');
  end if;

  if v_request.status <> 'PENDING' then
    return jsonb_build_object('ok', false, 'reason', 'ALREADY_DECIDED');
  end if;

  if v_decision = 'APPROVED' then
    insert into public.crew_members (crew_id, user_id, role)
    values (v_request.crew_id, v_request.user_id, 'MEMBER')
    on conflict do nothing;
  end if;

  update public.crew_join_requests
  set status = v_decision,
      decided_at = now()
  where id = v_request.id;

  return jsonb_build_object(
    'ok', true,
    'crew_id', v_request.crew_id,
    'status', v_decision
  );
end;
$$;

-- Immediate join by invite code is retired in favor of request + approval.
drop function if exists public.join_crew_by_invite_code(text);

alter function public.create_crew(text, text, boolean) owner to postgres;
alter function public.list_public_crews() owner to postgres;
alter function public.get_crew_preview_by_invite_code(text) owner to postgres;
alter function public.get_crew_public_preview(uuid) owner to postgres;
alter function public.request_join_crew(text, uuid, text) owner to postgres;
alter function public.list_crew_join_requests(uuid) owner to postgres;
alter function public.decide_crew_join_request(uuid, text) owner to postgres;

revoke all on function public.create_crew(text, text, boolean) from public;
revoke all on function public.list_public_crews() from public;
revoke all on function public.get_crew_preview_by_invite_code(text) from public;
revoke all on function public.get_crew_public_preview(uuid) from public;
revoke all on function public.request_join_crew(text, uuid, text) from public;
revoke all on function public.list_crew_join_requests(uuid) from public;
revoke all on function public.decide_crew_join_request(uuid, text) from public;

grant execute on function public.create_crew(text, text, boolean) to authenticated, service_role;
grant execute on function public.list_public_crews() to authenticated, service_role;
grant execute on function public.get_crew_preview_by_invite_code(text) to authenticated, service_role;
grant execute on function public.get_crew_public_preview(uuid) to authenticated, service_role;
grant execute on function public.request_join_crew(text, uuid, text) to authenticated, service_role;
grant execute on function public.list_crew_join_requests(uuid) to authenticated, service_role;
grant execute on function public.decide_crew_join_request(uuid, text) to authenticated, service_role;

-- Keep older 2-arg create_crew signature working if still referenced during deploy.
create or replace function public.create_crew(
  p_name text,
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.create_crew(p_name, p_description, true);
end;
$$;

alter function public.create_crew(text, text) owner to postgres;
revoke all on function public.create_crew(text, text) from public;
grant execute on function public.create_crew(text, text) to authenticated, service_role;
