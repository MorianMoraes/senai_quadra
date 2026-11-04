-- Narrow student write operations. Students never receive UPDATE on sports_state.
create or replace function public.player_create_team(team_id text, team_name text, team_sport text)
returns void language plpgsql security definer set search_path = '' as $$
declare current_payload jsonb;
begin
  if (select private.current_app_role()) is distinct from 'student' then
    raise exception 'Esta operação está disponível para jogadores ativos.' using errcode = '42501';
  end if;
  if nullif(trim(team_id), '') is null or char_length(trim(team_name)) not between 2 and 100 then
    raise exception 'Informe um identificador e nome válidos para a equipe.' using errcode = '22023';
  end if;
  if team_sport not in ('futebol','volei','futsal','handebol','queimada','basquete','xadrez','dama','ludo','pingue-pongue','outra-quadra','outro-tabuleiro') then
    raise exception 'Modalidade inválida.' using errcode = '22023';
  end if;
  select payload into current_payload from public.sports_state where id = 1 for update;
  if exists (
    select 1 from jsonb_array_elements(current_payload -> 'teams') t
    where t ->> 'creatorId' = (select auth.uid())::text
  ) then raise exception 'Você já cadastrou uma equipe.' using errcode = '23505'; end if;
  if exists (select 1 from jsonb_array_elements(current_payload -> 'teams') t where t ->> 'id' = team_id) then
    raise exception 'Este identificador de equipe já existe.' using errcode = '23505';
  end if;
  update public.sports_state set payload = jsonb_set(payload, '{teams}',
    (payload -> 'teams') || jsonb_build_array(jsonb_build_object(
      'id', trim(team_id), 'name', trim(team_name), 'sport', team_sport, 'status', 'pendente',
      'creatorId', (select auth.uid())::text, 'teacherIds', '[]'::jsonb,
      'memberIds', jsonb_build_array((select auth.uid())::text), 'reserveIds', '[]'::jsonb,
      'wins', 0, 'losses', 0, 'draws', 0, 'pointsFor', 0, 'pointsAgainst', 0
    )), true), updated_at = now() where id = 1;
  insert into public.activity_logs (actor_id, action) values ((select auth.uid()), 'Cadastrou uma equipe para um evento');
end;
$$;

