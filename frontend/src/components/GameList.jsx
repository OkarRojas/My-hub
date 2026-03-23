import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

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
  const API_URL = import.meta.env.VITE_API_URL || 'https://my-hub-yc50.onrender.com';

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
      <div className="myhub-container">
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '1.2rem' }}>
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
          <h1 className="myhub-title" style={{ margin: 0, fontSize: '2rem' }}>
            🎮 Mis Juegos
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Bienvenido, <strong>{user.email}</strong>
          </p>
        </div>
        <div>
          <button
            className="myhub-btn"
            style={{ padding: '0.75rem 1.5rem', marginRight: '1rem' }}
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
      <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0', flexWrap: 'wrap' }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb' }}
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
          className="myhub-input"
          style={{ maxWidth: '250px' }}
        />
      </div>

      {/* FORMULARIO AGREGAR */}
      <div className="game-card">
        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Título del Juego
              </label>
              <input
                type="text"
                value={newGame.title}
                onChange={(e) => setNewGame({ ...newGame, title: e.target.value })}
                className="myhub-input"
                placeholder="Super Mario Bros"
                required
                disabled={creating}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Plataforma
              </label>
              <input
                type="text"
                value={newGame.platform}
                onChange={(e) => setNewGame({ ...newGame, platform: e.target.value })}
                className="myhub-input"
                placeholder="NES, PC, PS5"
                required
                disabled={creating}
              />
            </div>
            <button
              type="submit"
              className="myhub-btn"
              style={{ padding: '1rem 2rem', height: 'fit-content' }}
              disabled={creating}
            >
              {creating ? 'Agregando...' : 'Agregar Juego'}
            </button>
          </div>
        </form>

        {/* LISTA DE JUEGOS */}
        <div style={{ padding: '0 2rem 2rem' }}>
          {filteredGames.length === 0 ? (
            <p style={{
              textAlign: 'center', color: '#6b7280', fontSize: '1.1rem',
              padding: '3rem', background: '#f9fafb', borderRadius: '12px', margin: '1rem 0'
            }}>
              📭 No hay juegos aún. ¡Sé el primero en agregar uno!
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  className="myhub-card"
                  style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}
                >
                  {/* TÍTULO Y PLATAFORMA / MODO EDICIÓN */}
                  <div style={{ minWidth: '200px' }}>
                    {editingGame?.id === game.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          value={editingGame.title}
                          onChange={(e) => setEditingGame({ ...editingGame, title: e.target.value })}
                          className="myhub-input"
                          style={{ padding: '0.4rem', width: '150px' }}
                        />
                        <input
                          value={editingGame.platform}
                          onChange={(e) => setEditingGame({ ...editingGame, platform: e.target.value })}
                          className="myhub-input"
                          style={{ padding: '0.4rem', width: '100px' }}
                        />
                        <button
                          onClick={() => updateGame(game.id)}
                          style={{ background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: '8px', padding: '0.4rem 0.8rem', cursor: 'pointer', fontWeight: '600' }}
                        >
                          💾 Guardar
                        </button>
                        <button
                          onClick={() => setEditingGame(null)}
                          style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '0.4rem 0.8rem', cursor: 'pointer' }}
                        >
                          ✖ Cancelar
                        </button>
                      </div>
                    ) : (
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                          {game.title}
                        </h3>
                        <p style={{ color: '#6b7280', fontSize: '1rem' }}>{game.platform}</p>
                      </div>
                    )}
                  </div>

                  {/* CONTROLES */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <select
                      value={game.status || 'pendiente'}
                      onChange={(e) => updateStatus(game.id, e.target.value)}
                      style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer' }}
                    >
                      <option value="pendiente">📋 Pendiente</option>
                      <option value="jugando">🎮 Jugando</option>
                      <option value="completado">✅ Completado</option>
                      <option value="abandonado">❌ Abandonado</option>
                    </select>

                    <select
                      value={game.score || ''}
                      onChange={(e) => updateScore(game.id, parseInt(e.target.value))}
                      style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer' }}
                    >
                      <option value="">⭐ Nota</option>
                      {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                        <option key={n} value={n}>{n} / 10</option>
                      ))}
                    </select>

                    <button
                      onClick={() => setEditingGame({ id: game.id, title: game.title, platform: game.platform })}
                      style={{ background: '#dbeafe', color: '#1d4ed8', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: '600' }}
                    >
                      ✏️ Editar
                    </button>

                    <button
                      onClick={() => deleteGame(game.id)}
                      style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: '600' }}
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
