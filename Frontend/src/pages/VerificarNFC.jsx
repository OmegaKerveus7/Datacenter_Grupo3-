import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { verificarNFC } from '../api/visitas';
import { abrirPuerta2 } from '../api/puertas';

export default function VerificarNFC() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [verificado, setVerificado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);

  async function handleVerificar(e) {
    e.preventDefault();
    setMsg('');
    setError('');
    setLoading(true);
    const res = await verificarNFC(token, id, codigo);
    setLoading(false);
    if (res.estado === 'ok') {
      setVerificado(true);
      setMsg('Código NFC verificado correctamente. Ya puedes abrir la puerta 2.');
    } else {
      setError(res.error || 'Error al verificar código NFC');
    }
  }

  async function handleAbrirPuerta() {
    setOpening(true);
    setError('');
    const res = await abrirPuerta2(token);
    setOpening(false);
    if (res.estado === 'ok') {
      setMsg('Puerta 2 abierta correctamente');
    } else {
      setError(res.error || 'Error al abrir puerta');
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Verificar Código NFC</h2>
        <p style={styles.sub}>Escanea tu código NFC o ingrésalo manualmente</p>

        {msg && <div style={styles.success}>{msg}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleVerificar} style={styles.form}>
          <input
            type="text"
            placeholder="Código NFC"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            required
            style={styles.input}
          />
          <button type="submit" disabled={loading || verificado} style={styles.button}>
            {loading ? 'Verificando...' : 'Verificar Código'}
          </button>
        </form>

        {verificado && (
          <button
            onClick={handleAbrirPuerta}
            disabled={opening}
            style={{ ...styles.button, background: '#00b894', marginTop: '15px' }}
          >
            {opening ? 'Abriendo...' : 'Abrir Puerta 2'}
          </button>
        )}

        <button
          onClick={() => navigate('/mis-visitas')}
          style={{ ...styles.button, background: '#333', marginTop: '10px' }}
        >
          Volver a Mis Visitas
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', display: 'flex', justifyContent: 'center' },
  card: {
    background: '#1a1a2e', padding: '30px', borderRadius: '10px',
    width: '100%', maxWidth: '450px', color: 'white'
  },
  sub: { fontSize: '0.85em', opacity: 0.7, marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: {
    padding: '12px', borderRadius: '6px', border: '1px solid #333',
    background: '#16213e', color: 'white', fontSize: '1.2em',
    textAlign: 'center', letterSpacing: '3px'
  },
  button: {
    padding: '12px', borderRadius: '6px', border: 'none',
    background: '#e94560', color: 'white', fontSize: '1em',
    cursor: 'pointer', fontWeight: 'bold'
  },
  success: {
    background: '#00b89433', color: '#00b894', padding: '10px',
    borderRadius: '6px', marginBottom: '15px', textAlign: 'center'
  },
  error: {
    background: '#e9456033', color: '#e94560', padding: '10px',
    borderRadius: '6px', marginBottom: '15px', textAlign: 'center'
  }
};
