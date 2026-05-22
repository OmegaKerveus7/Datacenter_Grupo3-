const API = '';

export async function abrirPuerta1(token) {
  const res = await fetch(`${API}/api/acceso/puerta-1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}

export async function abrirPuerta2(token) {
  const res = await fetch(`${API}/api/acceso/puerta-2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}

export async function desbloquearPuertas(token) {
  const res = await fetch(`${API}/api/acceso/unlock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}

export async function bloquearPuertas(token) {
  const res = await fetch(`${API}/api/acceso/lock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return res.json();
}
