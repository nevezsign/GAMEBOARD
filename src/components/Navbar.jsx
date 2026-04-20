import { NavLink, Link } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/', label: '🏠 Home' },
    { to: '/pilotos', label: '🏎️ Pilotos' },
    { to: '/equipes', label: '👥 Equipes' },
    { to: '/rankings', label: '🏆 Rankings' },
    { to: '/mapas', label: '🗺️ Mapas' },
    { to: '/configuracoes', label: '⚙️ Config' },
  ];

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">🏁</span>
        <span>Apex Rivals</span>
      </Link>

      <button className="navbar-mobile-toggle" onClick={() => setOpen(!open)}>
        {open ? '✕' : '☰'}
      </button>

      <ul className={`navbar-links${open ? ' open' : ''}`}>
        {links.map(l => (
          <li key={l.to}>
            <NavLink
              to={l.to}
              end={l.to === '/'}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          </li>
        ))}
        <li>
          <NavLink
            to="/pre-jogo"
            className="nav-start-btn"
            onClick={() => setOpen(false)}
          >
            🚀 Corrida
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
