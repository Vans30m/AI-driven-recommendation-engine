/**
 * Tests for the recommendation service (pure logic, no DB required).
 */
const recommendationService = require('../services/recommendationService');

// We test the internal helper functions by exporting them or by verifying
// module-level behaviour. Since the module uses mongoose, we mock it.

jest.mock('../models/Interaction', () => ({
  find: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
    select: jest.fn().mockResolvedValue([]),
  }),
  aggregate: jest.fn().mockResolvedValue([]),
  findOneAndUpdate: jest.fn().mockResolvedValue({}),
}));

jest.mock('../models/Content', () => ({
  find: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
  }),
  findById: jest.fn().mockResolvedValue(null),
}));

jest.mock('../models/User', () => ({
  findById: jest.fn().mockReturnValue({
    select: jest.fn().mockResolvedValue({ preferences: { categories: [], tags: [] } }),
  }),
}));

describe('RecommendationService', () => {
  describe('getRecommendations()', () => {
    it('returns an empty array when no candidates exist', async () => {
      const result = await recommendationService.getRecommendations('user123', { limit: 10 });
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('getTrending()', () => {
    it('returns an array', async () => {
      const result = await recommendationService.getTrending({ limit: 5 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getSimilarContent()', () => {
    it('returns an empty array when source content does not exist', async () => {
      const result = await recommendationService.getSimilarContent('nonexistent_id', { limit: 5 });
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });
});
