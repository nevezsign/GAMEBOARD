import { Link } from 'react-router-dom';
import useStore from '../store/useStore';
import { useRef, useEffect } from 'react';

function MiniTrackPreview({ trackPoints, width = 200, height = 140 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !trackPoints || trackPoints.length < 2) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.clearRect(0, 0, width, height);

    // Find bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    trackPoints.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });

    const trackW = maxX - minX || 1;
    const trackH = maxY - minY || 1;
    const scale = Math.min((width - 30) / trackW, (height - 30) / trackH);
    const offsetX = (width - trackW * scale) / 2 - minX * scale;
    const offsetY = (height - trackH * scale) / 2 - minY * scale;

    // Draw track
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    trackPoints.forEach((p, i) => {
      const x = p.x * scale + offsetX;
      const y = p.y * scale + offsetY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    if (trackPoints.length > 2) ctx.closePath();
    ctx.stroke();

    // Start dot
    const s = trackPoints[0];
    ctx.beginPath();
    ctx.arc(s.x * scale + offsetX, s.y * scale + offsetY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e';
    ctx.fill();
  }, [trackPoints, width, height]);

  if (!trackPoints || trackPoints.length < 2) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        Sem preview
      </div>
    );
  }

  return <canvas ref={canvasRef} style={{ borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)' }} />;
}

export default function Maps() {
  const maps = useStore(s => s.maps);
  const deleteMap = useStore(s => s.deleteMap);

  return (
    <div className="animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="page-title">🗺️ Mapas</h1>
          <p className="page-subtitle">Crie e gerencie pistas para suas corridas</p>
        </div>
        <Link to="/mapas/novo" className="btn btn-primary">+ Novo Mapa</Link>
      </div>

      {maps.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗺️</div>
          <h3 className="empty-state-title">Nenhum mapa encontrado</h3>
          <p className="empty-state-text">Crie sua primeira pista!</p>
          <Link to="/mapas/novo" className="btn btn-primary">Criar Mapa</Link>
        </div>
      ) : (
        <div className="grid-3 mt-24">
          {maps.map(m => (
            <div key={m.id} className="card">
              <MiniTrackPreview trackPoints={m.points} />
              <h3 style={{ marginTop: 12, fontSize: '1.05rem' }}>{m.name}</h3>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>🔄 {m.laps} voltas</span>
                <span>⚡ {m.difficulty}</span>
                <span>📍 {m.points?.length || 0} pontos</span>
              </div>
              <div className="btn-group mt-16">
                <Link to={`/mapas/editar/${m.id}`} className="btn btn-sm" style={{ flex: 1 }}>✏️ Editar</Link>
                <button
                  className="btn btn-sm btn-danger"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (window.confirm(`Excluir o mapa "${m.name}"?`)) {
                      deleteMap(m.id);
                    }
                  }}
                >🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
