import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { API_CONFIG } from '../../config/api';
import axios from 'axios';
import './GameList.css';

export default function GameList() {
  const [games, setGames] = useState([]);
  const [newGame, setNewGame] = useState({ title: '', platform: '' });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [editingGame, setEditingGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');  // 🔍 Nueva búsqueda
  const [searchResults, setSearchResults] = useState([]);  // 🔍 Resultados
  const [searchLoading, setSearchLoading] = useState(false);  // 🔍 Loading
  const [searchError, setSearchError] = useState('');
  const [gamesError, setGamesError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGames();
  }, []);

  // 🔍 Handler de búsqueda con debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError('');
      try {
        const res = await axios.get(
          `${API_CONFIG.BASE_URL}/games/search?query=${encodeURIComponent(searchQuery)}`
        );
        setSearchResults(res.data.results || []);
      } catch (err) {
        console.error('Error buscando juegos:', err);
        setSearchResults([]);
        setSearchError('No se pudo completar la busqueda. Intenta de nuevo.');
      } finally {
        setSearchLoading(false);
      }
    }, 300); // debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchGames = async () => {
    try {
      setGamesError('');
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('[GameList.fetchGames] token missing, skipping fetch');
        setGames([]);
        setGamesError('No hay sesion activa. Inicia sesion nuevamente.');
        return;
      }

      const res = await axios.get(`${API_CONFIG.BASE_URL}/games/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[GameList.fetchGames] loaded games', {
        count: Array.isArray(res.data) ? res.data.length : 0,
      });
      setGames(res.data);
    } catch (error) {
      console.error('Error fetching games:', error);
      setGames([]);
      setGamesError('No se pudieron cargar tus juegos. Recarga la pagina o inicia sesion de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Seleccionar juego de la búsqueda
  const selectGame = async (game) => {
    if (!game.rawg_id && game.game_id) {
      setNewGame({
        title: game.name,
        platform: game.platforms?.map(p => p.name).join(', ') || game.slug || '',
        rawg_id: null,
        game_id: game.game_id,
        image: game.image,
        genres: game.genres,
        description: game.description
      });
      setSearchResults([]);
      setSearchQuery('');
      return;
    }

    try {
      const res = await axios.get(`${API_CONFIG.BASE_URL}/games/detail/${game.rawg_id}`);
      const fullGame = res.data;
      
      // Llenar formulario automáticamente
      setNewGame({
        title: fullGame.name,
        platform: fullGame.platforms?.map(p => p.name).join(', ') || '',
        rawg_id: fullGame.rawg_id,
        game_id: fullGame.id || null,
        image: fullGame.image,
        genres: fullGame.genres,
        description: fullGame.description
      });
      
      setSearchResults([]);  // Ocultar resultados
      setSearchQuery('');    // Limpiar búsqueda
    } catch (err) {
      console.error('Error cargando detalles del juego:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No auth token found');
      }
      if (!newGame.rawg_id && !newGame.game_id) {
        throw new Error('Primero selecciona un juego desde la búsqueda');
      }

      const created = await axios.post(`${API_CONFIG.BASE_URL}/games/add-to-library`, null, {
        params: {
          rawg_id: newGame.rawg_id || undefined,
          game_id: newGame.game_id || undefined,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[GameList.handleSubmit] game created', created.data);
      setNewGame({ title: '', platform: '' });
      await fetchGames();
    } catch (error) {
      console.error('Error creating game:', error.response?.data || error.message);
    } finally {
      setCreating(false);
    }
  };

  // ... resto de funciones (deleteGame, updateStatus, etc.) permanecen IGUALES ...

  const deleteGame = async (gameId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_CONFIG.BASE_URL}/games/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGames(games.filter((g) => g.id !== gameId));
    } catch (err) {
      console.error('Error deleting game:', err);
    }
  };

  const updateStatus = async (gameId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_CONFIG.BASE_URL}/games/${gameId}/status?status=${newStatus}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGames(games.map((g) => g.id === gameId ? { ...g, status: newStatus } : g));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const updateScore = async (gameId, newScore) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_CONFIG.BASE_URL}/games/${gameId}/score?score=${newScore}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGames(games.map((g) => g.id === gameId ? { ...g, score: newScore } : g));
    } catch (err) {
      console.error('Error updating score:', err);
    }
  };

  const updateGame = async (gameId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_CONFIG.BASE_URL}/games/${gameId}`,
        editingGame,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGames(games.map((g) => g.id === gameId ? { ...g, ...response.data } : g));
      setEditingGame(null);
    } catch (err) {
      console.error('Error updating game:', err);
    }
  };

  const filteredGames = games
    .filter((g) => filterStatus === 'todos' || g.status === filterStatus)
    .filter((g) => filterPlatform === '' || g.platform.toLowerCase().includes(filterPlatform.toLowerCase()));

  if (loading) {
    return (
      <div className="game-loading-container">
        <div className="game-loading-text">
          Cargando juegos...
        </div>
      </div>
    );
  }

  return (
    <div className="game-list">
      {/* HEADER - IGUAL */}
      <div className="game-header">
        <div>
          <h1 className="game-header-title">
            🎮 Mis Juegos
          </h1>
          <p className="game-header-subtitle">
            Bienvenido, <strong>{user.email}</strong>
          </p>
        </div>
        <div className="game-header-actions">
          <button
            className="game-primary-btn back-btn"
            onClick={() => navigate('/dashboard')}
          >
            ← Volver
          </button>
          <button className="logout-btn" onClick={logout}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* FILTROS - IGUAL */}
      <div className="game-filters">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="game-select"
        >
          <option value="todos">🎮 Todos</option>
          <option value="pendiente">📋 Pendiente</option>
          <option value="jugando">🎮 Jugando</option>
          <option value="completado">✅ Completado</option>
          <option value="abandonado">❌ Abandonado</option>
        </select>
        <input
          type="text"
          placeholder="🔍 Filtrar por plataforma..."
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="game-input platform-filter-input"
        />
      </div>

      {/* FORMULARIO MEJORADO CON BÚSQUEDA 🔍 */}
      <div className="game-card">
        <form onSubmit={handleSubmit} className="game-form">
          <div className="game-form-grid">
            {/* 🔍 NUEVA BARRA DE BÚSQUEDA */}
            <div className="search-section">
              <label className="game-label">🔍 Buscar juego</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Elden Ring, Zelda, Mario..."
                className="game-input search-input"
              />
              {/* Resultados de búsqueda */}
              {searchLoading && <div className="search-loading">🔎 Buscando...</div>}
              {!searchLoading && searchError && <div className="search-loading">{searchError}</div>}
              {!searchLoading && !searchError && searchQuery.length >= 2 && searchResults.length === 0 && (
                <div className="search-loading">No se encontraron resultados.</div>
              )}
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((game) => (
                    <div
                      key={game.rawg_id}
                      className="search-result-item"
                      onClick={() => selectGame(game)}
                    >
                      <img 
                        src={game.image} 
                        alt={game.name} 
                        className="search-result-image" 
                      />
                      <div>
                        <h4>{game.name}</h4>
                        <p>{game.genres?.map(g => g.name).join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Campos automáticos */}
            <div>
              <label className="game-label">Título</label>
              <input
                type="text"
                value={newGame.title}
                onChange={(e) => setNewGame({ ...newGame, title: e.target.value })}
                className="game-input"
                placeholder="Se rellena automáticamente"
                disabled={creating}
                readOnly
              />
            </div>
            
            <div>
              <label className="game-label">Plataformas</label>
              <input
                type="text"
                value={newGame.platform}
                onChange={(e) => setNewGame({ ...newGame, platform: e.target.value })}
                className="game-input"
                placeholder="Se rellena automáticamente"
                disabled={creating}
                readOnly
              />
            </div>

            <button
              type="submit"
              className="game-primary-btn add-game-btn"
              disabled={creating}
            >
              {creating ? 'Agregando...' : 'Agregar Juego'}
            </button>
          </div>
        </form>

        {/* LISTA DE JUEGOS - IGUAL */}
        <div className="game-items-wrap">
          {gamesError ? (
            <p className="empty-games-msg">{gamesError}</p>
          ) : filteredGames.length === 0 ? (
            <p className="empty-games-msg">
              📭 No hay juegos aún. ¡Busca y agrega el primero!
            </p>
          ) : (
            <div className="game-items-grid">
              {filteredGames.map((game) => (
                <div key={game.id} className="game-item-card">
                  {/* ... resto del JSX igual que tenías ... */}
                  <div className="game-info-col">
                    {editingGame?.id === game.id ? (
                      <div className="game-edit-row">
                        <input
                          value={editingGame.title}
                          onChange={(e) => setEditingGame({ ...editingGame, title: e.target.value })}
                          className="game-input inline-edit-input inline-edit-title"
                        />
                        <input
                          value={editingGame.platform}
                          onChange={(e) => setEditingGame({ ...editingGame, platform: e.target.value })}
                          className="game-input inline-edit-input inline-edit-platform"
                        />
                        <button
                          onClick={() => updateGame(game.id)}
                          className="action-btn save-btn"
                        >
                          💾 Guardar
                        </button>
                        <button
                          onClick={() => setEditingGame(null)}
                          className="action-btn cancel-btn"
                        >
                          ✖ Cancelar
                        </button>
                      </div>
                    ) : (
                      <div>
                        <h3 className="game-title">{game.title}</h3>
                        <p className="game-platform">{game.platform}</p>
                      </div>
                    )}
                  </div>

                  <div className="game-controls">
                    <select
                      value={game.status || 'pendiente'}
                      onChange={(e) => updateStatus(game.id, e.target.value)}
                      className="game-select compact-select"
                    >
                      <option value="pendiente">📋 Pendiente</option>
                      <option value="jugando">🎮 Jugando</option>
                      <option value="completado">✅ Completado</option>
                      <option value="abandonado">❌ Abandonado</option>
                    </select>

                    <select
                      value={game.score || ''}
                      onChange={(e) => updateScore(game.id, parseInt(e.target.value))}
                      className="game-select compact-select"
                    >
                      <option value="">⭐ Nota</option>
                      {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                        <option key={n} value={n}>{n} / 10</option>
                      ))}
                    </select>

                    <button
                      onClick={() => setEditingGame({ id: game.id, title: game.title, platform: game.platform })}
                      className="action-btn edit-btn"
                    >
                      ✏️ Editar
                    </button>

                    <button
                      onClick={() => deleteGame(game.id)}
                      className="action-btn delete-btn"
                    >
                      🗑️ Borrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
