import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

const AuthContext = createContext();
const AUTH_TIMEOUT_MS = 15000;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('[AuthProvider] boot. token exists:', Boolean(token));
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('[AuthProvider] validating token via /users/me', {
        baseUrl: API_CONFIG.BASE_URL,
      });
      axios.get(`${API_CONFIG.BASE_URL}/users/me`, { timeout: AUTH_TIMEOUT_MS })
        .then((res) => {
          console.log('[AuthProvider] token valid. user loaded:', res.data);
          setUser(res.data);
        })
        .catch((err) => {
          console.error('[AuthProvider] token validation failed:', {
            message: err?.message,
            status: err?.response?.status,
            data: err?.response?.data,
            code: err?.code,
          });
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          console.log('[AuthProvider] boot validation finished. setLoading(false)');
          setLoading(false);
        });
    } else {
      console.log('[AuthProvider] no token found. setLoading(false)');
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    console.log('[AuthProvider.login] start', {
      email,
      baseUrl: API_CONFIG.BASE_URL,
      timeoutMs: AUTH_TIMEOUT_MS,
    });
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const res = await axios.post(
      `${API_CONFIG.BASE_URL}/auth/login`,
      params,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: AUTH_TIMEOUT_MS,
      }
    );
    console.log('[AuthProvider.login] /auth/login resolved', {
      status: res.status,
      hasAccessToken: Boolean(res?.data?.access_token),
    });

    const { access_token } = res.data;
    if (!access_token) {
      console.error('[AuthProvider.login] missing access_token in /auth/login response', res.data);
      throw new Error('Missing access token in login response');
    }

    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    console.log('[AuthProvider.login] token stored and auth header set');

    const userData = await axios.get(`${API_CONFIG.BASE_URL}/users/me`, {
      timeout: AUTH_TIMEOUT_MS,
    });
    console.log('[AuthProvider.login] /users/me resolved', {
      status: userData.status,
      user: userData.data,
    });
    setUser(userData.data);
    return userData.data;
  };

  const register = async (email, password) => {
    console.log('[AuthProvider.register] start', { email, baseUrl: API_CONFIG.BASE_URL });
    await axios.post(`${API_CONFIG.BASE_URL}/auth/register`, { email, password }, {
      timeout: AUTH_TIMEOUT_MS,
    });
    console.log('[AuthProvider.register] register success. logging in...');
    return login(email, password);
  };

  const logout = () => {
    console.log('[AuthProvider.logout] clearing session');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
