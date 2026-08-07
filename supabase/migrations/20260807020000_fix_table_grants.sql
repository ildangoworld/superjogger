-- Fix table privileges for Supabase API roles.
-- "permission denied for table ..." is a GRANT issue, not RLS.

grant usage on schema public to postgres, anon, authenticated, service_role;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.user_preferences to authenticated;
grant select, insert, update, delete on table public.weekly_goals to authenticated;

grant all on table public.profiles to service_role;
grant all on table public.user_preferences to service_role;
grant all on table public.weekly_goals to service_role;

do $$
begin
  if to_regclass('public.workouts') is not null then
    execute 'grant select, insert, update, delete on table public.workouts to authenticated';
    execute 'grant all on table public.workouts to service_role';
  end if;

  if to_regclass('public.weekly_summaries') is not null then
    execute 'grant select, insert, update, delete on table public.weekly_summaries to authenticated';
    execute 'grant all on table public.weekly_summaries to service_role';
  end if;
end
$$;

grant usage, select on all sequences in schema public to authenticated, service_role;

-- Allow authenticated users to create their own profile row if the signup trigger missed it.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own"
on public.user_preferences for insert
to authenticated
with check (auth.uid() = user_id);

-- Ensure the auth trigger can write profiles even when RLS is enabled.
alter function public.handle_new_user() owner to postgres;
grant execute on function public.handle_new_user() to postgres, service_role;
