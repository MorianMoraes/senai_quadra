import { useState, type FormEvent } from 'react';
import type { Game, MatchSet, Route } from '../types/models';
import { useApp } from '../contexts/AppContext';
import { Button, Card, Empty, Field, Modal, SelectField, Status } from '../components/ui';
import { cancelGame, createGame, joinGame, leaveGame, saveScore } from '../services/games';
import { addDays, fmtDate, startTime, teamName, userName } from '../utils/format';
import { field } from '../utils/validation';

export function GameDetails({ game, onClose }: { game: Game; onClose: () => void }) {
  const { state } = useApp();
  return <Modal title={`${teamName(state, game.team1)} × ${teamName(state, game.team2)}`} onClose={onClose}><div className="grid-equal"><div><p><strong>Data:</strong> {fmtDate(game.date)}</p><p><strong>Horário:</strong> {game.time}</p><p><strong>Local:</strong> {game.court}</p><p><strong>Status:</strong> {game.status}</p></div><div><p><strong>Participantes ({game.participantIds.length}/{game.limit}):</strong></p><p className="muted">{game.participantIds.map(id => userName(state, id)).join(', ') || 'Nenhum inscrito ainda.'}</p></div></div><p><strong>Descrição:</strong> {game.description || '—'}</p><p><strong>Observações:</strong> {game.notes || '—'}</p>{game.sets.map((set, index) => <div className="list-item" key={index}><strong>Set {index + 1}</strong><span>{set.a} × {set.b}</span></div>)}</Modal>;
}
function ScoreModal({ game, onClose }: { game: Game; onClose: () => void }) {
  const { state, act, notify } = useApp();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget), sets: MatchSet[] = [];
    for (let index = 0; index < 3; index++) {
      const a = field(data, `a${index}`), b = field(data, `b${index}`);
      if ((a === '') !== (b === '')) { notify('Preencha os dois placares de cada set.', true); return; }
      if (a !== '' && b !== '') sets.push({ a: Number(a), b: Number(b) });
    }
    if (act((draft, actor) => saveScore(draft, actor, game.id, sets), 'Placar salvo e estatísticas atualizadas.')) onClose();
  }
  return <Modal title="Registrar placar" onClose={onClose}><form onSubmit={submit}><div className="form-grid">{[0, 1, 2].map(index => <div className="form-field full" key={index}><div className="form-grid"><Field label={`Set ${index + 1} — ${teamName(state, game.team1)}`} name={`a${index}`} type="number" min={0} defaultValue={game.sets[index]?.a ?? ''} /><Field label={`Set ${index + 1} — ${teamName(state, game.team2)}`} name={`b${index}`} type="number" min={0} defaultValue={game.sets[index]?.b ?? ''} /></div></div>)}</div><div className="modal-footer"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar resultado</Button></div></form></Modal>;
}
export function GamesPage({ navigate }: { navigate: (route: Route) => void }) {
  const { state, user, act } = useApp(), [detail, setDetail] = useState<string | null>(null), [score, setScore] = useState<string | null>(null), [dateFilter, setDateFilter] = useState(''), [teamFilter, setTeamFilter] = useState(''), [statusFilter, setStatusFilter] = useState('');
  if (!user) return null;
  const detailGame = state.games.find(game => game.id === detail), scoreGame = state.games.find(game => game.id === score);
  const games = [...state.games].filter(game => (!dateFilter || game.date === dateFilter) && (!teamFilter || game.team1 === teamFilter || game.team2 === teamFilter) && (!statusFilter || game.status === statusFilter)).sort((a, b) => startTime(b.date, b.time) - startTime(a.date, a.time));
  return <><div className="section-title"><h2>Jogos e eventos</h2>{user.role === 'teacher' && <Button onClick={() => navigate('createGame')}>＋ Criar jogo</Button>}</div><Card className="table-wrap"><div className="game-filters"><label>Data<input aria-label="Filtrar por data" type="date" value={dateFilter} onChange={event => setDateFilter(event.target.value)} /></label><label>Equipe<select aria-label="Filtrar por equipe" value={teamFilter} onChange={event => setTeamFilter(event.target.value)}><option value="">Todas as equipes</option>{state.teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label><label>Situação<select aria-label="Filtrar por situação" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="">Todas</option><option value="inscricoes">Inscrições abertas</option><option value="agendado">Agendado</option><option value="finalizado">Finalizado</option><option value="cancelado">Cancelado</option></select></label></div>{games.length ? <table><thead><tr><th>Data</th><th>Partida</th><th>Horário</th><th>Quadra</th><th>Participantes</th><th>Status</th><th>Ações</th></tr></thead><tbody>{games.map(game => {
    const joined = game.participantIds.includes(user.id), upcoming = startTime(game.date, game.time) > Date.now(), open = ['inscricoes', 'agendado'].includes(game.status);
    return <tr key={game.id}><td>{fmtDate(game.date)}</td><td><strong>{teamName(state, game.team1)} × {teamName(state, game.team2)}</strong></td><td>{game.time}</td><td>{game.court}</td><td>{game.participantIds.length}/{game.limit}</td><td><Status color={game.status === 'finalizado' ? 'green' : game.status === 'cancelado' ? 'red' : 'blue'}>{game.status}</Status></td><td><div className="table-actions"><button className="link-btn" onClick={() => setDetail(game.id)}>Detalhes</button>{user.role === 'student' && open && upcoming && (joined ? startTime(game.date, game.time) - Date.now() > 15 * 60_000 && <button className="link-btn" onClick={() => act((draft, actor) => leaveGame(draft, actor, game.id), 'Participação cancelada.')}>Sair</button> : <button className="link-btn" onClick={() => act((draft, actor) => joinGame(draft, actor, game.id), 'Você entrou no jogo.')}>Entrar</button>)}{user.role === 'teacher' && game.status !== 'cancelado' && <><button className="link-btn" onClick={() => setScore(game.id)}>Placar</button><button className="link-btn" onClick={() => { if (confirm('Tem certeza que deseja cancelar este jogo?')) act((draft, actor) => cancelGame(draft, actor, game.id), 'Jogo cancelado.'); }}>Cancelar</button></>}</div></td></tr>;
  })}</tbody></table> : <Empty>{state.games.length ? 'Nenhum jogo corresponde aos filtros. Ajuste os filtros para ver outras partidas.' : 'Ainda não há jogos. Novas partidas aparecerão aqui e no calendário.'}</Empty>}</Card>{detailGame && <GameDetails game={detailGame} onClose={() => setDetail(null)} />}{scoreGame && <ScoreModal game={scoreGame} onClose={() => setScore(null)} />}</>;
}
export function CreateGamePage({ navigate }: { navigate: (route: Route) => void }) {
  const { state, user, act } = useApp();
  if (user?.role !== 'teacher') return <Empty>Acesso negado. Somente professores podem criar jogos.</Empty>;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    if (act((draft, actor) => createGame(draft, actor, { date: field(data, 'date'), time: field(data, 'time'), team1: field(data, 'team1'), team2: field(data, 'team2'), limit: Number(field(data, 'limit')), description: field(data, 'description'), notes: field(data, 'notes'), status: field(data, 'status') === 'agendado' ? 'agendado' : 'inscricoes' }), 'Jogo criado com sucesso.')) navigate('calendar');
  }
  return <Card><div className="section-title"><h2>Novo jogo</h2><Status>Somente professor</Status></div><form onSubmit={submit}><div className="form-grid"><Field label="Data" name="date" type="date" min={addDays(1)} required /><Field label="Horário" name="time" type="time" required /><Field label="Local / quadra" value="Quadra SENAI" readOnly /><Field label="Duração (min)" value={90} readOnly />{[1, 2].map(index => <SelectField key={index} label={`Equipe ${index}`} name={`team${index}`}><option value="">Equipe aberta</option>{state.teams.filter(team => team.status === 'ativa').map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</SelectField>)}<Field label="Limite de jogadores" name="limit" type="number" min={1} defaultValue={18} required /><SelectField label="Status" name="status" defaultValue="inscricoes"><option value="inscricoes">Inscrições abertas</option><option value="agendado">Agendado</option></SelectField><Field full label="Descrição" name="description" placeholder="Ex.: Jogo amistoso" /><div className="form-field full"><label htmlFor="gameNotes">Observações</label><textarea id="gameNotes" name="notes" /></div></div><Button type="submit">Salvar jogo</Button></form></Card>;
}
