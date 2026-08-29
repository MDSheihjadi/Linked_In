import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { searchApi } from '../api/usersApi';
import type { SearchResults } from '../api/usersApi';
import Avatar from '../components/Avatar';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      setResults(await searchApi.search(query));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h2>Search</h2>
      <form onSubmit={handleSearch} className="search-form">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people or posts…"
          className="search-input"
        />
        <button type="submit" className="composer__submit">Search</button>
      </form>

      {loading && <p>Searching…</p>}

      {results && (
        <>
          {results.users && results.users.length > 0 && (
            <div className="search-section">
              <h3>People</h3>
              {results.users.map((u) => (
                <Link key={u._id} to={`/profile/${u._id}`} className="search-result-card">
                  <Avatar id={u._id} name={u.name} size={36} />
                  <div>
                    <strong>{u.name}</strong>
                    {u.headline && <div className="post-card__headline">{u.headline}</div>}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {results.posts && results.posts.length > 0 && (
            <div className="search-section">
              <h3>Posts</h3>
              {results.posts.map((p) => (
                <div key={p._id} className="search-result-card" style={{ alignItems: 'flex-start' }}>
                  <Avatar id={p.author._id} name={p.author.name} size={36} />
                  <div>
                    <strong>{p.author.name}</strong>
                    <p style={{ margin: '4px 0 0' }}>{p.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(!results.users || results.users.length === 0) &&
            (!results.posts || results.posts.length === 0) && <p>No results found.</p>}
        </>
      )}
    </div>
  );
}