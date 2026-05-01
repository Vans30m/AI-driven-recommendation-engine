const express = require('express');
const { body, validationResult } = require('express-validator');
const Interaction = require('../models/Interaction');
const Content = require('../models/Content');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All interaction routes require authentication
router.use(protect);

// POST /api/interactions — record a user interaction
router.post(
  '/',
  [
    body('contentId').notEmpty().withMessage('contentId is required'),
    body('type')
      .isIn(['view', 'like', 'dislike', 'share', 'bookmark', 'rate'])
      .withMessage('Invalid interaction type'),
    body('rating')
      .optional()
      .isFloat({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('timeSpent').optional().isInt({ min: 0 }).withMessage('timeSpent must be a positive integer'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { contentId, type, rating, timeSpent } = req.body;

      // Verify content exists
      const content = await Content.findById(contentId);
      if (!content) return res.status(404).json({ error: 'Content not found' });

      // Upsert interaction
      const interaction = await Interaction.findOneAndUpdate(
        { user: req.user._id, content: contentId, type },
        { rating, timeSpent },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );

      // Update content counters
      const counterMap = { like: 'likeCount', share: 'shareCount' };
      if (counterMap[type]) {
        await Content.findByIdAndUpdate(contentId, { $inc: { [counterMap[type]]: 1 } });
      }

      // Add to user browsing history on 'view'
      if (type === 'view') {
        await User.findByIdAndUpdate(req.user._id, {
          $push: {
            browsingHistory: {
              $each: [{ content: contentId }],
              $slice: -50, // Keep last 50 items
            },
          },
        });
      }

      res.status(201).json(interaction);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/interactions/me — get current user's interactions
router.get('/me', async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;

    const skip = (Number(page) - 1) * Number(limit);
    const [interactions, total] = await Promise.all([
      Interaction.find(filter)
        .populate('content', 'title category imageUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Interaction.countDocuments(filter),
    ]);

    res.json({ interactions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
