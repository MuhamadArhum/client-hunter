// The app's rateLimiter middleware skips enforcement whenever NODE_ENV==='test'
// (see src/middleware/rateLimiter.js), which is what lets the rest of the suite
// hammer endpoints freely. That means real enforcement is never exercised by
// the normal test run. This file flips NODE_ENV before importing the
// middleware so the actual limiter logic gets verified directly, using a
// throwaway express app (no DB/app.js needed).
process.env.NODE_ENV = 'production';

const express = require('express');
const request = require('supertest');
const { authLimiter, apiLimiter } = require('../src/middleware/rateLimiter');

afterAll(() => {
  process.env.NODE_ENV = 'test';
});

describe('Rate limiter - real enforcement', () => {
  it('allows exactly 10 requests then blocks the 11th with 429 (auth limiter)', async () => {
    const app = express();
    app.use('/auth', authLimiter, (req, res) => res.json({ ok: true }));

    for (let i = 1; i <= 10; i++) {
      const res = await request(app).get('/auth');
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).get('/auth');
    expect(blocked.status).toBe(429);
    expect(blocked.body.success).toBe(false);
    expect(blocked.body.message).toMatch(/Too many authentication attempts/);
  }, 20000);

  it('allows exactly 100 requests then blocks the 101st with 429 (general API limiter)', async () => {
    const app = express();
    app.use('/api', apiLimiter, (req, res) => res.json({ ok: true }));

    for (let i = 1; i <= 100; i++) {
      const res = await request(app).get('/api');
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).get('/api');
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toMatch(/Too many requests/);
  }, 30000);

  it('tracks limits per-route independently (auth limit hit does not affect api limiter)', async () => {
    // Fresh instances so counts from the earlier tests in this file don't bleed in.
    jest.resetModules();
    const fresh = require('../src/middleware/rateLimiter');
    const app = express();
    app.use('/auth', fresh.authLimiter, (req, res) => res.json({ ok: true }));
    app.use('/api', fresh.apiLimiter, (req, res) => res.json({ ok: true }));

    for (let i = 1; i <= 10; i++) {
      await request(app).get('/auth');
    }
    const authBlocked = await request(app).get('/auth');
    expect(authBlocked.status).toBe(429);

    const apiRes = await request(app).get('/api');
    expect(apiRes.status).toBe(200);
  }, 20000);

  it('sets standard RateLimit-* headers so clients can back off correctly', async () => {
    const app = express();
    app.use('/auth', authLimiter, (req, res) => res.json({ ok: true }));

    const res = await request(app).get('/auth');
    expect(res.headers['ratelimit-limit']).toBeDefined();
    expect(res.headers['ratelimit-remaining']).toBeDefined();
  });
});
