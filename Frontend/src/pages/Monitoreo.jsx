import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerMonitoreo } from '../api/areas';

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'short', timeStyle: 'short' });
}

function Val({ v, unit, warn, danger }) {
  const text = v !== null && v !== undefined ? `${v}${unit || ''}` : '—';
  const cls = `metric-value${danger ? ' danger' : warn ? ' warn' : ''}`;
  return <span className={cls}>{text}</span>;
}

const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

export default function Monitoreo() {
  const { token } = useAuth();
  const [data, setData]       = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const load = useCallback(async (refresh = false) => {
    refresh ? setSpinning(true) : setLoading(true);
    const res = await obtenerMonitoreo(token);
    if (res.error) setError(res.error); else { setData(res); setError(''); }
    setLoading(false); setSpinning(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const srv = data?.servidores;
  const pue = data?.puertas;
  const jar = data?.jardin;

  const areas = [
    {
      key: 'servidores', titulo: 'Servidores',
      activo: srv && Object.values(srv).some(v => v && v !== 0),
      fecha: srv?.created_at,
      filas: [
        { label: 'Temperatura', v: srv?.temperatura, unit: ' °C', danger: srv?.temperatura > 35, warn: srv?.temperatura > 28 },
        { label: 'Humedad',     v: srv?.humedad,     unit: ' %',  warn: srv?.humedad > 70 },
        { label: 'Humo',        v: srv?.humo === 1 ? 'Detectado' : srv?.humo === 0 ? 'Normal' : '—', danger: srv?.humo === 1 },
        { label: 'Ventilador',  v: srv?.fan  === 1 ? 'Encendido' : srv?.fan  === 0 ? 'Apagado'   : '—' },
        { label: 'Alerta',      v: srv?.alerta === 1 ? 'ACTIVA' : srv?.alerta === 0 ? 'Normal' : '—', danger: srv?.alerta === 1 },
      ],
    },
    {
      key: 'puertas', titulo: 'Puertas / Acceso',
      activo: pue && Object.values(pue).some(v => v && v !== 0),
      fecha: pue?.created_at,
      filas: [
        { label: 'Puerta 1',   v: pue?.puerta1 === 1 ? 'Abierta' : pue?.puerta1 === 0 ? 'Cerrada' : '—', warn: pue?.puerta1 === 1 },
        { label: 'Puerta 2',   v: pue?.puerta2 === 1 ? 'Abierta' : pue?.puerta2 === 0 ? 'Cerrada' : '—', warn: pue?.puerta2 === 1 },
        { label: 'Sensor PIR', v: pue?.pir    === 1 ? 'Movimiento' : pue?.pir    === 0 ? 'Inactivo' : '—', warn: pue?.pir === 1 },
        { label: 'Botón 1',    v: pue?.btn1   === 1 ? 'Presionado' : '—' },
        { label: 'Botón 2',    v: pue?.btn2   === 1 ? 'Presionado' : '—' },
        { label: 'Alarma',     v: pue?.alerta === 1 ? 'ACTIVA' : pue?.alerta === 0 ? 'Normal' : '—', danger: pue?.alerta === 1 },
      ],
    },
    {
      key: 'jardin', titulo: 'Área Jardín',
      activo: jar && Object.values(jar).some(v => v && v !== 0),
      fecha: jar?.created_at,
      filas: [
        { label: 'Humedad Suelo', v: jar?.humedad_suelo, unit: ' %',  danger: jar?.humedad_suelo < 15, warn: jar?.humedad_suelo < 30 },
        { label: 'Temperatura',   v: jar?.temperatura,  unit: ' °C', warn: jar?.temperatura > 35 },
        { label: 'Humedad Aire',  v: jar?.humedad_aire, unit: ' %' },
      ],
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Monitoreo</h2>
          <p className="page-subtitle">Estado en tiempo real del DataCenter</p>
        </div>
        <button onClick={() => load(true)} disabled={spinning} className="btn btn-secondary">
          {spinning ? <span className="spinner"/> : <RefreshIcon/>}
          Actualizar
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-state"><span className="spinner"/>Cargando datos...</div>
      ) : (
        <div className="grid-3">
          {areas.map(a => (
            <div key={a.key} className="card">
              <div className="card-header">
                <span className="card-title">{a.titulo}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={`dot ${a.activo ? 'dot-green' : 'dot-gray'}`}/>
                  <span className={`badge ${a.activo ? 'badge-green' : 'badge-gray'}`}>
                    {a.activo ? 'Activa' : 'Sin datos'}
                  </span>
                </div>
              </div>
              {a.filas.map(f => (
                <div key={f.label} className="metric-row">
                  <span className="metric-label">{f.label}</span>
                  <Val v={f.v} unit={f.unit} warn={f.warn} danger={f.danger}/>
                </div>
              ))}
              <div className="card-footer">Actualizado: {fmt(a.fecha)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
