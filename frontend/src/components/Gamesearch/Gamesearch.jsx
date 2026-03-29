import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API_CONFIG } from '../../config/api';
import 'Gamesearch.css';

function GameSearch({ onGameSelect }) {
  const { login } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_CONFIG.BASE_URL}/games/search?query=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setResults(data.results || []);
      } catch (err) {
        console.error('Error buscando juegos:', err);
      } finally {
        setLoading(false);
      }
    }, 300); // debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = async (game) => {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/games/detail/${game.rawg_id}`);
      const fullGame = await res.json();
      onGameSelect(fullGame);
      setQuery('');
      setResults([]);
    } catch (err) {
      console.error('Error cargando detalles:', err);
    }
  };

  return (
    <div className="game-search">
      <input
        type="text"
        placeholder="Buscar juego (Elden Ring, Zelda...)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
      />
      
      {loading && <div className="search-loading">Buscando...</div>}
      
      {results.length > 0 && (
        <div className="search-results">
          {results.map((game) => (
            <div
              key={game.rawg_id}
              className="search-result"
              onClick={() => handleSelect(game)}
            >
              <img src={game.image} alt={game.name} />
              <div>
                <h4>{game.name}</h4>
                <p>{game.genres?.map(g => g.name).join(', ')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GameSearch;
