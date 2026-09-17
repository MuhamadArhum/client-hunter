jest.mock('../src/services/emailService', () => ({ sendEmail: jest.fn() }));

const crypto = require('crypto');
const { app, request, registerAndLogin } = require('./helpers');
const User = require('../src/models/User');
const { sendEmail } = require('../src/services/emailService');

describe('Auth API - password reset & avatar (previously untested)', () => {
  beforeEach(() => {
    sendEmail.mockReset().mockResolvedValue({ id: 'msg_1' });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('generates a reset token and emails a reset link for a known user', async () => {
      await registerAndLogin({ email: 'forgot@test.com' });
      const res = await request(app).post('/api/auth/forgot-password').send({ email: 'forgot@test.com' });
      expect(res.status).toBe(200);
      expect(sendEmail).toHaveBeenCalledTimes(1);
      const html = sendEmail.mock.calls[0][0].html;
      expect(html).toContain('/reset-password/');

      const user = await User.findOne({ email: 'forgot@test.com' }).select('+resetPasswordToken +resetPasswordExpire');
      expect(user.resetPasswordToken).toBeTruthy();
      expect(user.resetPasswordExpire.getTime()).toBeGreaterThan(Date.now());
    });

    it('returns the same 200 response for an unknown email (no user enumeration)', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({ email: 'doesnotexist@test.com' });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/If that email exists/);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('clears the reset token and reports 500 if the email fails to send', async () => {
      sendEmail.mockRejectedValueOnce(new Error('SMTP down'));
      await registerAndLogin({ email: 'forgotfail@test.com' });
      const res = await request(app).post('/api/auth/forgot-password').send({ email: 'forgotfail@test.com' });
      expect(res.status).toBe(500);

      const user = await User.findOne({ email: 'forgotfail@test.com' }).select('+resetPasswordToken');
      expect(user.resetPasswordToken).toBeUndefined();
    });

    it('rejects an invalid email format', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({ email: 'not-an-email' });
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/auth/reset-password/:token', () => {
    const extractRawToken = () => sendEmail.mock.calls[0][0].html.match(/reset-password\/([a-f0-9]+)/)[1];

    it('resets the password with a valid, unexpired token and logs the user in', async () => {
      await registerAndLogin({ email: 'resetflow@test.com', password: 'oldpassword1' });
      await request(app).post('/api/auth/forgot-password').send({ email: 'resetflow@test.com' });
      const rawToken = extractRawToken();

      const res = await request(app)
        .post(`/api/auth/reset-password/${rawToken}`)
        .send({ password: 'brandnewpass1' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();

      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'resetflow@test.com', password: 'brandnewpass1',
      });
      expect(loginRes.status).toBe(200);
    });

    it('invalidates the token after a single use (cannot be replayed)', async () => {
      await registerAndLogin({ email: 'reuse@test.com', password: 'oldpassword1' });
      await request(app).post('/api/auth/forgot-password').send({ email: 'reuse@test.com' });
      const rawToken = extractRawToken();

      await request(app).post(`/api/auth/reset-password/${rawToken}`).send({ password: 'firstnewpass1' });
      const replay = await request(app).post(`/api/auth/reset-password/${rawToken}`).send({ password: 'secondnewpass1' });
      expect(replay.status).toBe(400);
    });

    it('rejects a garbage/guessed token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password/not-a-real-token')
        .send({ password: 'somepassword1' });
      expect(res.status).toBe(400);
    });

    it('rejects an expired token', async () => {
      await registerAndLogin({ email: 'expired@test.com' });
      await request(app).post('/api/auth/forgot-password').send({ email: 'expired@test.com' });
      const rawToken = extractRawToken();

      // Force-expire it directly in the DB.
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      await User.updateOne({ resetPasswordToken: hashedToken }, { resetPasswordExpire: new Date(Date.now() - 1000) });

      const res = await request(app)
        .post(`/api/auth/reset-password/${rawToken}`)
        .send({ password: 'somepassword1' });
      expect(res.status).toBe(400);
    });

    it('rejects a too-short new password (422 from validator)', async () => {
      await registerAndLogin({ email: 'shortreset@test.com' });
      await request(app).post('/api/auth/forgot-password').send({ email: 'shortreset@test.com' });
      const rawToken = extractRawToken();

      const res = await request(app).post(`/api/auth/reset-password/${rawToken}`).send({ password: '123' });
      expect(res.status).toBe(422);
    });
  });

  describe('PUT /api/auth/avatar', () => {
    it('accepts a valid base64 image under the size limit', async () => {
      const { token } = await registerAndLogin({ email: 'avataruser@test.com' });
      const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
      const res = await request(app)
        .put('/api/auth/avatar')
        .set('Authorization', `Bearer ${token}`)
        .send({ avatar: tinyPng });
      expect(res.status).toBe(200);
      expect(res.body.user.avatar).toBe(tinyPng);
    });

    it('rejects a non-image data URI', async () => {
      const { token } = await registerAndLogin({ email: 'avatarbad@test.com' });
      const res = await request(app)
        .put('/api/auth/avatar')
        .set('Authorization', `Bearer ${token}`)
        .send({ avatar: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==' });
      expect(res.status).toBe(400);
    });

    it('rejects an oversized avatar (> 1.5MB)', async () => {
      const { token } = await registerAndLogin({ email: 'avatarbig@test.com' });
      const huge = 'data:image/png;base64,' + 'A'.repeat(1.6 * 1024 * 1024);
      const res = await request(app)
        .put('/api/auth/avatar')
        .set('Authorization', `Bearer ${token}`)
        .send({ avatar: huge });
      expect(res.status).toBe(400);
    });

    it('rejects a plain string masquerading as a data URI prefix', async () => {
      const { token } = await registerAndLogin({ email: 'avatarfake@test.com' });
      const res = await request(app)
        .put('/api/auth/avatar')
        .set('Authorization', `Bearer ${token}`)
        .send({ avatar: 'javascript:alert(1)' });
      expect(res.status).toBe(400);
    });

    it('requires authentication', async () => {
      const res = await request(app).put('/api/auth/avatar').send({ avatar: 'data:image/png;base64,abc' });
      expect(res.status).toBe(401);
    });
  });
});
