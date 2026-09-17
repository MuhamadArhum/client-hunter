const { app, request, registerAndLogin } = require('./helpers');

describe('Settings / Integrations API', () => {
  let token;

  beforeEach(async () => {
    token = (await registerAndLogin({ email: 'settingsuser@test.com' })).token;
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/settings/integrations');
    expect(res.status).toBe(401);
  });

  it('reports integrations as unconfigured by default', async () => {
    const res = await request(app)
      .get('/api/settings/integrations')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.RESEND_API_KEY.configured).toBe(false);
  });

  it('saves a sensitive key and masks it on read', async () => {
    const putRes = await request(app)
      .put('/api/settings/integrations')
      .set('Authorization', `Bearer ${token}`)
      .send({ RESEND_API_KEY: 're_1234567890ABCDEF' });
    expect(putRes.status).toBe(200);
    expect(putRes.body.updated).toContain('RESEND_API_KEY');

    const getRes = await request(app)
      .get('/api/settings/integrations')
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.body.data.RESEND_API_KEY.configured).toBe(true);
    expect(getRes.body.data.RESEND_API_KEY.displayValue).toBe('••••CDEF');
    expect(getRes.body.data.RESEND_API_KEY.displayValue).not.toContain('re_1234567890');
  });

  it('does not mask non-sensitive keys', async () => {
    await request(app)
      .put('/api/settings/integrations')
      .set('Authorization', `Bearer ${token}`)
      .send({ EMAIL_FROM: 'hello@company.com' });

    const getRes = await request(app)
      .get('/api/settings/integrations')
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.body.data.EMAIL_FROM.displayValue).toBe('hello@company.com');
  });

  it('ignores keys that are not on the allowed list', async () => {
    const res = await request(app)
      .put('/api/settings/integrations')
      .set('Authorization', `Bearer ${token}`)
      .send({ NOT_A_REAL_KEY: 'malicious', JWT_SECRET: 'attempt-override' });
    expect(res.status).toBe(200);
    expect(res.body.updated).toEqual([]);
  });
});
