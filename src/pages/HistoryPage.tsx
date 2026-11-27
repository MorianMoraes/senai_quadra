import { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button, Card, Empty } from '../components/ui';
import { fmtDate, startTime, teamName, userName } from '../utils/format';
import { SportLabel } from '../components/SportIcon';
import { sports } from '../components/SportIcon';

const championsGallery = Array.from({ length: 7 }, (_, index) => ({
  src: `${import.meta.env.BASE_URL}assets/champions/galeria-${String(index + 1).padStart(2, '0')}.jpeg`,
  alt: `Registro ${index + 1} da celebração e premiação dos Jogos do SESI`,
}));

export function HistoryPage() {
  const { state } = useApp();
  const [galleryIndex, setGalleryIndex] = useState(0);
  const champions = state.tournaments.filter(tournament => tournament.status === 'finalizado').sort((a,b) => b.date.localeCompare(a.date));
  const games = state.games.filter(game => game.status === 'finalizado').sort((a, b) => startTime(b.date, b.time) - startTime(a.date, a.time));

  useEffect(() => {
    const timer = window.setInterval(() => setGalleryIndex(index => (index + 1) % championsGallery.length), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const moveGallery = (offset: number) => setGalleryIndex(index => (index + offset + championsGallery.length) % championsGallery.length);
  const activePhoto = championsGallery[galleryIndex]!;

  return <div className="performance-page">
    <section className="champions-gallery" aria-labelledby="champions-title">
      <div className="section-title champions-gallery-heading">
        <img className="champions-gallery-logo" src={`${import.meta.env.BASE_URL}assets/jogos-sesi-saude.jpeg`} alt="Jogos do SESI + Saúde" />
        <div><p className="eyebrow">EDIÇÕES ANTERIORES</p><h2 id="champions-title">Galeria dos Campeões</h2></div>
      </div>
      <Card className="champions-photo-gallery">
        <div className="champions-gallery-frame" aria-live="polite">
          <img src={activePhoto.src} alt={activePhoto.alt} />
          <button type="button" className="champions-gallery-arrow previous" aria-label="Foto anterior" onClick={() => moveGallery(-1)}>‹</button>
          <button type="button" className="champions-gallery-arrow next" aria-label="Próxima foto" onClick={() => moveGallery(1)}>›</button>
        </div>
        <div className="champions-gallery-controls">
          <span className="muted">Foto {galleryIndex + 1} de {championsGallery.length}</span>
          <div className="champions-gallery-dots" role="group" aria-label="Escolher foto da galeria">
            {championsGallery.map((photo, index) => <button key={photo.src} type="button" aria-label={`Mostrar foto ${index + 1}`} aria-current={galleryIndex === index ? 'true' : undefined} onClick={() => setGalleryIndex(index)} />)}
          </div>
        </div>
      </Card>
      {champions.length ? <div className="history-results">{champions.map(tournament=>{const winnerId=tournament.rounds.at(-1)?.[0]?.winner;const winner=state.teams.find(team=>team.id===winnerId);return <Card className="history-result" key={tournament.id}>{tournament.banner?<img className="tournament-banner" src={tournament.banner} alt={`Foto dos campeões ${winner?.name??''}`} loading="lazy"/>:<div className="champion-photo-placeholder">Foto da equipe campeã será adicionada</div>}<div className="section-title"><div><p className="eyebrow">{tournament.edition||new Date(tournament.date).getFullYear()}</p><h3>{tournament.name}</h3></div><strong className="history-winner">{winner?.name??'Campeão a confirmar'}</strong></div><p className="muted">{fmtDate(tournament.date)} · {tournament.teamIds.length} equipes</p><div className="btn-row">{tournament.pdfUrl?<a className="btn btn-secondary" href={tournament.pdfUrl} target="_blank" rel="noreferrer">Baixar PDF</a>:<Button variant="secondary" disabled>Baixar PDF · aguardando envio</Button>}<span className="muted">{tournament.pdfName||'Documento da edição será disponibilizado'}</span></div></Card>})}</div>:<Card><Empty>As edições concluídas aparecerão aqui junto com as fotos da galeria.</Empty></Card>}
    </section>
    <section className="performance-history" aria-labelledby="history-games-title">
      <div className="section-title"><div><p className="eyebrow">RESULTADOS PÚBLICOS</p><h2 id="history-games-title">Histórico de partidas</h2></div></div>
      {games.length ? <div className="history-results">{games.map(game => {
        const teamA = state.teams.find(team => team.id === game.team1), teamB = state.teams.find(team => team.id === game.team2);
        const teamGame = Boolean(game.team1 || game.team2);
        const winsA = game.sets.filter(set => set.a > set.b).length, winsB = game.sets.filter(set => set.b > set.a).length;
        const scoreA = game.sets.reduce((sum, set) => sum + set.a, 0), scoreB = game.sets.reduce((sum, set) => sum + set.b, 0);
        const resultA = teamGame ? winsA : scoreA, resultB = teamGame ? winsB : scoreB;
        const winner = resultA === resultB ? 'Empate' : teamGame ? teamName(state, resultA > resultB ? game.team1 : game.team2) : resultA > resultB ? 'Participante 1' : 'Participante 2';
        const assigned = new Set([...(teamA?.memberIds ?? []), ...(teamB?.memberIds ?? [])]);
        const playersA = game.participantIds.filter(id => teamA?.memberIds.includes(id));
        const playersB = game.participantIds.filter(id => teamB?.memberIds.includes(id));
        const unassigned = game.participantIds.filter(id => !assigned.has(id));
        return <Card className="history-result" key={game.id}><div className="section-title"><div><SportLabel sport={game.sport} /><h3>{teamGame ? `${teamName(state, game.team1)} × ${teamName(state, game.team2)}` : sports.find(item => item.id === game.sport)?.name ?? 'Atividade'}</h3></div><strong className="history-winner">{winner === 'Empate' ? winner : `Vencedor: ${winner}`}</strong></div><p className="muted">{fmtDate(game.date)} · {game.time} · {game.unit ? `${game.unit} · ` : ''}{game.court}</p><p><strong>Resultado:</strong> {game.sets.map(set => `${set.a} × ${set.b}`).join(' · ') || 'Resultado registrado'}</p>{teamGame ? <div className="grid-equal"><p><strong>{teamName(state, game.team1)} — participantes:</strong><br />{playersA.length ? playersA.map(id => userName(state, id)).join(', ') : 'Não informados'}</p><p><strong>{teamName(state, game.team2)} — participantes:</strong><br />{playersB.length ? playersB.map(id => userName(state, id)).join(', ') : 'Não informados'}</p>{unassigned.length > 0 && <p><strong>Outros participantes:</strong> {unassigned.map(id => userName(state, id)).join(', ')}</p>}</div> : <p><strong>Participantes:</strong> {game.participantIds.map(id => userName(state, id)).join(', ') || 'Não informados'}</p>}</Card>;
      })}</div> : <Card><Empty>Nenhuma partida finalizada.</Empty></Card>}
    </section>
  </div>;
}
