import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ContentCard from '../components/content/ContentCard';
import StarRating from '../components/common/StarRating';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ContentDetailPage.css';

export default function ContentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [content, setContent] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [interactions, setInteractions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  const viewStartRef = useRef(Date.now());

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [contentRes, similarRes] = await Promise.all([
        api.get(`/content/${id}`),
        api.get(`/recommendations/similar/${id}`, { params: { limit: 4 } }),
      ]);
      setContent(contentRes.data);
      setSimilar(similarRes.data.similar || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadContent();
    viewStartRef.current = Date.now();

    // Track view + time spent on unmount
    return () => {
      if (!user) return;
      const timeSpent = Math.round((Date.now() - viewStartRef.current) / 1000);
      api.post('/interactions', { contentId: id, type: 'view', timeSpent }).catch(() => {});
    };
  }, [id, user, loadContent]);

  const sendInteraction = async (type, extra = {}) => {
    if (!user) { setActionMsg('Please log in to interact.'); return; }
    try {
      await api.post('/interactions', { contentId: id, type, ...extra });
      setInteractions((prev) => ({ ...prev, [type]: true }));
      setActionMsg(type === 'like' ? '❤️ Liked!' : type === 'share' ? '🔗 Shared!' : type === 'bookmark' ? '🔖 Bookmarked!' : '✅ Done!');
      setTimeout(() => setActionMsg(''), 2500);
    } catch (err) {
      setActionMsg(err.response?.data?.error || 'Action failed.');
    }
  };

  const handleRate = async (rating) => {
    await sendInteraction('rate', { rating });
    setInteractions((prev) => ({ ...prev, rating }));
  };

  if (loading) return <div className="flex-center" style={{ height: '60vh' }}><div className="spinner" /></div>;
  if (error) return <div className="container mt-4"><div className="alert alert-error">{error}</div></div>;
  if (!content) return null;

  return (
    <main className="detail-page container">
      <div className="detail-layout">
        {/* Main article */}
        <article className="detail-article">
          <div className="detail-header">
            <span className="badge badge-category">{content.category}</span>
            <h1 className="detail-title">{content.title}</h1>
            <div className="detail-meta text-muted">
              <span>✍️ {content.author}</span>
              <span>📅 {new Date(content.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>👁 {content.viewCount} views</span>
            </div>
          </div>

          {content.imageUrl && (
            <img src={content.imageUrl} alt={content.title} className="detail-image" />
          )}

          <div className="detail-body">
            <p>{content.description}</p>
          </div>

          {/* Tags */}
          {content.tags?.length > 0 && (
            <div className="detail-tags">
              {content.tags.map((tag) => (
                <Link key={tag} to={`/browse?search=${tag}`} className="badge badge-tag">{tag}</Link>
              ))}
            </div>
          )}

          {/* Interaction bar */}
          <div className="interaction-bar">
            {actionMsg && <div className="alert alert-success">{actionMsg}</div>}
            <div className="interaction-buttons">
              <button
                className={`btn btn-outline ${interactions.like ? 'active-btn' : ''}`}
                onClick={() => sendInteraction('like')}
                title="Like"
              >
                ❤️ {interactions.like ? 'Liked' : 'Like'} ({content.likeCount})
              </button>
              <button
                className={`btn btn-outline ${interactions.bookmark ? 'active-btn' : ''}`}
                onClick={() => sendInteraction('bookmark')}
                title="Bookmark"
              >
                🔖 {interactions.bookmark ? 'Saved' : 'Save'}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => sendInteraction('share')}
                title="Share"
              >
                🔗 Share
              </button>
            </div>

            {user && (
              <div className="rating-section">
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>Rate this:</span>
                <StarRating
                  value={interactions.rating || 0}
                  onChange={handleRate}
                />
              </div>
            )}
          </div>
        </article>

        {/* Sidebar — similar content */}
        {similar.length > 0 && (
          <aside className="detail-sidebar">
            <h3 className="sidebar-title">📖 Similar Content</h3>
            <div className="sidebar-list">
              {similar.map((item) => (
                <ContentCard key={item._id} item={item} />
              ))}
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}
