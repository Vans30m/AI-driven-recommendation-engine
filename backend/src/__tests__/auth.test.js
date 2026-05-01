/**
 * Integration tests for auth routes using supertest and an in-memory MongoDB.
 * We mock mongoose to avoid needing a live DB in CI.
 */

const request = require('supertest');
const app = require('../app');

// Mock the User model
jest.mock('../models/User', () => {
  const mockUser = {
    _id: 'mockUserId',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    preferences: { categories: [], tags: [] },
    comparePassword: jest.fn().mockResolvedValue(true),
    toJSON: function () { return { ...this, password: undefined }; },
  };

  const MockUser = jest.fn().mockImplementation(() => mockUser);
  MockUser.findOne = jest.fn();
  MockUser.findById = jest.fn().mockResolvedValue(mockUser);
  MockUser.create = jest.fn().mockResolvedValue(mockUser);
  return MockUser;
});

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('returns 400 if name is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'a@b.com', password: 'pass123' });
      expect(res.status).toBe(400);
    });

    it('returns 400 if email is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Alice', email: 'not-an-email', password: 'pass123' });
      expect(res.status).toBe(400);
    });

    it('returns 400 if password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Alice', email: 'alice@example.com', password: '123' });
      expect(res.status).toBe(400);
    });

    it('returns 409 if email is already registered', async () => {
      const User = require('../models/User');
      User.findOne.mockResolvedValueOnce({ email: 'alice@example.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Alice', email: 'alice@example.com', password: 'pass123' });
      expect(res.status).toBe(409);
    });

    it('returns 201 with token on success', async () => {
      const User = require('../models/User');
      User.findOne.mockResolvedValueOnce(null); // no existing user

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Alice', email: 'alice@example.com', password: 'pass123' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'pass123' });
      expect(res.status).toBe(400);
    });

    it('returns 401 if credentials are wrong', async () => {
      const User = require('../models/User');
      // findOne returns null → invalid credentials
      User.findOne.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrongpass' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
