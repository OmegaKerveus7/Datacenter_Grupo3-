import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { accesoNFC } from '../api/visitas';

export default function VerificarNFC() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('LOGIN');
  const [mensaje, setMensaje] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const processedRef = useRef(null);

  const params = new URLSearchParams(window.location.search);
  const key = params.get('key');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.error) {
        setLoginError(data.error);
        return;
      }

      const id = `${key}:${data.usuario.id}`;
      if (processedRef.current === id) return;
      processedRef.current = id;

      setEstado('LOADING');
      const nfcRes = await accesoNFC(data.token, key);
      if (nfcRes.estado === 'ok') {
        setEstado('SUCCESS');
        setMensaje(nfcRes.mensaje || 'Acceso concedido');
      } else if (nfcRes.error === 'No tiene acceso') {
        setEstado('NO_ACCESO');
      } else if (nfcRes.error === 'No tiene visita programada para esta hora') {
        setEstado('NO_VISITA');
      } else {
        setEstado('NO_ACCESO');
      }
    } catch {
      setLoginError('Error de conexión');
    }
  };

  const ESTADOS = {
    SUCCESS: { icon: '✅', color: '#00b894' },
    NO_ACCESO: { icon: '🚫', color: '#e94560' },
    NO_VISITA: { icon: '📅', color: '#fdcb6e' },
    LOGIN: { icon: '🏢', color: '#636e72' },
    LOADING: { icon: '⏳', color: '#74b9ff' },
  };

  const e = ESTADOS[estado];

  if (!key) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ fontSize: '4em', textAlign: 'center', marginBottom: '20px' }}>🏢</div>
          <h2 style={{ textAlign: 'center' }}>Acceso por NFC</h2>
          <p style={styles.sub}>Escanea tu chip NFC</p>
          <button onClick={() => navigate('/dashboard')} style={styles.btn}>Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ fontSize: '4em', textAlign: 'center', marginBottom: '20px' }}>
          {estado === 'LOADING' ? '⏳' : e.icon}
        </div>

        {estado === 'LOADING' && <h2 style={{ textAlign: 'center' }}>Verificando...</h2>}

        {estado === 'SUCCESS' && (
          <>
            <h2 style={{ textAlign: 'center', color: e.color }}>{mensaje}</h2>
            <p style={styles.sub}>Puede ingresar</p>
            <button onClick={() => navigate('/dashboard')} style={{ ...styles.btn, background: e.color }}>Ir al Inicio</button>
          </>
        )}

        {['NO_ACCESO', 'NO_VISITA'].includes(estado) && (
          <>
            <h2 style={{ textAlign: 'center', color: e.color }}>
              {estado === 'NO_VISITA' ? 'No tiene visita programada para esta hora' : 'No tiene acceso'}
            </h2>
            <button onClick={() => setEstado('LOGIN')} style={{ ...styles.btn, background: e.color, marginTop: '20px' }}>
              Intentar de nuevo
            </button>
          </>
        )}

        {estado === 'LOGIN' && (
          <form onSubmit={handleLogin}>
            <h2 style={{ textAlign: 'center' }}>Identificación</h2>
            <p style={styles.sub}>Ingrese sus credenciales para verificar la visita</p>
            <input
              type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input} required
            />
            <input
              type="password" placeholder="Contraseña" value={password}
              onChange={e => setPassword(e.target.value)}
              style={styles.input} required
            />
            {loginError && <p style={{ color: '#e94560', fontSize: '0.85em', textAlign: 'center' }}>{loginError}</p>}
            <button type="submit" style={styles.btn}>Verificar</button>
          </form>
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
  input: {
    display: 'block', width: '100%', padding: '12px', borderRadius: '6px',
    border: '1px solid #444', background: '#16213e', color: 'white',
    fontSize: '1em', marginTop: '12px', boxSizing: 'border-box'
  },
  btn: {
    display: 'block', width: '100%', padding: '12px', borderRadius: '6px',
    border: 'none', background: '#e94560', color: 'white',
    fontSize: '1em', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px'
  }
};
