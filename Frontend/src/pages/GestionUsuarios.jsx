import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listarUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from '../api/usuarios';

const ROL_BADGE = { admin: 'badge-red', gerente: 'badge-blue', empleado: 'badge-gray' };

export default function GestionUsuarios() {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState('');
  const [error, setError]       = useState('');
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'empleado' });

  const load = async () => { setLoading(true); const r = await listarUsuarios(token); if (Array.isArray(r)) setUsuarios(r); setLoading(false); };
  useEffect(() => { load(); }, [token]);

  function setF(k, v) { setForm(p => ({ ...p, [k]: v })); }
  function notify(ok, text) { setMsg(''); setError(''); ok ? setMsg(text) : setError(text); }

  async function handleCrear(e) {
    e.preventDefault();
    setCreating(true);
    const res = await crearUsuario(token, form.nombre, form.email, form.password, form.rol);
    setCreating(false);
    if (res.estado === 'ok') {
      notify(true, `Usuario ${form.nombre} creado`);
      setForm({ nombre: '', email: '', password: '', rol: 'empleado' });
      setShowForm(false); load();
    } else { notify(false, res.error || 'Error al crear usuario'); }
  }

  async function handleRol(id, rol) {
    const res = await actualizarUsuario(token, id, { rol });
    notify(res.estado === 'ok', res.estado === 'ok' ? 'Rol actualizado' : (res.error || 'Error'));
    if (res.estado === 'ok') load();
  }

  async function handleEliminar(id, nombre) {
    if (!window.confirm(`¿Eliminar a ${nombre}? Esta acción no se puede deshacer.`)) return;
    const res = await eliminarUsuario(token, id);
    notify(res.estado === 'ok', res.estado === 'ok' ? `${nombre} eliminado` : (res.error || 'Error'));
    if (res.estado === 'ok') load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Usuarios</h2>
          <p className="page-subtitle">Gestión de cuentas del sistema</p>
        </div>
        <button onClick={() => { setShowForm(o => !o); setMsg(''); setError(''); }}
          className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}>
          {showForm ? 'Cancelar' : '+ Nuevo usuario'}
        </button>
      </div>

      {msg   && <div className="alert alert-success"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>{msg}</div>}
      {error && <div className="alert alert-error"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <p className="card-title" style={{ marginBottom: 16 }}>Crear nuevo usuario</p>
          <form onSubmit={handleCrear} className="form-stack">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <input placeholder="Ej. Juan Pérez" value={form.nombre} onChange={e => setF('nombre', e.target.value)} required className="form-input"/>
              </div>
              <div className="form-group">
                <label className="form-label">Correo electrónico</label>
                <input type="email" placeholder="correo@empresa.com" value={form.email} onChange={e => setF('email', e.target.value)} required className="form-input"/>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => setF('password', e.target.value)} required className="form-input"/>
              </div>
              <div className="form-group">
                <label className="form-label">Rol</label>
                <select value={form.rol} onChange={e => setF('rol', e.target.value)} className="form-select">
                  <option value="empleado">Empleado</option>
                  <option value="gerente">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={creating} className="btn btn-primary">
                {creating ? <><span className="spinner"/>Creando...</> : 'Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="card-title">Cuentas registradas</span>
          <span className="badge badge-gray">{usuarios.length}</span>
        </div>
        {loading ? (
          <div className="loading-state"><span className="spinner"/>Cargando...</div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr><th>#</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {usuarios.length === 0 ? (
                  <tr><td colSpan={5}><div className="empty-state"><p>Sin usuarios registrados</p></div></td></tr>
                ) : usuarios.map(u => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--text-muted)', width: 36 }}>{u.id}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-strong)' }}>{u.nombre}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                    <td>
                      <select value={u.rol} onChange={e => handleRol(u.id, e.target.value)}
                        className="form-select form-input-sm" style={{ width: 'auto', minWidth: 100 }}>
                        <option value="empleado">Empleado</option>
                        <option value="gerente">Gerente</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <button onClick={() => handleEliminar(u.id, u.nombre)} className="btn btn-danger btn-sm">Eliminar</button>
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
