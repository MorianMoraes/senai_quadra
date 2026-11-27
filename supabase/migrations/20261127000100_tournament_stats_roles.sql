-- Add the SESI role and public tournament sporting data without replacing existing rows.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('student','teacher','director','sesi'));

drop policy if exists "profile owner or director reads profile" on public.profiles;
create policy "profile owner or authorized staff reads profile" on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.current_app_role()) in ('director','sesi'));
drop policy if exists "director manages profiles" on public.profiles;
create policy "SESI manages profiles" on public.profiles for update to authenticated
using ((select private.current_app_role()) = 'sesi')
with check ((select private.current_app_role()) = 'sesi');

drop policy if exists "director or teacher writes sports state" on public.sports_state;
create policy "authorized staff writes sports state" on public.sports_state for update to authenticated
using ((select private.current_app_role()) in ('director','teacher','sesi'))
with check ((select private.current_app_role()) in ('director','teacher','sesi'));

create or replace function public.save_sports_state(next_payload jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  app_role text := (select private.current_app_role());
  current_payload jsonb;
begin
  if app_role not in ('director','teacher','sesi') then
    raise exception 'Acesso negado para alterar dados esportivos.' using errcode = '42501';
  end if;
  if jsonb_typeof(next_payload) <> 'object' then
    raise exception 'Formato dos dados esportivos inválido.' using errcode = '22023';
  end if;
  select payload into current_payload from public.sports_state where id = 1 for update;
  if app_role = 'teacher' and (
    coalesce(next_payload -> 'games','[]'::jsonb) is distinct from coalesce(current_payload -> 'games','[]'::jsonb)
    or
    coalesce(next_payload -> 'tournaments','[]'::jsonb) is distinct from coalesce(current_payload -> 'tournaments','[]'::jsonb)
    or coalesce(next_payload -> 'standings','[]'::jsonb) is distinct from coalesce(current_payload -> 'standings','[]'::jsonb)
    or coalesce(next_payload -> 'cards','[]'::jsonb) is distinct from coalesce(current_payload -> 'cards','[]'::jsonb)
    or coalesce(next_payload -> 'scorers','[]'::jsonb) is distinct from coalesce(current_payload -> 'scorers','[]'::jsonb)
  ) then raise exception 'Treinadores não podem editar campeonatos, classificação, cartões ou artilheiros.' using errcode = '42501'; end if;
  if app_role = 'teacher' and exists (
    select 1 from (
      select coalesce(n ->> 'id', o ->> 'id') as team_id, n as new_team, o as old_team
      from jsonb_array_elements(coalesce(next_payload -> 'teams','[]'::jsonb)) n
      full join jsonb_array_elements(coalesce(current_payload -> 'teams','[]'::jsonb)) o on n ->> 'id' = o ->> 'id'
    ) changed
    where new_team is distinct from old_team
      and coalesce(old_team ->> 'creatorId', new_team ->> 'creatorId') <> (select auth.uid())::text
      and not coalesce(old_team -> 'teacherIds', '[]'::jsonb) ? (select auth.uid())::text
  ) then raise exception 'Treinadores só podem editar equipes vinculadas ao próprio perfil.' using errcode = '42501'; end if;
  if app_role = 'director' and coalesce(next_payload -> 'tournaments','[]'::jsonb) is distinct from coalesce(current_payload -> 'tournaments','[]'::jsonb) then
    if exists (
      select 1 from jsonb_array_elements(coalesce(next_payload -> 'tournaments','[]'::jsonb)) n
      left join jsonb_array_elements(coalesce(current_payload -> 'tournaments','[]'::jsonb)) o on o ->> 'id' = n ->> 'id'
      where coalesce(n -> 'rounds','[]'::jsonb) is distinct from coalesce(o -> 'rounds','[]'::jsonb)
    ) then raise exception 'Somente o SESI pode alterar chaveamentos e seus resultados.' using errcode = '42501'; end if;
  end if;
  update public.sports_state set payload = jsonb_build_object(
    'teams', coalesce(next_payload -> 'teams','[]'::jsonb),
    'games', coalesce(next_payload -> 'games','[]'::jsonb),
    'tournaments', coalesce(next_payload -> 'tournaments','[]'::jsonb),
    'stats', coalesce(next_payload -> 'stats','[]'::jsonb),
    'standings', coalesce(next_payload -> 'standings','[]'::jsonb),
    'cards', coalesce(next_payload -> 'cards','[]'::jsonb),
    'scorers', coalesce(next_payload -> 'scorers','[]'::jsonb)
  ), updated_at = now() where id = 1;
end;
$$;
revoke all on function public.save_sports_state(jsonb) from public, anon;
grant execute on function public.save_sports_state(jsonb) to authenticated;

create or replace function public.set_profile_suspension(target_id uuid, next_suspended boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select private.current_app_role()) is distinct from 'sesi' then
    raise exception 'Somente o SESI pode suspender contas.' using errcode = '42501';
  end if;
  update public.profiles set suspended = next_suspended, updated_at = now()
  where id = target_id and role in ('student','teacher','director');
  if not found then raise exception 'Conta indisponível para esta ação.' using errcode = '42501'; end if;
end;
$$;
revoke all on function public.set_profile_suspension(uuid,boolean) from public, anon;
grant execute on function public.set_profile_suspension(uuid,boolean) to authenticated;

drop policy if exists "directors read activity logs" on public.activity_logs;
create policy "SESI reads activity logs" on public.activity_logs for select to authenticated
using ((select private.current_app_role()) = 'sesi');
drop policy if exists "active staff append activity logs" on public.activity_logs;
create policy "authorized staff append activity logs" on public.activity_logs for insert to authenticated
with check (actor_id = (select auth.uid()) and (select private.current_app_role()) in ('director','teacher','sesi'));
notify pgrst, 'reload schema';
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sports_state') then
    alter publication supabase_realtime add table public.sports_state;
  end if;
end;
$$;
