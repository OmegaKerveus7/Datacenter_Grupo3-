const API = '';

export async function obtenerAccesos(token) {
  const res = await fetch(`${API}/api/accesos`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}
