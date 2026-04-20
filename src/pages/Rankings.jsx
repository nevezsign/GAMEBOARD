import { useState } from 'react';
import useStore from '../store/useStore';
import RankBadge from '../components/RankBadge';

export default function Rankings() {
  const [tab, setTab] = useState('individual');
  const pilots = useStore(s => s.pilots);
  const teams = useStore(s => s.teams);

  const sortedPilots = [...pilots].sort((a, b) => b.mmr - a.mmr);

  const constructors = teams.map(t => {
    const tp = pilots.filter(p => p.teamId === t.id);
    return {
      ...t,
      totalPoints: tp.reduce((s, p) => s + p.points, 0),
      totalWins: tp.reduce((s, p) => s + p.wins, 0),
      avgMmr: tp.length ? Math.round(tp.reduce((s, p) => s + p.mmr, 0) / tp.length) : 0,
      totalRaces: tp.reduce((s, p) => s + p.races, 0),
      pilotCount: tp.length,
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  const getTeam = (id) => teams.find(t => t.id === id);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">🏆 Rankings</h1>
        <p className="page-subtitle">Classificação de pilotos e construtores</p>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'individual' ? 'active' : ''}`} onClick={() => setTab('individual')}>
          🏎️ Individual
        </button>
        <button className={`tab ${tab === 'constructors' ? 'active' : ''}`} onClick={() => setTab('constructors')}>
          🏢 Construtores
        </button>
      </div>

      {tab === 'individual' && (
        sortedPilots.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏎️</div>
            <h3 className="empty-state-title">Sem pilotos</h3>
            <p className="empty-state-text">Crie pilotos para ver o ranking</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Piloto</th>
                  <th>Equipe</th>
                  <th>MMR</th>
                  <th>Rank</th>
                  <th>Pontos</th>
                  <th>Vitórias</th>
                  <th>Corridas</th>
                  <th>Win %</th>
                </tr>
              </thead>
              <tbody>
                {sortedPilots.map((p, i) => {
                  const team = getTeam(p.teamId);
                  const winRate = p.races > 0 ? ((p.wins / p.races) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={p.id}>
                      <td>
                        <span className={`position-badge position-${i < 3 ? i + 1 : 'other'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        <span className="team-dot" style={{ background: team?.color || '#555' }}></span>
                        {p.name}
                      </td>
                      <td style={{ color: team?.color || 'var(--text-muted)' }}>{team?.name || '—'}</td>
                      <td className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{p.mmr}</td>
                      <td><RankBadge mmr={p.mmr} /></td>
                      <td className="text-mono">{p.points}</td>
                      <td className="text-mono" style={{ color: 'var(--accent-yellow)' }}>{p.wins}</td>
                      <td className="text-mono">{p.races}</td>
                      <td className="text-mono" style={{ color: 'var(--accent-green)' }}>{winRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'constructors' && (
        constructors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <h3 className="empty-state-title">Sem equipes</h3>
            <p className="empty-state-text">Crie equipes para ver o ranking</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Equipe</th>
                  <th>Pilotos</th>
                  <th>MMR Médio</th>
                  <th>Pontos</th>
                  <th>Vitórias</th>
                  <th>Corridas</th>
                </tr>
              </thead>
              <tbody>
                {constructors.map((t, i) => (
                  <tr key={t.id}>
                    <td>
                      <span className={`position-badge position-${i < 3 ? i + 1 : 'other'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      <span className="team-dot" style={{ background: t.color }}></span>
                      {t.name}
                    </td>
                    <td className="text-mono">{t.pilotCount}</td>
                    <td className="text-mono" style={{ color: 'var(--accent-cyan)' }}>{t.avgMmr}</td>
                    <td className="text-mono" style={{ fontWeight: 700 }}>{t.totalPoints}</td>
                    <td className="text-mono" style={{ color: 'var(--accent-yellow)' }}>{t.totalWins}</td>
                    <td className="text-mono">{t.totalRaces}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
