import React from 'react';
import { Link } from 'react-router-dom';
import './ContentCard.css';

const CATEGORY_EMOJI = {
  technology: '💻', science: '🔬', sports: '⚽', entertainment: '🎬',
  politics: '🏛️', health: '❤️', business: '💼', education: '📚',
  travel: '✈️', food: '🍴', lifestyle: '🌟', art: '🎨',
};

export default function ContentCard({ item, score }) {
  const emoji = CATEGORY_EMOJI[item.category] || '📄';

  return (
    <Link to={`/content/${item._id}`} className="content-card card">
      <div className="card-image-wrapper">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="card-image"
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="card-image-placeholder">{emoji}</div>
        )}
        <span className="card-category badge badge-category">{item.category}</span>
      </div>

      <div className="card-body">
        <h3 className="card-title">{item.title}</h3>
        <p className="card-desc text-muted">{item.description?.slice(0, 100)}…</p>

        <div className="card-meta">
          <span className="card-author text-muted">✍️ {item.author}</span>
          <div className="card-stats">
            <span>👁 {item.viewCount || 0}</span>
            <span>❤️ {item.likeCount || 0}</span>
          </div>
        </div>

        {score !== undefined && (
          <div className="card-score">
            <span className="score-bar" style={{ width: `${Math.round(score * 100)}%` }} />
            <span className="score-label">Match {Math.round(score * 100)}%</span>
          </div>
        )}

        {item.tags && item.tags.length > 0 && (
          <div className="card-tags">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge badge-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
