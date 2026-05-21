const API = '';

export async function solicitarVisita(token, motivo, horaProgramada) {
  const res = await fetch(`${API}/api/visitas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ motivo, hora_programada: horaProgramada })
  });
  return res.json();
}

export async function obtenerMisVisitas(token) {
  const res = await fetch(`${API}/api/visitas`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}

export async function obtenerPendientes(token) {
  const res = await fetch(`${API}/api/visitas/pendientes`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}

export async function obtenerTodasVisitas(token) {
  const res = await fetch(`${API}/api/visitas/todas`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}

export async function aprobarVisita(token, id) {
  const res = await fetch(`${API}/api/visitas/${id}/aprobar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}

export async function rechazarVisita(token, id) {
  const res = await fetch(`${API}/api/visitas/${id}/rechazar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}

export async function accesoNFC(token, codigo_nfc) {
  const res = await fetch(`${API}/api/acceso/nfc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ codigo_nfc })
  });
  return res.json();
}

export async function modificarFechaVisita(token, id, horaProgramada) {
  const res = await fetch(`${API}/api/visitas/${id}/fecha`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ hora_programada: horaProgramada })
  });
  return res.json();
}
