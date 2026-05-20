import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { solicitarVisita } from '../api/visitas';

export default function SolicitarVisita() {
  const { token } = useAuth();
  const [motivo, setMotivo] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg('');
    setError('');
    setLoading(true);
    const horaProgramada = new Date(`${fecha}T${hora}`).toISOString();
    const res = await solicitarVisita(token, motivo, horaProgramada);
    setLoading(false);
    if (res.estado === 'ok') {
      setMsg('Solicitud de visita enviada correctamente. Espera la aprobación.');
      setMotivo('');
      setFecha('');
      setHora('');
    } else {
      setError(res.error || 'Error al solicitar visita');
    }
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Solicitar Visita al DataCenter</h2>
        <p style={styles.sub}>Programa una visita para acceder por la Puerta 2</p>

        {msg && <div style={styles.success}>{msg}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label>Motivo de la visita</label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
            rows="4"
            style={styles.textarea}
            placeholder="Describe el motivo de tu visita..."
          />

          <label>Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            min={minDate}
            style={styles.input}
          />

          <label>Hora</label>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            required
            style={styles.input}
          />

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', display: 'flex', justifyContent: 'center' },
  card: {
    background: '#1a1a2e',
    padding: '30px',
    borderRadius: '10px',
    width: '100%',
    maxWidth: '500px',
    color: 'white'
  },
  sub: { fontSize: '0.85em', opacity: 0.7, marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '0.9em' },
  textarea: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #333',
    background: '#16213e',
    color: 'white',
    fontSize: '1em',
    resize: 'vertical'
  },
  input: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #333',
    background: '#16213e',
    color: 'white',
    fontSize: '1em'
  },
  button: {
    padding: '12px',
    borderRadius: '6px',
    border: 'none',
    background: '#e94560',
    color: 'white',
    fontSize: '1em',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '10px'
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
