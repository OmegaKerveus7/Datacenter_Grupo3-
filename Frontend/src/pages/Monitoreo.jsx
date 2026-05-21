import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerMonitoreo } from '../api/areas';

function formatFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
}

function checarActivo(area, valores) {
  if (!valores) return false;
  return Object.values(valores).some(v => v !== 0 && v !== null && v !== undefined && v !== '');
}

export default function Monitoreo() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerMonitoreo(token).then(res => {
      if (res.error) setError(res.error);
      else setData(res);
    });
  }, [token]);

  const areas = [
    {
      titulo: 'Servidores',
      key: 'servidores',
      activo: data && checarActivo('servidores', data.servidores),
      fecha: data?.servidores?.created_at,
      filas: [
        { label: 'Temperatura', value: data?.servidores?.temperatura, unit: '°C' },
        { label: 'Humo', value: data?.servidores?.humo },
        { label: 'Humedad', value: data?.servidores?.humedad, unit: '%' },
        { label: 'Alerta', value: data?.servidores?.alerta },
        { label: 'Ventilador', value: data?.servidores?.fan },
      ]
    },
    {
      titulo: 'Puertas / Acceso',
      key: 'puertas',
      activo: data && checarActivo('puertas', data.puertas),
      fecha: data?.puertas?.created_at,
      filas: [
        { label: 'Botón 1', value: data?.puertas?.btn1 },
        { label: 'Botón 2', value: data?.puertas?.btn2 },
        { label: 'PIR', value: data?.puertas?.pir },
        { label: 'Puerta 1', value: data?.puertas?.puerta1 },
        { label: 'Puerta 2', value: data?.puertas?.puerta2 },
        { label: 'Alarma', value: data?.puertas?.alerta },
      ]
    },
    {
      titulo: 'Jardín',
      key: 'jardin',
      activo: data && checarActivo('jardin', data.jardin),
      fecha: data?.jardin?.created_at,
      filas: [
        { label: 'Humedad Suelo', value: data?.jardin?.humedad_suelo, unit: '%' },
        { label: 'Temperatura', value: data?.jardin?.temperatura, unit: '°C' },
        { label: 'Humedad Aire', value: data?.jardin?.humedad_aire, unit: '%' },
      ]
    },
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Monitoreo del DataCenter</h2>

      {error && <div style={styles.error}>{error}</div>}

      {!data && !error && <p style={{ textAlign: 'center', opacity: 0.6 }}>Cargando...</p>}

      <div style={styles.grid}>
        {areas.map(a => (
          <div key={a.key} style={styles.card}>
            <div style={styles.header}>
              <h3 style={{ margin: 0 }}>{a.titulo}</h3>
              <span style={{
                ...styles.badge,
                background: a.activo ? '#00b894' : '#e94560'
              }}>
                {a.activo ? 'ACTIVA' : 'DESACTIVADA'}
              </span>
            </div>

            <table style={styles.table}>
              <tbody>
                {a.filas.map(f => (
                  <tr key={f.label}>
                    <td style={styles.tdLabel}>{f.label}</td>
                    <td style={styles.tdValue}>
                      {f.value !== null && f.value !== undefined ? `${f.value}${f.unit || ''}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={styles.footer}>
              Última actualización: {formatFecha(a.fecha)}
            </div>
          </div>
        ))}
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px'
  },
  card: {
    background: '#1a1a2e', borderRadius: '10px', padding: '20px',
    color: 'white'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '10px'
  },
  badge: {
    padding: '3px 10px', borderRadius: '4px', fontSize: '0.7em',
    fontWeight: 'bold', letterSpacing: '1px'
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  tdLabel: { padding: '6px 0', fontSize: '0.85em', opacity: 0.7 },
  tdValue: { padding: '6px 0', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1em' },
  footer: { marginTop: '15px', fontSize: '0.75em', opacity: 0.5, textAlign: 'center' }
};
