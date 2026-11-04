-- Schema de integração do SENAI Sports. Review existing project objects before applying.
create schema if not exists private;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student','teacher','director')),
  nome text not null default '',
  email text not null default '',
  turma text not null default '',
  idade integer not null default 0 check (idade between 0 and 120),
  matricula text not null default '',
  avatar_url text not null default '',
  suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Add application authorization/profile fields to the existing SENAI profiles table.
-- Existing `nome` and `avatar_url` columns remain the canonical profile fields.
alter table public.profiles add column if not exists role text not null default 'student' check (role in ('student','teacher','director'));
alter table public.profiles add column if not exists email text not null default '';
alter table public.profiles add column if not exists turma text not null default '';
alter table public.profiles add column if not exists idade integer not null default 0;
alter table public.profiles add column if not exists matricula text not null default '';
alter table public.profiles add column if not exists avatar_url text not null default '';
alter table public.profiles add column if not exists suspended boolean not null default false;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email = '';

create table if not exists public.sports_state (
  id smallint primary key check (id = 1),
  payload jsonb not null default '{"teams":[],"games":[],"tournaments":[],"stats":[]}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.sports_state (id) values (1) on conflict (id) do nothing;

create table if not exists public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  action text not null check (char_length(action) <= 500),
  source_legacy_id text unique,
  created_at timestamptz not null default now()
);
alter table public.activity_logs add column if not exists source_legacy_id text unique;
create index if not exists activity_logs_created_at_idx on public.activity_logs (created_at desc);
create index if not exists activity_logs_actor_id_idx on public.activity_logs (actor_id);

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nome, email, turma)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'turma', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function private.current_app_role()
returns text language sql stable security definer set search_path = '' as $$
  select coalesce((select p.role from public.profiles p where p.id = (select auth.uid()) and not p.suspended), 'unauthorized')
$$;
revoke all on function private.current_app_role() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.current_app_role() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.sports_state enable row level security;
alter table public.activity_logs enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
revoke all on public.activity_logs from anon, authenticated;
grant select, insert on public.activity_logs to authenticated;

drop policy if exists "profile owner or director reads profile" on public.profiles;
create policy "profile owner or director reads profile" on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.current_app_role()) = 'director');
drop policy if exists "director manages profiles" on public.profiles;
create policy "director manages profiles" on public.profiles for update to authenticated
using ((select private.current_app_role()) = 'director')
with check ((select private.current_app_role()) = 'director');
revoke insert, update, delete on public.profiles from anon, authenticated;

-- The public directory intentionally omits email, matrícula and age.
create or replace view public.public_profiles with (security_invoker = false) as
select id, role, nome as name, turma, avatar_url as photo, suspended from public.profiles;
revoke all on public.public_profiles from public;
grant select on public.public_profiles to anon, authenticated;

drop policy if exists "sports schedule is public" on public.sports_state;
create policy "sports schedule is public" on public.sports_state for select to anon, authenticated using (true);
drop policy if exists "director or teacher writes sports state" on public.sports_state;
create policy "director or teacher writes sports state" on public.sports_state for update to authenticated
using ((select private.current_app_role()) in ('director','teacher'))
with check ((select private.current_app_role()) in ('director','teacher'));
grant select on public.sports_state to anon, authenticated;
grant update on public.sports_state to authenticated;
revoke insert, delete on public.sports_state from anon, authenticated;

drop policy if exists "directors read activity logs" on public.activity_logs;
create policy "directors read activity logs" on public.activity_logs for select to authenticated
using ((select private.current_app_role()) = 'director');
drop policy if exists "active staff append activity logs" on public.activity_logs;
create policy "active staff append activity logs" on public.activity_logs for insert to authenticated
with check (actor_id = (select auth.uid()) and (select private.current_app_role()) in ('director','teacher'));
grant select, insert on public.activity_logs to authenticated;
revoke update, delete on public.activity_logs from anon, authenticated;

