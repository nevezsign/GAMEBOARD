import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useStore from '../store/useStore';

export default function PilotForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pilots = useStore(s => s.pilots);
  const teams = useStore(s => s.teams);
  const addPilot = useStore(s => s.addPilot);
  const updatePilot = useStore(s => s.updatePilot);

  const existing = id ? pilots.find(p => p.id === id) : null;
  const isEdit = !!existing;

  const [form, setForm] = useState({
    name: '',
    teamId: '',
    speed: 50,
    consistency: 50,
    aggressiveness: 50,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        teamId: existing.teamId || '',
        speed: existing.speed,
        consistency: existing.consistency,
        aggressiveness: existing.aggressiveness,
      });
    }
  }, [existing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Nome é obrigatório!');

    if (isEdit) {
      updatePilot(id, {
        name: form.name.trim(),
        teamId: form.teamId || null,
        speed: form.speed,
        consistency: form.consistency,
        aggressiveness: form.aggressiveness,
      });
    } else {
      addPilot({
        name: form.name.trim(),
        teamId: form.teamId || null,
        speed: form.speed,
        consistency: form.consistency,
        aggressiveness: form.aggressiveness,
      });
    }
    navigate('/pilotos');
  };

  const totalAttr = form.speed + form.consistency + form.aggressiveness;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? '✏️ Editar Piloto' : '🏎️ Novo Piloto'}</h1>
        <p className="page-subtitle">{isEdit ? `Editando ${existing?.name}` : 'Crie um novo piloto para competir'}</p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 28 }}>
        <div className="form-group">
          <label className="form-label">Nome do Piloto</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ex: Max Verstappen"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Equipe</label>
          <select
            className="form-select"
            value={form.teamId}
            onChange={e => setForm({ ...form, teamId: e.target.value })}
          >
            <option value="">Sem equipe</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 8 }}>
          <div className="flex-between mb-16">
            <span className="form-label" style={{ margin: 0 }}>Atributos</span>
            <span className="text-mono" style={{ fontSize: '0.8rem', color: totalAttr > 200 ? 'var(--accent-red)' : 'var(--accent-cyan)' }}>
              Total: {totalAttr}/300
            </span>
          </div>
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span className="slider-label">⚡ Velocidade</span>
            <span className="slider-value">{form.speed}</span>
          </div>
          <input
            type="range"
            className="slider-input"
            min="1"
            max="100"
            value={form.speed}
            onChange={e => setForm({ ...form, speed: parseInt(e.target.value) })}
          />
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span className="slider-label">🎯 Consistência</span>
            <span className="slider-value">{form.consistency}</span>
          </div>
          <input
            type="range"
            className="slider-input"
            min="1"
            max="100"
            value={form.consistency}
            onChange={e => setForm({ ...form, consistency: parseInt(e.target.value) })}
          />
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span className="slider-label">🔥 Agressividade</span>
            <span className="slider-value">{form.aggressiveness}</span>
          </div>
          <input
            type="range"
            className="slider-input"
            min="1"
            max="100"
            value={form.aggressiveness}
            onChange={e => setForm({ ...form, aggressiveness: parseInt(e.target.value) })}
          />
        </div>

        <div className="btn-group mt-24">
          <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }}>
            {isEdit ? '💾 Salvar Alterações' : '🏎️ Criar Piloto'}
          </button>
          <button type="button" className="btn btn-lg" onClick={() => navigate('/pilotos')}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
