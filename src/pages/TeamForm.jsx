import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useStore from '../store/useStore';
import { TEAM_COLORS } from '../utils/constants';

export default function TeamForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const teams = useStore(s => s.teams);
  const addTeam = useStore(s => s.addTeam);
  const updateTeam = useStore(s => s.updateTeam);

  const existing = id ? teams.find(t => t.id === id) : null;
  const isEdit = !!existing;

  const [form, setForm] = useState({
    name: '',
    color: '#00d4ff',
  });

  useEffect(() => {
    if (existing) {
      setForm({ name: existing.name, color: existing.color });
    }
  }, [existing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Nome é obrigatório!');

    if (isEdit) {
      updateTeam(id, { name: form.name.trim(), color: form.color });
    } else {
      addTeam({ name: form.name.trim(), color: form.color });
    }
    navigate('/equipes');
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 500, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? '✏️ Editar Equipe' : '👥 Nova Equipe'}</h1>
        <p className="page-subtitle">{isEdit ? `Editando ${existing?.name}` : 'Crie uma nova equipe'}</p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 28 }}>
        <div className="form-group">
          <label className="form-label">Nome da Equipe</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ex: Red Bull Racing"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Cor da Equipe</label>
          <div className="color-picker-wrap">
            <input
              type="color"
              className="color-picker"
              value={form.color}
              onChange={e => setForm({ ...form, color: e.target.value })}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="text-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{form.color.toUpperCase()}</span>
              <input 
                type="text" 
                className="form-input" 
                value={form.color} 
                onChange={e => {
                  const val = e.target.value;
                  if (/^#[0-9A-F]{0,6}$/i.test(val)) {
                    setForm({ ...form, color: val });
                  }
                }}
                placeholder="#00D4FF"
                style={{ width: 100, padding: '4px 8px', fontSize: '0.8rem', height: 'auto' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {TEAM_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, color: c })}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: c,
                  border: form.color === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                  transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>

        <div className="btn-group mt-24">
          <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }}>
            {isEdit ? '💾 Salvar' : '👥 Criar Equipe'}
          </button>
          <button type="button" className="btn btn-lg" onClick={() => navigate('/equipes')}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
