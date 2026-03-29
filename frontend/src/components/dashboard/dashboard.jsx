import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import {
  FiSearch, FiBell, FiChevronDown, FiGrid, FiBarChart2,
  FiFileText, FiBox, FiUser, FiLogOut, FiMoreVertical,
  FiStar, FiSliders,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
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

const chartRanges = ['1H', '24H', '1W', '1M', '1Y', 'ALL'];
const REVIEWS_PER_PAGE = 8;
const rangeToMs = {
  '1H': 60 * 60 * 1000,
  '24H': 24 * 60 * 60 * 1000,
  '1W': 7 * 24 * 60 * 60 * 1000,
  '1M': 30 * 24 * 60 * 60 * 1000,
  '1Y': 365 * 24 * 60 * 60 * 1000,
};

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState('1W');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsWindow, setReviewsWindow] = useState('all');
  const [isTopGamesSort, setIsTopGamesSort] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const searchInputRef = useRef(null);
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

  const filteredPlayHistory = useMemo(() => {
    const history = Array.isArray(stats.play_history) ? stats.play_history : [];

    const normalizedHistory = history
      .map((entry) => {
        const timestamp = entry.created_at ? new Date(entry.created_at).getTime() : NaN;

        return {
          ...entry,
          _timestamp: Number.isFinite(timestamp) ? timestamp : null,
        };
      })
      .sort((a, b) => {
        if (a._timestamp === null && b._timestamp === null) {
          return 0;
        }
        if (a._timestamp === null) {
          return -1;
        }
        if (b._timestamp === null) {
          return 1;
        }
        return a._timestamp - b._timestamp;
      });

    if (selectedRange === 'ALL') {
      return normalizedHistory;
    }

    const now = Date.now();
    const windowMs = rangeToMs[selectedRange];

    if (!windowMs) {
      return normalizedHistory;
    }

    return normalizedHistory.filter((entry) => {
      if (entry._timestamp === null) {
        return false;
      }

      return now - entry._timestamp <= windowMs && now >= entry._timestamp;
    });
  }, [stats.play_history, selectedRange]);

  const visibleReviews = useMemo(() => {
    const baseReviews = Array.isArray(stats.reviews) ? stats.reviews : [];
    const normalizedQuery = searchQuery.trim().toLowerCase();
    let reviews = [...baseReviews];

    if (reviewsWindow === '24h') {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      reviews = reviews.filter((review) => {
        const timestamp = review.created_at ? new Date(review.created_at).getTime() : NaN;
        if (!Number.isFinite(timestamp)) {
          return false;
        }

        return now - timestamp <= oneDayMs && now >= timestamp;
      });
    }

    if (isTopGamesSort) {
      reviews.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }

    if (normalizedQuery) {
      reviews = reviews.filter((review) => {
        const searchText = `${review.name ?? ''} ${review.code ?? ''} ${review.status ?? ''}`.toLowerCase();
        return searchText.includes(normalizedQuery);
      });
    }

    return reviews;
  }, [stats.reviews, reviewsWindow, isTopGamesSort, searchQuery]);

  const filteredRecentGames = useMemo(() => {
    const games = Array.isArray(stats.recent_games) ? stats.recent_games : [];
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return games;
    }

    return games.filter((game) => {
      const searchText = `${game.amount ?? ''} ${game.symbol ?? ''}`.toLowerCase();
      return searchText.includes(normalizedQuery);
    });
  }, [stats.recent_games, searchQuery]);

  const totalReviewPages = useMemo(() => {
    return Math.max(1, Math.ceil(visibleReviews.length / REVIEWS_PER_PAGE));
  }, [visibleReviews.length]);

  const paginatedReviews = useMemo(() => {
    const startIndex = (reviewsPage - 1) * REVIEWS_PER_PAGE;
    return visibleReviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE);
  }, [visibleReviews, reviewsPage]);

  const reviewPageNumbers = useMemo(() => {
    if (totalReviewPages <= 5) {
      return Array.from({ length: totalReviewPages }, (_, index) => index + 1);
    }

    let start = Math.max(1, reviewsPage - 2);
    let end = Math.min(totalReviewPages, start + 4);
    start = Math.max(1, end - 4);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [reviewsPage, totalReviewPages]);

  useEffect(() => {
    setReviewsPage((prevPage) => Math.min(prevPage, totalReviewPages));
  }, [totalReviewPages]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    setReviewsPage(1);
  }, [searchQuery]);

  const fetchDashboardStats = ({ showLoader = false } = {}) => {
    if (showLoader) {
      setLoading(true);
    }

    return fetch(`${API_CONFIG.BASE_URL}/dashboard/my-stats`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setReviewsPage(1);
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        if (showLoader) {
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    if (!isUserMenuOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/login');
  };

  const handleGoToGames = () => {
    setIsUserMenuOpen(false);
    navigate('/games');
  };

  const handleGoToDashboard = () => {
    setIsUserMenuOpen(false);
    navigate('/dashboard');
  };

  const handleRefreshData = () => {
    setIsUserMenuOpen(false);
    fetchDashboardStats();
  };

  useEffect(() => {
    fetchDashboardStats({ showLoader: true });
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
              <button
                type="button"
                className={`dashboard-icon-btn ${isSearchOpen ? 'is-active' : ''}`}
                onClick={() => setIsSearchOpen((prev) => !prev)}
                aria-label="Mostrar u ocultar buscador"
              >
                <FiSearch className="dashboard-icon" />
              </button>
              {isSearchOpen && (
                <input
                  ref={searchInputRef}
                  type="text"
                  className="dashboard-search-input"
                  placeholder="Buscar juego, plataforma o estado..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              )}
              <button type="button" className="dashboard-icon-btn">
                <FiBell className="dashboard-icon" />
              </button>
              <div className="dashboard-user-menu" ref={userMenuRef}>
                <button
                  type="button"
                  className="dashboard-user-pill"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                >
                  <div className="dashboard-user-avatar" />
                  <span className="dashboard-user-name">{stats.user_name || user?.email?.split('@')[0] || 'Usuario'}</span>
                  <FiChevronDown className={`dashboard-user-chevron ${isUserMenuOpen ? 'is-open' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="dashboard-user-dropdown" role="menu" aria-label="Opciones de usuario">
                    <button type="button" className="dashboard-user-option" role="menuitem" onClick={handleGoToDashboard}>
                      <FiUser className="dashboard-user-option-icon" />
                      Ver dashboard
                    </button>
                    <button type="button" className="dashboard-user-option" role="menuitem" onClick={handleGoToGames}>
                      <FiBox className="dashboard-user-option-icon" />
                      Mis juegos
                    </button>
                    <button type="button" className="dashboard-user-option" role="menuitem" onClick={handleRefreshData}>
                      <FiSliders className="dashboard-user-option-icon" />
                      Actualizar datos
                    </button>
                    <button type="button" className="dashboard-user-option is-danger" role="menuitem" onClick={handleLogout}>
                      <FiLogOut className="dashboard-user-option-icon" />
                      Cerrar sesion
                    </button>
                  </div>
                )}
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
                    <LineChart data={filteredPlayHistory}>
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
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="portfolio-range">
                  {chartRanges.map((range) => (
                    <button
                      key={range}
                      type="button"
                      className={`portfolio-range-btn ${selectedRange === range ? 'is-active' : ''}`}
                      onClick={() => setSelectedRange(range)}
                      aria-pressed={selectedRange === range}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Juegos recientes */}
            <div className="dashboard-assets-column">
              <div className="dashboard-assets-head">
                <h3 className="dashboard-section-title">Recientes jugados</h3>
              </div>
              <div className="assets-grid">
                {filteredRecentGames.length === 0 ? (
                  <p style={{ color: '#003c90' }}>
                    {searchQuery.trim() ? 'No hay coincidencias en recientes.' : 'No hay juegos recientes.'}
                  </p>
                ) : (
                  filteredRecentGames.map((asset, i) => (
                    <article key={i} className="asset-card">
                      <div className="asset-card-head">
                        <div>
                          <p className="asset-amount">{asset.amount}</p>
                          <p>{asset.hours_played !== undefined ? asset.hours_played : 'N/A'}h</p>
                          
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
                      <button
                      type="button"
                      className={`market-filter-btn ${reviewsWindow === '24h' ? 'is-active' : ''}`}
                      onClick={() => {
                        setReviewsWindow((prev) => (prev === '24h' ? 'all' : '24h'));
                        setReviewsPage(1);
                      }}
                      >
                      24h
                      </button>
                      <button 
                      type="button" 
                      className={`market-filter-btn ${isTopGamesSort ? 'is-active' : ''}`}
                      onClick={() => {
                        setIsTopGamesSort((prev) => !prev);
                        setReviewsPage(1);
                      }}
                      >
                      Top juegos
                      </button>
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
                      {visibleReviews.length === 0 ? (
                        <tr>
                        <td colSpan={5} style={{ color: '#94a3b8', textAlign: 'center', padding: '16px' }}>
                          No hay juegos para este filtro.
                        </td>
                        </tr>
                      ) : (
                        paginatedReviews.map((row, i) => (
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
                    {visibleReviews.length > 0 && totalReviewPages > 1 && (
                      <div className="market-pagination">
                        <button
                          type="button"
                          className="market-page-btn"
                          onClick={() => setReviewsPage((prev) => Math.max(1, prev - 1))}
                          disabled={reviewsPage === 1}
                        >
                          Anterior
                        </button>

                        <div className="market-page-numbers">
                          {reviewPageNumbers[0] > 1 && (
                            <>
                              <button
                                type="button"
                                className="market-page-number"
                                onClick={() => setReviewsPage(1)}
                              >
                                1
                              </button>
                              {reviewPageNumbers[0] > 2 && <span className="market-page-ellipsis">...</span>}
                            </>
                          )}

                          {reviewPageNumbers.map((page) => (
                            <button
                              key={page}
                              type="button"
                              className={`market-page-number ${reviewsPage === page ? 'is-active' : ''}`}
                              onClick={() => setReviewsPage(page)}
                            >
                              {page}
                            </button>
                          ))}

                          {reviewPageNumbers[reviewPageNumbers.length - 1] < totalReviewPages && (
                            <>
                              {reviewPageNumbers[reviewPageNumbers.length - 1] < totalReviewPages - 1 && (
                                <span className="market-page-ellipsis">...</span>
                              )}
                              <button
                                type="button"
                                className="market-page-number"
                                onClick={() => setReviewsPage(totalReviewPages)}
                              >
                                {totalReviewPages}
                              </button>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          className="market-page-btn"
                          onClick={() => setReviewsPage((prev) => Math.min(totalReviewPages, prev + 1))}
                          disabled={reviewsPage === totalReviewPages}
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
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
