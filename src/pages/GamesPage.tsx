import { useState, type FormEvent } from 'react';
import type { Game, MatchSet, Route, Sport } from '../types/models';
import { useApp } from '../contexts/AppContext';
import { Button, Card, Empty, Field, Modal, SelectField, Status } from '../components/ui';
import { cancelGame, createGame, joinGame, leaveGame, MAX_GAME_PLAYERS, saveScore } from '../services/games';
import { addDays, fmtDate, startTime, teamName, userName } from '../utils/format';
import { field } from '../utils/validation';
import { SportChoiceGroup, SportIcon, SportLabel, sports } from '../components/SportIcon';
import { sportCategory } from '../utils/sports';

function gameTitle(game: Game, state: ReturnType<typeof useApp>['state']): string {
  return game.team1 || game.team2 ? `${teamName(state, game.team1)} × ${teamName(state, game.team2)}` : sports.find(item => item.id === game.sport)?.name ?? 'Partida';
}

export function GameDetails({ game, onClose }: { game: Game; onClose: () => void }) {
  const { state } = useApp();
  return <Modal title={gameTitle(game, state)} onClose={onClose}><div className="game-sport-detail"><SportLabel sport={game.sport} /></div><div className="grid-equal"><div><p><strong>Data:</strong> {fmtDate(game.date)}</p><p><strong>Horário:</strong> {game.time}</p><p><strong>Duração:</strong> {game.duration ? `${game.duration} min` : 'Livre'}</p><p><strong>Unidade:</strong> {game.unit || 'Não informada'}</p><p><strong>Espaço:</strong> {game.court}</p><p><strong>Status:</strong> {game.status}</p></div><div><p><strong>Participantes ({game.participantIds.length}/{Math.min(game.limit, MAX_GAME_PLAYERS)}):</strong></p><p className="muted">{game.participantIds.map(id => userName(state, id)).join(', ') || 'Nenhum inscrito ainda.'}</p></div></div><p><strong>Descrição:</strong> {game.description || '—'}</p><p><strong>Observações:</strong> {game.notes || '—'}</p>{game.sets.map((set, index) => <div className="list-item" key={index}><strong>{game.team1 || game.team2 ? `Set ${index + 1}` : `Rodada ${index + 1}`}</strong><span>{set.a} × {set.b}</span></div>)}</Modal>;
}

function ScoreModal({ game, onClose }: { game: Game; onClose: () => void }) {
  const { state, act, notify } = useApp();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget), sets: MatchSet[] = [];
    for (let index = 0; index < 3; index++) {
      const a = field(data, `a${index}`), b = field(data, `b${index}`);
      if ((a === '') !== (b === '')) { notify('Preencha os dois placares de cada rodada.', true); return; }
      if (a !== '' && b !== '') sets.push({ a: Number(a), b: Number(b) });
    }
    if (act((draft, actor) => saveScore(draft, actor, game.id, sets), 'Resultado salvo.')) onClose();
  }
  const teamA = game.team1 ? teamName(state, game.team1) : 'Participante 1';
  const teamB = game.team2 ? teamName(state, game.team2) : 'Participante 2';
  return <Modal title="Registrar resultado" onClose={onClose}><form onSubmit={submit}><div className="form-grid">{[0, 1, 2].map(index => <div className="form-field full" key={index}><div className="form-grid"><Field label={`Rodada ${index + 1} — ${teamA}`} name={`a${index}`} type="number" min={0} defaultValue={game.sets[index]?.a ?? ''} /><Field label={`Rodada ${index + 1} — ${teamB}`} name={`b${index}`} type="number" min={0} defaultValue={game.sets[index]?.b ?? ''} /></div></div>)}</div><div className="modal-footer"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar resultado</Button></div></form></Modal>;
}

