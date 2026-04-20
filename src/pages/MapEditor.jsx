import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useStore from '../store/useStore';

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

function interpolatePoints(controlPoints, density = 10) {
  if (controlPoints.length < 2) return [...controlPoints];
  const pts = [...controlPoints];
  // Close the loop
  pts.push(pts[0]);
  const result = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const p3 = pts[(i + 2) % pts.length];
    for (let t = 0; t < 1; t += 1 / density) {
      result.push(catmullRom(p0, p1, p2, p3, t));
    }
  }
  return result;
}

export default function MapEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const maps = useStore(s => s.maps);
  const addMap = useStore(s => s.addMap);
  const updateMap = useStore(s => s.updateMap);

  const existing = id ? maps.find(m => m.id === id) : null;
  const isEdit = !!existing;

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [controlPoints, setControlPoints] = useState([]);
  const [name, setName] = useState('Nova Pista');
  const [laps, setLaps] = useState(3);
  const [difficulty, setDifficulty] = useState('Medium');
  const [tool, setTool] = useState('draw'); // draw, move
  const [dragging, setDragging] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    if (existing) {
      // Try to recover control points or use raw points
      setControlPoints(existing.controlPoints || existing.points?.filter((_, i) => i % 10 === 0) || []);
      setName(existing.name);
      setLaps(existing.laps);
      setDifficulty(existing.difficulty);
    }
  }, [existing]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new ResizeObserver(([entry]) => {
      setCanvasSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    obs.observe(container);
    return () => obs.disconnect();
  }, []);

  const smoothPath = controlPoints.length >= 3 ? interpolatePoints(controlPoints, 12) : controlPoints;

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.w * dpr;
    canvas.height = canvasSize.h * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#0a0a16';
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvasSize.w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasSize.h); ctx.stroke();
    }
    for (let y = 0; y < canvasSize.h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasSize.w, y); ctx.stroke();
    }

    // Draw smooth path
    if (smoothPath.length >= 2) {
      // Track outline (wider)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 28;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      smoothPath.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      if (controlPoints.length >= 3) ctx.closePath();
      ctx.stroke();

      // Track main line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 4;
      smoothPath.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      if (controlPoints.length >= 3) ctx.closePath();
      ctx.stroke();

      // Sector coloring (thirds of the path)
      const third = Math.floor(smoothPath.length / 3);
      const sectorColors = ['rgba(239, 68, 68, 0.3)', 'rgba(0, 212, 255, 0.3)', 'rgba(168, 85, 247, 0.3)'];
      for (let s = 0; s < 3; s++) {
        const start = s * third;
        const end = s === 2 ? smoothPath.length : (s + 1) * third;
        ctx.beginPath();
        ctx.strokeStyle = sectorColors[s];
        ctx.lineWidth = 20;
        for (let i = start; i < end; i++) {
          if (i === start) ctx.moveTo(smoothPath[i].x, smoothPath[i].y);
          else ctx.lineTo(smoothPath[i].x, smoothPath[i].y);
        }
        ctx.stroke();
      }

      // Finish line
      if (smoothPath.length > 0) {
        const fp = smoothPath[0];
        ctx.save();
        ctx.translate(fp.x, fp.y);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-12, -4, 24, 8);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('START', 0, -8);
        ctx.restore();
      }
    }

    // Draw control points
    controlPoints.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#22c55e' : dragging === i ? '#f59e0b' : '#00d4ff';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${i + 1}`, p.x, p.y - 10);
    });

    // Instructions
    if (controlPoints.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '16px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Clique para adicionar pontos da pista', canvasSize.w / 2, canvasSize.h / 2);
      ctx.font = '12px Inter';
      ctx.fillText('Mínimo 3 pontos para fechar o circuito', canvasSize.w / 2, canvasSize.h / 2 + 24);
    }
  }, [controlPoints, smoothPath, canvasSize, dragging]);

  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e) => {
    const pos = getCanvasPos(e);

    if (tool === 'move' || e.button === 2) {
      // Check if clicking on a control point
      const idx = controlPoints.findIndex(p =>
        Math.hypot(p.x - pos.x, p.y - pos.y) < 15
      );
      if (idx !== -1) {
        setDragging(idx);
        return;
      }
    }

    if (tool === 'draw' && e.button === 0) {
      setControlPoints(prev => [...prev, pos]);
    }
  };

  const handleMouseMove = (e) => {
    if (dragging !== null) {
      const pos = getCanvasPos(e);
      setControlPoints(prev => prev.map((p, i) => i === dragging ? pos : p));
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    // Right click removes nearest point
    const pos = getCanvasPos(e);
    const idx = controlPoints.findIndex(p => Math.hypot(p.x - pos.x, p.y - pos.y) < 15);
    if (idx !== -1) {
      setControlPoints(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleSave = () => {
    if (!name.trim()) return alert('Dê um nome à pista!');
    if (controlPoints.length < 3) return alert('Precisa de pelo menos 3 pontos!');

    const data = {
      name: name.trim(),
      points: smoothPath,
      controlPoints: controlPoints,
      laps,
      difficulty,
      width: canvasSize.w,
      height: canvasSize.h,
      checkpoints: [],
      sectors: [
        { start: 0, end: Math.floor(smoothPath.length / 3) },
        { start: Math.floor(smoothPath.length / 3), end: Math.floor(smoothPath.length * 2 / 3) },
        { start: Math.floor(smoothPath.length * 2 / 3), end: smoothPath.length },
      ],
      finishIndex: 0,
    };

    if (isEdit) {
      updateMap(id, data);
    } else {
      addMap(data);
    }

    navigate('/mapas');
  };

  return (
    <div className="animate-fade-in">
      <div className="section-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">{isEdit ? '✏️ Editar Mapa' : '🗺️ Novo Mapa'}</h1>
          <p className="page-subtitle">Clique para adicionar pontos • Botão direito para remover</p>
        </div>
        <div className="btn-group">
          <button className="btn" onClick={() => navigate('/mapas')}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>💾 Salvar Mapa</button>
        </div>
      </div>

      <div className="editor-layout">
        <div
          ref={containerRef}
          className="editor-canvas-container"
          onContextMenu={handleContextMenu}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: tool === 'draw' ? 'crosshair' : 'grab' }}
          />
        </div>

        <div className="editor-sidebar">
          <div className="hud-section">
            <div className="hud-title">Configuração</div>
            <div className="form-group">
              <label className="form-label">Nome</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Voltas</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={50}
                  value={laps}
                  onChange={e => setLaps(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Dificuldade</label>
                <select
                  className="form-select"
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                >
                  <option value="Easy">Fácil</option>
                  <option value="Medium">Médio</option>
                  <option value="Hard">Difícil</option>
                </select>
              </div>
            </div>
          </div>

          <div className="hud-section">
            <div className="hud-title">Ferramentas</div>
            <div className="editor-tools">
              <button
                className={`editor-tool-btn ${tool === 'draw' ? 'active' : ''}`}
                onClick={() => setTool('draw')}
              >✏️ Desenhar</button>
              <button
                className={`editor-tool-btn ${tool === 'move' ? 'active' : ''}`}
                onClick={() => setTool('move')}
              >✋ Mover</button>
            </div>
          </div>

          <div className="hud-section">
            <div className="hud-title">Informações</div>
            <div className="hud-race-info">
              <div className="hud-info-item">
                <div className="hud-info-value">{controlPoints.length}</div>
                <div className="hud-info-label">Pontos</div>
              </div>
              <div className="hud-info-item">
                <div className="hud-info-value">{smoothPath.length}</div>
                <div className="hud-info-label">Path Total</div>
              </div>
            </div>
          </div>

          <div className="hud-section">
            <div className="hud-title">Ações</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                className="btn btn-sm btn-danger"
                style={{ width: '100%' }}
                onClick={() => setControlPoints([])}
              >🗑️ Limpar Tudo</button>
              <button
                className="btn btn-sm"
                style={{ width: '100%' }}
                onClick={() => setControlPoints(prev => prev.slice(0, -1))}
                disabled={controlPoints.length === 0}
              >↩️ Desfazer Último</button>
            </div>
          </div>

          <div className="hud-section" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div className="hud-title">Legenda</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div><span style={{ color: '#ef4444' }}>■</span> Setor 1</div>
              <div><span style={{ color: '#00d4ff' }}>■</span> Setor 2</div>
              <div><span style={{ color: '#a855f7' }}>■</span> Setor 3</div>
              <div><span style={{ color: '#22c55e' }}>■</span> Largada / Chegada</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
