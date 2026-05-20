const API = 'http://192.168.1.49:3000';

export async function listarUsuarios(token) {
  const res = await fetch(`${API}/api/usuarios`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

export async function crearUsuario(token, nombre, email, password, rol) {
  const res = await fetch(`${API}/api/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ nombre, email, password, rol })
  });
  return res.json();
}

export async function actualizarUsuario(token, id, data) {
  const res = await fetch(`${API}/api/usuarios/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function eliminarUsuario(token, id) {
  const res = await fetch(`${API}/api/usuarios/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}