export function GamesPage({ navigate, initialCategory = '' }: { navigate: (route: Route) => void; initialCategory?: string }) {
  const { state, user, act } = useApp();
  const [detail, setDetail] = useState<string | null>(null), [score, setScore] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState(''), [teamFilter, setTeamFilter] = useState(''), [statusFilter, setStatusFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState(''), [spaceFilter, setSpaceFilter] = useState(''), [sportFilter, setSportFilter] = useState(''), [categoryFilter, setCategoryFilter] = useState(initialCategory), [myGamesOnly, setMyGamesOnly] = useState(false);
  const detailGame = state.games.find(game => game.id === detail), scoreGame = state.games.find(game => game.id === score);
  const games = [...state.games].filter(game => (!myGamesOnly || Boolean(user && game.participantIds.includes(user.id))) && (!categoryFilter || sportCategory(game.sport) === categoryFilter) && (!dateFilter || game.date === dateFilter) && (!teamFilter || game.team1 === teamFilter || game.team2 === teamFilter) && (!statusFilter || game.status === statusFilter) && (!spaceFilter || game.court === spaceFilter) && (!unitFilter || game.unit === unitFilter) && (!sportFilter || game.sport === sportFilter)).sort((a, b) => startTime(b.date, b.time) - startTime(a.date, a.time));
  return <><div className="section-title"><h2>Jogos e atividades</h2>{user && user.role !== 'student' && <Button onClick={() => navigate('createGame')}>＋ Criar jogo</Button>}</div>
    <div className="category-tabs" role="group" aria-label="Categoria de atividade">{[['','Todas'],['quadra','Jogos de quadra'],['mesa','Mesa e tabuleiro']].map(([value,label]) => <button type="button" key={value} aria-pressed={categoryFilter===value} onClick={() => { setCategoryFilter(value!); setSportFilter(''); }}>{label}</button>)}</div>
    {user?.role === 'student' && <div className="category-tabs"><button type="button" aria-pressed={myGamesOnly} onClick={() => setMyGamesOnly(value => !value)}>{myGamesOnly ? 'Todos os jogos' : 'Minhas inscrições'}</button></div>}
    <Card className="table-wrap"><div className="sport-filter" role="group" aria-label="Filtrar por modalidade"><button type="button" aria-pressed={!sportFilter} onClick={() => setSportFilter('')}>Todas</button>{sports.filter(sport => !categoryFilter || sport.category === categoryFilter).map(sport => <button type="button" key={sport.id} aria-label={`Filtrar ${sport.name}`} title={sport.name} aria-pressed={sportFilter===sport.id} onClick={() => setSportFilter(sport.id)}><SportIcon sport={sport.id} /><span>{sport.name}</span></button>)}</div><div className="game-filters"><label>Data<input aria-label="Filtrar por data" type="date" value={dateFilter} onChange={event => setDateFilter(event.target.value)} /></label><label>Unidade<select aria-label="Filtrar por unidade" value={unitFilter} onChange={event => setUnitFilter(event.target.value)}><option value="">Todas as unidades</option>{[...new Set(state.games.map(game => game.unit).filter((unit): unit is string => Boolean(unit)))].map(unit => <option key={unit} value={unit}>{unit}</option>)}</select></label><label>Equipe<select aria-label="Filtrar por equipe" value={teamFilter} onChange={event => setTeamFilter(event.target.value)}><option value="">Todas as equipes</option>{state.teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label><label>Espaço<select aria-label="Filtrar por espaço" value={spaceFilter} onChange={event => setSpaceFilter(event.target.value)}><option value="">Todos os espaços</option>{[...new Set(state.games.map(game => game.court))].map(space => <option key={space} value={space}>{space}</option>)}</select></label><label>Situação<select aria-label="Filtrar por situação" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="">Todas</option><option value="inscricoes">Inscrições abertas</option><option value="agendado">Agendado</option><option value="finalizado">Finalizado</option><option value="cancelado">Cancelado</option></select></label></div>
      {games.length ? <table className="game-table"><thead><tr><th>Data</th><th>Atividade</th><th>Horário</th><th>Unidade / espaço</th><th>Participantes</th><th>Status</th><th>Ações</th></tr></thead><tbody>{games.map(game => {
        const joined = Boolean(user && game.participantIds.includes(user.id)), upcoming = startTime(game.date, game.time) > Date.now(), open = ['inscricoes', 'agendado'].includes(game.status);
        return <tr key={game.id}><td data-label="Data">{fmtDate(game.date)}</td><td data-label="Atividade"><SportLabel sport={game.sport} /><strong>{gameTitle(game, state)}</strong></td><td data-label="Horário">{game.time}{game.duration > 0 ? ` · ${game.duration} min` : ''}</td><td data-label="Unidade / espaço">{game.unit || 'Não informada'}<small className="muted">{game.court}</small></td><td data-label="Participantes">{game.participantIds.length}/{Math.min(game.limit, MAX_GAME_PLAYERS)}</td><td data-label="Situação"><Status color={game.status === 'finalizado' ? 'green' : game.status === 'cancelado' ? 'red' : 'blue'}>{game.status}</Status></td><td data-label="Ações"><div className="table-actions"><button className="link-btn" onClick={() => setDetail(game.id)}>Detalhes</button>{user?.role === 'student' && open && upcoming && (joined ? startTime(game.date, game.time) - Date.now() > 15 * 60_000 && <button className="link-btn" onClick={() => act((draft, actor) => leaveGame(draft, actor, game.id), 'Participação cancelada.')}>Sair</button> : <button className="link-btn" onClick={() => act((draft, actor) => joinGame(draft, actor, game.id), 'Inscrição confirmada.')}>Inscrever-se</button>)}{user && user.role !== 'student' && game.status !== 'cancelado' && <><button className="link-btn" onClick={() => setScore(game.id)}>Resultado</button><button className="link-btn" onClick={() => { if (confirm('Cancelar este jogo?')) act((draft, actor) => cancelGame(draft, actor, game.id), 'Jogo cancelado.'); }}>Cancelar</button></>}</div></td></tr>;
      })}</tbody></table> : <Empty>{state.games.length ? 'Nenhuma atividade corresponde aos filtros.' : 'Nenhum jogo cadastrado.'}</Empty>}
    </Card>{detailGame && <GameDetails game={detailGame} onClose={() => setDetail(null)} />}{scoreGame && <ScoreModal game={scoreGame} onClose={() => setScore(null)} />}</>;
}

export function CreateGamePage({ navigate }: { navigate: (route: Route) => void }) {
  const { state, user, act } = useApp();
  const [category, setCategory] = useState<'quadra' | 'mesa'>('quadra');
  if (!user || user.role === 'student') return <Empty>Acesso permitido somente a representantes.</Empty>;
  const units = [...new Set(state.games.map(game => game.unit).filter((unit): unit is string => Boolean(unit)))];
  const spaces = [...new Set(state.games.map(game => game.court).filter(Boolean))];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const sport = field(data, 'sport') as Sport;
    const durationText = field(data, 'duration');
    if (act((draft, actor) => createGame(draft, actor, { sport, date: field(data, 'date'), time: field(data, 'time'), unit: field(data, 'unit'), court: field(data, 'court'), duration: durationText ? Number(durationText) : 0, team1: field(data, 'team1'), team2: field(data, 'team2'), limit: Number(field(data, 'limit')), description: field(data, 'description'), notes: field(data, 'notes'), status: field(data, 'status') === 'agendado' ? 'agendado' : 'inscricoes' }), 'Atividade criada.')) navigate('calendar');
  }
  return <Card><div className="section-title"><h2>Novo jogo ou atividade</h2><Status>Representante</Status></div><form onSubmit={submit}><div className="form-grid">
    <div className="form-field full"><span className="field-label">Categoria</span><div className="category-tabs"><button type="button" aria-pressed={category==='quadra'} onClick={() => setCategory('quadra')}>Jogos de quadra</button><button type="button" aria-pressed={category==='mesa'} onClick={() => setCategory('mesa')}>Mesa e tabuleiro</button></div></div>
    <div className="full"><SportChoiceGroup key={category} name="sport" category={category} /></div>
    <Field label="Unidade do SENAI" name="unit" list="senai-units" placeholder="Informe a unidade" required /><datalist id="senai-units">{units.map(unit => <option key={unit} value={unit} />)}</datalist>
    <Field label="Local ou espaço" name="court" list="senai-spaces" placeholder={category === 'quadra' ? 'Ex.: quadra coberta' : 'Ex.: sala de jogos'} required /><datalist id="senai-spaces">{spaces.map(space => <option key={space} value={space} />)}</datalist>
    <Field label="Data" name="date" type="date" min={addDays(1)} required /><Field label="Horário" name="time" type="time" required />
    <Field label={category === 'quadra' ? 'Duração (minutos)' : 'Duração (opcional, minutos)'} name="duration" type="number" min={category === 'quadra' ? 60 : 0} step={15} defaultValue={category === 'quadra' ? 60 : ''} required={category === 'quadra'} />
    {category === 'quadra' && <><SelectField label="Equipe 1 (opcional)" name="team1"><option value="">Equipe aberta</option>{state.teams.filter(team => team.status === 'ativa').map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</SelectField><SelectField label="Equipe 2 (opcional)" name="team2"><option value="">Equipe aberta</option>{state.teams.filter(team => team.status === 'ativa').map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</SelectField></>}
    <Field label="Limite de participantes" name="limit" type="number" min={1} max={MAX_GAME_PLAYERS} defaultValue={category === 'quadra' ? MAX_GAME_PLAYERS : 2} required />
    <SelectField label="Inscrições" name="status" defaultValue="inscricoes"><option value="inscricoes">Abertas</option><option value="agendado">Agendado</option></SelectField>
    <Field full label="Informações da atividade" name="description" placeholder="Detalhes para os participantes" /><div className="form-field full"><label htmlFor="gameNotes">Observações</label><textarea id="gameNotes" name="notes" /></div>
  </div><Button type="submit">Salvar atividade</Button></form></Card>;
}
