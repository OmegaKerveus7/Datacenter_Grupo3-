import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!user) return null;

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <Link to="/dashboard" style={styles.brand}>DataCenter</Link>
        <span style={styles.badge}>{user.rol}</span>
      </div>
      <div style={styles.center}>
        <Link to="/dashboard" style={styles.link}>Inicio</Link>
        <Link to="/solicitar-visita" style={styles.link}>Solicitar Visita</Link>
        <Link to="/mis-visitas" style={styles.link}>Mis Visitas</Link>
        <Link to="/verificar-nfc" style={styles.link}>Acceso NFC</Link>
        {(user.rol === 'gerente' || user.rol === 'admin') && (
          <Link to="/panel-visitas" style={styles.link}>Panel Visitas</Link>
        )}
        {user.rol === 'admin' && (
          <Link to="/gestion-usuarios" style={styles.link}>Usuarios</Link>
        )}
      </div>
      <div style={styles.right}>
        <span style={styles.userName}>{user.nombre}</span>
        <button onClick={handleLogout} style={styles.logoutBtn}>Salir</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#1a1a2e',
    color: 'white',
    padding: '10px 20px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  left: { display: 'flex', alignItems: 'center', gap: '10px' },
  brand: { color: '#e94560', fontWeight: 'bold', fontSize: '1.2em', textDecoration: 'none' },
  badge: {
    background: '#e94560',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.75em',
    textTransform: 'uppercase'
  },
  center: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
  link: { color: 'white', textDecoration: 'none', fontSize: '0.9em' },
  right: { display: 'flex', alignItems: 'center', gap: '10px' },
  userName: { fontSize: '0.85em', opacity: 0.8 },
  logoutBtn: {
    background: '#e94560',
    color: 'white',
    border: 'none',
    padding: '5px 12px',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};
