import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { useAuth } from './hooks/useAuth';
import AuthForm from './components/AuthForm/AuthForm';
import GameList from './components/GameList/GameList';
import Dashboard from './components/dashboard/dashboard';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  console.log('[ProtectedRoute] render', {
    loading,
    user,
  });
  if (loading) return <div className="app-loading-text">Cargando...</div>;
  return user ? children : <Navigate to="/login" />;
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<AuthForm />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/games" element={<ProtectedRoute><GameList /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
