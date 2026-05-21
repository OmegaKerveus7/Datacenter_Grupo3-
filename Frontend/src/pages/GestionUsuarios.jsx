import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listarUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from '../api/usuarios';

export default function GestionUsuarios() {
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('empleado');

  async function load() {
    setLoading(true);
    const res = await listarUsuarios(token);
    if (Array.isArray(res)) setUsuarios(res);
    setLoading(false);
  }

  useEffect(() => { load(); }, [token]);

  async function handleCrear(e) {
    e.preventDefault();
    setMsg(''); setError('');
    const res = await crearUsuario(token, nombre, email, password, rol);
    if (res.estado === 'ok') {
      setMsg(`Usuario ${nombre} creado correctamente`);
      setNombre(''); setEmail(''); setPassword(''); setRol('empleado');
      setShowForm(false);
      load();
    } else {
      setError(res.error || 'Error al crear usuario');
    }
  }

  async function handleCambiarRol(id, nuevoRol) {
    setMsg(''); setError('');
    const res = await actualizarUsuario(token, id, { rol: nuevoRol });
    if (res.estado === 'ok') {
      setMsg(`Rol actualizado a ${nuevoRol}`);
      load();
    } else {
      setError(res.error || 'Error al actualizar rol');
    }
  }

  async function handleEliminar(id, nombreUsuario) {
    if (!window.confirm(`¿Eliminar a ${nombreUsuario}?`)) return;
    setMsg(''); setError('');
    const res = await eliminarUsuario(token, id);
    if (res.estado === 'ok') {
      setMsg(`Usuario ${nombreUsuario} eliminado`);
      load();
    } else {
      setError(res.error || 'Error al eliminar');
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2>Gestión de Usuarios</h2>
          <button onClick={() => setShowForm(!showForm)} style={styles.btnAdd}>
            {showForm ? 'Cancelar' : '+ Nuevo Usuario'}
          </button>
        </div>

        {msg && <div style={styles.success}>{msg}</div>}
        {error && <div style={styles.error}>{error}</div>}

        {showForm && (
          <form onSubmit={handleCrear} style={styles.form}>
            <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={styles.input} />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
            <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />
            <select value={rol} onChange={(e) => setRol(e.target.value)} style={styles.input}>
              <option value="empleado">Empleado</option>
              <option value="gerente">Gerente</option>
              <option value="admin">Administrador</option>
            </select>
            <button type="submit" style={styles.btnSubmit}>Crear Usuario</button>
          </form>
        )}

        {loading ? (
          <p style={styles.loading}>Cargando...</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.nombre}</td>
                    <td>
                      <select
                        value={u.rol}
                        onChange={(e) => handleCambiarRol(u.id, e.target.value)}
                        style={styles.selectRol}
                      >
                        <option value="empleado">Empleado</option>
                        <option value="gerente">Gerente</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <button onClick={() => handleEliminar(u.id, u.nombre)} style={styles.btnDelete}>Eliminar</button>
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
    width: '100%', maxWidth: '1000px', color: 'white'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '20px'
  },
  btnAdd: {
    background: '#0f3460', color: 'white', border: 'none',
    padding: '8px 16px', borderRadius: '6px', cursor: 'pointer'
  },
  form: {
    display: 'flex', flexDirection: 'column', gap: '10px',
    padding: '20px', background: '#16213e', borderRadius: '8px', marginBottom: '20px'
  },
  input: {
    padding: '10px', borderRadius: '6px', border: '1px solid #333',
    background: '#1a1a2e', color: 'white', fontSize: '0.9em'
  },
  btnSubmit: {
    padding: '10px', borderRadius: '6px', border: 'none',
    background: '#e94560', color: 'white', cursor: 'pointer', fontWeight: 'bold'
  },
  loading: { textAlign: 'center', opacity: 0.6, padding: '20px' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' },
  selectRol: {
    background: '#16213e', color: 'white', border: '1px solid #333',
    borderRadius: '4px', padding: '4px', cursor: 'pointer'
  },
  btnDelete: {
    background: '#e94560', color: 'white', border: 'none',
    padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em'
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
