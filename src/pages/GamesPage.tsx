import { useEffect, useState, type FormEvent } from 'react';
import type { Game, MatchSet, Route, Sport } from '../types/models';
import { useApp } from '../contexts/AppContext';
import { Button, Card, Empty, Field, Modal, SelectField, Status } from '../components/ui';
import { cancelGame, createGame, joinGame, leaveGame, MAX_GAME_PLAYERS, saveScore } from '../services/games';
import { addDays, fmtDate, startTime, teamName, userName } from '../utils/format';
import { field } from '../utils/validation';
import { SportIcon, SportLabel, sports, availableSports } from '../components/SportIcon';
import { sportCategory } from '../utils/sports';

function gameTitle(game: Game, state: ReturnType<typeof useApp>['state']): string {
  return game.team1 || game.team2 ? `${teamName(state, game.team1)} × ${teamName(state, game.team2)}` : sports.find(item => item.id === game.sport)?.name ?? 'Partida';
}

export function GameDetails({ game, onClose }: { game: Game; onClose: () => void }) {
  const { state } = useApp();
  return <Modal title={gameTitle(game, state)} onClose={onClose}><div className="game-sport-detail"><SportLabel sport={game.sport} /></div><div className="grid-equal"><div><p><strong>Data:</strong> {fmtDate(game.date)}</p><p><strong>Horário:</strong> {game.time}</p><p><strong>Duração:</strong> {game.duration ? `${game.duration} min` : 'Livre'}</p><p><strong>Calendário:</strong> {game.calendar && game.calendar !== 'geral' ? game.calendar : 'Agenda esportiva geral'}</p><p><strong>Unidade:</strong> {game.unit || 'Não informada'}</p><p><strong>Espaço:</strong> {game.court}</p><p><strong>Status:</strong> {game.status}</p></div><div><p><strong>Participantes ({game.participantIds.length}/{Math.min(game.limit, MAX_GAME_PLAYERS)}):</strong></p><p className="muted">{game.participantIds.map(id => userName(state, id)).join(', ') || 'Nenhum inscrito ainda.'}</p></div></div><p><strong>Descrição:</strong> {game.description || '—'}</p><p><strong>Observações:</strong> {game.notes || '—'}</p>{game.sets.map((set, index) => <div className="list-item" key={index}><strong>{game.team1 || game.team2 ? `Set ${index + 1}` : `Rodada ${index + 1}`}</strong><span>{set.a} × {set.b}</span></div>)}</Modal>;
}

function ScoreModal({ game, onClose }: { game: Game; onClose: () => void }) {
  const { state, actAsync, notify } = useApp();
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget), sets: MatchSet[] = [];
    for (let index = 0; index < 3; index++) {
      const a = field(data, `a${index}`), b = field(data, `b${index}`);
      if ((a === '') !== (b === '')) { notify('Preencha os dois placares de cada rodada.', true); return; }
      if (a !== '' && b !== '') sets.push({ a: Number(a), b: Number(b) });
    }
    setBusy(true);
    try {
      if (await actAsync((draft, actor) => saveScore(draft, actor, game.id, sets), 'Resultado salvo.')) onClose();
    } finally { setBusy(false); }
  }
  const teamA = game.team1 ? teamName(state, game.team1) : 'Participante 1';
  const teamB = game.team2 ? teamName(state, game.team2) : 'Participante 2';
  return <Modal title="Registrar resultado" onClose={onClose}><form onSubmit={submit}><div className="form-grid">{[0, 1, 2].map(index => <div className="form-field full" key={index}><div className="form-grid"><Field label={`Rodada ${index + 1} — ${teamA}`} name={`a${index}`} type="number" min={0} defaultValue={game.sets[index]?.a ?? ''} /><Field label={`Rodada ${index + 1} — ${teamB}`} name={`b${index}`} type="number" min={0} defaultValue={game.sets[index]?.b ?? ''} /></div></div>)}</div><div className="modal-footer"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar resultado'}</Button></div></form></Modal>;
}

