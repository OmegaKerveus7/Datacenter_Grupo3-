import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { accesoNFC } from '../api/visitas';

export default function VerificarNFC() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [estado, setEstado] = useState('WAITING');
  const [mensaje, setMensaje] = useState('');
  const processedRef = useRef(null);

  useEffect(() => {
    if (loading) return;

    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');
    if (!key) { setEstado('WAITING'); return; }

    const id = `${key}:${user ? user.id : 'null'}`;
    if (processedRef.current === id) return;
    processedRef.current = id;

    setEstado('LOADING');
    accesoNFC(key).then(res => {
      if (res.estado === 'ok') {
        setEstado('SUCCESS');
        setMensaje(res.mensaje || 'Acceso concedido');
      } else if (res.error === 'No tiene acceso') {
        setEstado('NO_ACCESO');
      } else if (res.error === 'No tiene visita programada para esta hora') {
        setEstado('NO_VISITA');
      } else if (!user) {
        setEstado('NO_LOGIN');
      } else {
        setEstado('NO_ACCESO');
      }
    });
  }, [user, loading]);

  const ESTADOS = {
    SUCCESS: { icon: '✅', color: '#00b894', msg: mensaje },
    NO_ACCESO: { icon: '🚫', color: '#e94560', msg: 'No tiene acceso' },
    NO_VISITA: { icon: '📅', color: '#fdcb6e', msg: 'No tiene visita programada para esta hora' },
    NO_LOGIN: { icon: '🔒', color: '#e94560', msg: 'No está logueado' },
    WAITING: { icon: '🏢', color: '#636e72', msg: '' },
    LOADING: { icon: '⏳', color: '#74b9ff', msg: '' },
  };

  const e = ESTADOS[estado];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ fontSize: '4em', textAlign: 'center', marginBottom: '20px' }}>
          {estado === 'LOADING' ? '⏳' : e.icon}
        </div>

        {estado === 'LOADING' && <h2 style={{ textAlign: 'center' }}>Verificando...</h2>}

        {estado === 'WAITING' && (
          <>
            <h2 style={{ textAlign: 'center' }}>Acceso por NFC</h2>
            <p style={styles.sub}>Escanea tu chip NFC</p>
            <button onClick={() => navigate('/dashboard')} style={styles.btn}>Volver</button>
          </>
        )}

        {estado === 'SUCCESS' && (
          <>
            <h2 style={{ textAlign: 'center', color: e.color }}>{e.msg}</h2>
            <p style={styles.sub}>Puede ingresar</p>
            <button onClick={() => navigate('/dashboard')} style={{ ...styles.btn, background: e.color }}>Ir al Inicio</button>
          </>
        )}

        {['NO_ACCESO', 'NO_VISITA', 'NO_LOGIN'].includes(estado) && (
          <>
            <h2 style={{ textAlign: 'center', color: e.color }}>{e.msg}</h2>
            <button onClick={() => navigate(user ? '/dashboard' : '/login')} style={{ ...styles.btn, background: e.color, marginTop: '20px' }}>
              {user ? 'Volver' : 'Iniciar Sesion'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' },
  card: {
    background: '#1a1a2e', padding: '40px', borderRadius: '10px',
    width: '100%', maxWidth: '400px', color: 'white'
  },
  sub: { textAlign: 'center', fontSize: '0.9em', opacity: 0.7, marginTop: '10px' },
  btn: {
    display: 'block', width: '100%', padding: '12px', borderRadius: '6px',
    border: 'none', background: '#e94560', color: 'white',
    fontSize: '1em', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px'
  }
};
