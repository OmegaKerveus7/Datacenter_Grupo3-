import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerPendientes, obtenerTodasVisitas, aprobarVisita, rechazarVisita } from '../api/visitas';

export default function PanelVisitas() {
  const { user, token } = useAuth();
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('pendientes');

  async function load() {
    setLoading(true);
    const fn = tab === 'todas' ? obtenerTodasVisitas : obtenerPendientes;
    const res = await fn(token);
    if (Array.isArray(res)) {
      setVisitas(res);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [token, tab]);

  async function handleAprobar(id) {
    setMsg(''); setError('');
    const res = await aprobarVisita(token, id);
    if (res.estado === 'ok') {
      setMsg(`Visita #${id} aprobada. Código NFC: ${res.solicitud.codigo_nfc}`);
      load();
    } else {
      setError(res.error || 'Error al aprobar');
    }
  }

  async function handleRechazar(id) {
    setMsg(''); setError('');
    const res = await rechazarVisita(token, id);
    if (res.estado === 'ok') {
      setMsg(`Visita #${id} rechazada`);
      load();
    } else {
      setError(res.error || 'Error al rechazar');
    }
  }

  function formatDate(d) {
    return new Date(d).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
  }

  function getStatusColor(estado) {
    switch (estado) {
      case 'aprobada': return '#00b894';
      case 'rechazada': return '#e94560';
      default: return '#fdcb6e';
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Panel de Visitas</h2>

        <div style={styles.tabs}>
          <button
            onClick={() => setTab('pendientes')}
            style={{ ...styles.tab, ...(tab === 'pendientes' ? styles.tabActive : {}) }}
          >
            Pendientes
          </button>
          {user.rol === 'admin' && (
            <button
              onClick={() => setTab('todas')}
              style={{ ...styles.tab, ...(tab === 'todas' ? styles.tabActive : {}) }}
            >
              Todas
            </button>
          )}
        </div>

        {msg && <div style={styles.success}>{msg}</div>}
        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <p style={styles.loading}>Cargando...</p>
        ) : visitas.length === 0 ? (
          <p style={styles.empty}>No hay solicitudes {tab === 'pendientes' ? 'pendientes' : ''}.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Solicitante</th>
                  <th>Fecha Prog.</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Código NFC</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {visitas.map((v) => (
                  <tr key={v.id}>
                    <td>{v.id}</td>
                    <td>{v.solicitante_nombre || v.solicitante_email}</td>
                    <td>{formatDate(v.hora_programada)}</td>
                    <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>{v.motivo}</td>
                    <td>
                      <span style={{ ...styles.status, background: getStatusColor(v.estado) }}>
                        {v.estado}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
                      {v.codigo_nfc || '---'}
                    </td>
                    <td>
                      {v.estado === 'pendiente' && (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => handleAprobar(v.id)} style={styles.btnAprobar}>
                            Aprobar
                          </button>
                          <button onClick={() => handleRechazar(v.id)} style={styles.btnRechazar}>
                            Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', display: 'flex', justifyContent: 'center' },
  card: {
    background: '#1a1a2e', padding: '30px', borderRadius: '10px',
    width: '100%', maxWidth: '1100px', color: 'white'
  },
  tabs: { display: 'flex', gap: '10px', marginBottom: '20px' },
  tab: {
    padding: '8px 20px', borderRadius: '6px', border: '1px solid #333',
    background: 'transparent', color: 'white', cursor: 'pointer'
  },
  tabActive: { background: '#e94560', borderColor: '#e94560' },
  loading: { textAlign: 'center', opacity: 0.6, padding: '20px' },
  empty: { textAlign: 'center', opacity: 0.6, padding: '40px' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' },
  status: {
    padding: '3px 10px', borderRadius: '4px', color: 'white',
    fontSize: '0.8em', textTransform: 'capitalize'
  },
  btnAprobar: {
    background: '#00b894', color: 'white', border: 'none',
    padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em'
  },
  btnRechazar: {
    background: '#e94560', color: 'white', border: 'none',
    padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em'
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
