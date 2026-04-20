import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { formatTime } from '../utils/constants';

// === RACE SIMULATION ENGINE ===
class RaceEngine {
  constructor(pilots, trackPoints, laps, difficulty, baseSpeed = 0.35) {
    this.trackPoints = trackPoints;
    this.totalPoints = trackPoints.length;
    this.laps = laps;
    this.difficulty = difficulty;
    this.baseSpeed = baseSpeed;
    this.totalDistance = laps * this.totalPoints;

    this.pilots = pilots.map((p, i) => ({
      ...p,
      progress: -i * 3, // Staggered start
      lap: 0,
      currentLap: 1,
      position: i + 1,
      finished: false,
      finishTick: null,
      lapTimes: [],
      lapStartTick: 0,
      bestLap: null,
      totalTime: null,
    }));

    this.tick = 0;
    this.running = false;
    this.finished = false;
    this.finishOrder = [];
    this.speedMultiplier = 1;
  }

  update() {
    if (this.finished) return;
    this.tick++;

    const diffMod = this.difficulty === 'Hard' ? 0.8 : this.difficulty === 'Easy' ? 1.15 : 1.0;

    for (const pilot of this.pilots) {
      if (pilot.finished) continue;

      // Speed calculation
      const movementBase = this.baseSpeed;
      const speedFactor = 0.5 + (pilot.speed / 100) * 0.9;
      const consistVar = (100 - pilot.consistency) / 100;
      const randomFactor = 1 + (Math.random() - 0.5) * consistVar * 0.35;

      // Drafting: boost if close behind another pilot
      let draftBonus = 1.0;
      for (const other of this.pilots) {
        if (other.id === pilot.id || other.finished) continue;
        const gap = other.progress - pilot.progress;
        if (gap > 0 && gap < 8) {
          draftBonus = 1.0 + (pilot.aggressiveness / 100) * 0.06;
          break;
        }
      }

      const movement = movementBase * speedFactor * randomFactor * diffMod * draftBonus * this.speedMultiplier;
      pilot.progress += movement;

      // Lap tracking
      const newLap = Math.floor(pilot.progress / this.totalPoints);
      if (newLap > pilot.lap) {
        const lapTime = (this.tick - pilot.lapStartTick) / 60; // seconds at 60fps
        pilot.lapTimes.push(lapTime);
        if (!pilot.bestLap || lapTime < pilot.bestLap) {
          pilot.bestLap = lapTime;
        }
        pilot.lapStartTick = this.tick;
        pilot.lap = newLap;
        pilot.currentLap = Math.min(newLap + 1, this.laps);

        // Check finish
        if (pilot.lap >= this.laps) {
          pilot.finished = true;
          pilot.finishTick = this.tick;
          pilot.totalTime = this.tick / 60;
          this.finishOrder.push(pilot.id);
        }
      }
    }

    // Update positions
    const sorted = [...this.pilots].sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return a.finishTick - b.finishTick;
      return b.progress - a.progress;
    });
    sorted.forEach((p, i) => { p.position = i + 1; });

    // Check if race is done
    if (this.pilots.every(p => p.finished)) {
      this.finished = true;
    }
  }

  getPilotTrackPosition(pilot) {
    if (!this.trackPoints.length) return { x: 0, y: 0 };
    const idx = ((Math.floor(pilot.progress) % this.totalPoints) + this.totalPoints) % this.totalPoints;
    const nextIdx = (idx + 1) % this.totalPoints;
    const frac = pilot.progress - Math.floor(pilot.progress);

    const p1 = this.trackPoints[idx];
    const p2 = this.trackPoints[nextIdx];

    return {
      x: p1.x + (p2.x - p1.x) * frac,
      y: p1.y + (p2.y - p1.y) * frac,
    };
  }

  getState() {
    return {
      tick: this.tick,
      elapsed: this.tick / 60,
      finished: this.finished,
      laps: this.laps,
      pilots: this.pilots.map(p => ({
        id: p.id,
        name: p.name,
        teamColor: p.teamColor,
        teamName: p.teamName,
        position: p.position,
        progress: p.progress,
        lap: p.lap,
        currentLap: p.currentLap,
        finished: p.finished,
        bestLap: p.bestLap,
        totalTime: p.totalTime,
        lapTimes: p.lapTimes,
        pos: this.getPilotTrackPosition(p),
      })),
    };
  }

  getResults() {
    return this.pilots
      .sort((a, b) => a.position - b.position)
      .map(p => ({
        pilotId: p.id,
        name: p.name,
        teamColor: p.teamColor,
        teamName: p.teamName,
        position: p.position,
        totalTime: p.totalTime,
        bestLap: p.bestLap,
        lapTimes: p.lapTimes,
      }));
  }
}

