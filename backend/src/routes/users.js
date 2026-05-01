const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// GET /api/users/profile
router.get('/profile', (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/users/profile — update name, avatar
router.put(
  '/profile',
  [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const updates = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.avatar !== undefined) updates.avatar = req.body.avatar;

      const user = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true,
      });
      res.json({ user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PUT /api/users/preferences — update category/tag preferences
router.put(
  '/preferences',
  [
    body('categories')
      .optional()
      .isArray()
      .withMessage('Categories must be an array'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const preferences = {};
      if (req.body.categories) preferences['preferences.categories'] = req.body.categories;
      if (req.body.tags) preferences['preferences.tags'] = req.body.tags;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: preferences },
        { new: true, runValidators: true }
      );
      res.json({ user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/users/history — browsing history
router.get('/history', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('browsingHistory')
      .populate('browsingHistory.content', 'title category imageUrl');
    res.json({ history: user.browsingHistory.reverse() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
