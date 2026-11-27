import { useApp } from '../contexts/AppContext';
import { Card, Empty } from '../components/ui';
import { fmtDate } from '../utils/format';

export function DocumentsPage() {
  const { state } = useApp();
  const regulations = state.tournaments.filter(item => item.regulationUrl || item.regulationName);
  const reports = state.games.filter(item => item.reportUrl || item.reportName);
  return <div className="documents-page"><div className="section-title"><div><p className="eyebrow">CONSULTA PÚBLICA</p><h2>Regulamentos e relatórios</h2></div></div>
    <Card className="calendar-document"><div><p className="eyebrow">AGENDA OFICIAL</p><h3>Calendário 2026</h3><p className="muted">Consulte as datas e atividades previstas para a temporada.</p></div><a className="btn btn-primary" href={`${import.meta.env.BASE_URL}assets/calendar/calendario-2026.pdf`} target="_blank" rel="noreferrer">Abrir calendário PDF</a></Card>
    <Card><h3>Regulamentos por campeonato</h3>{regulations.length ? <div className="list">{regulations.map(item => <div className="list-item" key={item.id}><div><strong>{item.name}</strong><small>{item.regulationName || 'Regulamento'}</small></div>{item.regulationUrl && <a className="btn btn-secondary" href={item.regulationUrl} target="_blank" rel="noreferrer">Visualizar</a>}</div>)}</div> : <Empty>Os regulamentos serão adicionados pela direção quando os documentos estiverem prontos.</Empty>}</Card>
    <Card><h3>Relatórios de jogos</h3>{reports.length ? <div className="list">{reports.map(item => <div className="list-item" key={item.id}><div><strong>{item.reportName || `Relatório · ${item.court}`}</strong><small>{fmtDate(item.date)} · {item.unit} · {item.court}</small></div>{item.reportUrl && <a className="btn btn-secondary" href={item.reportUrl} target="_blank" rel="noreferrer">Visualizar</a>}</div>)}</div> : <Empty>Os relatórios serão vinculados às partidas quando forem enviados.</Empty>}</Card>
  </div>;
}
