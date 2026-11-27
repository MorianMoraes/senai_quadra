-- Private roster records: never expose CPF, birth dates or enrollment numbers publicly.
create table if not exists public.team_players_private (
  id text primary key,
  team_id text not null,
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  birth_date date not null,
  cpf text not null check (cpf ~ '^[0-9]{11}$'),
  enrollment text not null check (length(trim(enrollment)) between 1 and 40),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists team_players_private_cpf_unique on public.team_players_private (cpf);
create unique index if not exists team_players_private_enrollment_unique on public.team_players_private (lower(enrollment));
alter table public.team_players_private enable row level security;
revoke all on public.team_players_private from anon, public;
grant select, insert, update, delete on public.team_players_private to authenticated;

drop policy if exists "private roster read" on public.team_players_private;
create policy "private roster read" on public.team_players_private for select to authenticated
using (
  (select private.current_app_role()) in ('sesi','director')
  or ((select private.current_app_role()) = 'teacher' and exists (
    select 1 from public.sports_state s,
      jsonb_array_elements(coalesce(s.payload -> 'teams','[]'::jsonb)) t
    where s.id = 1 and t ->> 'id' = team_id
      and ((t ->> 'creatorId') = (select auth.uid())::text
        or coalesce(t -> 'teacherIds','[]'::jsonb) ? (select auth.uid())::text)
  ))
);
drop policy if exists "private roster insert" on public.team_players_private;
create policy "private roster insert" on public.team_players_private for insert to authenticated
with check (
  created_by = (select auth.uid()) and (
    (select private.current_app_role()) in ('sesi','director')
    or ((select private.current_app_role()) = 'teacher' and exists (
      select 1 from public.sports_state s,
        jsonb_array_elements(coalesce(s.payload -> 'teams','[]'::jsonb)) t
      where s.id = 1 and t ->> 'id' = team_id
        and ((t ->> 'creatorId') = (select auth.uid())::text
          or coalesce(t -> 'teacherIds','[]'::jsonb) ? (select auth.uid())::text)
    ))
  )
);
drop policy if exists "private roster update" on public.team_players_private;
create policy "private roster update" on public.team_players_private for update to authenticated
using (
  (select private.current_app_role()) in ('sesi','director')
  or ((select private.current_app_role()) = 'teacher' and created_by = (select auth.uid()) and exists (
    select 1 from public.sports_state s,
      jsonb_array_elements(coalesce(s.payload -> 'teams','[]'::jsonb)) t
    where s.id = 1 and t ->> 'id' = team_id
      and ((t ->> 'creatorId') = (select auth.uid())::text
        or coalesce(t -> 'teacherIds','[]'::jsonb) ? (select auth.uid())::text)
  ))
) with check (
  (select private.current_app_role()) in ('sesi','director')
  or ((select private.current_app_role()) = 'teacher' and created_by = (select auth.uid()) and exists (
    select 1 from public.sports_state s,
      jsonb_array_elements(coalesce(s.payload -> 'teams','[]'::jsonb)) t
    where s.id = 1 and t ->> 'id' = team_id
      and ((t ->> 'creatorId') = (select auth.uid())::text
        or coalesce(t -> 'teacherIds','[]'::jsonb) ? (select auth.uid())::text)
  ))
);
drop policy if exists "private roster delete" on public.team_players_private;
create policy "private roster delete" on public.team_players_private for delete to authenticated
using (
  (select private.current_app_role()) in ('sesi','director')
  or ((select private.current_app_role()) = 'teacher' and created_by = (select auth.uid()) and exists (
    select 1 from public.sports_state s,
      jsonb_array_elements(coalesce(s.payload -> 'teams','[]'::jsonb)) t
    where s.id = 1 and t ->> 'id' = team_id
      and ((t ->> 'creatorId') = (select auth.uid())::text
        or coalesce(t -> 'teacherIds','[]'::jsonb) ? (select auth.uid())::text)
  ))
);

-- Tournament notes are private to the authoring team's coach and authorized staff.
create table if not exists public.tournament_team_notes (
  id text primary key,
  tournament_id text not null,
  team_id text not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  note text not null check (length(trim(note)) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tournament_team_notes enable row level security;
revoke all on public.tournament_team_notes from anon, public;
grant select, insert, update, delete on public.tournament_team_notes to authenticated;
drop policy if exists "team notes private read" on public.tournament_team_notes;
create policy "team notes private read" on public.tournament_team_notes for select to authenticated
using (
  (select private.current_app_role()) in ('sesi','director')
  or ((select private.current_app_role()) = 'teacher' and author_id = (select auth.uid()) and exists (
    select 1 from public.sports_state s,
      jsonb_array_elements(coalesce(s.payload -> 'teams','[]'::jsonb)) t
    where s.id = 1 and t ->> 'id' = team_id
      and exists (select 1 from jsonb_array_elements(coalesce(s.payload -> 'tournaments','[]'::jsonb)) tour where tour ->> 'id' = tournament_id and coalesce(tour -> 'teamIds','[]'::jsonb) ? team_id)
      and ((t ->> 'creatorId') = (select auth.uid())::text
        or coalesce(t -> 'teacherIds','[]'::jsonb) ? (select auth.uid())::text)
  ))
);
drop policy if exists "team notes private insert" on public.tournament_team_notes;
create policy "team notes private insert" on public.tournament_team_notes for insert to authenticated
with check (
  author_id = (select auth.uid()) and (select private.current_app_role()) = 'teacher' and exists (
    select 1 from public.sports_state s,
      jsonb_array_elements(coalesce(s.payload -> 'teams','[]'::jsonb)) t
    where s.id = 1 and t ->> 'id' = team_id
      and exists (select 1 from jsonb_array_elements(coalesce(s.payload -> 'tournaments','[]'::jsonb)) tour where tour ->> 'id' = tournament_id and coalesce(tour -> 'teamIds','[]'::jsonb) ? team_id)
      and ((t ->> 'creatorId') = (select auth.uid())::text
        or coalesce(t -> 'teacherIds','[]'::jsonb) ? (select auth.uid())::text)
  )
);
drop policy if exists "team notes private update" on public.tournament_team_notes;
create policy "team notes private update" on public.tournament_team_notes for update to authenticated
using (
  (author_id = (select auth.uid()) and (select private.current_app_role()) = 'teacher' and exists (
    select 1 from public.sports_state s,
      jsonb_array_elements(coalesce(s.payload -> 'teams','[]'::jsonb)) t
    where s.id = 1 and t ->> 'id' = team_id
      and exists (select 1 from jsonb_array_elements(coalesce(s.payload -> 'tournaments','[]'::jsonb)) tour where tour ->> 'id' = tournament_id and coalesce(tour -> 'teamIds','[]'::jsonb) ? team_id)
      and ((t ->> 'creatorId') = (select auth.uid())::text
        or coalesce(t -> 'teacherIds','[]'::jsonb) ? (select auth.uid())::text)
  )) or (select private.current_app_role()) in ('sesi','director')
) with check (
  (author_id = (select auth.uid()) and (select private.current_app_role()) = 'teacher' and exists (
    select 1 from public.sports_state s,
      jsonb_array_elements(coalesce(s.payload -> 'teams','[]'::jsonb)) t
    where s.id = 1 and t ->> 'id' = team_id
      and exists (select 1 from jsonb_array_elements(coalesce(s.payload -> 'tournaments','[]'::jsonb)) tour where tour ->> 'id' = tournament_id and coalesce(tour -> 'teamIds','[]'::jsonb) ? team_id)
      and ((t ->> 'creatorId') = (select auth.uid())::text
        or coalesce(t -> 'teacherIds','[]'::jsonb) ? (select auth.uid())::text)
  ))
  or (select private.current_app_role()) in ('sesi','director')
);
drop policy if exists "team notes private delete" on public.tournament_team_notes;
create policy "team notes private delete" on public.tournament_team_notes for delete to authenticated
using (
  (author_id = (select auth.uid()) and (select private.current_app_role()) = 'teacher' and exists (
    select 1 from public.sports_state s,
      jsonb_array_elements(coalesce(s.payload -> 'teams','[]'::jsonb)) t
    where s.id = 1 and t ->> 'id' = team_id
      and exists (select 1 from jsonb_array_elements(coalesce(s.payload -> 'tournaments','[]'::jsonb)) tour where tour ->> 'id' = tournament_id and coalesce(tour -> 'teamIds','[]'::jsonb) ? team_id)
      and ((t ->> 'creatorId') = (select auth.uid())::text
        or coalesce(t -> 'teacherIds','[]'::jsonb) ? (select auth.uid())::text)
  ))
  or (select private.current_app_role()) in ('sesi','director')
);

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='team_players_private') then
      alter publication supabase_realtime add table public.team_players_private;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='tournament_team_notes') then
      alter publication supabase_realtime add table public.tournament_team_notes;
    end if;
  end if;
end $$;
notify pgrst, 'reload schema';
