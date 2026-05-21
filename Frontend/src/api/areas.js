const API = '';

export async function obtenerMonitoreo(token) {
  const res = await fetch(`${API}/api/monitoreo`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}