// === CANVAS RENDERER ===
function drawRace(ctx, w, h, trackPoints, state, selectedPilot) {
  // Background
  ctx.fillStyle = '#08081a';
  ctx.fillRect(0, 0, w, h);

  if (!trackPoints || trackPoints.length < 2) return;

  // Find bounds & compute transform
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  trackPoints.forEach(p => {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  });
  const trackW = maxX - minX || 1;
  const trackH = maxY - minY || 1;
  const padding = 60;
  const scale = Math.min((w - padding * 2) / trackW, (h - padding * 2) / trackH);
  const ox = (w - trackW * scale) / 2 - minX * scale;
  const oy = (h - trackH * scale) / 2 - minY * scale;

  const tx = (p) => ({ x: p.x * scale + ox, y: p.y * scale + oy });

  // Track outline (road)
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 34 * Math.min(scale, 1.2);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  trackPoints.forEach((p, i) => {
    const tp = tx(p);
    if (i === 0) ctx.moveTo(tp.x, tp.y);
    else ctx.lineTo(tp.x, tp.y);
  });
  ctx.closePath();
  ctx.stroke();

  // Sector coloring
  const third = Math.floor(trackPoints.length / 3);
  const sectorColors = ['rgba(239,68,68,0.12)', 'rgba(0,212,255,0.12)', 'rgba(168,85,247,0.12)'];
  for (let s = 0; s < 3; s++) {
    const start = s * third;
    const end = s === 2 ? trackPoints.length : (s + 1) * third;
    ctx.beginPath();
    ctx.strokeStyle = sectorColors[s];
    ctx.lineWidth = 24 * Math.min(scale, 1.2);
    for (let i = start; i <= end && i < trackPoints.length; i++) {
      const tp = tx(trackPoints[i]);
      if (i === start) ctx.moveTo(tp.x, tp.y);
      else ctx.lineTo(tp.x, tp.y);
    }
    ctx.stroke();
  }

  // Track center line
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  trackPoints.forEach((p, i) => {
    const tp = tx(p);
    if (i === 0) ctx.moveTo(tp.x, tp.y);
    else ctx.lineTo(tp.x, tp.y);
  });
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // Track border lines
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  trackPoints.forEach((p, i) => {
    const tp = tx(p);
    if (i === 0) ctx.moveTo(tp.x, tp.y);
    else ctx.lineTo(tp.x, tp.y);
  });
  ctx.closePath();
  ctx.stroke();

  // Finish line
  const fp = tx(trackPoints[0]);
  ctx.save();
  ctx.translate(fp.x, fp.y);
  ctx.fillStyle = '#22c55e';
  ctx.shadowColor = '#22c55e';
  ctx.shadowBlur = 10;
  ctx.fillRect(-14, -5, 28, 10);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 9px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('🏁', 0, -8);
  ctx.restore();

  // Sector labels
  const sectorLabels = ['S1', 'S2', 'S3'];
  const sectorDotColors = ['#ef4444', '#00d4ff', '#a855f7'];
  for (let s = 0; s < 3; s++) {
    const midIdx = Math.floor((s + 0.5) * third);
    if (midIdx < trackPoints.length) {
      const mp = tx(trackPoints[midIdx]);
      ctx.fillStyle = sectorDotColors[s];
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.5;
      ctx.fillText(sectorLabels[s], mp.x, mp.y - 20);
      ctx.globalAlpha = 1;
    }
  }

  if (!state || !state.pilots) return;

  // Draw pilots (back to front, selected pilot on top)
  const pilotsToRender = [...state.pilots].sort((a, b) => {
    if (a.id === selectedPilot) return 1;
    if (b.id === selectedPilot) return -1;
    return a.position - b.position;
  });

  for (const pilot of pilotsToRender) {
    const pos = tx(pilot.pos);
    const isSelected = pilot.id === selectedPilot;
    const radius = isSelected ? 10 : 7;

    // Glow
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = pilot.teamColor + '20';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 13, 0, Math.PI * 2);
      ctx.strokeStyle = pilot.teamColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Dot
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = pilot.teamColor;
    ctx.shadowColor = pilot.teamColor;
    ctx.shadowBlur = isSelected ? 12 : 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.stroke();

    // Position number
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${isSelected ? 8 : 7}px JetBrains Mono`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pilot.position, pos.x, pos.y);

    // Name label (ALWAYS visible)
    ctx.fillStyle = '#fff';
    ctx.font = `${isSelected ? 'bold 11px' : '10px'} Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // Background for name
    const nameText = pilot.name;
    const nameWidth = ctx.measureText(nameText).width + 8;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(pos.x - nameWidth / 2, pos.y - radius - 18, nameWidth, 14);
    ctx.fillStyle = isSelected ? '#fff' : 'rgba(255,255,255,0.85)';
    ctx.fillText(nameText, pos.x, pos.y - radius - 5);
  }
}

