const { app, request, registerAndLogin } = require('./helpers');

describe('Templates API', () => {
  let tokenA, tokenB;

  beforeEach(async () => {
    tokenA = (await registerAndLogin({ email: 'templateA@test.com' })).token;
    tokenB = (await registerAndLogin({ email: 'templateB@test.com' })).token;
  });

  it('creates a template', async () => {
    const res = await request(app)
      .post('/api/templates')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Cold Intro', subject: 'Hello', body: 'Hi there', category: 'cold-outreach' });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Cold Intro');
  });

  it('only returns templates belonging to the requesting user', async () => {
    await request(app).post('/api/templates').set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'A Template', subject: 'S', body: 'B' });
    await request(app).post('/api/templates').set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'B Template', subject: 'S', body: 'B' });

    const res = await request(app).get('/api/templates').set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('A Template');
  });

  it('prevents a user from updating another user\'s template', async () => {
    const created = await request(app).post('/api/templates').set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Mine', subject: 'S', body: 'B' });
    const id = created.body.data._id;

    const res = await request(app)
      .put(`/api/templates/${id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Hijacked' });
    expect(res.status).toBe(404);
  });

  it('increments usage count on use', async () => {
    const created = await request(app).post('/api/templates').set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Usable', subject: 'S', body: 'B' });
    const id = created.body.data._id;

    const res = await request(app).post(`/api/templates/${id}/use`).set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.data.usageCount).toBe(1);
  });

  it('deletes a template', async () => {
    const created = await request(app).post('/api/templates').set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'ToDelete', subject: 'S', body: 'B' });
    const id = created.body.data._id;

    const res = await request(app).delete(`/api/templates/${id}`).set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);

    const listRes = await request(app).get('/api/templates').set('Authorization', `Bearer ${tokenA}`);
    expect(listRes.body.data.length).toBe(0);
  });
});
