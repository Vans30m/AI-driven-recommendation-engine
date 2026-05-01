const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getRecommendations,
  getTrending,
  getSimilarContent,
} = require('../services/recommendationService');

const router = express.Router();

// GET /api/recommendations — personalised recommendations (requires auth)
router.get('/', protect, async (req, res) => {
  try {
    const { limit = 20, category, excludeSeen } = req.query;
    const recommendations = await getRecommendations(req.user._id, {
      limit: Number(limit),
      category,
      excludeSeen: excludeSeen !== 'false',
    });
    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendations/trending — trending content (no auth required)
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10, category } = req.query;
    const trending = await getTrending({ limit: Number(limit), category });
    res.json({ trending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendations/similar/:contentId — similar content
router.get('/similar/:contentId', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const similar = await getSimilarContent(req.params.contentId, { limit: Number(limit) });
    res.json({ similar });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
