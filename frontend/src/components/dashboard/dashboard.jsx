import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import {
  FiSearch, FiBell, FiChevronDown, FiGrid, FiBarChart2,
  FiFileText, FiBox, FiUser, FiLogOut, FiMoreVertical,
  FiStar, FiSliders,
} from 'react-icons/fi';
import './dashboard.css';
import { useAuth } from '../../hooks/useAuth';
import { API_CONFIG } from '../../config/api';

const navItems = [
  { icon: FiGrid, active: true },
  { icon: FiFileText, active: false },
  { icon: FiBarChart2, active: false },
  { icon: FiBox, active: false },
  { icon: FiUser, active: false },
  { icon: FiLogOut, active: false },
];

function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    user_name: '',
    total_hours: 0,
    total_games: 0,
    puntuacion: 0,
    hours_played: 0,
    recent_games: [],
    play_history: [],
    reviews: []
  });

  useEffect(() => {
    fetch(`${API_CONFIG.BASE_URL}/dashboard/my-stats`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page" style={{ color: '#fff', padding: 40 }}>
        Cargando...
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-frame">

        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar-logo">
            <div className="dashboard-sidebar-logo-mark" />
          </div>
          <nav className="dashboard-nav">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={`${index}-${item.active}`}
                  type="button"
                  className={`dashboard-nav-item ${item.active ? 'is-active' : ''}`}
                >
                  <Icon className="dashboard-nav-icon" />
                </button>
              );
            })}
          </nav>
          <div className="dashboard-sidebar-avatar" />
        </aside>

        <main className="dashboard-main">

          {/* Header */}
          <header className="dashboard-header">
            <div>
              <h1 className="dashboard-title">Overview</h1>
            </div>
            <div className="dashboard-header-actions">
              <button type="button" className="dashboard-icon-btn">
                <FiSearch className="dashboard-icon" />
              </button>
              <button type="button" className="dashboard-icon-btn">
                <FiBell className="dashboard-icon" />
              </button>
              <div className="dashboard-user-pill">
                <div className="dashboard-user-avatar" />
                <span className="dashboard-user-name">{stats.user_name}</span>
                <FiChevronDown className="dashboard-user-chevron" />
              </div>
            </div>
          </header>

          {/* Top Section */}
          <section className="dashboard-grid-top">

            {/* Historial de juego — gráfica */}
            <div className="dashboard-portfolio-column">
              <h2 className="dashboard-section-title">Historial de juego</h2>
              <div className="portfolio-card">
                <div className="portfolio-card-head">
                  <div>
                    <p className="portfolio-label">Tiempo jugado</p>
                    <p className="portfolio-value">{stats.total_hours}H</p>
                  </div>
                  <button type="button" className="muted-icon-btn">
                    <FiMoreVertical />
                  </button>
                </div>
                <div className="portfolio-chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.play_history}>
                      <Tooltip
                        contentStyle={{
                          border: 'none',
                          borderRadius: '12px',
                          background: '#1f2937',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#7ab0e5"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="portfolio-range">
                  <span>1H</span>
                  <span>24H</span>
                  <span className="is-active">1W</span>
                  <span>1M</span>
                  <span>1Y</span>
                  <span>ALL</span>
                </div>
              </div>
            </div>

            {/* Juegos recientes */}
            <div className="dashboard-assets-column">
              <div className="dashboard-assets-head">
                <h3 className="dashboard-section-title">Recientes jugados</h3>
              </div>
              <div className="assets-grid">
                {stats.recent_games.length === 0 ? (
                  <p style={{ color: '#94a3b8' }}>No hay juegos recientes.</p>
                ) : (
                  stats.recent_games.map((asset, i) => (
                    <article key={i} className="asset-card">
                      <div className="asset-card-head">
                        <div>
                          <p className="asset-amount">{asset.amount}</p>
                          <p className="asset-time">{asset.hours_played}h</p>
                          <p className="asset-value">{asset.score}</p> 
                        </div>
                        <FiMoreVertical className="asset-menu-icon" />
                      </div>
                      <div className="asset-card-foot">
                        <div className={`asset-chip ${asset.tone}`}>{asset.symbol}</div>
                        <p className="asset-change">{asset.change}</p>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Bottom Section */}
          <section className="dashboard-grid-bottom">

            {/* Tabla de críticas */}
            <div className="market-panel">
              <div className="market-panel-head">
                <h2 className="market-title">Así van las críticas de tus juegos</h2>
                <div className="market-filters">
                  <button type="button" className="market-filter-btn">24h</button>
                  <button type="button" className="market-filter-btn">Top juegos</button>
                  <button type="button" className="market-filter-icon-btn">
                    <FiSliders className="dashboard-icon" />
                  </button>
                </div>
              </div>
              <div className="market-table-wrap">
                <table className="market-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Estado</th>
                      <th>Puntuación</th>
                      <th>Jugadores</th>
                      <th className="market-watch-head"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.reviews.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ color: '#94a3b8', textAlign: 'center', padding: '16px' }}>
                          No hay juegos registrados.
                        </td>
                      </tr>
                    ) : (
                      stats.reviews.map((row, i) => (
                        <tr key={i}>
                          <td>
                            <div className="market-coin">
                              <div className="market-coin-logo">
                                {row.code?.[0] ?? '?'}
                              </div>
                              <div>
                                <p className="market-coin-name">{row.name}</p>
                                <p className="market-coin-code">{row.code}</p>
                              </div>
                            </div>
                          </td>
                          <td className="market-price">{row.status}</td>
                          <td className="market-change">{row.rating}</td>
                          <td className="market-cap">{row.player_count}</td>
                          <td className="market-watch-cell">
                            <button type="button" className="market-watch-btn">
                              <FiStar className="dashboard-icon" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Panel promo */}
            <aside className="promo-panel">
              <p className="promo-title">Recomendaciones de la semana</p>
              <p className="promo-copy">
                Descubre nuevos juegos basados en tus gustos y preferencias.
                ¡Explora, juega y disfruta de nuevas experiencias!
              </p>
              <button type="button" className="promo-cta">
                Descubre ahora
              </button>
              <div className="promo-art" />
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
