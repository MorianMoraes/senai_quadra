-- Ensure role checks fail closed for anonymous, missing and suspended profiles.
-- Existing SECURITY DEFINER routines compare the result of current_app_role().
create or replace function private.current_app_role()
returns text language sql stable security definer set search_path = '' as $$
  select coalesce((select p.role from public.profiles p where p.id = (select auth.uid()) and not p.suspended), 'unauthorized')
$$;
revoke all on function private.current_app_role() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.current_app_role() to anon, authenticated;
notify pgrst, 'reload schema';