create or replace function public.player_join_team(target_team_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare current_payload jsonb; target_team jsonb;
begin
  if (select private.current_app_role()) is distinct from 'student' then
    raise exception 'Esta operação está disponível para jogadores ativos.' using errcode = '42501';
  end if;
  select payload into current_payload from public.sports_state where id = 1 for update;
  select t into target_team from jsonb_array_elements(current_payload -> 'teams') t where t ->> 'id' = target_team_id;
  if target_team is null or target_team ->> 'status' <> 'ativa' then raise exception 'Esta equipe não está disponível.' using errcode = '42501'; end if;
  if exists (select 1 from jsonb_array_elements_text(coalesce(target_team -> 'memberIds','[]'::jsonb)) as members(player_id) where player_id = (select auth.uid())::text)
     or exists (select 1 from jsonb_array_elements_text(coalesce(target_team -> 'reserveIds','[]'::jsonb)) as reserves(player_id) where player_id = (select auth.uid())::text) then
    raise exception 'Você já faz parte desta equipe.' using errcode = '23505';
  end if;
  if jsonb_array_length(coalesce(target_team -> 'memberIds','[]'::jsonb)) >= 6 then raise exception 'A equipe já atingiu o limite de titulares.' using errcode = '23514'; end if;
  if exists (
    select 1 from jsonb_array_elements(current_payload -> 'teams') t
    where t ->> 'id' <> target_team_id and (
      exists (select 1 from jsonb_array_elements_text(coalesce(t -> 'memberIds','[]'::jsonb)) as members(player_id) where player_id = (select auth.uid())::text)
      or exists (select 1 from jsonb_array_elements_text(coalesce(t -> 'reserveIds','[]'::jsonb)) as reserves(player_id) where player_id = (select auth.uid())::text)
    )
  ) then raise exception 'Você já está inscrito em outra equipe.' using errcode = '23505'; end if;
  update public.sports_state set payload = jsonb_set(payload, '{teams}', (
    select jsonb_agg(case when t ->> 'id' = target_team_id
      then jsonb_set(t, '{memberIds}', coalesce(t -> 'memberIds','[]'::jsonb) || jsonb_build_array((select auth.uid())::text), true)
      else t end order by ordinality)
    from jsonb_array_elements(payload -> 'teams') with ordinality as rows(t, ordinality)
  ), true), updated_at = now() where id = 1;
  insert into public.activity_logs (actor_id, action) values ((select auth.uid()), 'Entrou em uma equipe');
end;
$$;

create or replace function public.player_set_team_roster(target_team_id text, requested_members jsonb, requested_reserves jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare current_payload jsonb; target_team jsonb;
begin
  if (select private.current_app_role()) is distinct from 'student' then
    raise exception 'Esta operação está disponível para jogadores ativos.' using errcode = '42501';
  end if;
  if jsonb_typeof(requested_members) <> 'array' or jsonb_typeof(requested_reserves) <> 'array'
     or jsonb_array_length(requested_members) > 6 or jsonb_array_length(requested_reserves) > 4 then
    raise exception 'Selecione até 6 titulares e 4 reservas.' using errcode = '22023';
  end if;
  if not exists (select 1 from jsonb_array_elements_text(requested_members) as m(player_id) where m.player_id = (select auth.uid())::text) then
    raise exception 'O representante precisa permanecer entre os titulares.' using errcode = '42501';
  end if;
  if (select count(*) from jsonb_array_elements_text(requested_members)) <> (select count(distinct value) from jsonb_array_elements_text(requested_members))
     or (select count(*) from jsonb_array_elements_text(requested_reserves)) <> (select count(distinct value) from jsonb_array_elements_text(requested_reserves))
     or exists (select 1 from jsonb_array_elements_text(requested_members) as m(player_id) join jsonb_array_elements_text(requested_reserves) as r(player_id) using (player_id)) then
    raise exception 'Não repita jogadores no elenco.' using errcode = '23505';
  end if;
  if exists (
    select 1 from (
      select player_id from jsonb_array_elements_text(requested_members) as m(player_id)
      union all select player_id from jsonb_array_elements_text(requested_reserves) as r(player_id)
    ) requested
    left join public.profiles p on p.id::text = requested.player_id
    where p.id is null or p.suspended or p.role not in ('student','teacher')
  ) then raise exception 'O elenco pode conter apenas jogadores ativos.' using errcode = '23514'; end if;
  select payload into current_payload from public.sports_state where id = 1 for update;
  select t into target_team from jsonb_array_elements(current_payload -> 'teams') t where t ->> 'id' = target_team_id;
  if target_team is null or target_team ->> 'creatorId' <> (select auth.uid())::text then
    raise exception 'Somente o representante da equipe pode organizar este elenco.' using errcode = '42501';
  end if;
  if exists (select 1 from jsonb_array_elements(current_payload -> 'tournaments') tr where tr -> 'teamIds' ? target_team_id) then
    raise exception 'O elenco está fechado porque a equipe já está inscrita em campeonato.' using errcode = '23514';
  end if;
  if exists (
    select 1 from jsonb_array_elements(current_payload -> 'teams') t
    cross join lateral jsonb_array_elements_text(coalesce(t -> 'memberIds','[]'::jsonb) || coalesce(t -> 'reserveIds','[]'::jsonb)) as roster(player_id)
    where t ->> 'id' <> target_team_id and roster.player_id in (
      select player_id from jsonb_array_elements_text(requested_members) as m(player_id)
      union select player_id from jsonb_array_elements_text(requested_reserves) as r(player_id)
    )
  ) then raise exception 'Um jogador já está vinculado a outra equipe.' using errcode = '23505'; end if;
  update public.sports_state set payload = jsonb_set(payload, '{teams}', (
    select jsonb_agg(case when t ->> 'id' = target_team_id
      then jsonb_set(jsonb_set(t, '{memberIds}', requested_members, true), '{reserveIds}', requested_reserves, true)
      else t end order by ordinality)
    from jsonb_array_elements(payload -> 'teams') with ordinality as rows(t, ordinality)
  ), true), updated_at = now() where id = 1;
  insert into public.activity_logs (actor_id, action) values ((select auth.uid()), 'Atualizou o elenco da própria equipe');
end;
$$;

create or replace function public.player_join_game(target_game_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare current_payload jsonb; target_game jsonb; start_at timestamp;
begin
  if (select private.current_app_role()) is distinct from 'student' then
    raise exception 'Esta operação está disponível para jogadores ativos.' using errcode = '42501';
  end if;
  select payload into current_payload from public.sports_state where id = 1 for update;
  select g into target_game from jsonb_array_elements(current_payload -> 'games') g where g ->> 'id' = target_game_id;
  if target_game is null or target_game ->> 'status' not in ('inscricoes','agendado') then raise exception 'Inscrições indisponíveis.' using errcode = '42501'; end if;
  start_at := (target_game ->> 'date')::date + (target_game ->> 'time')::time;
  if start_at <= timezone('America/Sao_Paulo', now())::timestamp then raise exception 'O horário de inscrição foi encerrado.' using errcode = '23514'; end if;
  if exists (select 1 from jsonb_array_elements_text(coalesce(target_game -> 'participantIds','[]'::jsonb)) as participants(player_id) where player_id = (select auth.uid())::text) then
    raise exception 'Você já está inscrito.' using errcode = '23505';
  end if;
  if jsonb_array_length(coalesce(target_game -> 'participantIds','[]'::jsonb)) >= least(coalesce((target_game ->> 'limit')::integer,20),20) then
    raise exception 'O jogo atingiu o limite de participantes.' using errcode = '23514';
  end if;
  update public.sports_state set payload = jsonb_set(payload, '{games}', (
    select jsonb_agg(case when g ->> 'id' = target_game_id
      then jsonb_set(g, '{participantIds}', coalesce(g -> 'participantIds','[]'::jsonb) || jsonb_build_array((select auth.uid())::text), true)
      else g end order by ordinality)
    from jsonb_array_elements(payload -> 'games') with ordinality as rows(g, ordinality)
  ), true), updated_at = now() where id = 1;
  insert into public.activity_logs (actor_id, action) values ((select auth.uid()), 'Inscreveu-se em um jogo');
end;
$$;

create or replace function public.player_leave_game(target_game_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare current_payload jsonb; target_game jsonb; start_at timestamp;
begin
  if (select private.current_app_role()) is distinct from 'student' then
    raise exception 'Esta operação está disponível para jogadores ativos.' using errcode = '42501';
  end if;
  select payload into current_payload from public.sports_state where id = 1 for update;
  select g into target_game from jsonb_array_elements(current_payload -> 'games') g where g ->> 'id' = target_game_id;
  if target_game is null then raise exception 'Jogo não encontrado.' using errcode = 'P0002'; end if;
  start_at := (target_game ->> 'date')::date + (target_game ->> 'time')::time;
  if start_at - timezone('America/Sao_Paulo', now())::timestamp <= interval '15 minutes' then raise exception 'Não é possível sair faltando 15 minutos ou menos.' using errcode = '23514'; end if;
  if not exists (select 1 from jsonb_array_elements_text(coalesce(target_game -> 'participantIds','[]'::jsonb)) as participants(player_id) where player_id = (select auth.uid())::text) then
    raise exception 'Você não está inscrito neste jogo.' using errcode = 'P0002';
  end if;
  update public.sports_state set payload = jsonb_set(payload, '{games}', (
    select jsonb_agg(case when g ->> 'id' = target_game_id
      then jsonb_set(g, '{participantIds}', coalesce((select jsonb_agg(participant) from jsonb_array_elements(coalesce(g -> 'participantIds','[]'::jsonb)) as players(participant) where participant #>> '{}' <> (select auth.uid())::text),'[]'::jsonb), true)
      else g end order by ordinality)
    from jsonb_array_elements(payload -> 'games') with ordinality as rows(g, ordinality)
  ), true), updated_at = now() where id = 1;
  insert into public.activity_logs (actor_id, action) values ((select auth.uid()), 'Cancelou inscrição em um jogo');
end;
$$;

revoke all on function public.player_create_team(text,text,text) from public, anon;
revoke all on function public.player_join_team(text) from public, anon;
revoke all on function public.player_set_team_roster(text,jsonb,jsonb) from public, anon;
revoke all on function public.player_join_game(text) from public, anon;
revoke all on function public.player_leave_game(text) from public, anon;
grant execute on function public.player_create_team(text,text,text) to authenticated;
grant execute on function public.player_join_team(text) to authenticated;
grant execute on function public.player_set_team_roster(text,jsonb,jsonb) to authenticated;
grant execute on function public.player_join_game(text) to authenticated;
grant execute on function public.player_leave_game(text) to authenticated;

notify pgrst, 'reload schema';