export function GamesPage({ navigate, initialCategory = '', initialCalendar = '', myOnly = false, embedded = false }: { navigate: (route: Route) => void; initialCategory?: string; initialCalendar?: string; myOnly?: boolean; embedded?: boolean }) {
  const { state, user, actAsync } = useApp();
  const [detail, setDetail] = useState<string | null>(null), [scoreGame, setScoreGame] = useState<Game | null>(null);
  const [dateFilter, setDateFilter] = useState(''), [teamFilter, setTeamFilter] = useState(''), [statusFilter, setStatusFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState(''), [spaceFilter, setSpaceFilter] = useState(''), [sportFilter, setSportFilter] = useState(''), [categoryFilter, setCategoryFilter] = useState(initialCategory), [calendarFilter, setCalendarFilter] = useState(initialCalendar), [myGamesOnly, setMyGamesOnly] = useState(myOnly);
  useEffect(() => { setCategoryFilter(initialCategory); setSportFilter(''); }, [initialCategory]);
  useEffect(() => { setCalendarFilter(initialCalendar); }, [initialCalendar]);
  useEffect(() => { setMyGamesOnly(myOnly); }, [myOnly]);
  const detailGame = state.games.find(game => game.id === detail);
  const games = [...state.games].filter(game => (!myGamesOnly || Boolean(user && game.participantIds.includes(user.id))) && (!calendarFilter || (game.calendar || 'geral') === calendarFilter) && (!categoryFilter || sportCategory(game.sport) === categoryFilter) && (!dateFilter || game.date === dateFilter) && (!teamFilter || game.team1 === teamFilter || game.team2 === teamFilter) && (!statusFilter || game.status === statusFilter) && (!spaceFilter || game.court === spaceFilter) && (!unitFilter || game.unit === unitFilter) && (!sportFilter || game.sport === sportFilter)).sort((a, b) => startTime(a.date, a.time) - startTime(b.date, b.time));
  return <>{!embedded && <div className="section-title"><h2>Jogos e atividades</h2>{(user?.role === 'director' || user?.role === 'sesi') && <Button onClick={() => navigate('createGame')}>＋ Criar jogo</Button>}</div>}
    {!embedded && <div className="category-tabs" role="group" aria-label="Categoria de atividade">{[['','Todas'],['quadra','Quadra'],['verao','Jogos de Verão'],['mesa','Jogos de Mesa']].map(([value,label]) => <button type="button" key={value} aria-pressed={categoryFilter===value} onClick={() => { setCategoryFilter(value!); setSportFilter(''); }}>{label}</button>)}</div>}
    {!embedded && user?.role === 'student' && <div className="category-tabs"><button type="button" aria-pressed={myGamesOnly} onClick={() => setMyGamesOnly(value => !value)}>{myGamesOnly ? 'Todos os jogos' : 'Minhas inscrições'}</button></div>}
    <Card className="table-wrap"><div className="sport-filter" role="group" aria-label="Filtrar por modalidade"><button type="button" aria-pressed={!sportFilter} onClick={() => setSportFilter('')}>Todas</button>{availableSports.filter(sport => !categoryFilter || sport.category === categoryFilter).map(sport => <button type="button" key={sport.id} aria-label={`Filtrar ${sport.name}`} title={sport.name} aria-pressed={sportFilter===sport.id} onClick={() => setSportFilter(sport.id)}><SportIcon sport={sport.id} /><span>{sport.name}</span></button>)}</div><div className="game-filters"><label>Data<input aria-label="Filtrar por data" type="date" value={dateFilter} onChange={event => setDateFilter(event.target.value)} /></label>{!embedded && new Set(state.games.map(game => game.calendar || 'geral')).size > 1 && <label>Calendário<select aria-label="Filtrar por calendário" value={calendarFilter} onChange={event => setCalendarFilter(event.target.value)}><option value="">Todos</option>{[...new Set(state.games.map(game => game.calendar || 'geral'))].map(value => <option key={value} value={value}>{value === 'geral' ? 'Agenda esportiva geral' : value}</option>)}</select></label>}<label>Unidade<select aria-label="Filtrar por unidade" value={unitFilter} onChange={event => setUnitFilter(event.target.value)}><option value="">Todas as unidades</option>{[...new Set(state.games.map(game => game.unit).filter((unit): unit is string => Boolean(unit)))].map(unit => <option key={unit} value={unit}>{unit}</option>)}</select></label><label>Equipe<select aria-label="Filtrar por equipe" value={teamFilter} onChange={event => setTeamFilter(event.target.value)}><option value="">Todas as equipes</option>{state.teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label><label>Espaço<select aria-label="Filtrar por espaço" value={spaceFilter} onChange={event => setSpaceFilter(event.target.value)}><option value="">Todos os espaços</option>{[...new Set(state.games.map(game => game.court))].map(space => <option key={space} value={space}>{space}</option>)}</select></label><label>Situação<select aria-label="Filtrar por situação" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="">Todas</option><option value="inscricoes">Inscrições abertas</option><option value="agendado">Agendado</option><option value="finalizado">Finalizado</option><option value="cancelado">Cancelado</option></select></label></div>
      {games.length ? <table className="game-table"><thead><tr><th>Data</th><th>Atividade</th><th>Horário</th><th>Unidade / espaço</th><th>Participantes</th><th>Status</th><th>Ações</th></tr></thead><tbody>{games.map(game => {
        const joined = Boolean(user && game.participantIds.includes(user.id)), upcoming = startTime(game.date, game.time) > Date.now(), open = ['inscricoes', 'agendado'].includes(game.status);
        const cap = Math.min(game.limit, MAX_GAME_PLAYERS), full = game.participantIds.length >= cap;
        return <tr key={game.id}><td data-label="Data">{fmtDate(game.date)}</td><td data-label="Atividade"><SportLabel sport={game.sport} /><strong>{gameTitle(game, state)}</strong><small className="muted">{game.calendar && game.calendar !== 'geral' ? game.calendar : 'Agenda esportiva geral'}</small></td><td data-label="Horário">{game.time}{game.duration > 0 ? ` · ${game.duration} min` : ''}</td><td data-label="Unidade / espaço">{game.unit || 'Não informada'}<small className="muted">{game.court}</small></td><td data-label="Participantes">{game.participantIds.length}/{cap}</td><td data-label="Situação"><Status color={game.status === 'finalizado' ? 'green' : game.status === 'cancelado' ? 'red' : 'blue'}>{game.status}</Status></td><td data-label="Ações"><div className="table-actions"><button type="button" className="link-btn" onClick={() => setDetail(game.id)}>Detalhes</button>{user?.role === 'student' && open && upcoming && (joined ? startTime(game.date, game.time) - Date.now() > 15 * 60_000 && <button type="button" className="link-btn" onClick={() => { void actAsync((draft, actor) => leaveGame(draft, actor, game.id), 'Participação cancelada.'); }}>Sair</button> : <button type="button" className="link-btn" disabled={full} onClick={() => { void actAsync((draft, actor) => joinGame(draft, actor, game.id), 'Inscrição confirmada.'); }}>{full ? 'Lotado' : 'Inscrever-se'}</button>)}{(user?.role === 'director' || user?.role === 'sesi') && game.status !== 'cancelado' && <><button type="button" className="link-btn" onClick={() => setScoreGame(game)}>Resultado</button>{game.status !== 'finalizado' && <button type="button" className="link-btn" onClick={() => { if (confirm('Cancelar este jogo?')) void actAsync((draft, actor) => cancelGame(draft, actor, game.id), 'Jogo cancelado.'); }}>Cancelar</button>}</>}</div></td></tr>;
      })}</tbody></table> : <Empty>{state.games.length ? 'Nenhuma atividade corresponde aos filtros.' : 'Nenhum jogo cadastrado.'}</Empty>}
    </Card>{detailGame && <GameDetails game={detailGame} onClose={() => setDetail(null)} />}{scoreGame && <ScoreModal game={scoreGame} onClose={() => setScoreGame(null)} />}</>;
}

export function CreateGamePage({ navigate, initialTournamentId }: { navigate: (route: Route) => void; initialTournamentId?: string }) {
  const { state, user, actAsync, notify } = useApp();
  const eligibleTournaments = state.tournaments.filter(tournament => tournament.status !== 'finalizado' && tournament.teamIds.length >= 2);
  const [selectedTournamentId, setSelectedTournamentId] = useState(() => eligibleTournaments.find(tournament=>tournament.id===initialTournamentId)?.id ?? eligibleTournaments[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  if (!user || (user.role !== 'director')) return <Empty>Somente o diretor pode criar jogos.</Empty>;
  const units = [...new Set(state.games.map(game => game.unit).filter((unit): unit is string => Boolean(unit)))];
  const spaces = [...new Set(state.games.map(game => game.court).filter(Boolean))];
  const customCalendars = [...new Set(state.games.map(game => game.calendar).filter((value): value is string => Boolean(value && value !== 'geral')))];
  const selectedTournament = eligibleTournaments.find(tournament => tournament.id === selectedTournamentId);
  const category = sportCategory(selectedTournament?.sport ?? 'volei');
  const tournamentTeams = selectedTournament?.teamIds.map(id => state.teams.find(team => team.id === id)).filter((team): team is NonNullable<typeof team> => Boolean(team)) ?? [];
  if (!eligibleTournaments.length) return <Card><h2>Nenhum campeonato disponível</h2><p>Crie um campeonato e inscreva pelo menos duas equipes antes de cadastrar uma partida.</p><Button onClick={() => navigate('tournaments')}>Abrir campeonatos</Button></Card>;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const sport = field(data, 'sport') as Sport;
    const durationText = field(data, 'duration');
    const selectedCalendar = field(data, 'calendar');
    const calendar = selectedCalendar === '__novo__' ? field(data, 'newCalendar') : selectedCalendar;
    if (selectedCalendar === '__novo__' && !calendar) { notify('Informe o nome do novo calendário.', true); return; }
    setBusy(true);
    try {
      if (await actAsync((draft, actor) => createGame(draft, actor, { tournamentId: field(data, 'tournamentId'), sport, date: field(data, 'date'), time: field(data, 'time'), unit: field(data, 'unit'), court: field(data, 'court'), calendar, duration: durationText ? Number(durationText) : 0, team1: field(data, 'team1'), team2: field(data, 'team2'), limit: Number(field(data, 'limit')), description: field(data, 'description'), notes: field(data, 'notes'), reportName: field(data, 'reportName'), reportUrl: field(data, 'reportUrl'), status: 'inscricoes' }), 'Jogo criado no campeonato.')) navigate('calendar');
    } finally { setBusy(false); }
  }
  return <Card><div className="section-title"><h2>Novo jogo do campeonato</h2><Status>Diretor</Status></div><form onSubmit={submit}><div className="form-grid">
    <div className="form-field full"><label htmlFor="game-tournament">Campeonato</label><select id="game-tournament" name="tournamentId" value={selectedTournamentId} onChange={event=>setSelectedTournamentId(event.target.value)} required>{eligibleTournaments.map(tournament=><option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}</select></div>
    <div className="form-field full"><span className="field-label">Modalidade do campeonato</span><strong>{sports.find(item=>item.id===selectedTournament?.sport)?.name ?? selectedTournament?.sport}</strong><input type="hidden" name="sport" value={selectedTournament?.sport ?? "volei"}/></div>
    <Field label="Unidade do SENAI" name="unit" list="senai-units" placeholder="Informe a unidade" required /><datalist id="senai-units">{units.map(unit => <option key={unit} value={unit} />)}</datalist>
    <Field label="Local ou espaço" name="court" list="senai-spaces" placeholder={category === 'quadra' ? 'Ex.: quadra coberta' : 'Ex.: sala de jogos'} required /><datalist id="senai-spaces">{spaces.map(space => <option key={space} value={space} />)}</datalist>
    <SelectField label="Calendário" name="calendar" defaultValue="geral"><option value="geral">Agenda esportiva geral</option>{customCalendars.map(value => <option key={value} value={value}>{value}</option>)}<option value="__novo__">Criar novo calendário…</option></SelectField>
    <Field label="Nome do novo calendário (se selecionado)" name="newCalendar" placeholder="Ex.: Jogos Interclasses 2026" />
    <Field label="Data" name="date" type="date" min={addDays(1)} required /><Field label="Horário" name="time" type="time" required />
    <Field key={`duration-${category}`} label={category === 'quadra' ? 'Duração (minutos)' : 'Duração (opcional, minutos)'} name="duration" type="number" min={category === 'quadra' ? 60 : 0} step={1} defaultValue={category === 'quadra' ? 60 : ''} required={category === 'quadra'} />
    <SelectField label="Equipe 1" name="team1" required><option value="">Selecione</option>{tournamentTeams.map(team=><option key={team.id} value={team.id}>{team.name}</option>)}</SelectField><SelectField label="Equipe 2" name="team2" required><option value="">Selecione</option>{tournamentTeams.map(team=><option key={team.id} value={team.id}>{team.name}</option>)}</SelectField>
    <Field key={`limit-${category}`} label="Limite de participantes" name="limit" type="number" min={1} max={MAX_GAME_PLAYERS} defaultValue={category === 'quadra' ? MAX_GAME_PLAYERS : 2} required />
    <Field full label="Informações da atividade" name="description" placeholder="Detalhes para os participantes" /><div className="form-field full"><label htmlFor="gameNotes">Observações</label><textarea id="gameNotes" name="notes" /></div><Field label="Nome do relatório (opcional)" name="reportName"/><Field label="Link do relatório (opcional)" name="reportUrl" type="url"/>
  </div><Button type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar atividade'}</Button></form></Card>;
}
