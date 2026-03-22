import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

export default function GameList() {
  const [games, setGames] = useState([]);
  const [newGame, setNewGame] = useState({ title: '', platform: '' });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const API_URL = 'http://localhost:8000';

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const res = await axios.get(`${API_URL}/games`);
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
      await axios.post(`${API_URL}/games`, newGame);
      setNewGame({ title: '', platform: '' });
      await fetchGames();  // Refresh lista
    } catch (error) {
      console.error('Error creating game:', error.response?.data || error.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="myhub-container">
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '1.2rem' }}>
          Cargando juegos...
        </div>
      </div>
    );
  }

  const deleteGame = async (gameId) => {
  try {
    const token = localStorage.getItem('token'); // ← obtenerlo aquí directamente
    await axios.delete(`${API_URL}/games/${gameId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setGames(games.filter((g) => g.id !== gameId));
  } catch (err) {
    console.error('Error deleting game:', err);
  }
};


  return (
    <div className="game-list">
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

      <div>
         <ul>
            {games.map((game) => (
                <li key={game.id}>
                <strong>{game.title}</strong> — {game.platform}
                {/* ← NUEVO */}
                <button onClick={() => deleteGame(game.id)}>🗑️ Borrar</button>
                </li>
            ))}
            </ul>
      </div>

      <div className="game-card">
        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 2fr 1fr auto', 
            gap: '1rem', 
            alignItems: 'end' 
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
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
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
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

        <div style={{ padding: '0 2rem 2rem' }}>
          {games.length === 0 ? (
            <p style={{ 
              textAlign: 'center', 
              color: '#6b7280', 
              fontSize: '1.1rem', 
              padding: '3rem',
              background: '#f9fafb',
              borderRadius: '12px',
              margin: '1rem 0'
            }}>
              📭 No hay juegos aún. ¡Sé el primero en agregar uno!
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {games.map((game) => (
                <div 
                  key={game.id} 
                  className="myhub-card" 
                  style={{ 
                    padding: '1.5rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}
                >
                  <div>
                    <h3 style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: '600', 
                      color: '#1f2937', 
                      marginBottom: '0.25rem' 
                    }}>
                      {game.title}
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                      {game.platform} 
                      {game.created_at && ` • ${new Date(game.created_at).toLocaleDateString('es-CO')}`}
                    </p>
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
