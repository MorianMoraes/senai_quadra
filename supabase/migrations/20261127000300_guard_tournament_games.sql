create or replace function private.guard_tournament_game_creation()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  app_role text := (select private.current_app_role());
begin
  if new.payload -> 'games' is not distinct from old.payload -> 'games' then
    return new;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(new.payload -> 'games','[]'::jsonb)) game
    left join jsonb_array_elements(coalesce(old.payload -> 'games','[]'::jsonb)) previous
      on previous ->> 'id' = game ->> 'id'
    where previous is null
      and (
        app_role <> 'director'
        or coalesce(game ->> 'createdBy','') <> (select auth.uid())::text
        or not exists (
          select 1
          from jsonb_array_elements(coalesce(new.payload -> 'tournaments','[]'::jsonb)) tournament
          where tournament ->> 'id' = game ->> 'tournamentId'
            and coalesce(tournament ->> 'status','') <> 'finalizado'
            and coalesce(tournament -> 'teamIds','[]'::jsonb) ? (game ->> 'team1')
            and coalesce(tournament -> 'teamIds','[]'::jsonb) ? (game ->> 'team2')
            and (game ->> 'team1') <> (game ->> 'team2')
            and coalesce(nullif(tournament ->> 'startDate',''),tournament ->> 'date') <= game ->> 'date'
            and coalesce(nullif(tournament ->> 'endDate',''),'9999-12-31') >= game ->> 'date'
        )
      )
  ) then
    raise exception 'Somente o diretor pode criar jogos vinculados a campeonatos e suas equipes inscritas.' using errcode = '42501';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(new.payload -> 'games','[]'::jsonb)) game
    where nullif(game ->> 'tournamentId','') is not null
      and not exists (
        select 1 from jsonb_array_elements(coalesce(new.payload -> 'tournaments','[]'::jsonb)) tournament
        where tournament ->> 'id' = game ->> 'tournamentId'
          and coalesce(tournament -> 'teamIds','[]'::jsonb) ? (game ->> 'team1')
          and coalesce(tournament -> 'teamIds','[]'::jsonb) ? (game ->> 'team2')
          and coalesce(nullif(tournament ->> 'startDate',''),tournament ->> 'date') <= game ->> 'date'
          and coalesce(nullif(tournament ->> 'endDate',''),'9999-12-31') >= game ->> 'date'
      )
  ) then
    raise exception 'O jogo deve pertencer a um campeonato e usar equipes inscritas nele.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists sports_state_guard_tournament_games on public.sports_state;
create trigger sports_state_guard_tournament_games
before update of payload on public.sports_state
for each row execute function private.guard_tournament_game_creation();
