import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthForm from './components/AuthForm/AuthForm';
import GameList from './components/GameList/GameList';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="app-loading-container">
        <div className="app-loading-text">
          Cargando...
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/" />;
}

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route
          path="/games"
          element={
            <ProtectedRoute>
              <GameList />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
