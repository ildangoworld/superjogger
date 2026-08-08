-- Fix infinite recursion in crew_members / crews RLS policies.
-- Safe to re-run: drops and recreates helper functions and policies.

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

drop policy if exists "crews_select_member" on public.crews;
create policy "crews_select_member"
on public.crews for select
to authenticated
using (public.is_crew_member(id));

drop policy if exists "crew_members_select_same_crew" on public.crew_members;
create policy "crew_members_select_same_crew"
on public.crew_members for select
to authenticated
using (public.is_crew_member(crew_id));

drop policy if exists "crew_members_delete_self_or_owner" on public.crew_members;
create policy "crew_members_delete_self_or_owner"
on public.crew_members for delete
to authenticated
using (
  auth.uid() = user_id
  or public.is_crew_owner(crew_id)
);

drop policy if exists "crew_members_update_owner" on public.crew_members;
create policy "crew_members_update_owner"
on public.crew_members for update
to authenticated
using (public.is_crew_owner(crew_id))
with check (public.is_crew_owner(crew_id));