create or replace function public.save_sports_state(next_payload jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if (select private.current_app_role()) not in ('director','teacher') then
    raise exception 'Somente professores e administradores podem gravar dados esportivos pelo sistema.' using errcode = '42501';
  end if;
  if jsonb_typeof(next_payload) <> 'object'
     or jsonb_typeof(next_payload -> 'teams') <> 'array'
     or jsonb_typeof(next_payload -> 'games') <> 'array'
     or jsonb_typeof(next_payload -> 'tournaments') <> 'array'
     or jsonb_typeof(next_payload -> 'stats') <> 'array' then
    raise exception 'Formato dos dados esportivos inválido.' using errcode = '22023';
  end if;
  update public.sports_state set payload = jsonb_build_object(
    'teams', next_payload -> 'teams', 'games', next_payload -> 'games',
    'tournaments', next_payload -> 'tournaments', 'stats', next_payload -> 'stats'
  ), updated_at = now() where id = 1;
end;
$$;
revoke all on function public.save_sports_state(jsonb) from public, anon;
grant execute on function public.save_sports_state(jsonb) to authenticated;

create or replace function public.import_legacy_sports_state(next_payload jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare legacy_log jsonb;
begin
  if (select private.current_app_role()) <> 'director' then
    raise exception 'Somente administradores podem importar dados locais.' using errcode = '42501';
  end if;
  if jsonb_typeof(next_payload) <> 'object'
     or jsonb_typeof(next_payload -> 'teams') <> 'array'
     or jsonb_typeof(next_payload -> 'games') <> 'array'
     or jsonb_typeof(next_payload -> 'tournaments') <> 'array'
     or jsonb_typeof(next_payload -> 'stats') <> 'array'
     or jsonb_typeof(next_payload -> 'logs') <> 'array' then
    raise exception 'Formato da migração inválido.' using errcode = '22023';
  end if;
  update public.sports_state set payload = jsonb_build_object(
    'teams', next_payload -> 'teams', 'games', next_payload -> 'games',
    'tournaments', next_payload -> 'tournaments', 'stats', next_payload -> 'stats'
  ), updated_at = now() where id = 1;
  for legacy_log in select value from jsonb_array_elements(next_payload -> 'logs') loop
    if legacy_log ->> 'actorId' is not null then
      insert into public.activity_logs (actor_id, action, source_legacy_id, created_at)
      values ((legacy_log ->> 'actorId')::uuid, left(legacy_log ->> 'action', 500), legacy_log ->> 'legacyId',
        coalesce((legacy_log ->> 'createdAt')::timestamptz, now()))
      on conflict (source_legacy_id) do nothing;
    end if;
  end loop;
end;
$$;
revoke all on function public.import_legacy_sports_state(jsonb) from public, anon;
grant execute on function public.import_legacy_sports_state(jsonb) to authenticated;

create or replace function public.update_own_profile(next_name text, next_turma text, next_photo text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set nome = left(trim(next_name), 120), turma = left(trim(next_turma), 80),
    avatar_url = left(trim(next_photo), 2048), updated_at = now()
  where id = (select auth.uid()) and not suspended;
  if not found then raise exception 'Perfil indisponível.' using errcode = '42501'; end if;
end;
$$;
revoke all on function public.update_own_profile(text,text,text) from public, anon;
grant execute on function public.update_own_profile(text,text,text) to authenticated;

create or replace function public.set_profile_suspension(target_id uuid, next_suspended boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select private.current_app_role()) <> 'director' then
    raise exception 'Somente administradores podem suspender contas.' using errcode = '42501';
  end if;
  update public.profiles set suspended = next_suspended, updated_at = now()
  where id = target_id and role in ('student','teacher');
  if not found then raise exception 'Conta indisponível para esta ação.' using errcode = '42501'; end if;
end;
$$;
revoke all on function public.set_profile_suspension(uuid,boolean) from public, anon;
grant execute on function public.set_profile_suspension(uuid,boolean) to authenticated;

notify pgrst, 'reload schema';
