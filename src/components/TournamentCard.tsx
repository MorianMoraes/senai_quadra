import type { Tournament } from '../types/models';
import { useApp } from '../contexts/AppContext';
import { registerTeam, registrationError } from '../services/tournaments';
import { generateTournamentBracket, saveTournamentMatchResult } from '../services/tournaments';
import { fmtDate, teamName, todayISO, userName } from '../utils/format';
import { Button, Card, Status } from './ui';

function BracketMatchControls({ tournament, roundIndex, matchIndex }: { tournament: Tournament; roundIndex: number; matchIndex: number }) {
  const { act, user } = useApp();
  const match = tournament.rounds[roundIndex]?.[matchIndex];
  if (!match || !user || user.role === 'student' || !match.a || !match.b) return null;
  return <form className="bracket-score" onSubmit={event => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    act((draft, actor) => saveTournamentMatchResult(draft, actor, tournament.id, roundIndex, matchIndex, Number(data.get('scoreA')), Number(data.get('scoreB'))), 'Resultado do confronto salvo.');
  }}><label>Placar <input aria-label="Placar da primeira equipe" name="scoreA" type="number" min="0" defaultValue={match.scoreA ?? ''} required /></label><span>×</span><label className="sr-only">Placar da segunda equipe<input aria-label="Placar da segunda equipe" name="scoreB" type="number" min="0" defaultValue={match.scoreB ?? ''} required /></label><Button type="submit">Salvar</Button></form>;
}

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  const { state, user, act } = useApp();
  const mine = user ? state.teams.filter(team => team.creatorId === user.id) : [], open = tournament.status === 'inscricoes';
  return <Card className="tournament-card"><div className="section-title"><div><h2>{tournament.name}</h2><p className="muted">{fmtDate(tournament.date)}{user ? ` • Professor: ${userName(state, tournament.createdBy)}` : ''}</p></div><Status>{open ? tournament.date < todayISO() ? 'Inscrições encerradas' : 'Inscrições abertas' : tournament.status}</Status></div><p><strong>{tournament.teamIds.length} time(s) inscrito(s)</strong> • 6 jogadores por time</p><div className="list">{tournament.registrations.length ? user ? tournament.registrations.map(registration => <div className="list-item" key={registration.teamId}><div><strong>{teamName(state, registration.teamId)}</strong><small>Representante: {userName(state, registration.leaderId)}<br />{registration.memberIds.map(id => userName(state, id)).join(', ')}</small></div><Status color="green">6/6 inscritos</Status></div>) : <p className="muted">Os elencos das equipes inscritas ficam disponíveis para usuários autenticados.</p> : <p className="muted">{open ? 'Aguardando a inscrição dos times.' : tournament.teamIds.map(id => teamName(state, id)).join(', ')}</p>}</div>
    {user && open && (mine.length ? mine.map(team => { const error = registrationError(state, user.id, tournament, team); return <div className="registration-option" key={team.id}><strong>{team.name}</strong><p className="muted">{error || 'Equipe completa — inscrição disponível.'}</p><Button disabled={Boolean(error)} onClick={() => act((draft, actor) => registerTeam(draft, actor, tournament.id, team.id), 'Time inscrito com os 6 jogadores.')}>{tournament.teamIds.includes(team.id) ? 'Time inscrito' : 'Inscrever time com 6 jogadores'}</Button></div>; }) : user.role === 'student' && <p className="notice">Somente o líder que criou o time pode inscrevê-lo. Monte sua equipe na aba Equipes.</p>)}
    {user && (user.role === 'teacher' || user.role === 'director') && <div className="btn-row bracket-actions"><Button variant="secondary" disabled={tournament.teamIds.length < 2} onClick={() => { if (!tournament.rounds.length || confirm('Gerar novamente? Os placares e confrontos atuais serão substituídos.')) act((draft, actor) => generateTournamentBracket(draft, actor, tournament.id), 'Chaveamento gerado.'); }}>{tournament.rounds.length ? 'Gerar chaveamento novamente' : 'Gerar chaveamento'}</Button>{!tournament.rounds.length && <small className="muted">As inscrições serão fechadas ao gerar o chaveamento.</small>}</div>}
    {tournament.rounds.length > 0 && (user ? <div className="bracket">{tournament.rounds.map((round, index) => <div className="round" key={index}><h4>{index === tournament.rounds.length - 1 ? 'Final' : `Rodada ${index + 1}`}</h4>{round.map((match, matchIndex) => <div className="match" key={matchIndex}><div className={`match-row ${match.winner && match.winner === match.a ? 'winner' : ''}`}><span>{match.a ? teamName(state, match.a) : 'A definir'}</span><strong>{match.scoreA ?? '—'}</strong></div><div className={`match-row ${match.winner && match.winner === match.b ? 'winner' : ''}`}><span>{match.b ? teamName(state, match.b) : 'A definir'}</span><strong>{match.scoreB ?? '—'}</strong></div><BracketMatchControls tournament={tournament} roundIndex={index} matchIndex={matchIndex} /></div>)}</div>)}</div> : <p className="notice">Placar e confrontos detalhados disponíveis após o login.</p>)}
  </Card>;
}
