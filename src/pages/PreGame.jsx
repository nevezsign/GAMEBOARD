import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useStore from '../store/useStore';
import RankBadge from '../components/RankBadge';

export default function PreGame() {
  const navigate = useNavigate();
  const pilots = useStore(s => s.pilots);
  const teams = useStore(s => s.teams);
  const maps = useStore(s => s.maps);
  const setActiveRace = useStore(s => s.setActiveRace);

  const [selectedPilots, setSelectedPilots] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);
  const [laps, setLaps] = useState(3);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPilots = pilots.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teams.find(t => t.id === p.teamId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTeam = (id) => teams.find(t => t.id === id);

  const togglePilot = (id) => {
    setSelectedPilots(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedPilots.length === pilots.length) {
      setSelectedPilots([]);
    } else {
      setSelectedPilots(pilots.map(p => p.id));
    }
  };

  const handleStart = () => {
    if (selectedPilots.length < 2) return alert('Selecione pelo menos 2 pilotos!');
    if (!selectedMap) return alert('Selecione um mapa!');

    const map = maps.find(m => m.id === selectedMap);
    const racePilots = selectedPilots.map(id => {
      const p = pilots.find(pi => pi.id === id);
      const team = getTeam(p.teamId);
      return {
        id: p.id,
        name: p.name,
        speed: p.speed,
        consistency: p.consistency,
        aggressiveness: p.aggressiveness,
        mmr: p.mmr,
        teamColor: team?.color || '#888888',
        teamName: team?.name || 'Sem equipe',
      };
    });

    setActiveRace({
      pilots: racePilots,
      map,
      laps: laps || map.laps || 3,
    });

    navigate('/corrida');
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">🚀 Configurar Corrida</h1>
        <p className="page-subtitle">Selecione pilotos, mapa e configure a corrida</p>
      </div>

      {pilots.length < 2 || maps.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <h3 style={{ marginBottom: 12 }}>⚠️ Pré-requisitos</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Você precisa de pelo menos <strong>2 pilotos</strong> e <strong>1 mapa</strong> para iniciar uma corrida.
          </p>
          <div className="btn-group" style={{ justifyContent: 'center' }}>
            {pilots.length < 2 && <Link to="/pilotos/novo" className="btn btn-primary">Criar Pilotos</Link>}
            {maps.length === 0 && <Link to="/mapas/novo" className="btn btn-primary">Criar Mapa</Link>}
          </div>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: 24 }}>
          {/* Left: Pilot Selection */}
          <div>
            <div className="section-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="section-title">🏎️ Pilotos ({selectedPilots.length}/{pilots.length})</h3>
                <button className="btn btn-sm" onClick={selectAll}>
                  {selectedPilots.length === pilots.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
              </div>
              <input 
                type="text" 
                className="form-input" 
                placeholder="🔍 Buscar piloto ou equipe..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 'calc(100vh - 380px)', overflowY: 'auto', paddingRight: 4 }}>
              {filteredPilots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Nenhum piloto encontrado
                </div>
              ) : (
                filteredPilots.map(p => {
                  const team = getTeam(p.teamId);
                  const selected = selectedPilots.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`selection-card ${selected ? 'selected' : ''}`}
                      onClick={() => togglePilot(p.id)}
                    >
                      <div className="check"></div>
                      <div
                        className="pilot-avatar"
                        style={{ background: team?.color || '#555', width: 36, height: 36, fontSize: '0.8rem' }}
                      >
                        {p.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {team?.name || 'Sem equipe'} • VEL:{p.speed} CON:{p.consistency} AGR:{p.aggressiveness}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="text-mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>{p.mmr}</div>
                        <RankBadge mmr={p.mmr} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Map + Config */}
          <div>
            <div className="section-header">
              <h3 className="section-title">🗺️ Mapa</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              {maps.map(m => (
                <div
                  key={m.id}
                  className={`selection-card ${selectedMap === m.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedMap(m.id);
                    setLaps(m.laps || 3);
                  }}
                >
                  <div className="check"></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      🔄 {m.laps} voltas • ⚡ {m.difficulty} • 📍 {m.points?.length || 0} pontos
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hud-section">
              <div className="hud-title">Configuração da Corrida</div>
              <div className="form-group">
                <label className="form-label">Número de Voltas</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={50}
                  value={laps}
                  onChange={e => setLaps(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="hud-section mt-16">
              <div className="hud-title">Resumo</div>
              <div className="hud-race-info">
                <div className="hud-info-item">
                  <div className="hud-info-value">{selectedPilots.length}</div>
                  <div className="hud-info-label">Pilotos</div>
                </div>
                <div className="hud-info-item">
                  <div className="hud-info-value">{laps}</div>
                  <div className="hud-info-label">Voltas</div>
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg mt-24"
              style={{ width: '100%', fontSize: '1.1rem', padding: '16px' }}
              onClick={handleStart}
              disabled={selectedPilots.length < 2 || !selectedMap}
            >
              🏁 Iniciar Corrida
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
