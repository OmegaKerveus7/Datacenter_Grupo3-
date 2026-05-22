import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { abrirPuerta1, abrirPuerta2, desbloquearPuertas, bloquearPuertas } from '../api/puertas';
import { obtenerMonitoreo } from '../api/areas';

export default function Dashboard() {
  const { user, token } = useAuth();
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [loadingUnlock, setLoadingUnlock] = useState(false);
  const [loadingLock, setLoadingLock] = useState(false);
  const [alertaPIR, setAlertaPIR] = useState(false);

  useEffect(() => {
    if (user.rol !== 'gerente' && user.rol !== 'admin') return;
    const poll = setInterval(async () => {
      const res = await obtenerMonitoreo(token);
      if (!res.error && res.puertas?.alerta === 1) setAlertaPIR(true);
      else setAlertaPIR(false);
    }, 3000);
    return () => clearInterval(poll);
  }, [token, user.rol]);

  async function handleAbrirPuerta1() {
    setLoading1(true); setMsg(''); setError('');
    const res = await abrirPuerta1(token);
    setLoading1(false);
    if (res.estado === 'ok') setMsg('Puerta 1 abierta correctamente');
    else setError(res.error || 'Error al abrir puerta 1');
  }

  async function handleAbrirPuerta2() {
    setLoading2(true); setMsg(''); setError('');
    const res = await abrirPuerta2(token);
    setLoading2(false);
    if (res.estado === 'ok') setMsg('Puerta 2 abierta correctamente');
    else setError(res.error || 'Error al abrir puerta 2');
  }

  async function handleUnlock() {
    setLoadingUnlock(true); setMsg(''); setError('');
    const res = await desbloquearPuertas(token);
    setLoadingUnlock(false);
    if (res.estado === 'ok') setMsg('Puertas desbloqueadas');
    else setError(res.error || 'Error al desbloquear');
  }

  async function handleLock() {
    setLoadingLock(true); setMsg(''); setError('');
    const res = await bloquearPuertas(token);
    setLoadingLock(false);
    if (res.estado === 'ok') setMsg('Puertas bloqueadas');
    else setError(res.error || 'Error al bloquear');
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Bienvenido, {user.nombre}</h2>
        <p style={styles.rol}>Rol: <strong>{user.rol}</strong></p>

        {alertaPIR && (
          <div style={styles.alerta}>
            Acceso no identificado detectado en puertas
          </div>
        )}

        {msg && <div style={styles.success}>{msg}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.buttons}>
          <button onClick={handleAbrirPuerta1} disabled={loading1} style={styles.btn}>
            {loading1 ? 'Abriendo...' : 'Abrir Puerta 1'}
          </button>
          {(user.rol === 'gerente' || user.rol === 'admin') && (
            <button onClick={handleAbrirPuerta2} disabled={loading2} style={{ ...styles.btn, background: '#0f3460' }}>
              {loading2 ? 'Abriendo...' : 'Abrir Puerta 2'}
            </button>
          )}
        </div>

        {(user.rol === 'gerente' || user.rol === 'admin') && (
          <div style={styles.lockButtons}>
            <button onClick={handleLock} disabled={loadingLock} style={{ ...styles.btnLock, background: '#e94560' }}>
              {loadingLock ? 'Bloqueando...' : 'Bloquear Puertas'}
            </button>
            <button onClick={handleUnlock} disabled={loadingUnlock} style={{ ...styles.btnLock, background: '#00b894' }}>
              {loadingUnlock ? 'Desbloqueando...' : 'Desbloquear Puertas'}
            </button>
          </div>
        )}

        <div style={styles.info}>
          <p>Puerta 1: Acceso remoto (autenticación)</p>
          <p>Puerta 2: Acceso mediante NFC (solo empleados)</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', display: 'flex', justifyContent: 'center' },
  card: { background: '#1a1a2e', padding: '30px', borderRadius: '10px', width: '100%', maxWidth: '500px', color: 'white' },
  rol: { fontSize: '0.9em', opacity: 0.7, marginBottom: '20px' },
  alerta: {
    background: '#e9456033', color: '#e94560', padding: '12px', borderRadius: '6px',
    marginBottom: '15px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #e94560'
  },
  buttons: { display: 'flex', gap: '15px', marginBottom: '20px' },
  btn: { flex: 1, padding: '15px', borderRadius: '8px', border: 'none', background: '#e94560', color: 'white', fontSize: '1em', fontWeight: 'bold', cursor: 'pointer' },
  lockButtons: { display: 'flex', gap: '10px', marginBottom: '20px' },
  btnLock: { flex: 1, padding: '12px', borderRadius: '8px', border: 'none', color: 'white', fontSize: '1em', fontWeight: 'bold', cursor: 'pointer' },
  success: { background: '#00b89433', color: '#00b894', padding: '10px', borderRadius: '6px', marginBottom: '15px', textAlign: 'center' },
  error: { background: '#e9456033', color: '#e94560', padding: '10px', borderRadius: '6px', marginBottom: '15px', textAlign: 'center' },
  info: { fontSize: '0.8em', opacity: 0.6, borderTop: '1px solid #333', paddingTop: '15px' }
};
