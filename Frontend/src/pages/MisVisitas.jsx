import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerMisVisitas } from '../api/visitas';

export default function MisVisitas() {
  const { token } = useAuth();
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const res = await obtenerMisVisitas(token);
      if (Array.isArray(res)) {
        setVisitas(res);
      }
      setLoading(false);
    }
    load();
  }, [token]);

  function getStatusColor(estado) {
    switch (estado) {
      case 'aprobada': return '#00b894';
      case 'rechazada': return '#e94560';
      default: return '#fdcb6e';
    }
  }

  function formatDate(d) {
    return new Date(d).toLocaleString('es-MX', {
      dateStyle: 'short', timeStyle: 'short'
    });
  }

  if (loading) return <div style={styles.loading}>Cargando...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Mis Visitas</h2>
        {visitas.length === 0 ? (
          <p style={styles.empty}>No tienes solicitudes de visita aún.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {visitas.map((v) => (
                  <tr key={v.id}>
                    <td>{formatDate(v.hora_programada)}</td>
                    <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>{v.motivo}</td>
                    <td>
                      <span style={{ ...styles.status, background: getStatusColor(v.estado) }}>
                        {v.estado}
                      </span>
                    </td>
                    <td>
                      {v.estado === 'aprobada' && (
                        <button
                          onClick={() => navigate('/verificar-nfc')}
                          style={styles.btn}
                        >
                          NFC
                        </button>
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
    width: '100%', maxWidth: '900px', color: 'white'
  },
  loading: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    height: '50vh', color: 'white'
  },
  empty: { textAlign: 'center', opacity: 0.6, padding: '40px' },
  tableWrapper: { overflowX: 'auto' },
  table: {
    width: '100%', borderCollapse: 'collapse', fontSize: '0.9em'
  },
  status: {
    padding: '3px 10px', borderRadius: '4px', color: 'white',
    fontSize: '0.8em', textTransform: 'capitalize'
  },
  btn: {
    background: '#0f3460', color: 'white', border: 'none',
    padding: '5px 12px', borderRadius: '4px', cursor: 'pointer',
    fontSize: '0.85em'
  }
};
