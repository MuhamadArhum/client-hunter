const jwt = require('jsonwebtoken');
const { app, request, registerAndLogin } = require('./helpers');

describe('Deep / Security Tests', () => {
  describe('NoSQL injection resistance', () => {
    it('does not allow $ne login bypass', async () => {
      await registerAndLogin({ email: 'inject@test.com', password: 'realpass1' });

      const res = await request(app).post('/api/auth/login').send({
        email: { $ne: null },
        password: { $ne: null },
      });

      // express-mongo-sanitize strips the operators; validator then rejects
      // the non-string email, so this must never return a valid token.
      expect(res.status).not.toBe(200);
      expect(res.body.token).toBeUndefined();
    });

    it('sanitizes $where / operator injection in lead search', async () => {
      const { token } = await registerAndLogin({ email: 'inject2@test.com' });
      const res = await request(app)
        .get('/api/leads')
        .query({ search: { $gt: '' } })
        .set('Authorization', `Bearer ${token}`);
      // Should not 500 - sanitized to a harmless string/query
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('JWT forgery / tampering', () => {
    it('rejects a token signed with the wrong secret', async () => {
      const forged = jwt.sign({ id: '64f000000000000000000000' }, 'wrong-secret', { expiresIn: '1h' });
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);
      expect(res.status).toBe(401);
    });

    it('rejects an expired token', async () => {
      const expired = jwt.sign({ id: '64f000000000000000000000' }, process.env.JWT_SECRET, { expiresIn: -10 });
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);
      expect(res.status).toBe(401);
    });

    it('rejects a token for a deleted/non-existent user', async () => {
      const fake = jwt.sign({ id: '64f000000000000000000000' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${fake}`);
      expect(res.status).toBe(401);
    });

    it('rejects malformed Authorization header formats', async () => {
      const variants = ['Bearer', 'Bearer ', 'Token abc.def.ghi', 'abc.def.ghi', ''];
      for (const header of variants) {
        const req = request(app).get('/api/auth/me');
        if (header) req.set('Authorization', header);
        const res = await req;
        expect(res.status).toBe(401);
      }
    });
  });

  describe('Payload size / input abuse', () => {
    it('rejects an oversized JSON body (> 5mb limit)', async () => {
      const { token } = await registerAndLogin({ email: 'bigpayload@test.com' });
      const bigString = 'x'.repeat(6 * 1024 * 1024); // 6mb > 5mb limit
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({ companyName: bigString });
      expect([413, 400]).toContain(res.status);
    }, 30000);

    it('rejects absurdly long companyName instead of crashing', async () => {
      const { token } = await registerAndLogin({ email: 'longname@test.com' });
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({ companyName: 'A'.repeat(500) });
      expect(res.status).toBe(422);
    });

    it('stores HTML/script content as inert data (no server crash / reflected execution)', async () => {
      const { token } = await registerAndLogin({ email: 'xss@test.com' });
      const payload = '<script>alert(1)</script>';
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({ companyName: payload, notes: payload });
      expect(res.status).toBe(201);
      // stored as plain text, not executed/stripped in a way that breaks JSON
      expect(res.body.data.companyName).toBe(payload);
    });

    it('handles deeply nested / garbage JSON without crashing the process', async () => {
      const { token } = await registerAndLogin({ email: 'garbage@test.com' });
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({ companyName: 'OK Co', extra: { a: { b: { c: { d: { e: 'deep' } } } } } });
      expect(res.status).toBe(201);
    });
  });

  describe('Auth guard sweep - every protected route rejects unauthenticated requests', () => {
    const protectedRoutes = [
      ['get', '/api/leads'],
      ['post', '/api/leads'],
      ['get', '/api/proposals'],
      ['post', '/api/proposals/generate'],
      ['get', '/api/outreach'],
      ['post', '/api/outreach/email'],
      ['get', '/api/analytics/dashboard'],
      ['get', '/api/templates'],
      ['post', '/api/templates'],
      ['get', '/api/sequences'],
      ['post', '/api/sequences'],
      ['get', '/api/activity'],
      ['get', '/api/settings/integrations'],
      ['post', '/api/apollo/search'],
      ['post', '/api/chat'],
      ['get', '/api/auth/me'],
    ];

    it.each(protectedRoutes)('%s %s returns 401 without a token', async (method, path) => {
      const res = await request(app)[method](path).send({});
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Unknown routes / method mismatches', () => {
    it('returns 404 for a completely unknown route', async () => {
      const res = await request(app).get('/api/this-does-not-exist-at-all');
      expect(res.status).toBe(404);
    });

    it('returns 404 for a wrong HTTP method on a real path prefix (no route match)', async () => {
      const res = await request(app).patch('/api/health');
      expect(res.status).toBe(404);
    });
  });

  describe('Concurrency / race conditions', () => {
    it('only allows one winner when registering the same email in parallel', async () => {
      const email = 'race@test.com';
      const attempts = Array.from({ length: 8 }, () =>
        request(app).post('/api/auth/register').send({ name: 'Racer', email, password: 'password123' })
      );
      const results = await Promise.all(attempts);
      const successes = results.filter((r) => r.status === 201);
      expect(successes.length).toBe(1);
    }, 30000);

    it('handles many concurrent lead creations for the same user without data loss', async () => {
      const { token } = await registerAndLogin({ email: 'concurrent@test.com' });
      const N = 25;
      const attempts = Array.from({ length: N }, (_, i) =>
        request(app)
          .post('/api/leads')
          .set('Authorization', `Bearer ${token}`)
          .send({ companyName: `Concurrent Co ${i}` })
      );
      const results = await Promise.all(attempts);
      expect(results.every((r) => r.status === 201)).toBe(true);

      const listRes = await request(app).get('/api/leads?limit=100').set('Authorization', `Bearer ${token}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBe(N);
    }, 30000);
  });

  describe('ID / type confusion', () => {
    it('rejects a numeric id where a Mongo ObjectId is expected', async () => {
      const { token } = await registerAndLogin({ email: 'idconfuse@test.com' });
      const res = await request(app)
        .get('/api/leads/12345')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(422);
    });

    it('rejects an array where a string id is expected', async () => {
      const { token } = await registerAndLogin({ email: 'idconfuse2@test.com' });
      const res = await request(app)
        .get('/api/leads/507f1f77bcf86cd799439011,507f1f77bcf86cd799439012')
        .set('Authorization', `Bearer ${token}`);
      expect([422, 404]).toContain(res.status);
    });
  });
});
