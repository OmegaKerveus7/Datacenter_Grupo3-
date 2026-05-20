import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../api/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.token) {
      loginUser(res.token, res.usuario);
      navigate('/dashboard');
    } else {
      setError(res.error || 'Error al iniciar sesión');
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>DataCenter</h1>
        <p style={styles.subtitle}>Sistema de Control de Acceso</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#0f0f23'
  },
  card: {
    background: '#1a1a2e',
    padding: '40px',
    borderRadius: '10px',
    width: '90%',
    maxWidth: '400px',
    color: 'white'
  },
  title: {
    textAlign: 'center',
    color: '#e94560',
    margin: '0 0 5px 0'
  },
  subtitle: {
    textAlign: 'center',
    fontSize: '0.85em',
    opacity: 0.7,
    margin: '0 0 25px 0'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #333',
    background: '#16213e',
    color: 'white',
    fontSize: '1em'
  },
  button: {
    padding: '12px',
    borderRadius: '6px',
    border: 'none',
    background: '#e94560',
    color: 'white',
    fontSize: '1em',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  error: {
    background: '#e9456033',
    color: '#e94560',
    padding: '10px',
    borderRadius: '6px',
    textAlign: 'center'
  }
};
