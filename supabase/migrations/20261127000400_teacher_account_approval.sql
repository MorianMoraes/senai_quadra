-- Pending representative access is stored separately from public sports data.
alter table public.profiles
  add column if not exists approval_status text not null default 'approved';
alter table public.profiles drop constraint if exists profiles_approval_status_check;
alter table public.profiles add constraint profiles_approval_status_check
  check (approval_status in ('pending','approved','rejected'));

create table if not exists public.account_requests (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  responsible_name text not null check (char_length(responsible_name) between 2 and 120),
  team_name text not null check (char_length(team_name) between 1 and 80),
  email text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);
alter table public.account_requests enable row level security;
revoke all on public.account_requests from public, anon, authenticated;
grant select on public.account_requests to authenticated;
drop policy if exists "applicant reads own request or director reads requests" on public.account_requests;
create policy "applicant reads own request or director reads requests" on public.account_requests
  for select to authenticated using (
    user_id = (select auth.uid()) or (select private.current_app_role()) = 'director'
  );

create or replace function private.current_app_role()
returns text language sql stable security definer set search_path = '' as $$
  select coalesce((select p.role from public.profiles p where p.id = (select auth.uid())
    and not p.suspended and p.approval_status = 'approved'), 'unauthorized')
$$;
revoke all on function private.current_app_role() from public;
grant execute on function private.current_app_role() to anon, authenticated;

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  is_representative boolean := new.raw_user_meta_data ->> 'registration_type' = 'teacher';
  person_name text := left(trim(coalesce(new.raw_user_meta_data ->> 'name', '')), 120);
  team text := left(trim(coalesce(new.raw_user_meta_data ->> 'turma', '')), 80);
begin
  insert into public.profiles (id, nome, email, turma, approval_status)
  values (new.id, person_name, coalesce(new.email, ''), team,
    case when is_representative then 'pending' else 'approved' end)
  on conflict (id) do nothing;
  if is_representative then
    insert into public.account_requests (user_id, responsible_name, team_name, email)
    values (new.id, person_name, team, coalesce(new.email, ''))
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.review_teacher_request(target_user uuid, decision text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  request_row public.account_requests%rowtype;
begin
  if (select private.current_app_role()) is distinct from 'director' then
    raise exception 'Somente o diretor pode aprovar ou recusar solicitações.' using errcode = '42501';
  end if;
  if decision not in ('approved','rejected') then
    raise exception 'Decisão inválida.' using errcode = '22023';
  end if;
  select * into request_row from public.account_requests where user_id = target_user for update;
  if not found or request_row.status <> 'pending' then
    raise exception 'Solicitação pendente não encontrada.' using errcode = 'P0002';
  end if;
  update public.account_requests set status = decision, reviewed_at = now(), reviewed_by = (select auth.uid())
    where user_id = target_user;
  update public.profiles set role = case when decision = 'approved' then 'teacher' else 'student' end,
    approval_status = decision, updated_at = now()
    where id = target_user and role = 'student' and not suspended and approval_status = 'pending';
  if not found then raise exception 'Perfil pendente indisponível.' using errcode = '42501'; end if;
  insert into public.activity_logs (actor_id, action)
    values ((select auth.uid()), left(case when decision = 'approved' then 'Aprovou acesso de ' else 'Recusou acesso de ' end || request_row.responsible_name, 500));
end;
$$;
revoke all on function public.review_teacher_request(uuid,text) from public, anon;
grant execute on function public.review_teacher_request(uuid,text) to authenticated;

-- Keep the existing account suspension screen functional for both admin roles.
create or replace function public.set_profile_suspension(target_id uuid, next_suspended boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select private.current_app_role()) not in ('director','sesi') then
    raise exception 'Somente a direção ou o SESI podem suspender contas.' using errcode = '42501';
  end if;
  update public.profiles set suspended = next_suspended, updated_at = now()
    where id = target_id and role in ('student','teacher');
  if not found then raise exception 'Conta indisponível para esta ação.' using errcode = '42501'; end if;
end;
$$;
revoke all on function public.set_profile_suspension(uuid,boolean) from public, anon;
grant execute on function public.set_profile_suspension(uuid,boolean) to authenticated;

drop view if exists public.public_profiles;
create view public.public_profiles with (security_invoker = false) as
select id, role, nome as name, avatar_url as photo, null::text as turma, false as suspended
from public.profiles where not suspended and approval_status = 'approved';
revoke all on public.public_profiles from public;
grant select on public.public_profiles to anon, authenticated;

notify pgrst, 'reload schema';
