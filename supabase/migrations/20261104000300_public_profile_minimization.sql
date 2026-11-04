-- Keep the public directory limited to names needed to display public participants.
-- Email, class, enrollment number, age and suspended accounts remain private.
drop view if exists public.public_profiles;
create view public.public_profiles with (security_invoker = false) as
select id, role, nome as name, avatar_url as photo
from public.profiles
where not suspended;
revoke all on public.public_profiles from public;
grant select on public.public_profiles to anon, authenticated;
notify pgrst, 'reload schema';
