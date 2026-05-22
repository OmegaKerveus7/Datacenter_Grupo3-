import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { solicitarVisita } from '../api/visitas';

export default function SolicitarVisita() {
  const { token } = useAuth();
  const navigate  = useNavigate();
  const [motivo, setMotivo] = useState('');
  const [fecha, setFecha]   = useState('');
  const [hora, setHora]     = useState('');
  const [msg, setMsg]       = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const d     = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const minT  = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(''); setError(''); setLoading(true);
    const res = await solicitarVisita(token, motivo, new Date(`${fecha}T${hora}`).toISOString());
    setLoading(false);
    if (res.estado === 'ok') {
      setMsg('Solicitud enviada. Espera la aprobación del administrador.');
      setMotivo(''); setFecha(''); setHora('');
    } else {
      setError(res.error || 'Error al solicitar visita');
    }
  }

  return (
    <div className="page" style={{ maxWidth: 560 }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Solicitar Visita</h2>
          <p className="page-subtitle">Programar acceso a la Puerta 2</p>
        </div>
        <button onClick={() => navigate('/mis-visitas')} className="btn btn-secondary btn-sm">
          Mis visitas
        </button>
      </div>

      <div className="card">
        {msg && (
          <div className="alert alert-success">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            {msg}
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-group">
            <label className="form-label">Motivo de la visita</label>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              required
              className="form-textarea"
              placeholder="Describe el propósito de tu visita..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                required min={today} className="form-input"/>
            </div>
            <div className="form-group">
              <label className="form-label">Hora</label>
              <input type="time" value={hora} onChange={e => setHora(e.target.value)}
                required min={fecha === today ? minT : undefined} className="form-input"/>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 4 }}>
            {loading ? <><span className="spinner"/>Enviando...</> : 'Enviar solicitud'}
          </button>
        </form>

        <div className="info-box" style={{ marginTop: 16 }}>
          <strong>Nota:</strong> La solicitud debe ser aprobada por un administrador o gerente. Una vez aprobada podrás usar el NFC en el horario programado.
        </div>
      </div>
    </div>
  );
}
