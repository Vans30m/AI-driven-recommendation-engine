const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['view', 'like', 'dislike', 'share', 'bookmark', 'rate'],
    },
    // Rating value (1-5) — only used when type === 'rate'
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    // Time spent on content in seconds (for 'view')
    timeSpent: {
      type: Number,
      default: 0,
    },
    // Implicit score used by recommendation engine
    score: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

// Compound index — one record per user-content-type triplet
interactionSchema.index({ user: 1, content: 1, type: 1 }, { unique: true });
interactionSchema.index({ user: 1, createdAt: -1 });
interactionSchema.index({ content: 1 });

// Compute implicit score before saving
interactionSchema.pre('save', function (next) {
  const scoreMap = { view: 1, like: 3, dislike: -2, share: 4, bookmark: 3, rate: 0 };
  this.score = scoreMap[this.type] ?? 1;
  if (this.type === 'rate' && this.rating != null) {
    // Map 1-5 stars to -2..+4 range
    this.score = (this.rating - 3) * 2;
  }
  // Extra weight for time spent reading (capped at 5 minutes)
  if (this.type === 'view' && this.timeSpent > 0) {
    const minutes = Math.min(this.timeSpent / 60, 5);
    this.score += minutes * 0.5;
  }
  next();
});

module.exports = mongoose.model('Interaction', interactionSchema);
