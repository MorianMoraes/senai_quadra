-- Keep public participant fields compatible while omitting private profile details.
drop view if exists public.public_profiles;
create view public.public_profiles with (security_invoker = false) as
select id, role, nome as name, avatar_url as photo, null::text as turma, false as suspended
from public.profiles
where not suspended;
revoke all on public.public_profiles from public;
grant select on public.public_profiles to anon, authenticated;
notify pgrst, 'reload schema';