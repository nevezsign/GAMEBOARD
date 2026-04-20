import { Link } from 'react-router-dom';
import useStore from '../store/useStore';
import RankBadge from '../components/RankBadge';
import { getRank, formatTime } from '../utils/constants';

export default function Home() {
  const pilots = useStore(s => s.pilots);
  const teams = useStore(s => s.teams);
  const races = useStore(s => s.races);

  const topPilots = [...pilots].sort((a, b) => b.mmr - a.mmr).slice(0, 5);
  const topWins = [...pilots].sort((a, b) => b.wins - a.wins).slice(0, 3);
  const topPoints = [...pilots].sort((a, b) => b.points - a.points).slice(0, 3);

  const teamRankings = teams.map(t => {
    const tp = pilots.filter(p => p.teamId === t.id);
    return {
      ...t,
      totalPoints: tp.reduce((s, p) => s + p.points, 0),
      totalWins: tp.reduce((s, p) => s + p.wins, 0),
      pilotCount: tp.length,
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 5);

  const recentRaces = races.slice(0, 5);

  const getTeamColor = (teamId) => teams.find(t => t.id === teamId)?.color || '#555';
  const getTeamName = (teamId) => teams.find(t => t.id === teamId)?.name || 'Sem equipe';
  const getPilotName = (id) => pilots.find(p => p.id === id)?.name || '???';

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">🏆 Hall da Fama</h1>
        <p className="page-subtitle">Os melhores pilotos e equipes do Apex Rivals</p>
      </div>

      {/* Stats Overview */}
      <div className="grid-4 mb-16">
        <div className="stat-card">
          <div className="stat-value">{pilots.length}</div>
          <div className="stat-label">Pilotos</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{teams.length}</div>
          <div className="stat-label">Equipes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{races.length}</div>
          <div className="stat-label">Corridas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{topPilots[0]?.mmr || 0}</div>
          <div className="stat-label">Maior MMR</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '24px' }}>
        {/* Top Pilots by MMR */}
        <div className="section">
          <div className="section-header">
            <h3 className="section-title">🏅 Top Pilotos (MMR)</h3>
            <Link to="/rankings" className="btn btn-sm">Ver todos</Link>
          </div>
          {topPilots.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '30px' }}>
                <p className="empty-state-text">Nenhum piloto criado ainda</p>
                <Link to="/pilotos/novo" className="btn btn-primary btn-sm">Criar Piloto</Link>
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Piloto</th>
                    <th>Equipe</th>
                    <th>MMR</th>
                    <th>Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {topPilots.map((p, i) => (
                    <tr key={p.id}>
                      <td>
                        <span className={`position-badge position-${i < 3 ? i + 1 : 'other'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        <span className="team-dot" style={{ background: getTeamColor(p.teamId) }}></span>
                        {p.name}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{getTeamName(p.teamId)}</td>
                      <td className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{p.mmr}</td>
                      <td><RankBadge mmr={p.mmr} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Teams */}
        <div className="section">
          <div className="section-header">
            <h3 className="section-title">🏢 Top Equipes</h3>
            <Link to="/equipes" className="btn btn-sm">Ver todas</Link>
          </div>
          {teamRankings.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '30px' }}>
                <p className="empty-state-text">Nenhuma equipe criada ainda</p>
                <Link to="/equipes/novo" className="btn btn-primary btn-sm">Criar Equipe</Link>
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Equipe</th>
                    <th>Pilotos</th>
                    <th>Pontos</th>
                    <th>Vitórias</th>
                  </tr>
                </thead>
                <tbody>
                  {teamRankings.map((t, i) => (
                    <tr key={t.id}>
                      <td>
                        <span className={`position-badge position-${i < 3 ? i + 1 : 'other'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        <span className="team-dot" style={{ background: t.color }}></span>
                        {t.name}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{t.pilotCount}</td>
                      <td className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{t.totalPoints}</td>
                      <td className="text-mono">{t.totalWins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Highlights */}
      <div className="section mt-24">
        <h3 className="section-title mb-16">⚡ Destaques</h3>
        <div className="grid-3">
          <div className="card" style={{ borderTop: '3px solid var(--accent-yellow)' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>🥇 Mais Vitórias</h4>
            {topWins.length > 0 ? topWins.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < topWins.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontWeight: 600 }}>
                  <span className="team-dot" style={{ background: getTeamColor(p.teamId) }}></span>
                  {p.name}
                </span>
                <span className="text-mono" style={{ color: 'var(--accent-yellow)', fontWeight: 700 }}>{p.wins}</span>
              </div>
            )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sem dados</p>}
          </div>

          <div className="card" style={{ borderTop: '3px solid var(--accent-cyan)' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>📊 Maior MMR</h4>
            {topPilots.slice(0, 3).length > 0 ? topPilots.slice(0, 3).map((p, i) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontWeight: 600 }}>
                  <span className="team-dot" style={{ background: getTeamColor(p.teamId) }}></span>
                  {p.name}
                </span>
                <span className="text-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{p.mmr}</span>
              </div>
            )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sem dados</p>}
          </div>

          <div className="card" style={{ borderTop: '3px solid var(--accent-purple)' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>🏁 Maior Pontuação</h4>
            {topPoints.slice(0, 3).length > 0 ? topPoints.slice(0, 3).map((p, i) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontWeight: 600 }}>
                  <span className="team-dot" style={{ background: getTeamColor(p.teamId) }}></span>
                  {p.name}
                </span>
                <span className="text-mono" style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>{p.points}</span>
              </div>
            )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sem dados</p>}
          </div>
        </div>
      </div>

      {/* Recent Races */}
      {recentRaces.length > 0 && (
        <div className="section mt-24">
          <h3 className="section-title mb-16">📋 Últimas Corridas</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Vencedor</th>
                  <th>Participantes</th>
                  <th>Voltas</th>
                </tr>
              </thead>
              <tbody>
                {recentRaces.map(r => {
                  const winner = r.results?.find(res => res.position === 1);
                  return (
                    <tr key={r.id}>
                      <td style={{ color: 'var(--text-secondary)' }}>{new Date(r.date).toLocaleDateString('pt-BR')}</td>
                      <td style={{ fontWeight: 600 }}>🏆 {winner ? getPilotName(winner.pilotId) : '—'}</td>
                      <td>{r.results?.length || 0}</td>
                      <td>{r.laps}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Call to Action */}
      {pilots.length === 0 && (
        <div className="card mt-24" style={{ textAlign: 'center', padding: '40px' }}>
          <h3 style={{ marginBottom: '12px' }}>🚀 Comece sua jornada!</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Crie pilotos, equipes e pistas para começar a competir no Apex Rivals.
          </p>
          <div className="btn-group" style={{ justifyContent: 'center' }}>
            <Link to="/pilotos/novo" className="btn btn-primary">Criar Piloto</Link>
            <Link to="/equipes/novo" className="btn">Criar Equipe</Link>
            <Link to="/mapas/novo" className="btn">Criar Mapa</Link>
          </div>
        </div>
      )}
    </div>
  );
}
