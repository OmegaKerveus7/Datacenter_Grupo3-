import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { abrirPuerta1, abrirPuerta2, desbloquearPuertas, bloquearPuertas } from '../api/puertas';
import { obtenerMonitoreo } from '../api/areas';

const DoorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M9 3h6a2 2 0 0 1 2 2v16H7V5a2 2 0 0 1 2-2z"/>
    <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none"/>
  </svg>
);
const NfcIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
    <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/>
  </svg>
);

const greetings = ['Buenos días', 'Buenas tardes', 'Buenas noches'];
const rolLabel = { admin: 'Administrador', gerente: 'Gerente', empleado: 'Empleado' };

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

  const h = new Date().getHours();
  const greeting = greetings[h < 12 ? 0 : h < 19 ? 1 : 2];

  async function handlePuerta(num) {
    setMsg(''); setError('');
    if (num === 1) {
      setLoading1(true);
      const res = await abrirPuerta1(token);
      setLoading1(false);
      res.estado === 'ok' ? setMsg('Puerta 1 abierta') : setError(res.error || 'Error al abrir puerta 1');
    } else {
      setLoading2(true);
      const res = await abrirPuerta2(token);
      setLoading2(false);
      res.estado === 'ok' ? setMsg('Puerta 2 abierta') : setError(res.error || 'Error al abrir puerta 2');
    }
  }

  return (
    <div className="page">
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2>{greeting}, {user.nombre}</h2>
          <p>Control de accesos del DataCenter</p>
        </div>
        <span className="badge badge-gray">{rolLabel[user.rol] || user.rol}</span>
      </div>

      {msg && (
        <div className="alert alert-success">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          {msg}
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      <p className="section-label">Control remoto</p>
      <div className="grid-doors" style={{ marginBottom: 20 }}>
        <div className="door-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="door-icon"><DoorIcon /></div>
            <div className="door-info">
              <h3>Puerta Principal</h3>
              <p>Acceso remoto autenticado</p>
            </div>
          </div>
          <button onClick={() => handlePuerta(1)} disabled={loading1} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            {loading1 ? <><span className="spinner"/>Abriendo...</> : 'Abrir Puerta 1'}
          </button>
        </div>

        {['gerente','admin'].includes(user.rol) && (
          <div className="door-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="door-icon"><NfcIcon /></div>
              <div className="door-info">
                <h3>Puerta Servidores</h3>
                <p>NFC o acceso remoto</p>
              </div>
            </div>
            <button onClick={() => handlePuerta(2)} disabled={loading2} className="btn btn-secondary btn-lg" style={{ width: '100%' }}>
              {loading2 ? <><span className="spinner"/>Abriendo...</> : 'Abrir Puerta 2'}
            </button>
          </div>
        )}
      </div>

      <div className="card card-sm">
        <p className="section-label" style={{ marginBottom: 10 }}>Información</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 10, fontSize: 13 }}>
            <span className="dot dot-green" style={{ marginTop: 7 }}/>
            <span><strong style={{ color: 'var(--text-strong)' }}>Puerta 1</strong> — apertura remota vía token de sesión</span>
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 13 }}>
            <span className="dot dot-blue" style={{ marginTop: 7 }}/>
            <span><strong style={{ color: 'var(--text-strong)' }}>Puerta 2</strong> — requiere visita aprobada y lectura NFC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
