import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

const ServerIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="8" rx="2"/>
    <rect x="2" y="13" width="20" height="8" rx="2"/>
    <circle cx="6" cy="7"  r="1" fill="currentColor" stroke="none"/>
    <circle cx="6" cy="17" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1"  x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1"  y1="12" x2="3"  y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const roleBadge = { admin: 'badge-red', gerente: 'badge-blue', empleado: 'badge-gray' };

function getInitialTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  if (!user) return null;

  const links = [
    { to: '/dashboard',        label: 'Inicio' },
    { to: '/solicitar-visita', label: 'Solicitar Visita' },
    { to: '/mis-visitas',      label: 'Mis Visitas' },
    ...(['admin','gerente'].includes(user.rol) ? [
      { to: '/panel-visitas', label: 'Panel Visitas' },
      { to: '/monitoreo',     label: 'Monitoreo' },
      { to: '/accesos',       label: 'Accesos' },
    ] : []),
    ...(user.rol === 'admin' ? [{ to: '/gestion-usuarios', label: 'Usuarios' }] : []),
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand-wrap">
          <Link to="/dashboard" className="navbar-brand">
            <ServerIcon />
            DataCenter FK
          </Link>
        </div>

        <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`navbar-link${location.pathname === l.to ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="navbar-right">
          <button
            className="theme-toggle"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <span className={`badge ${roleBadge[user.rol] || 'badge-gray'}`}>{user.rol}</span>
          <span className="navbar-user">{user.nombre}</span>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-secondary btn-sm">
            Salir
          </button>
          <button className="navbar-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menú">
            <span/><span/><span/>
          </button>
        </div>
      </div>
    </nav>
  );
}
