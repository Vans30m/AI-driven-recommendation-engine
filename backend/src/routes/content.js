const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Content = require('../models/Content');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/content — list / search content
router.get('/', async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { isPublished: true };
    if (category) filter.category = category;

    if (search) {
      filter.$text = { $search: search };
    }

    const [items, total] = await Promise.all([
      Content.find(filter)
        .sort(search ? { score: { $meta: 'textScore' } } : { publishedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Content.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/content/:id
router.get('/:id', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content || !content.isPublished) {
      return res.status(404).json({ error: 'Content not found' });
    }
    // Increment view count
    content.viewCount += 1;
    await content.save();
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/content — create (admin only)
router.post(
  '/',
  protect,
  adminOnly,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const content = await Content.create(req.body);
      res.status(201).json(content);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PUT /api/content/:id — update (admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    // Whitelist updatable fields to prevent mass-assignment
    const { title, description, category, tags, author, imageUrl, url, isPublished } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = tags;
    if (author !== undefined) updates.author = author;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (url !== undefined) updates.url = url;
    if (isPublished !== undefined) updates.isPublished = isPublished;

    const content = await Content.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!content) return res.status(404).json({ error: 'Content not found' });
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/content/:id — soft delete (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      { isPublished: false },
      { new: true }
    );
    if (!content) return res.status(404).json({ error: 'Content not found' });
    res.json({ message: 'Content unpublished' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
