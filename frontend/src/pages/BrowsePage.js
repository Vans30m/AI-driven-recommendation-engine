import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ContentCard from '../components/content/ContentCard';
import api from '../services/api';
import './BrowsePage.css';

const CATEGORIES = [
  'all', 'technology', 'science', 'sports', 'entertainment',
  'politics', 'health', 'business', 'education',
  'travel', 'food', 'lifestyle', 'art',
];

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 12 };
      if (category !== 'all') params.category = category;
      if (search) params.search = search;

      const res = await api.get('/content', { params });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [category, search, page]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const val = e.target.elements.q.value.trim();
    setParam('search', val);
  };

  return (
    <main className="browse-page container">
      <h1 className="page-title">Browse Content</h1>

      {/* Search bar */}
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          name="q"
          type="text"
          defaultValue={search}
          placeholder="Search articles, topics, authors…"
          className="form-control search-input"
        />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {/* Category filter */}
      <div className="category-filter">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${(category === cat || (cat === 'all' && !category)) ? 'active' : ''}`}
            onClick={() => setParam('category', cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results meta */}
      {!loading && (
        <p className="results-meta text-muted">
          {total} article{total !== 1 ? 's' : ''}
          {category !== 'all' ? ` in ${category}` : ''}
          {search ? ` matching "${search}"` : ''}
        </p>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="flex-center" style={{ height: '40vh' }}>
          <div className="spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>🔍 No content found. Try a different search or category.</p>
        </div>
      ) : (
        <>
          <div className="content-grid">
            {items.map((item) => (
              <ContentCard key={item._id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="pagination">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-btn ${p === page ? 'active' : ''}`}
                  onClick={() => setParam('page', String(p))}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
