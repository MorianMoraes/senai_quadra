import { useState, type FormEvent } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button, Card, Empty, Field, SelectField } from '../components/ui';
import { uid } from '../utils/format';

export function StatisticsPage() {
  const { state, user, actAsync } = useApp();
  const [tournamentId, setTournamentId] = useState(state.tournaments[0]?.id ?? '');
  const [cardTeamFilter,setCardTeamFilter]=useState(''),[cardDateFilter,setCardDateFilter]=useState('');
  const tournament = state.tournaments.find(item => item.id === tournamentId);
  const admin = user?.role === 'director' || user?.role === 'sesi';
  const rows = state.standings.filter(row => row.tournamentId === tournamentId).sort((a, b) => {
    const points = b.points - a.points;
    if (points) return points;
    const saldo = (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    return tournament?.tieBreak === 'gols' ? (b.goalsFor - a.goalsFor || saldo) : (saldo || b.goalsFor - a.goalsFor);
  });
  const cards = state.cards.filter(row => row.tournamentId === tournamentId && (!cardTeamFilter||row.teamId===cardTeamFilter) && (!cardDateFilter||row.date===cardDateFilter)).sort((a, b) => b.date.localeCompare(a.date));
  const scorers = state.scorers.filter(row => row.tournamentId === tournamentId).sort((a, b) => b.goals - a.goals);
  const team = (id: string) => state.teams.find(item => item.id === id);
  const player = (id: string) => state.players.find(item => item.id === id)?.fullName || state.users.find(item => item.id === id)?.name || state.cards.find(item=>item.playerId===id)?.playerName || state.scorers.find(item=>item.playerId===id)?.playerName || 'Jogador';

  function saveStanding(event: FormEvent<HTMLFormElement>, rowId: string) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    void actAsync(draft => {
      const row = draft.standings.find(item => item.id === rowId); if (!row) return;
      row.points = Number(data.get('points')); row.played = Number(data.get('played')); row.wins = Number(data.get('wins'));
      row.goalsFor = Number(data.get('goalsFor')); row.goalsAgainst = Number(data.get('goalsAgainst')); row.cards = Number(data.get('cards'));
    }, 'Classificação atualizada.');
  }
  function ensureRows() {
    if (!tournament) return;
    void actAsync(draft => {
      for (const teamId of tournament.teamIds) if (!draft.standings.some(row => row.tournamentId === tournament.id && row.teamId === teamId)) draft.standings.push({ id: uid('st'), tournamentId: tournament.id, teamId, points: 0, played: 0, wins: 0, goalsFor: 0, goalsAgainst: 0, cards: 0 });
    }, 'Tabela de classificação preparada.');
  }
  function saveCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const playerId=String(data.get('playerId')),playerName=state.players.find(item=>item.id===playerId)?.fullName||state.users.find(item=>item.id===playerId)?.name||'';
    void actAsync(draft => { draft.cards.push({ id: uid('card'), tournamentId, teamId: String(data.get('teamId')), playerId, playerName, type: String(data.get('type')) as 'Amarelo' | 'Vermelho', date: String(data.get('date')) }); }, 'Cartão registrado.');
    event.currentTarget.reset();
  }
  function saveScorer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget), teamId = String(data.get('teamId')), playerId = String(data.get('playerId')), goals = Number(data.get('goals'));
    const playerName=state.players.find(item=>item.id===playerId)?.fullName||state.users.find(item=>item.id===playerId)?.name||'';
    void actAsync(draft => {
      const found = draft.scorers.find(item => item.tournamentId === tournamentId && item.playerId === playerId);
      if (found) { found.goals = goals; found.teamId=teamId; found.playerName=playerName; } else draft.scorers.push({ id: uid('goal'), tournamentId, teamId, playerId, playerName, goals });
    }, 'Artilheiro atualizado.');
    event.currentTarget.reset();
  }
  const playersFor = (teamId: string) => {
    const roster=team(teamId)?.memberIds??[], accountPlayers=roster.map(id=>({id,name:player(id)}));
    return [...accountPlayers,...state.players.filter(item=>item.teamId===teamId&&!roster.includes(item.id)).map(item=>({id:item.id,name:item.fullName}))];
  };
  return <div className="statistics-page">
    <div className="section-title"><div><p className="eyebrow">DADOS ESPORTIVOS</p><h2>Classificação, cartões e artilheiros</h2></div></div>
    <label className="form-field stats-tournament">Campeonato<select value={tournamentId} onChange={event => setTournamentId(event.target.value)}><option value="">Selecione um campeonato</option>{state.tournaments.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    {!tournament ? <Card><Empty>Crie ou selecione um campeonato para consultar os dados.</Empty></Card> : <>
      <Card><div className="section-title"><div><h3>Classificação</h3><p className="muted">Desempate por pontos, saldo e gols pró.</p></div>{admin && <Button variant="secondary" onClick={ensureRows}>Atualizar equipes inscritas</Button>}</div>
        {rows.length ? <div className="table-wrap mobile-cards"><table><thead><tr><th>#</th><th>Equipe</th><th>Pts</th><th>J</th><th>V</th><th>GP</th><th>GC</th><th>SG</th><th>Cartões</th>{admin && <th>Ação</th>}</tr></thead><tbody>{rows.map((row,index) => <tr key={row.id}><td data-label="#">{index+1}</td><td data-label="Equipe">{team(row.teamId)?.name ?? 'Equipe removida'}</td>{admin ? <td colSpan={8}><form className="standing-edit" onSubmit={event => saveStanding(event,row.id)}>{[['points','Pts',row.points],['played','J',row.played],['wins','V',row.wins],['goalsFor','GP',row.goalsFor],['goalsAgainst','GC',row.goalsAgainst],['cards','Cartões',row.cards]].map(([name,label,value])=><label key={String(name)}>{label}<input name={String(name)} type="number" min="0" defaultValue={Number(value)} /></label>)}<strong>SG {row.goalsFor-row.goalsAgainst}</strong><Button type="submit">Salvar</Button></form></td> : <><td data-label="Pontos">{row.points}</td><td data-label="Jogos">{row.played}</td><td data-label="Vitórias">{row.wins}</td><td data-label="Gols pró">{row.goalsFor}</td><td data-label="Gols contra">{row.goalsAgainst}</td><td data-label="Saldo">{row.goalsFor-row.goalsAgainst}</td><td data-label="Cartões">{row.cards}</td></>}</tr>)}</tbody></table></div> : <Empty>A classificação será exibida quando houver equipes inscritas e dados registrados.</Empty>}
      </Card>
      <div className="stats-grid"><Card><h3>Cartões</h3>{admin && <form className="stats-form" onSubmit={saveCard}><SelectField label="Equipe" name="teamId" required>{tournament.teamIds.map(id=><option key={id} value={id}>{team(id)?.name}</option>)}</SelectField><SelectField label="Jogador" name="playerId" required>{tournament.teamIds.flatMap(playersFor).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</SelectField><SelectField label="Tipo" name="type" required><option>Amarelo</option><option>Vermelho</option></SelectField><Field label="Data" name="date" type="date" required/><Button type="submit">Registrar cartão</Button></form>}<div className="stats-form"><label className="form-field">Filtrar equipe<select value={cardTeamFilter} onChange={event=>setCardTeamFilter(event.target.value)}><option value="">Todas</option>{tournament.teamIds.map(id=><option key={id} value={id}>{team(id)?.name}</option>)}</select></label><label className="form-field">Filtrar data<input type="date" value={cardDateFilter} onChange={event=>setCardDateFilter(event.target.value)}/></label></div>{cards.length ? <div className="list">{cards.map(item=><div className="list-item" key={item.id}><div><strong>{player(item.playerId)} · {team(item.teamId)?.name}</strong><small>{item.type} · {item.date} · {cards.filter(card=>card.playerId===item.playerId).length} no campeonato</small></div>{admin&&<Button variant="secondary" onClick={()=>{const date=window.prompt("Data do cartão (AAAA-MM-DD)",item.date);const type=window.prompt("Tipo: Amarelo ou Vermelho",item.type);if(date&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)&&(type==="Amarelo"||type==="Vermelho"))void actAsync(draft=>{const card=draft.cards.find(row=>row.id===item.id);if(card){card.date=date;card.type=type}},"Cartão atualizado.")}}>Editar</Button>}{admin&&<Button variant="danger" onClick={()=>{if(confirm('Excluir este registro de cartão?')) void actAsync(draft=>{draft.cards=draft.cards.filter(card=>card.id!==item.id)},'Registro excluído.')}}>Excluir</Button>}</div>)}</div>:<p className="muted">Nenhum cartão registrado.</p>}</Card>
      <Card><h3>Artilheiros</h3>{admin&&<form className="stats-form" onSubmit={saveScorer}><SelectField label="Equipe" name="teamId" required>{tournament.teamIds.map(id=><option key={id} value={id}>{team(id)?.name}</option>)}</SelectField><SelectField label="Jogador" name="playerId" required>{tournament.teamIds.flatMap(playersFor).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</SelectField><Field label="Gols" name="goals" type="number" min="0" required defaultValue="0"/><Button type="submit">Salvar gols</Button></form>}{scorers.length?<div className="list">{scorers.map((item,index)=><div className="list-item" key={item.id}><strong>{index+1}. {player(item.playerId)} · {team(item.teamId)?.name}</strong><strong>{item.goals} gols</strong></div>)}</div>:<p className="muted">Nenhum artilheiro registrado.</p>}</Card></div>
    </>}
  </div>;
}
