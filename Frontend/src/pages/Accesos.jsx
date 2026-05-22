import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerAccesos } from '../api/accesos';
import { obtenerMonitoreo } from '../api/areas';

function formatFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
}

export default function Accesos() {
  const { token } = useAuth();
  const [accesos, setAccesos] = useState([]);
  const [monitoreo, setMonitoreo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerMonitoreo(token).then(res => {
      if (!res.error) setMonitoreo(res);
    });
    obtenerAccesos(token).then(res => {
      if (res.error) setError(res.error);
      else setAccesos(res);
    });
  }, [token]);

  const puertas = monitoreo?.puertas;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Control de Accesos</h2>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={{ margin: 0, borderBottom: '1px solid #333', paddingBottom: '10px' }}>Puerta 1</h3>
          <table style={styles.table}>
            <tbody>
              <tr><td style={styles.tdLabel}>Estado</td><td style={styles.tdValue}>{puertas?.puerta1 === 1 ? 'Abierta' : 'Cerrada'}</td></tr>
              <tr><td style={styles.tdLabel}>Botón</td><td style={styles.tdValue}>{puertas?.btn1 === 1 ? 'Presionado' : '—'}</td></tr>
            </tbody>
          </table>
        </div>
        <div style={styles.card}>
          <h3 style={{ margin: 0, borderBottom: '1px solid #333', paddingBottom: '10px' }}>Puerta 2</h3>
          <table style={styles.table}>
            <tbody>
              <tr><td style={styles.tdLabel}>Estado</td><td style={styles.tdValue}>{puertas?.puerta2 === 1 ? 'Abierta' : 'Cerrada'}</td></tr>
              <tr><td style={styles.tdLabel}>Botón</td><td style={styles.tdValue}>{puertas?.btn2 === 1 ? 'Presionado' : '—'}</td></tr>
            </tbody>
          </table>
        </div>
        <div style={styles.card}>
          <h3 style={{ margin: 0, borderBottom: '1px solid #333', paddingBottom: '10px' }}>Sensores</h3>
          <table style={styles.table}>
            <tbody>
              <tr><td style={styles.tdLabel}>PIR</td><td style={styles.tdValue}>{puertas?.pir === 1 ? 'Movimiento' : 'Inactivo'}</td></tr>
              <tr><td style={styles.tdLabel}>Alarma</td><td style={styles.tdValue}>{puertas?.alerta === 1 ? 'ACTIVA' : 'Inactiva'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...styles.card, marginTop: '25px' }}>
        <h3 style={{ margin: 0, borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>Historial de Accesos</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ ...styles.table, minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <th style={styles.th}>Fecha/Hora</th>
                <th style={styles.th}>Usuario</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Puerta</th>
                <th style={styles.th}>Método</th>
              </tr>
            </thead>
            <tbody>
              {accesos.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>Sin registros</td></tr>
              )}
              {accesos.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #222' }}>
                  <td style={styles.td}>{formatFecha(a.created_at)}</td>
                  <td style={styles.td}>{a.nombre}</td>
                  <td style={styles.td}>{a.email}</td>
                  <td style={styles.td}>Puerta {a.puerta}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.metodo,
                      background: a.metodo === 'nfc' ? '#00b89422' : '#0984e322',
                      color: a.metodo === 'nfc' ? '#00b894' : '#0984e3'
                    }}>
                      {a.metodo === 'nfc' ? 'NFC' : 'Remoto'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '1000px', margin: '0 auto' },
  title: { color: 'white', textAlign: 'center', marginBottom: '25px' },
  error: {
    background: '#e9456033', color: '#e94560', padding: '10px',
    borderRadius: '6px', marginBottom: '15px', textAlign: 'center'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  card: {
    background: '#1a1a2e', borderRadius: '10px', padding: '20px',
    color: 'white'
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 8px', textAlign: 'left', fontSize: '0.8em', opacity: 0.7 },
  td: { padding: '10px 8px', fontSize: '0.85em' },
  tdLabel: { padding: '8px 0', fontSize: '0.85em', opacity: 0.7 },
  tdValue: { padding: '8px 0', textAlign: 'right', fontWeight: 'bold' },
  metodo: {
    padding: '2px 8px', borderRadius: '4px', fontSize: '0.8em',
    fontWeight: 'bold'
  }
};
