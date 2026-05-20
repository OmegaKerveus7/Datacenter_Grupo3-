import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SolicitarVisita from './pages/SolicitarVisita';
import MisVisitas from './pages/MisVisitas';
import VerificarNFC from './pages/VerificarNFC';
import PanelVisitas from './pages/PanelVisitas';
import GestionUsuarios from './pages/GestionUsuarios';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/solicitar-visita"
            element={
              <ProtectedRoute>
                <SolicitarVisita />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-visitas"
            element={
              <ProtectedRoute>
                <MisVisitas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verificar-nfc"
            element={<VerificarNFC />}
          />
          <Route
            path="/panel-visitas"
            element={
              <ProtectedRoute roles={['admin', 'gerente']}>
                <PanelVisitas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion-usuarios"
            element={
              <ProtectedRoute roles={['admin']}>
                <GestionUsuarios />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
