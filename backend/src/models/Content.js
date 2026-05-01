const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'technology', 'science', 'sports', 'entertainment',
        'politics', 'health', 'business', 'education',
        'travel', 'food', 'lifestyle', 'art',
      ],
    },
    tags: {
      type: [String],
      default: [],
    },
    author: {
      type: String,
      default: 'Editorial Team',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      default: '',
    },
    // Engagement metrics
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    // TF-IDF feature vector (pre-computed for recommendation)
    featureVector: {
      type: Map,
      of: Number,
      default: {},
    },
    isPublished: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Text index for full-text search
contentSchema.index({ title: 'text', description: 'text', tags: 'text' });
contentSchema.index({ category: 1 });
contentSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('Content', contentSchema);
