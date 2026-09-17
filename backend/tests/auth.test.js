const { app, request, registerAndLogin } = require('./helpers');

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('registers a new user and returns a token', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Arhum',
        email: 'arhum@test.com',
        password: 'secret123',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('arhum@test.com');
      expect(res.body.user.role).toBe('agent');
      expect(res.body.user.password).toBeUndefined();
    });

    it('rejects duplicate email', async () => {
      await request(app).post('/api/auth/register').send({
        name: 'A', email: 'dupe@test.com', password: 'secret123',
      });
      const res = await request(app).post('/api/auth/register').send({
        name: 'B', email: 'dupe@test.com', password: 'secret123',
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid email format (422 from validator)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'A', email: 'not-an-email', password: 'secret123',
      });
      expect(res.status).toBe(422);
    });

    it('rejects short password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'A', email: 'short@test.com', password: '123',
      });
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with correct credentials', async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Login User', email: 'login@test.com', password: 'secret123',
      });
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@test.com', password: 'secret123',
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('rejects wrong password', async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Login User', email: 'login2@test.com', password: 'secret123',
      });
      const res = await request(app).post('/api/auth/login').send({
        email: 'login2@test.com', password: 'wrongpass',
      });
      expect(res.status).toBe(401);
    });

    it('rejects unknown email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nouser@test.com', password: 'whatever1',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the current user when authenticated', async () => {
      const { token, user } = await registerAndLogin({ email: 'me@test.com' });
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(user.email);
    });

    it('rejects requests with no token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('rejects requests with an invalid token', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer garbage.token.here');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('updates name and email', async () => {
      const { token } = await registerAndLogin({ email: 'update@test.com' });
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Updated Name');
    });

    it('rejects email already in use by another user', async () => {
      await registerAndLogin({ email: 'taken@test.com' });
      const { token } = await registerAndLogin({ email: 'other@test.com' });
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'taken@test.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/auth/password', () => {
    it('changes password with correct current password', async () => {
      const { token } = await registerAndLogin({ email: 'pwchange@test.com', password: 'oldpass1' });
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'oldpass1', newPassword: 'newpass1' });
      expect(res.status).toBe(200);

      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'pwchange@test.com', password: 'newpass1',
      });
      expect(loginRes.status).toBe(200);
    });

    it('rejects wrong current password', async () => {
      const { token } = await registerAndLogin({ email: 'pwchange2@test.com', password: 'oldpass1' });
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'wrongone', newPassword: 'newpass1' });
      expect(res.status).toBe(401);
    });
  });
});
