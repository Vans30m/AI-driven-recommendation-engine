import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ContentCard from '../components/content/ContentCard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './HomePage.css';

const CATEGORIES = [
  'technology', 'science', 'sports', 'entertainment',
  'politics', 'health', 'business', 'education',
  'travel', 'food', 'lifestyle', 'art',
];

export default function HomePage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const trendingRes = await api.get('/recommendations/trending', { params: { limit: 6 } });
      setTrending(trendingRes.data.trending || []);

      if (user) {
        const recRes = await api.get('/recommendations', { params: { limit: 12 } });
        setRecommendations(recRes.data.recommendations || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <main className="home-page">
      {/* Hero */}
      <section className="hero container">
        <div className="hero-content">
          <h1 className="hero-title">
            Discover Content<br />
            <span className="gradient-text">Tailored For You</span>
          </h1>
          <p className="hero-subtitle">
            Our AI engine analyses your interests and reading patterns to surface
            the most relevant articles, stories, and insights — so you always find
            something worth reading.
          </p>
          {!user && (
            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary">Get Started Free</Link>
              <Link to="/browse" className="btn btn-outline">Browse Content</Link>
            </div>
          )}
        </div>

        {/* Category pills */}
        <div className="category-pills">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              to={`/browse?category=${cat}`}
              className="category-pill"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {error && (
        <div className="container">
          <div className="alert alert-error">{error}</div>
        </div>
      )}

      {/* Personalised recommendations */}
      {user && recommendations.length > 0 && (
        <section className="container section">
          <h2 className="section-title">
            <span>✨</span> Recommended For You
          </h2>
          <div className="content-grid">
            {recommendations.map((item) => (
              <ContentCard
                key={item._id}
                item={item}
                score={item.recommendationScore}
              />
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <section className="container section">
          <h2 className="section-title">
            <span>🔥</span> Trending Now
          </h2>
          <div className="content-grid">
            {trending.map((item) => (
              <ContentCard key={item._id} item={item} />
            ))}
          </div>
          <div className="see-more">
            <Link to="/browse" className="btn btn-outline">See All Content →</Link>
          </div>
        </section>
      )}

      {/* CTA for logged-out users */}
      {!user && (
        <section className="cta-section container">
          <div className="cta-card card">
            <h2>🧠 Get Smarter Recommendations</h2>
            <p className="text-muted">
              Create a free account and let our AI learn what you love. The more you
              interact with content, the better your personalised feed becomes.
            </p>
            <Link to="/register" className="btn btn-primary">Create Account</Link>
          </div>
        </section>
      )}
    </main>
  );
}
