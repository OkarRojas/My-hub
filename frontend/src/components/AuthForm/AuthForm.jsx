import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './AuthForm.css';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[AuthForm] user changed', user);
    if (user) {
      console.log('[AuthForm] user is present. navigating to /dashboard');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[AuthForm.handleSubmit] start', {
      isLogin,
      email,
    });
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        console.log('[AuthForm.handleSubmit] calling login');
        await login(email, password);
        console.log('[AuthForm.handleSubmit] login resolved');
      } else {
        console.log('[AuthForm.handleSubmit] calling register');
        await register(email, password);
        console.log('[AuthForm.handleSubmit] register resolved');
      }
    } catch (err) {
      console.error('[AuthForm.handleSubmit] auth error', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
        code: err?.code,
      });
      const errorMsg = err.response?.data?.detail || 
                       'Error de conexión. Verifica email/contraseña.';
      setError(errorMsg);
    } finally {
      console.log('[AuthForm.handleSubmit] finally reached. setLoading(false)');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">🎮 MyHub</h1>
        <p className="auth-subtitle">
          {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta gratis'}
        </p>

        {error && (
          <div className="auth-error-box">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-label">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="tu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-label">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="auth-btn"
            disabled={loading}
            data-loading={loading}
          >
            {loading ? 'Cargando...' : (isLogin ? 'Iniciar sesión' : 'Registrarse')}
          </button>
        </form>

        <p className="auth-switch-text">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="auth-switch-btn"
          >
            {isLogin ? 'Crea una ahora' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}
