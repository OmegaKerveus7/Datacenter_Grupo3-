import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerAccesos } from '../api/accesos';
import { obtenerMonitoreo } from '../api/areas';

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'short', timeStyle: 'short' });
}

export default function Accesos() {
  const { token } = useAuth();
  const [accesos, setAccesos]   = useState([]);
  const [puertas, setPuertas]   = useState(null);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([obtenerMonitoreo(token), obtenerAccesos(token)]).then(([mon, acc]) => {
      if (!mon.error) setPuertas(mon.puertas);
      if (acc.error) setError(acc.error); else setAccesos(acc);
      setLoading(false);
    });
  }, [token]);

  const statusCards = [
    {
      title: 'Puerta Principal',
      rows: [
        { label: 'Estado',  value: puertas?.puerta1 === 1 ? 'Abierta'    : 'Cerrada',      cls: puertas?.puerta1 === 1 ? 'badge-yellow' : 'badge-gray', dot: puertas?.puerta1 === 1 ? 'dot-yellow' : 'dot-gray' },
        { label: 'Botón',   value: puertas?.btn1    === 1 ? 'Presionado' : 'Sin actividad', cls: puertas?.btn1    === 1 ? 'badge-yellow' : 'badge-gray', dot: puertas?.btn1    === 1 ? 'dot-yellow' : 'dot-gray' },
      ],
    },
    {
      title: 'Puerta Servidores',
      rows: [
        { label: 'Estado',  value: puertas?.puerta2 === 1 ? 'Abierta'    : 'Cerrada',      cls: puertas?.puerta2 === 1 ? 'badge-yellow' : 'badge-gray', dot: puertas?.puerta2 === 1 ? 'dot-yellow' : 'dot-gray' },
        { label: 'Botón',   value: puertas?.btn2    === 1 ? 'Presionado' : 'Sin actividad', cls: puertas?.btn2    === 1 ? 'badge-yellow' : 'badge-gray', dot: puertas?.btn2    === 1 ? 'dot-yellow' : 'dot-gray' },
      ],
    },
    {
      title: 'Sensores',
      rows: [
        { label: 'PIR',    value: puertas?.pir    === 1 ? 'Movimiento' : 'Inactivo', cls: puertas?.pir    === 1 ? 'badge-yellow' : 'badge-gray', dot: puertas?.pir    === 1 ? 'dot-yellow' : 'dot-gray' },
        { label: 'Alarma', value: puertas?.alerta === 1 ? 'ACTIVA'     : 'Normal',   cls: puertas?.alerta === 1 ? 'badge-red'    : 'badge-green', dot: puertas?.alerta === 1 ? 'dot-red'    : 'dot-green' },
      ],
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Accesos</h2>
          <p className="page-subtitle">Estado de puertas e historial de entradas</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      <div className="grid-3" style={{ marginBottom: 20 }}>
        {statusCards.map(c => (
          <div key={c.title} className="card card-sm">
            <div className="card-header"><span className="card-title">{c.title}</span></div>
            {c.rows.map(r => (
              <div key={r.label} className="metric-row">
                <span className="metric-label">{r.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={`dot ${r.dot}`}/>
                  <span className={`badge ${r.cls}`}>{r.value}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="card-title">Historial de Accesos</span>
          <span className="badge badge-gray">{accesos.length} registros</span>
        </div>

        {loading ? (
          <div className="loading-state"><span className="spinner"/>Cargando...</div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Puerta</th>
                  <th>Método</th>
                </tr>
              </thead>
              <tbody>
                {accesos.length === 0 ? (
                  <tr><td colSpan={5}>
                    <div className="empty-state">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>
                      <p>Sin registros de acceso</p>
                    </div>
                  </td></tr>
                ) : accesos.map(a => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{fmt(a.created_at)}</td>
                    <td style={{ color: 'var(--text-strong)', fontWeight: 500 }}>{a.nombre}</td>
                    <td>{a.email}</td>
                    <td>Puerta {a.puerta}</td>
                    <td>
                      <span className={`badge ${a.metodo === 'nfc' ? 'badge-blue' : 'badge-green'}`}>
                        {a.metodo === 'nfc' ? 'NFC' : 'Remoto'}
                      </span>
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
