import { Link } from 'react-router-dom';
import useStore from '../store/useStore';

export default function Teams() {
  const teams = useStore(s => s.teams);
  const pilots = useStore(s => s.pilots);
  const deleteTeam = useStore(s => s.deleteTeam);

  const getTeamPilots = (teamId) => pilots.filter(p => p.teamId === teamId);

  const teamData = teams.map(t => {
    const tp = getTeamPilots(t.id);
    return {
      ...t,
      pilots: tp,
      totalPoints: tp.reduce((s, p) => s + p.points, 0),
      totalWins: tp.reduce((s, p) => s + p.wins, 0),
      avgMmr: tp.length ? Math.round(tp.reduce((s, p) => s + p.mmr, 0) / tp.length) : 0,
    };
  });

  return (
    <div className="animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="page-title">👥 Equipes</h1>
          <p className="page-subtitle">Gerencie suas equipes e veja estatísticas</p>
        </div>
        <Link to="/equipes/novo" className="btn btn-primary">+ Nova Equipe</Link>
      </div>

      {teamData.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3 className="empty-state-title">Nenhuma equipe encontrada</h3>
          <p className="empty-state-text">Crie sua primeira equipe!</p>
          <Link to="/equipes/novo" className="btn btn-primary">Criar Equipe</Link>
        </div>
      ) : (
        <div className="grid-3 mt-24">
          {teamData.map(t => (
            <div key={t.id} className="card" style={{ borderTop: `3px solid ${t.color}` }}>
              <div className="flex-between mb-16">
                <div className="flex gap-8" style={{ alignItems: 'center' }}>
                  <span className="team-dot" style={{ background: t.color, width: 16, height: 16 }}></span>
                  <h3 style={{ fontSize: '1.1rem' }}>{t.name}</h3>
                </div>
                <div className="btn-group">
                  <Link to={`/equipes/editar/${t.id}`} className="btn btn-sm btn-icon" title="Editar">✏️</Link>
                  <button
                    className="btn btn-sm btn-icon btn-danger"
                    type="button"
                    title="Excluir"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (window.confirm(`Excluir equipe "${t.name}"?`)) {
                        deleteTeam(t.id);
                      }
                    }}
                  >🗑️</button>
                </div>
              </div>

              <div className="grid-2 mb-16" style={{ gap: 8 }}>
                <div className="stat-card" style={{ padding: 12 }}>
                  <div className="stat-value" style={{ fontSize: '1.4rem' }}>{t.totalPoints}</div>
                  <div className="stat-label">Pontos</div>
                </div>
                <div className="stat-card" style={{ padding: 12 }}>
                  <div className="stat-value" style={{ fontSize: '1.4rem' }}>{t.totalWins}</div>
                  <div className="stat-label">Vitórias</div>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Pilotos ({t.pilots.length})
              </div>
              {t.pilots.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Nenhum piloto</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {t.pilots.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      <span className="text-mono" style={{ color: 'var(--accent-cyan)' }}>{p.mmr}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
