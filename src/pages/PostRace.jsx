import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import RankBadge from '../components/RankBadge';
import { getRank, formatTime } from '../utils/constants';

export default function PostRace() {
  const navigate = useNavigate();
  const raceResults = useStore(s => s.raceResults);
  const pilots = useStore(s => s.pilots);
  const teams = useStore(s => s.teams);
  const settings = useStore(s => s.settings);

  if (!raceResults || !raceResults.results) {
    return (
      <div className="animate-fade-in">
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3 className="empty-state-title">Nenhum resultado disponível</h3>
          <p className="empty-state-text">Complete uma corrida para ver os resultados</p>
          <Link to="/pre-jogo" className="btn btn-primary">Configurar Corrida</Link>
        </div>
      </div>
    );
  }

  const results = raceResults.results;
  const mmrChanges = raceResults.mmrChanges || [];

  const getTeamName = (pilotId) => {
    const p = pilots.find(pi => pi.id === pilotId);
    const t = teams.find(ti => ti.id === p?.teamId);
    return t?.name || 'Sem equipe';
  };

  // Podium: 2nd, 1st, 3rd
  const podiumOrder = [results[1], results[0], results[2]].filter(Boolean);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 className="page-title">🏆 Resultado da Corrida</h1>
        <p className="page-subtitle">Classificação final e atualização de MMR</p>
      </div>

      {/* Podium */}
      {results.length >= 2 && (
        <div className="podium">
          {podiumOrder.map((r, i) => {
            if (!r) return null;
            const pos = r.position;
            const heights = { 1: 200, 2: 160, 3: 130 };
            const mc = mmrChanges.find(m => m.pilotId === r.pilotId);
            const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

            return (
              <div key={r.pilotId} className="podium-place" style={{ order: pos === 1 ? 0 : pos === 2 ? -1 : 1 }}>
                <div className="podium-pillar" style={{
                  height: heights[pos] || 100,
                  borderTopColor: pos === 1 ? '#ffd700' : pos === 2 ? '#c0c0c0' : '#cd7f32',
                }}>
                  <div className="podium-position" style={{
                    color: pos === 1 ? '#ffd700' : pos === 2 ? '#c0c0c0' : '#cd7f32',
                    fontSize: pos === 1 ? '2.5rem' : '2rem',
                  }}>
                    {medals[pos]}
                  </div>
                  <div className="podium-name">{r.name}</div>
                  <div className="podium-team">{r.teamName}</div>
                  {mc && (
                    <div className={`mmr-change mt-8 ${mc.mmrChange >= 0 ? 'mmr-positive' : 'mmr-negative'}`} style={{ fontSize: '0.9rem' }}>
                      {mc.mmrChange >= 0 ? '▲' : '▼'} {mc.mmrChange >= 0 ? '+' : ''}{mc.mmrChange}
                    </div>
                  )}
                  {r.totalTime && (
                    <div className="text-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {formatTime(r.totalTime)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Results Table */}
      <div className="section mt-24">
        <h3 className="section-title mb-16">📋 Classificação Completa</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Piloto</th>
                <th>Equipe</th>
                <th>Tempo Total</th>
                <th>Melhor Volta</th>
                <th>MMR Antes</th>
                <th>Mudança</th>
                <th>MMR Atual</th>
                <th>Rank</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const mc = mmrChanges.find(m => m.pilotId === r.pilotId);
                const currentPilot = pilots.find(p => p.id === r.pilotId);

                return (
                  <tr key={r.pilotId}>
                    <td>
                      <span className={`position-badge position-${i < 3 ? i + 1 : 'other'}`}>
                        {r.position}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      <span className="team-dot" style={{ background: r.teamColor }}></span>
                      {r.name}
                    </td>
                    <td style={{ color: r.teamColor }}>{r.teamName}</td>
                    <td className="text-mono">{formatTime(r.totalTime)}</td>
                    <td className="text-mono" style={{ color: 'var(--accent-purple)' }}>{formatTime(r.bestLap)}</td>
                    <td className="text-mono" style={{ color: 'var(--text-muted)' }}>{mc?.oldMmr || '—'}</td>
                    <td>
                      {mc && (
                        <span className={`mmr-change ${mc.mmrChange >= 0 ? 'mmr-positive' : 'mmr-negative'}`}>
                          {mc.mmrChange >= 0 ? '▲ +' : '▼ '}{mc.mmrChange}
                        </span>
                      )}
                    </td>
                    <td className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {mc?.newMmr || currentPilot?.mmr || '—'}
                    </td>
                    <td>
                      <RankBadge mmr={mc?.newMmr || currentPilot?.mmr || 1000} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rank Changes */}
      {(() => {
        const changes = mmrChanges.filter(mc => {
          const oldR = getRank(mc.oldMmr, settings?.ranks);
          const newR = getRank(mc.newMmr, settings?.ranks);
          return oldR.name !== newR.name;
        });

        if (changes.length === 0) return null;

        return (
          <div className="section mt-24">
            <h3 className="section-title mb-16">📈 Mudanças de Rank</h3>
            <div className="grid-3">
              {changes.map(mc => {
                const pilot = pilots.find(p => p.id === mc.pilotId);
                const oldR = getRank(mc.oldMmr, settings?.ranks);
                const newR = getRank(mc.newMmr, settings?.ranks);
                const promoted = mc.newMmr > mc.oldMmr;

              return (
                <div key={mc.pilotId} className="card" style={{
                  borderTop: `3px solid ${promoted ? 'var(--accent-green)' : 'var(--accent-red)'}`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{promoted ? '🎉' : '😟'}</div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{pilot?.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <RankBadge mmr={mc.oldMmr} />
                    <span style={{ color: promoted ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700 }}>
                      →
                    </span>
                    <RankBadge mmr={mc.newMmr} />
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        );
      })()}

      {/* Actions */}
      <div className="flex-center gap-16 mt-24" style={{ paddingBottom: 32 }}>
        <Link to="/pre-jogo" className="btn btn-primary btn-lg">🏁 Nova Corrida</Link>
        <Link to="/rankings" className="btn btn-lg">🏆 Rankings</Link>
        <Link to="/" className="btn btn-lg">🏠 Home</Link>
      </div>
    </div>
  );
}
