# 🧠 AI-Driven Content Recommendation Engine

A full-stack web application that delivers **personalised content recommendations** by combining content-based filtering, collaborative filtering, and popularity signals. Built with **React**, **Node.js/Express**, and **MongoDB**.

---

## 📋 Table of Contents
- [Architecture Overview](#-architecture-overview)
- [AI Recommendation Algorithm](#-ai-recommendation-algorithm)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Development Timeline](#-development-timeline)
- [Placement Advice](#-placement-advice)

---

## 🏗 Architecture Overview

```
┌──────────────────────────────────────────────────┐
│                  React Frontend                   │
│  (Homepage · Browse · Detail · Profile · Auth)   │
└─────────────────────┬────────────────────────────┘
                      │  REST API (JSON)
┌─────────────────────▼────────────────────────────┐
│              Node.js / Express Backend            │
│                                                   │
│  ┌────────────┐  ┌──────────────────────────────┐│
│  │ Auth (JWT) │  │  Recommendation Engine       ││
│  └────────────┘  │  ┌──────────────────────────┐││
│  ┌────────────┐  │  │ Content-Based Filtering  │││
│  │  Content   │  │  │ Collaborative Filtering  │││
│  │   Routes   │  │  │ Popularity Scoring       │││
│  └────────────┘  │  └──────────────────────────┘││
│  ┌────────────┐  └──────────────────────────────┘│
│  │Interaction │                                   │
│  │  Tracker   │                                   │
│  └────────────┘                                   │
└─────────────────────┬────────────────────────────┘
                      │  Mongoose ODM
┌─────────────────────▼────────────────────────────┐
│                    MongoDB                        │
│   Users · Content · Interactions                 │
└──────────────────────────────────────────────────┘
```

---

## 🤖 AI Recommendation Algorithm

The recommendation engine is a **hybrid model** blending three complementary approaches:

### 1. Content-Based Filtering (weight: 45%)
Builds a TF-IDF-inspired feature vector for every content item (from category, tags, title, and description) and compares it via **cosine similarity** to a weighted user-preference vector constructed from:
- Explicit preferences (selected categories & tags on the profile page)
- Past interactions (likes, bookmarks, views) with **temporal decay** — recent activity counts more than old activity

### 2. Collaborative Filtering — User-User (weight: 35%)
Finds "neighbour" users with similar interaction patterns using **Pearson correlation** on shared items (minimum 2 items in common). Predicts a score for unseen content by computing a similarity-weighted average of neighbour ratings. This surfaces content the user hasn't seen but similar users love.

### 3. Popularity Scoring (weight: 20%)
Ranks content by a weighted engagement score (views × 1 + likes × 3 + shares × 4) computed over the **last 7 days**. Normalised to [0, 1]. Handles the **cold-start problem** for new users with no interaction history.

### Blending & Ranking
```
finalScore = 0.45 × CB_score + 0.35 × CF_score + 0.20 × popularity_score
```
All sub-scores are normalised to [0, 1] before blending. Already-viewed content is excluded by default.

### Implicit Feedback Scoring
Every interaction type carries an implicit score used by the collaborative filter:

| Interaction | Implicit Score |
|---|---|
| View (< 1 min) | +1 |
| View (5 min+) | +3.5 |
| Like | +3 |
| Bookmark | +3 |
| Share | +4 |
| Dislike | −2 |
| Rate 5★ | +4 |
| Rate 1★ | −4 |

---

## ✨ Features

- **Personalised feed** — AI-ranked recommendations that improve with every interaction
- **Browse & search** — full-text search across all content, filterable by category
- **Interaction tracking** — like, bookmark, share, rate, and timed-read tracking
- **Similar content** — item-item content-based recommendations on the detail page
- **Trending section** — surfaced from recent engagement data (7-day window)
- **User profile & preferences** — set category interests and topic tags
- **JWT authentication** — secure register / login flow
- **Responsive dark UI** — works on desktop and mobile

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, Axios, CSS custom properties |
| **Backend** | Node.js 20, Express 4, express-validator, Helmet, Morgan |
| **Database** | MongoDB 7 + Mongoose ODM |
| **Auth** | JSON Web Tokens (JWT) + bcryptjs |
| **Deployment** | Docker + Docker Compose + Nginx (reverse proxy) |
| **Testing** | Jest + Supertest (backend) · React Testing Library (frontend) |

---

## 📁 Project Structure

```
AI-driven-recommendation-engine/
├── backend/
│   ├── server.js                  # Entry point
│   ├── src/
│   │   ├── app.js                 # Express app setup
│   │   ├── config/
│   │   │   └── database.js        # MongoDB connection
│   │   ├── models/
│   │   │   ├── User.js            # User schema (auth, preferences, history)
│   │   │   ├── Content.js         # Content schema with engagement metrics
│   │   │   └── Interaction.js     # User-content interaction schema
│   │   ├── routes/
│   │   │   ├── auth.js            # /api/auth
│   │   │   ├── content.js         # /api/content
│   │   │   ├── interactions.js    # /api/interactions
│   │   │   ├── recommendations.js # /api/recommendations
│   │   │   └── users.js           # /api/users
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT protect + adminOnly
│   │   ├── services/
│   │   │   └── recommendationService.js  # Core AI engine
│   │   └── scripts/
│   │       └── seed.js            # Database seeder (20 articles + demo users)
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js                 # Routes + providers
│   │   ├── index.js               # React entry
│   │   ├── index.css              # Global styles & design tokens
│   │   ├── context/
│   │   │   └── AuthContext.js     # Auth state + login/register/logout
│   │   ├── services/
│   │   │   └── api.js             # Axios instance with JWT interceptor
│   │   ├── hooks/
│   │   │   └── useFetch.js        # Generic data-fetching hook
│   │   ├── components/
│   │   │   ├── layout/Navbar.js
│   │   │   ├── content/ContentCard.js
│   │   │   └── common/StarRating.js
│   │   └── pages/
│   │       ├── HomePage.js        # Trending + personalised recs
│   │       ├── BrowsePage.js      # Search + category filter + pagination
│   │       ├── ContentDetailPage.js  # Article view + interactions + similar
│   │       ├── LoginPage.js
│   │       ├── RegisterPage.js    # Includes interest selection
│   │       └── ProfilePage.js     # Edit preferences & tags
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start

### Option 1 — Docker (recommended)

```bash
# 1. Clone the repo
git clone https://github.com/Vans30m/AI-driven-recommendation-engine.git
cd AI-driven-recommendation-engine

# 2. Start all services (MongoDB + backend + frontend)
docker-compose up --build

# 3. Seed the database (in a new terminal)
docker exec recommendation_backend npm run seed

# 4. Open the app
open http://localhost:3000
```

### Option 2 — Local Development

**Prerequisites:** Node.js 18+, MongoDB 6+ running locally

```bash
# Backend
cd backend
cp .env.example .env          # Edit .env if needed
npm install
npm run seed                  # Populate demo data
npm run dev                   # Starts on http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
npm start                     # Starts on http://localhost:3000
```

### Running Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login and receive JWT |
| GET | `/api/auth/me` | Yes | Get current user |

### Content
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/content` | No | List / search content (`?search=`, `?category=`, `?page=`) |
| GET | `/api/content/:id` | No | Get single content item |
| POST | `/api/content` | Admin | Create new content |
| PUT | `/api/content/:id` | Admin | Update content |
| DELETE | `/api/content/:id` | Admin | Unpublish content |

### Recommendations
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/recommendations` | Yes | Personalised recommendations |
| GET | `/api/recommendations/trending` | No | Trending content (7-day window) |
| GET | `/api/recommendations/similar/:id` | No | Similar items (content-based) |

### Interactions
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/interactions` | Yes | Record interaction (view/like/dislike/share/bookmark/rate) |
| GET | `/api/interactions/me` | Yes | Get own interaction history |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/profile` | Yes | Get own profile |
| PUT | `/api/users/profile` | Yes | Update name / avatar |
| PUT | `/api/users/preferences` | Yes | Update category & tag preferences |
| GET | `/api/users/history` | Yes | Get browsing history |

---

## 📅 Development Timeline

> **Total estimated time: ~15–18 days** for a solo developer

| Day | Milestone |
|---|---|
| **Day 1** | Project setup — repo, folder structure, `.env`, Docker Compose skeleton |
| **Day 2** | MongoDB schemas (User, Content, Interaction) + Mongoose connection |
| **Day 3** | Auth API — register, login, JWT middleware |
| **Day 4** | Content CRUD API (admin-only write, public read) + seed script |
| **Day 5** | Interaction tracking API (view, like, bookmark, share, rate) |
| **Day 6** | Recommendation service — content-based filtering + cosine similarity |
| **Day 7** | Recommendation service — collaborative filtering (user-user CF) |
| **Day 8** | Recommendation service — popularity scoring + hybrid blending |
| **Day 9** | React app scaffold — routing, AuthContext, Axios service, global CSS |
| **Day 10** | Navbar, ContentCard, HomePage (trending section) |
| **Day 11** | BrowsePage — search, category filter, pagination |
| **Day 12** | ContentDetailPage — article view, interaction bar, StarRating, similar content |
| **Day 13** | Login & Register pages (with interest selection on sign-up) |
| **Day 14** | ProfilePage — edit preferences, manage tags |
| **Day 15** | Unit & integration tests (backend + frontend) |
| **Day 16** | Docker builds + Nginx config + end-to-end testing |
| **Day 17** | Bug fixes, performance tuning, README polish |
| **Day 18** | *(Buffer)* Final review, optional cloud deployment |

---

## 🎓 Placement Advice

This is an **excellent placement portfolio project** because it demonstrates:

1. **Full-stack proficiency** — React + Node.js + MongoDB (the MERN stack is highly sought after in placements)
2. **AI/ML concepts** — collaborative filtering, cosine similarity, TF-IDF, temporal decay — you can talk through the algorithm in technical interviews with confidence
3. **Software engineering best practices** — JWT authentication, input validation, rate limiting, structured error handling, modular architecture
4. **System design** — the three-layer recommendation architecture is a great whiteboard discussion topic
5. **Docker / DevOps** — containerised deployment shows operational maturity beyond just writing code

**How to present it in interviews:**
- Walk through the recommendation algorithm diagram — explain *why* you chose a hybrid approach ("pure collaborative filtering fails for new users with no history, so I added content-based + popularity to handle cold-start")
- Mention the implicit feedback scoring table — shows you thought about data quality
- Highlight the temporal decay function — demonstrates understanding of real-world data characteristics
