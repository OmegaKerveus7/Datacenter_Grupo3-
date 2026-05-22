import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerPendientes, obtenerTodasVisitas, aprobarVisita, rechazarVisita, modificarFechaVisita } from '../api/visitas';

function fmtDate(d) { return d ? new Date(d).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '—'; }
function fmtInput(d) {
  const dt = new Date(d), p = n => String(n).padStart(2,'0');
  return `${dt.getFullYear()}-${p(dt.getMonth()+1)}-${p(dt.getDate())}T${p(dt.getHours())}:${p(dt.getMinutes())}`;
}

const ESTADO = { aprobada: 'badge-green', rechazada: 'badge-red', pendiente: 'badge-yellow' };

export default function PanelVisitas() {
  const { user, token } = useAuth();
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState('');
  const [error, setError]     = useState('');
  const [tab, setTab]         = useState('pendientes');
  const [editFecha, setEditFecha] = useState({});

  async function load() {
    setLoading(true);
    const res = await (tab === 'todas' ? obtenerTodasVisitas : obtenerPendientes)(token);
    if (Array.isArray(res)) setVisitas(res);
    setLoading(false);
  }
  useEffect(() => { load(); }, [token, tab]);

  function notify(ok, text) { setMsg(''); setError(''); ok ? setMsg(text) : setError(text); }

  async function handleAprobar(id) {
    const res = await aprobarVisita(token, id);
    notify(res.estado === 'ok', res.estado === 'ok' ? `Visita #${id} aprobada` : (res.error || 'Error al aprobar'));
    if (res.estado === 'ok') load();
  }
  async function handleRechazar(id) {
    const res = await rechazarVisita(token, id);
    notify(res.estado === 'ok', res.estado === 'ok' ? `Visita #${id} rechazada` : (res.error || 'Error al rechazar'));
    if (res.estado === 'ok') load();
  }
  async function handleModificar(id) {
    const fecha = editFecha[id]; if (!fecha) return;
    const res = await modificarFechaVisita(token, id, fecha);
    if (res.estado === 'ok') { setMsg(`Fecha de visita #${id} actualizada`); setEditFecha(p => ({ ...p, [id]: undefined })); load(); }
    else setError(res.error || 'Error al modificar fecha');
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Panel de Visitas</h2>
          <p className="page-subtitle">Gestión de solicitudes de acceso</p>
        </div>
        <span className="badge badge-gray">{visitas.length} {tab === 'pendientes' ? 'pendientes' : 'registros'}</span>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'pendientes' ? ' tab-active' : ''}`} onClick={() => setTab('pendientes')}>Pendientes</button>
        {user.rol === 'admin' && (
          <button className={`tab${tab === 'todas' ? ' tab-active' : ''}`} onClick={() => setTab('todas')}>Todas</button>
        )}
      </div>

      {msg   && <div className="alert alert-success"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>{msg}</div>}
      {error && <div className="alert alert-error"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}

      {loading ? (
        <div className="loading-state"><span className="spinner"/>Cargando visitas...</div>
      ) : visitas.length === 0 ? (
        <div className="empty-state">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <p>No hay solicitudes {tab === 'pendientes' ? 'pendientes' : ''}</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th><th>Solicitante</th><th>Fecha Programada</th><th>Motivo</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visitas.map(v => (
                <tr key={v.id}>
                  <td style={{ color: 'var(--text-muted)', width: 36 }}>{v.id}</td>
                  <td style={{ fontWeight: 500, color: 'var(--text-strong)', whiteSpace: 'nowrap' }}>{v.solicitante_nombre || v.solicitante_email}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {editFecha[v.id] !== undefined ? (
                      <div className="inline-edit">
                        <input type="datetime-local" value={editFecha[v.id]}
                          onChange={e => setEditFecha(p => ({ ...p, [v.id]: e.target.value }))}
                          className="form-input form-input-sm" style={{ width: 'auto' }}/>
                        <button onClick={() => handleModificar(v.id)} className="btn btn-success btn-sm">Guardar</button>
                        <button onClick={() => setEditFecha(p => ({ ...p, [v.id]: undefined }))} className="btn btn-secondary btn-sm">✕</button>
                      </div>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {fmtDate(v.hora_programada)}
                        <button onClick={() => setEditFecha(p => ({ ...p, [v.id]: fmtInput(v.hora_programada) }))}
                          className="btn-ghost-sm" title="Editar fecha">✏</button>
                      </span>
                    )}
                  </td>
                  <td style={{ maxWidth: 200, color: 'var(--text)' }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.motivo}</span>
                  </td>
                  <td><span className={`badge ${ESTADO[v.estado] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{v.estado}</span></td>
                  <td>
                    {v.estado === 'pendiente' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleAprobar(v.id)}  className="btn btn-success btn-sm">Aprobar</button>
                        <button onClick={() => handleRechazar(v.id)} className="btn btn-danger  btn-sm">Rechazar</button>
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
  );
}