// === RACE PAGE COMPONENT ===
export default function Race() {
  const navigate = useNavigate();
  const activeRace = useStore(s => s.activeRace);
  const saveRace = useStore(s => s.saveRace);
  const settings = useStore(s => s.settings);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const animRef = useRef(null);

  const [raceState, setRaceState] = useState(null);
  const [selectedPilot, setSelectedPilot] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  const [raceStarted, setRaceStarted] = useState(false);
  const [raceDone, setRaceDone] = useState(false);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setCanvasSize({
        w: Math.floor(entry.contentRect.width),
        h: Math.floor(entry.contentRect.height),
      });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Initialize engine
  useEffect(() => {
    if (!activeRace) return;
    const { pilots, map, laps } = activeRace;
    engineRef.current = new RaceEngine(
      pilots,
      map.points || [],
      laps,
      map.difficulty || 'Medium',
      settings?.raceBaseSpeed ?? 0.35
    );
    setRaceState(engineRef.current.getState());
    setSelectedPilot(pilots[0]?.id || null);
  }, [activeRace]);

  // Animation loop
  useEffect(() => {
    if (!raceStarted || !engineRef.current) return;

    const loop = () => {
      const engine = engineRef.current;
      if (!engine || engine.finished) {
        if (engine && engine.finished && !raceDone) {
          setRaceDone(true);
          setRaceState(engine.getState());
        }
        return;
      }

      // Run multiple ticks per frame based on speed
      for (let i = 0; i < speed; i++) {
        engine.update();
        if (engine.finished) break;
      }

      setRaceState(engine.getState());
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [raceStarted, speed, raceDone]);

  // Canvas render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeRace) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.w * dpr;
    canvas.height = canvasSize.h * dpr;
    ctx.scale(dpr, dpr);

    drawRace(ctx, canvasSize.w, canvasSize.h, activeRace.map.points, raceState, selectedPilot);
  }, [canvasSize, raceState, selectedPilot, activeRace]);

  // Handle finish
  const handleFinish = () => {
    if (!engineRef.current) return;
    const results = engineRef.current.getResults();

    saveRace({
      results,
      mapId: activeRace.map.id,
      laps: activeRace.laps,
      participants: activeRace.pilots.map(p => p.id),
    });

    navigate('/pos-corrida');
  };

  if (!activeRace) {
    return (
      <div className="animate-fade-in">
        <div className="empty-state">
          <div className="empty-state-icon">🏁</div>
          <h3 className="empty-state-title">Nenhuma corrida configurada</h3>
          <p className="empty-state-text">Configure uma corrida primeiro</p>
          <button className="btn btn-primary" onClick={() => navigate('/pre-jogo')}>
            Configurar Corrida
          </button>
        </div>
      </div>
    );
  }

  const elapsed = raceState?.elapsed || 0;
  const sortedPilots = raceState?.pilots ? [...raceState.pilots].sort((a, b) => a.position - b.position) : [];
  const leaderProgress = sortedPilots[0]?.progress || 0;

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - var(--nav-height) - 48px)' }}>
      <div className="race-layout" style={{ height: '100%' }}>
        {/* Canvas */}
        <div ref={containerRef} className="race-canvas-container">
          <canvas ref={canvasRef} />

          {/* Overlay controls */}
          {!raceStarted && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 10,
            }}>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: 8 }}>🏁 Pronto!</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                  {activeRace.pilots.length} pilotos • {activeRace.laps} voltas • {activeRace.map.name}
                </p>
                <button
                  className="btn btn-primary btn-lg"
                  style={{ fontSize: '1.2rem', padding: '18px 48px' }}
                  onClick={() => setRaceStarted(true)}
                >
                  🚦 LARGADA!
                </button>
              </div>
            </div>
          )}

          {raceDone && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 10,
            }}>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: 8 }}>🏆 Corrida Finalizada!</h2>
                <p style={{ color: 'var(--accent-yellow)', fontSize: '1.2rem', marginBottom: 8, fontWeight: 700 }}>
                  🥇 {sortedPilots[0]?.name}
                </p>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                  Tempo: {formatTime(sortedPilots[0]?.totalTime)}
                </p>
                <button
                  className="btn btn-primary btn-lg"
                  style={{ fontSize: '1.1rem', padding: '16px 40px' }}
                  onClick={handleFinish}
                >
                  📊 Ver Resultados
                </button>
              </div>
            </div>
          )}
        </div>

        {/* HUD */}
        <div className="race-hud">
          {/* Race Info */}
          <div className="hud-section">
            <div className="hud-title">Informações</div>
            <div className="hud-race-info">
              <div className="hud-info-item">
                <div className="hud-info-value">{formatTime(elapsed)}</div>
                <div className="hud-info-label">Tempo</div>
              </div>
              <div className="hud-info-item">
                <div className="hud-info-value">
                  {Math.min((sortedPilots[0]?.currentLap || 1), activeRace.laps)}/{activeRace.laps}
                </div>
                <div className="hud-info-label">Volta</div>
              </div>
            </div>
          </div>

          {/* Speed Controls */}
          <div className="hud-section">
            <div className="hud-title">Velocidade</div>
            <div className="speed-controls">
              {[1, 2, 4, 8].map(s => (
                <button
                  key={s}
                  className={`speed-btn ${speed === s ? 'active' : ''}`}
                  onClick={() => setSpeed(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Positions */}
          <div className="hud-section" style={{ flex: 1, overflow: 'hidden' }}>
            <div className="hud-title">Posições</div>
            <div className="position-list" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 400px)' }}>
              {sortedPilots.map((p, i) => {
                const gap = i === 0 ? 0 : (leaderProgress - p.progress) / 2;
                return (
                  <div
                    key={p.id}
                    className={`position-item ${selectedPilot === p.id ? 'highlight' : ''}`}
                    onClick={() => setSelectedPilot(p.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className={`pos-num ${i < 3 ? 'top-3' : ''}`}>
                      {p.position}
                    </span>
                    <span className="pilot-dot" style={{ background: p.teamColor }}></span>
                    <span className="pilot-name">{p.name}</span>
                    <span className="pilot-gap">
                      {p.finished ? (
                        <span style={{ color: 'var(--accent-green)' }}>✓</span>
                      ) : i === 0 ? (
                        <span style={{ color: 'var(--accent-cyan)' }}>L{p.currentLap}</span>
                      ) : (
                        `+${gap.toFixed(1)}s`
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Pilot Info */}
          {selectedPilot && raceState && (
            <div className="hud-section">
              <div className="hud-title">Piloto Selecionado</div>
              {(() => {
                const p = raceState.pilots.find(pi => pi.id === selectedPilot);
                if (!p) return null;
                return (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span className="pilot-dot" style={{ background: p.teamColor, width: 12, height: 12 }}></span>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.teamName}</div>
                    <div className="hud-race-info mt-8">
                      <div className="hud-info-item">
                        <div className="hud-info-value" style={{ fontSize: '0.95rem' }}>P{p.position}</div>
                        <div className="hud-info-label">Posição</div>
                      </div>
                      <div className="hud-info-item">
                        <div className="hud-info-value" style={{ fontSize: '0.95rem' }}>
                          {p.bestLap ? formatTime(p.bestLap) : '—'}
                        </div>
                        <div className="hud-info-label">Melhor Volta</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
