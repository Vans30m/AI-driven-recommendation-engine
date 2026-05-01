import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ProfilePage.css';

const CATEGORIES = [
  'technology', 'science', 'sports', 'entertainment',
  'politics', 'health', 'business', 'education',
  'travel', 'food', 'lifestyle', 'art',
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [selectedCats, setSelectedCats] = useState(user?.preferences?.categories || []);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(user?.preferences?.tags || []);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const toggleCat = (cat) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const addTag = (e) => {
    e.preventDefault();
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (tag) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const [profileRes, prefRes] = await Promise.all([
        api.put('/users/profile', { name, avatar }),
        api.put('/users/preferences', { categories: selectedCats, tags }),
      ]);
      updateUser({ ...profileRes.data.user, preferences: prefRes.data.user.preferences });
      setMsg({ type: 'success', text: '✅ Profile updated!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="profile-page container">
      <h1 className="page-title">My Profile</h1>

      <div className="profile-layout">
        {/* Avatar preview */}
        <div className="profile-avatar-section">
          <div className="profile-avatar-large">
            {avatar ? (
              <img src={avatar} alt={name} />
            ) : (
              <span>{name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <p className="text-muted" style={{ fontSize: '0.85rem', textAlign: 'center', marginTop: '0.5rem' }}>
            {user?.email}
          </p>
          <span className={`role-badge ${user?.role === 'admin' ? 'admin' : ''}`}>
            {user?.role}
          </span>
        </div>

        {/* Form */}
        <form className="profile-form card" onSubmit={handleSave}>
          {msg && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}

          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              required
            />
          </div>

          <div className="form-group">
            <label>Avatar URL <span className="text-muted">(optional)</span></label>
            <input
              type="url"
              className="form-control"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div className="form-group">
            <label>Category Interests</label>
            <div className="interests-grid">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`interest-btn ${selectedCats.includes(cat) ? 'selected' : ''}`}
                  onClick={() => toggleCat(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Topic Tags</label>
            <form className="tag-input-row" onSubmit={addTag}>
              <input
                type="text"
                className="form-control"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="e.g. machine learning"
              />
              <button type="submit" className="btn btn-outline btn-sm">Add</button>
            </form>
            {tags.length > 0 && (
              <div className="tags-list">
                {tags.map((tag) => (
                  <span key={tag} className="tag-chip">
                    {tag}
                    <button type="button" className="tag-remove" onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </main>
  );
}
