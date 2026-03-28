import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiUsers, FiActivity, FiDatabase, FiArrowUpRight, FiArrowDownRight, FiMoreVertical, FiCalendar } from 'react-icons/fi';
import './home.css';

// Datos de prueba para el gráfico
const chartData = [
  { name: 'Lun', activeUsers: 2400, newSignups: 400 },
  { name: 'Mar', activeUsers: 3100, newSignups: 300 },
  { name: 'Mie', activeUsers: 2800, newSignups: 550 },
  { name: 'Jue', activeUsers: 3908, newSignups: 278 },
  { name: 'Vie', activeUsers: 4800, newSignups: 189 },
  { name: 'Sab', activeUsers: 3800, newSignups: 239 },
  { name: 'Dom', activeUsers: 4300, newSignups: 349 },
];

// Datos de prueba para la tabla
const recentActivity = [
  { id: '#MH-001', user: 'Carlos Mendoza', role: 'Pro User', date: 'Hoy, 14:30', status: 'Active', cpu: '12%' },
  { id: '#MH-002', user: 'Ana Silva', role: 'Free Tier', date: 'Hoy, 12:15', status: 'Idle', cpu: '1%' },
  { id: '#MH-003', user: 'Tech Corp Admin', role: 'Enterprise', date: 'Ayer, 09:00', status: 'Warning', cpu: '89%' },
  { id: '#MH-004', user: 'Luis Rojas', role: 'Pro User', date: 'Ayer, 18:45', status: 'Active', cpu: '24%' },
];

const Home = () => {
  const navigate = useNavigate();

  const getStatusTone = (status) => {
    if (status === 'Active') return 'is-active';
    if (status === 'Warning') return 'is-warning';
    return 'is-idle';
  };

  return (
    <div className="home-page">
      <div className="home-shell">
        <header className="home-header">
          <div>
            <p className="home-kicker">MyHub Platform</p>
            <h1 className="home-title">Overview</h1>
            <p className="home-subtitle">Métricas y estado general de MyHub.</p>
          </div>

          <div className="home-header-actions">
            <button type="button" className="home-secondary-btn">
              <FiCalendar className="home-btn-icon" />
              Últimos 7 días
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="home-primary-btn"
            >
              Iniciar sesión
            </button>
          </div>
        </header>

        <section className="home-metrics-grid">
          <article className="home-metric-card">
            <div className="home-metric-head">
              <div>
                <p className="home-metric-label">Total Usuarios</p>
                <h3 className="home-metric-value">24,592</h3>
              </div>
              <div className="home-metric-icon-wrap users-tone">
                <FiUsers className="home-metric-icon" />
              </div>
            </div>
            <div className="home-metric-foot">
              <span className="home-trend positive">
                <FiArrowUpRight /> +14.5%
              </span>
              <span className="home-trend-caption">vs mes anterior</span>
            </div>
          </article>

          <article className="home-metric-card">
            <div className="home-metric-head">
              <div>
                <p className="home-metric-label">Sesiones Activas</p>
                <h3 className="home-metric-value">1,432</h3>
              </div>
              <div className="home-metric-icon-wrap sessions-tone">
                <FiActivity className="home-metric-icon" />
              </div>
            </div>
            <div className="home-metric-foot">
              <span className="home-trend negative">
                <FiArrowDownRight /> -2.4%
              </span>
              <span className="home-trend-caption">vs mes anterior</span>
            </div>
          </article>

          <article className="home-metric-card">
            <div className="home-metric-head">
              <div>
                <p className="home-metric-label">Uso de Base de Datos</p>
                <h3 className="home-metric-value">68.2<span className="home-metric-unit"> GB</span></h3>
              </div>
              <div className="home-metric-icon-wrap storage-tone">
                <FiDatabase className="home-metric-icon" />
              </div>
            </div>
            <div className="home-progress-row">
              <div className="home-progress-track">
                <div className="home-progress-fill" style={{ width: '68%' }} />
              </div>
              <span className="home-progress-value">68%</span>
            </div>
          </article>
        </section>

        <section className="home-main-grid">
          <article className="home-chart-panel">
            <div className="home-panel-head">
              <h2 className="home-panel-title">Tráfico de Red</h2>
              <button type="button" className="home-icon-btn" aria-label="Opciones de tráfico">
                <FiMoreVertical className="home-btn-icon" />
              </button>
            </div>

            <div className="home-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    itemStyle={{ color: '#1e293b', fontWeight: 500 }}
                  />
                  <Area type="monotone" dataKey="activeUsers" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="home-activity-panel">
            <div className="home-panel-head">
              <h2 className="home-panel-title">Estado de Instancias</h2>
            </div>

            <div className="home-activity-list">
              {recentActivity.map((item) => (
                <div key={item.id} className="home-activity-item">
                  <div className="home-activity-main">
                    <span className={`home-status-dot ${getStatusTone(item.status)}`} />
                    <div>
                      <p className="home-activity-user">{item.user}</p>
                      <p className="home-activity-meta">{item.id} · {item.date}</p>
                    </div>
                  </div>
                  <span className="home-cpu-pill">CPU: {item.cpu}</span>
                </div>
              ))}
            </div>

            <button type="button" className="home-link-btn">
              Ver todas las instancias
            </button>
          </article>
        </section>
      </div>
    </div>
  );
};

export default Home;