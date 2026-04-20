import { useState } from 'react';
import useStore from '../store/useStore';

const DEFAULT_RANKS = [
  { name: 'Bronze',       min: 0,    max: 999,  color: '#cd7f32' },
  { name: 'Silver',       min: 1000, max: 1499, color: '#c0c0c0' },
  { name: 'Gold',         min: 1500, max: 1999, color: '#ffd700' },
  { name: 'Platinum',     min: 2000, max: 2499, color: '#00cec9' },
  { name: 'Master',       min: 2500, max: 2999, color: '#a855f7' },
  { name: 'GrandMaster',  min: 3000, max: 3499, color: '#ef4444' },
  { name: 'Challenger',   min: 3500, max: 99999, color: '#f59e0b' },
];

export default function Settings() {
  const settings = useStore(s => s.settings);
  const updateSettings = useStore(s => s.updateSettings);
  const pilots = useStore(s => s.pilots);
  const races = useStore(s => s.races);
  const resetAllData = useStore(s => s.resetAllData);

  const currentRanks = settings?.ranks || DEFAULT_RANKS;
  const currentMMR = settings?.defaultMmr ?? 1000;
  const currentKFactor = settings?.kFactor ?? 32;
  const currentBaseSpeed = settings?.raceBaseSpeed ?? 0.35;

  const [ranks, setRanks] = useState(currentRanks.map(r => ({ ...r })));
  const [defaultMmr, setDefaultMmr] = useState(currentMMR);
  const [kFactor, setKFactor] = useState(currentKFactor);
  const [raceBaseSpeed, setRaceBaseSpeed] = useState(currentBaseSpeed);
  const [saved, setSaved] = useState(false);

  const updateRank = (index, field, value) => {
    setRanks(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
    setSaved(false);
  };

  const addRank = () => {
    const last = ranks[ranks.length - 1];
    setRanks(prev => [...prev, {
      name: 'Novo Rank',
      min: (last?.max || 0) + 1,
      max: (last?.max || 0) + 500,
      color: '#ffffff',
    }]);
    setSaved(false);
  };

  const removeRank = (index) => {
    if (ranks.length <= 1) return;
    setRanks(prev => prev.filter((_, i) => i !== index));
    setSaved(false);
  };

  const handleSave = () => {
    // Auto-fix ranges: make each rank start where the previous one ended +1
    const fixed = ranks.map((r, i) => ({
      ...r,
      min: i === 0 ? 0 : ranks[i - 1].max + 1,
      max: i === ranks.length - 1 ? 99999 : r.max,
      key: r.name.toLowerCase().replace(/\s+/g, ''),
    }));

    updateSettings({
      ranks: fixed,
      defaultMmr,
      kFactor,
      raceBaseSpeed,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (!window.confirm('Restaurar todas as configurações para o padrão?')) return;
    setRanks(DEFAULT_RANKS.map(r => ({ ...r })));
    setDefaultMmr(1000);
    setKFactor(32);
    setRaceBaseSpeed(0.35);
    setSaved(false);
  };

  const handleResetAllData = () => {
    if (!window.confirm('⚠️ ATENÇÃO: Isso vai apagar TODOS os dados (pilotos, equipes, mapas, corridas) e restaurar configurações. Continuar?')) return;
    if (!window.confirm('Tem certeza absoluta? Esta ação não pode ser desfeita!')) return;
    resetAllData();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      window.location.hash = '/';
    }, 1000);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">⚙️ Configurações</h1>
        <p className="page-subtitle">Personalize ranks, MMR e parâmetros do simulador</p>
      </div>

      {/* MMR Settings */}
      <div className="card mb-16" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>📊 Sistema de MMR</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">MMR Inicial</label>
            <input
              type="number"
              className="form-input"
              value={defaultMmr}
              onChange={e => { setDefaultMmr(parseInt(e.target.value) || 0); setSaved(false); }}
              min={0}
              max={5000}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>MMR de novos pilotos</small>
          </div>
          <div className="form-group">
            <label className="form-label">K-Factor</label>
            <input
              type="number"
              className="form-input"
              value={kFactor}
              onChange={e => { setKFactor(parseInt(e.target.value) || 1); setSaved(false); }}
              min={1}
              max={100}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Maior = mudanças maiores</small>
          </div>
        </div>
      </div>

      {/* Race Settings */}
      <div className="card mb-16" style={{ padding: 24 }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>🏎️ Configuração da Corrida</h3>
        <div className="slider-group">
          <div className="slider-header">
            <span className="slider-label">Velocidade Base dos Pilotos</span>
            <span className="slider-value">{raceBaseSpeed.toFixed(2)}</span>
          </div>
          <input
            type="range"
            className="slider-input"
            min="0.05"
            max="2.0"
            step="0.05"
            value={raceBaseSpeed}
            onChange={e => { setRaceBaseSpeed(parseFloat(e.target.value)); setSaved(false); }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
            <span>Lento (0.05)</span>
            <span>Padrão (0.35)</span>
            <span>Rápido (2.0)</span>
          </div>
        </div>
      </div>

      {/* Rank Configuration */}
      <div className="card mb-16" style={{ padding: 24 }}>
        <div className="flex-between mb-16">
          <h3 style={{ fontSize: '1rem' }}>🏅 Faixas de Rank</h3>
          <button className="btn btn-sm btn-primary" onClick={addRank}>+ Adicionar Rank</button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Cor</th>
                <th>Nome</th>
                <th>MMR Mín.</th>
                <th>MMR Máx.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ranks.map((rank, i) => (
                <tr key={i}>
                  <td>
                    <input
                      type="color"
                      value={rank.color}
                      onChange={e => updateRank(i, 'color', e.target.value)}
                      style={{ width: 32, height: 32, border: '2px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'none', padding: 2 }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-input"
                      value={rank.name}
                      onChange={e => updateRank(i, 'name', e.target.value)}
                      style={{ width: 150, padding: '6px 10px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-input text-mono"
                      value={rank.min}
                      onChange={e => updateRank(i, 'min', parseInt(e.target.value) || 0)}
                      style={{ width: 100, padding: '6px 10px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-input text-mono"
                      value={i === ranks.length - 1 ? '∞' : rank.max}
                      onChange={e => updateRank(i, 'max', parseInt(e.target.value) || 0)}
                      disabled={i === ranks.length - 1}
                      style={{ width: 100, padding: '6px 10px' }}
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-icon btn-danger"
                      onClick={() => removeRank(i)}
                      disabled={ranks.length <= 1}
                      title="Remover"
                    >🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          💡 O último rank sempre terá máximo ilimitado. As faixas serão auto-ajustadas ao salvar.
        </div>
      </div>

      {/* Save / Reset */}
      <div className="flex-between mb-16">
        <div className="btn-group">
          <button className="btn btn-primary btn-lg" onClick={handleSave}>
            {saved ? '✅ Salvo!' : '💾 Salvar Configurações'}
          </button>
          <button className="btn btn-lg" onClick={handleReset}>
            🔄 Restaurar Padrão
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ padding: 24, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--accent-red)', marginBottom: 12 }}>⚠️ Zona de Perigo</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
          Limpar todos os dados do simulador. Todos os pilotos, equipes, mapas e corridas serão apagados permanentemente.
        </p>
        <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          <span>📊 {pilots.length} pilotos</span>
          <span>🏁 {races.length} corridas</span>
        </div>
        <button className="btn btn-danger" onClick={handleResetAllData}>
          🗑️ Apagar Todos os Dados
        </button>
      </div>
    </div>
  );
}
