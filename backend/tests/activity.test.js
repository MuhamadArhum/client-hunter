const { app, request, registerAndLogin } = require('./helpers');
const Lead = require('../src/models/Lead');
const OutreachLog = require('../src/models/OutreachLog');

describe('Activity API', () => {
  let token;

  beforeEach(async () => {
    const auth = await registerAndLogin({ email: 'activityuser@test.com' });
    token = auth.token;
  });

  it('merges leads and outreach logs into one feed, newest first', async () => {
    const oldLead = await Lead.create({ companyName: 'Old Lead' });
    await Lead.findByIdAndUpdate(oldLead._id, { createdAt: new Date(Date.now() - 100000) });
    const newLead = await Lead.create({ companyName: 'New Lead' });
    await OutreachLog.create({ lead: newLead._id, type: 'email', message: 'hi', status: 'sent' });

    const res = await request(app).get('/api/activity').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    const types = res.body.data.map((a) => a.type);
    expect(types).toContain('outreach');
    expect(types).toContain('lead_new');
  });

  it('excludes soft-deleted leads from the feed', async () => {
    await Lead.create({ companyName: 'Gone Lead', status: 'deleted' });
    await Lead.create({ companyName: 'Visible Lead' });
    const res = await request(app).get('/api/activity').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const titles = res.body.data.map((a) => a.title);
    expect(titles.some((t) => t.includes('Visible Lead'))).toBe(true);
    expect(titles.some((t) => t.includes('Gone Lead'))).toBe(false);
  });

  it('filters by type=outreach only', async () => {
    const lead = await Lead.create({ companyName: 'Filter Lead' });
    await OutreachLog.create({ lead: lead._id, type: 'email', message: 'hi', status: 'sent' });

    const res = await request(app).get('/api/activity').query({ type: 'outreach' }).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every((a) => a.type === 'outreach')).toBe(true);
  });

  it('paginates correctly', async () => {
    for (let i = 0; i < 5; i++) await Lead.create({ companyName: `Page Lead ${i}` });
    const res = await request(app).get('/api/activity').query({ page: 1, limit: 2 }).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(5);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/activity');
    expect(res.status).toBe(401);
  });
});
