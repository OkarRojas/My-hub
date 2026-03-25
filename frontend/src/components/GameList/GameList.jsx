import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const res = await axios.get(`${API_URL}/games/`);
      setGames(res.data);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await axios.post(`${API_URL}/games/`, newGame);
      setNewGame({ title: '', platform: '' });
      await fetchGames();
    } catch (error) {
      console.error('Error creating game:', error.response?.data || error.message);
    } finally {
      setCreating(false);
    }
  };

  const deleteGame = async (gameId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/games/${gameId}`, {
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
        `${API_URL}/games/${gameId}/status?status=${newStatus}`,
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
        `${API_URL}/games/${gameId}/score?score=${newScore}`,
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
      await axios.put(
        `${API_URL}/games/${gameId}`,
        editingGame,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGames(games.map((g) => g.id === gameId ? { ...g, ...editingGame } : g));
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
      {/* HEADER */}
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
            onClick={() => navigate('/')}
          >
            ← Volver
          </button>
          <button className="logout-btn" onClick={logout}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* FILTROS */}
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

      {/* FORMULARIO AGREGAR */}
      <div className="game-card">
        <form onSubmit={handleSubmit} className="game-form">
          <div className="game-form-grid">
            <div>
              <label className="game-label">
                Título del Juego
              </label>
              <input
                type="text"
                value={newGame.title}
                onChange={(e) => setNewGame({ ...newGame, title: e.target.value })}
                className="game-input"
                placeholder="Super Mario Bros"
                required
                disabled={creating}
              />
            </div>
            <div>
              <label className="game-label">
                Plataforma
              </label>
              <input
                type="text"
                value={newGame.platform}
                onChange={(e) => setNewGame({ ...newGame, platform: e.target.value })}
                className="game-input"
                placeholder="NES, PC, PS5"
                required
                disabled={creating}
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

        {/* LISTA DE JUEGOS */}
        <div className="game-items-wrap">
          {filteredGames.length === 0 ? (
            <p className="empty-games-msg">
              📭 No hay juegos aún. ¡Sé el primero en agregar uno!
            </p>
          ) : (
            <div className="game-items-grid">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  className="game-item-card"
                >
                  {/* TÍTULO Y PLATAFORMA / MODO EDICIÓN */}
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
                        <h3 className="game-title">
                          {game.title}
                        </h3>
                        <p className="game-platform">{game.platform}</p>
                      </div>
                    )}
                  </div>

                  {/* CONTROLES */}
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
