import { Link } from 'react-router-dom';
import useStore from '../store/useStore';
import RankBadge from '../components/RankBadge';

export default function Pilots() {
  const pilots = useStore(s => s.pilots);
  const teams = useStore(s => s.teams);
  const deletePilot = useStore(s => s.deletePilot);

  const getTeam = (id) => teams.find(t => t.id === id);

  const sorted = [...pilots].sort((a, b) => b.mmr - a.mmr);

  return (
    <div className="animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="page-title">🏎️ Pilotos</h1>
          <p className="page-subtitle">Gerencie seus pilotos e acompanhe seu progresso</p>
        </div>
        <Link to="/pilotos/novo" className="btn btn-primary">+ Novo Piloto</Link>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏎️</div>
          <h3 className="empty-state-title">Nenhum piloto encontrado</h3>
          <p className="empty-state-text">Crie seu primeiro piloto para começar!</p>
          <Link to="/pilotos/novo" className="btn btn-primary">Criar Piloto</Link>
        </div>
      ) : (
        <div className="table-container mt-24">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Piloto</th>
                <th>Equipe</th>
                <th>VEL</th>
                <th>CON</th>
                <th>AGR</th>
                <th>MMR</th>
                <th>Rank</th>
                <th>Pts</th>
                <th>V</th>
                <th>Corridas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => {
                const team = getTeam(p.teamId);
                return (
                  <tr key={p.id}>
                    <td>
                      <span className={`position-badge position-${i < 3 ? i + 1 : 'other'}`} style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                        {i + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      <span className="team-dot" style={{ background: team?.color || '#555' }}></span>
                      {p.name}
                    </td>
                    <td style={{ color: team?.color || 'var(--text-muted)' }}>{team?.name || '—'}</td>
                    <td className="text-mono">{p.speed}</td>
                    <td className="text-mono">{p.consistency}</td>
                    <td className="text-mono">{p.aggressiveness}</td>
                    <td className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{p.mmr}</td>
                    <td><RankBadge mmr={p.mmr} /></td>
                    <td className="text-mono">{p.points}</td>
                    <td className="text-mono" style={{ color: 'var(--accent-yellow)' }}>{p.wins}</td>
                    <td className="text-mono">{p.races}</td>
                    <td>
                      <div className="btn-group">
                        <Link to={`/pilotos/editar/${p.id}`} className="btn btn-sm btn-icon" title="Editar">✏️</Link>
                        <button
                          className="btn btn-sm btn-icon btn-danger"
                          type="button"
                          title="Excluir"
                          onClick={(e) => {
                            e.preventDefault();
                            if (window.confirm(`Excluir o piloto "${p.name}"?`)) {
                              deletePilot(p.id);
                            }
                          }}
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
