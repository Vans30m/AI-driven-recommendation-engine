/**
 * AI Recommendation Service
 *
 * Implements a hybrid recommendation system combining:
 *  1. Content-Based Filtering  — matches content features to user preferences & history
 *  2. Collaborative Filtering  — finds users with similar taste (user-user CF)
 *  3. Popularity Boost         — surfaces trending content for cold-start situations
 *
 * All three scores are blended with configurable weights to produce a final
 * ranked list of recommended content items.
 */

const Interaction = require('../models/Interaction');
const Content = require('../models/Content');
const User = require('../models/User');

// ─── Weights ────────────────────────────────────────────────────────────────
const WEIGHTS = {
  contentBased: 0.45,
  collaborative: 0.35,
  popularity: 0.20,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Compute cosine similarity between two score-maps.
 * @param {Map<string,number>} vecA
 * @param {Map<string,number>} vecB
 * @returns {number} similarity in [0, 1]
 */
function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [key, valA] of vecA) {
    normA += valA * valA;
    if (vecB.has(key)) {
      dot += valA * vecB.get(key);
    }
  }
  for (const [, valB] of vecB) {
    normB += valB * valB;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Build a TF-IDF-like term-frequency vector from a content document.
 * @param {object} content  Mongoose Content document
 * @returns {Map<string,number>}
 */
function buildContentVector(content) {
  const vec = new Map();

  const addTerm = (term, weight) => {
    const t = term.toLowerCase().trim();
    if (!t) return;
    vec.set(t, (vec.get(t) || 0) + weight);
  };

  // Category carries the most weight
  addTerm(content.category, 3);

  // Tags
  (content.tags || []).forEach((tag) => addTerm(tag, 2));

  // Title words
  (content.title || '').split(/\W+/).filter(Boolean).forEach((w) => addTerm(w, 1));

  // Description words (lower weight; only first 100 words)
  (content.description || '')
    .split(/\W+/)
    .slice(0, 100)
    .filter(Boolean)
    .forEach((w) => addTerm(w, 0.5));

  return vec;
}

/**
 * Build a preference vector for a user from their interactions & profile.
 * @param {string} userId
 * @returns {Promise<Map<string,number>>}
 */
async function buildUserVector(userId) {
  const vec = new Map();

  // Pull user preferences
  const user = await User.findById(userId).select('preferences');
  if (user) {
    (user.preferences.categories || []).forEach((cat) => {
      vec.set(cat, (vec.get(cat) || 0) + 5);
    });
    (user.preferences.tags || []).forEach((tag) => {
      vec.set(tag.toLowerCase(), (vec.get(tag.toLowerCase()) || 0) + 3);
    });
  }

  // Weight by past interactions (recent interactions matter more)
  const interactions = await Interaction.find({ user: userId })
    .populate('content', 'category tags title')
    .sort({ createdAt: -1 })
    .limit(100);

  const now = Date.now();
  interactions.forEach((interaction) => {
    if (!interaction.content) return;
    const { content, score, createdAt } = interaction;

    // Temporal decay: half-life of 30 days
    const ageInDays = (now - new Date(createdAt).getTime()) / 86_400_000;
    const decay = Math.exp(-0.023 * ageInDays); // ln(2)/30 ≈ 0.023

    const weight = score * decay;

    // Category signal
    const cat = content.category;
    if (cat) vec.set(cat, (vec.get(cat) || 0) + weight * 3);

    // Tag signals
    (content.tags || []).forEach((tag) => {
      const t = tag.toLowerCase();
      vec.set(t, (vec.get(t) || 0) + weight * 2);
    });

    // Title word signals
    (content.title || '')
      .split(/\W+/)
      .filter(Boolean)
      .forEach((w) => {
        const t = w.toLowerCase();
        vec.set(t, (vec.get(t) || 0) + weight * 0.5);
      });
  });

  return vec;
}

// ─── 1. Content-Based Filtering ─────────────────────────────────────────────

async function getContentBasedScores(userId, candidateIds) {
  const userVec = await buildUserVector(userId);
  if (userVec.size === 0) return {};

  const contents = await Content.find({ _id: { $in: candidateIds } });
  const scores = {};

  contents.forEach((content) => {
    const contentVec = buildContentVector(content);
    scores[content._id.toString()] = cosineSimilarity(userVec, contentVec);
  });

  return scores;
}

// ─── 2. Collaborative Filtering (User-User) ─────────────────────────────────

async function getCollaborativeScores(userId, candidateIds) {
  // Get target user's interaction history
  const myInteractions = await Interaction.find({ user: userId }).select('content score');
  const myRatings = new Map(myInteractions.map((i) => [i.content.toString(), i.score]));

  if (myRatings.size === 0) return {};

  // Find users who interacted with at least 2 of the same items
  const commonContentIds = [...myRatings.keys()];
  const otherInteractions = await Interaction.find({
    user: { $ne: userId },
    content: { $in: commonContentIds },
  }).select('user content score');

  // Group by user
  const userGroups = {};
  otherInteractions.forEach(({ user, content, score }) => {
    const uid = user.toString();
    if (!userGroups[uid]) userGroups[uid] = new Map();
    userGroups[uid].set(content.toString(), score);
  });

  // Compute Pearson-like similarity with each neighbour
  const neighbours = [];
  Object.entries(userGroups).forEach(([uid, theirRatings]) => {
    // Need at least 2 items in common
    const commonItems = [...myRatings.keys()].filter((id) => theirRatings.has(id));
    if (commonItems.length < 2) return;

    let dot = 0;
    let normA = 0;
    let normB = 0;
    commonItems.forEach((id) => {
      const a = myRatings.get(id);
      const b = theirRatings.get(id);
      dot += a * b;
      normA += a * a;
      normB += b * b;
    });
    const sim = (Math.sqrt(normA) * Math.sqrt(normB)) === 0
      ? 0
      : dot / (Math.sqrt(normA) * Math.sqrt(normB));

    if (sim > 0) {
      neighbours.push({ uid, theirRatings, sim });
    }
  });

  if (neighbours.length === 0) return {};

  // Sort by similarity, take top 20
  neighbours.sort((a, b) => b.sim - a.sim);
  const topNeighbours = neighbours.slice(0, 20);

  // Predict scores for candidate content items
  const candidateSet = new Set(candidateIds.map(String));
  const scores = {};

  // Fetch neighbour interactions for candidate items
  const neighbourIds = topNeighbours.map((n) => n.uid);
  const candidateInteractions = await Interaction.find({
    user: { $in: neighbourIds },
    content: { $in: candidateIds },
  }).select('user content score');

  // Group by content
  const contentRatingsByUser = {};
  candidateInteractions.forEach(({ user, content, score }) => {
    const cid = content.toString();
    if (!contentRatingsByUser[cid]) contentRatingsByUser[cid] = [];
    contentRatingsByUser[cid].push({ uid: user.toString(), score });
  });

  candidateIds.forEach((cid) => {
    const cidStr = cid.toString();
    if (!candidateSet.has(cidStr) || !contentRatingsByUser[cidStr]) {
      scores[cidStr] = 0;
      return;
    }

    let weightedSum = 0;
    let simSum = 0;
    contentRatingsByUser[cidStr].forEach(({ uid, score }) => {
      const neighbour = topNeighbours.find((n) => n.uid === uid);
      if (neighbour) {
        weightedSum += neighbour.sim * score;
        simSum += Math.abs(neighbour.sim);
      }
    });

    scores[cidStr] = simSum === 0 ? 0 : weightedSum / simSum;
  });

  return scores;
}

// ─── 3. Popularity Scoring ───────────────────────────────────────────────────

async function getPopularityScores(candidateIds) {
  const contents = await Content.find({ _id: { $in: candidateIds } }).select(
    'viewCount likeCount shareCount'
  );

  const scores = {};
  let maxScore = 1;

  contents.forEach((c) => {
    // Wilson score-style popularity (weights: view=1, like=3, share=4)
    const raw = c.viewCount + c.likeCount * 3 + c.shareCount * 4;
    scores[c._id.toString()] = raw;
    if (raw > maxScore) maxScore = raw;
  });

  // Normalise to [0, 1]
  Object.keys(scores).forEach((id) => {
    scores[id] = scores[id] / maxScore;
  });

  return scores;
}

// ─── Normalise a score map to [0, 1] ─────────────────────────────────────────

function normalise(scores) {
  const values = Object.values(scores);
  if (values.length === 0) return scores;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const result = {};
  Object.entries(scores).forEach(([k, v]) => {
    result[k] = (v - min) / range;
  });
  return result;
}

// ─── Main Public API ─────────────────────────────────────────────────────────

/**
 * Generate personalised content recommendations for a user.
 *
 * @param {string} userId
 * @param {object} options
 * @param {number} [options.limit=20]         Number of items to return
 * @param {string} [options.category]         Filter by category
 * @param {boolean} [options.excludeSeen=true] Exclude already-viewed content
 * @returns {Promise<Array>} Ranked content documents
 */
async function getRecommendations(userId, options = {}) {
  const { limit = 20, category, excludeSeen = true } = options;

  // Build exclusion list
  const exclude = [];
  if (excludeSeen) {
    const seen = await Interaction.find({ user: userId, type: 'view' }).select('content');
    seen.forEach((i) => exclude.push(i.content));
  }

  // Fetch candidate pool (published content, optionally filtered by category)
  const query = { isPublished: true };
  if (exclude.length > 0) query._id = { $nin: exclude };
  if (category) query.category = category;

  const candidates = await Content.find(query)
    .select('_id category tags title description viewCount likeCount shareCount')
    .sort({ publishedAt: -1 })
    .limit(200); // limit candidate pool for performance

  if (candidates.length === 0) return [];

  const candidateIds = candidates.map((c) => c._id);

  // Run all three scorers in parallel
  const [cbScores, cfScores, popScores] = await Promise.all([
    getContentBasedScores(userId, candidateIds),
    getCollaborativeScores(userId, candidateIds),
    getPopularityScores(candidateIds),
  ]);

  // Normalise each score set
  const normCB = normalise(cbScores);
  const normCF = normalise(cfScores);
  // popScores already normalised

  // Blend scores
  const finalScores = {};
  candidateIds.forEach((cid) => {
    const key = cid.toString();
    finalScores[key] =
      WEIGHTS.contentBased * (normCB[key] || 0) +
      WEIGHTS.collaborative * (normCF[key] || 0) +
      WEIGHTS.popularity * (popScores[key] || 0);
  });

  // Sort candidates by final score (descending)
  const ranked = candidates
    .slice()
    .sort((a, b) => (finalScores[b._id.toString()] || 0) - (finalScores[a._id.toString()] || 0))
    .slice(0, limit);

  // Attach recommendation score to each item (useful for debugging)
  return ranked.map((c) => ({
    ...c.toObject(),
    recommendationScore: parseFloat((finalScores[c._id.toString()] || 0).toFixed(4)),
  }));
}

/**
 * Get trending content (category-aware, no personalisation).
 */
async function getTrending(options = {}) {
  const { limit = 10, category } = options;
  const query = { isPublished: true };
  if (category) query.category = category;

  // Trending = highest engagement in the last 7 days
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentInteractions = await Interaction.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: '$content', totalScore: { $sum: '$score' } } },
    { $sort: { totalScore: -1 } },
    { $limit: limit * 3 },
  ]);

  if (recentInteractions.length === 0) {
    return Content.find(query).sort({ viewCount: -1 }).limit(limit);
  }

  const contentIds = recentInteractions.map((r) => r._id);
  const contents = await Content.find({ ...query, _id: { $in: contentIds } });

  // Re-order by interaction score
  const scoreMap = new Map(recentInteractions.map((r) => [r._id.toString(), r.totalScore]));
  return contents
    .sort((a, b) => (scoreMap.get(b._id.toString()) || 0) - (scoreMap.get(a._id.toString()) || 0))
    .slice(0, limit);
}

/**
 * Get content similar to a given item (item-item content-based).
 */
async function getSimilarContent(contentId, options = {}) {
  const { limit = 10 } = options;

  const source = await Content.findById(contentId);
  if (!source) return [];

  const sourceVec = buildContentVector(source);

  const candidates = await Content.find({
    isPublished: true,
    _id: { $ne: contentId },
    category: source.category,
  }).limit(100);

  const scored = candidates.map((c) => ({
    ...c.toObject(),
    similarity: cosineSimilarity(sourceVec, buildContentVector(c)),
  }));

  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}

module.exports = { getRecommendations, getTrending, getSimilarContent };
