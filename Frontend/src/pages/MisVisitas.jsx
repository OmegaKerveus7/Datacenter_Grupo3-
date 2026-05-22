import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerMisVisitas } from '../api/visitas';

function fmt(d) { return new Date(d).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }); }
const ESTADO = { aprobada: 'badge-green', rechazada: 'badge-red', pendiente: 'badge-yellow' };

export default function MisVisitas() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obtenerMisVisitas(token).then(res => { if (Array.isArray(res)) setVisitas(res); setLoading(false); });
  }, [token]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Mis Visitas</h2>
          <p className="page-subtitle">Historial de solicitudes de acceso</p>
        </div>
        <button onClick={() => navigate('/solicitar-visita')} className="btn btn-primary">
          + Solicitar visita
        </button>
      </div>

      {loading ? (
        <div className="loading-state"><span className="spinner"/>Cargando...</div>
      ) : visitas.length === 0 ? (
        <div className="empty-state" style={{ padding: '72px 20px' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <p>No tienes solicitudes de visita</p>
          <button onClick={() => navigate('/solicitar-visita')} className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
            Crear primera solicitud
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Fecha Programada</th><th>Motivo</th><th>Estado</th><th>NFC</th></tr>
            </thead>
            <tbody>
              {visitas.map(v => (
                <tr key={v.id}>
                  <td style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{fmt(v.hora_programada)}</td>
                  <td style={{ maxWidth: 260 }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.motivo}</span>
                  </td>
                  <td>
                    <span className={`badge ${ESTADO[v.estado] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{v.estado}</span>
                  </td>
                  <td>
                    {v.estado === 'aprobada'
                      ? <button onClick={() => navigate('/verificar-nfc')} className="btn btn-blue btn-sm">Verificar NFC</button>
                      : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
