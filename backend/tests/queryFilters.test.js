const { app, request, registerAndLogin } = require('./helpers');
const Lead = require('../src/models/Lead');
const Proposal = require('../src/models/Proposal');
const OutreachLog = require('../src/models/OutreachLog');

describe('List/filter endpoints - deeper coverage', () => {
  let token;

  beforeEach(async () => {
    const auth = await registerAndLogin({ email: 'filteruser@test.com' });
    token = auth.token;
  });

  describe('GET /api/proposals', () => {
    it('filters by status', async () => {
      const lead = await Lead.create({ companyName: 'Filter Prop Co' });
      await Proposal.create({ lead: lead._id, title: 'Draft One', content: 'C', status: 'draft' });
      await Proposal.create({ lead: lead._id, title: 'Sent One', content: 'C', status: 'sent' });

      const res = await request(app).get('/api/proposals').query({ status: 'sent' }).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Sent One');
    });

    it('filters by leadId', async () => {
      const leadA = await Lead.create({ companyName: 'Lead A' });
      const leadB = await Lead.create({ companyName: 'Lead B' });
      await Proposal.create({ lead: leadA._id, title: 'For A', content: 'C' });
      await Proposal.create({ lead: leadB._id, title: 'For B', content: 'C' });

      const res = await request(app).get('/api/proposals').query({ leadId: leadA._id.toString() }).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('For A');
    });

    it('filters by dateFrom/dateTo range', async () => {
      const lead = await Lead.create({ companyName: 'Date Range Co' });
      const oldProp = await Proposal.create({ lead: lead._id, title: 'Old', content: 'C' });
      await Proposal.collection.updateOne({ _id: oldProp._id }, { $set: { createdAt: new Date('2020-01-01') } });
      await Proposal.create({ lead: lead._id, title: 'Recent', content: 'C' });

      const res = await request(app)
        .get('/api/proposals')
        .query({ dateFrom: '2024-01-01' })
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      const titles = res.body.data.map((p) => p.title);
      expect(titles).toContain('Recent');
      expect(titles).not.toContain('Old');
    });

    it('paginates results', async () => {
      const lead = await Lead.create({ companyName: 'Paginate Prop Co' });
      for (let i = 0; i < 5; i++) await Proposal.create({ lead: lead._id, title: `Prop ${i}`, content: 'C' });

      const res = await request(app).get('/api/proposals').query({ page: 2, limit: 2 }).set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(5);
      expect(res.body.pagination.pages).toBe(3);
    });
  });

  describe('GET /api/outreach', () => {
    it('filters by type and status together', async () => {
      const lead = await Lead.create({ companyName: 'Outreach Filter Co' });
      await OutreachLog.create({ lead: lead._id, type: 'email', message: 'm', status: 'sent' });
      await OutreachLog.create({ lead: lead._id, type: 'email', message: 'm', status: 'failed' });
      await OutreachLog.create({ lead: lead._id, type: 'whatsapp', message: 'm', status: 'sent' });

      const res = await request(app)
        .get('/api/outreach')
        .query({ type: 'email', status: 'sent' })
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].type).toBe('email');
      expect(res.body.data[0].status).toBe('sent');
    });

    it('filters by leadId', async () => {
      const leadA = await Lead.create({ companyName: 'OA' });
      const leadB = await Lead.create({ companyName: 'OB' });
      await OutreachLog.create({ lead: leadA._id, type: 'email', message: 'm' });
      await OutreachLog.create({ lead: leadB._id, type: 'email', message: 'm' });

      const res = await request(app)
        .get('/api/outreach')
        .query({ leadId: leadA._id.toString() })
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('GET /api/outreach/history/:leadId', () => {
    it('returns only logs for the given lead, paginated', async () => {
      const leadA = await Lead.create({ companyName: 'History A' });
      const leadB = await Lead.create({ companyName: 'History B' });
      for (let i = 0; i < 3; i++) await OutreachLog.create({ lead: leadA._id, type: 'email', message: `m${i}` });
      await OutreachLog.create({ lead: leadB._id, type: 'email', message: 'other' });

      const res = await request(app)
        .get(`/api/outreach/history/${leadA._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.pagination.total).toBe(3);
    });

    it('404s for a non-existent lead', async () => {
      const res = await request(app)
        .get('/api/outreach/history/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/outreach/schedule', () => {
    it('schedules a follow-up and moves the lead to follow_up status', async () => {
      const lead = await Lead.create({ companyName: 'Schedule Co', status: 'contacted' });
      const res = await request(app)
        .post('/api/outreach/schedule')
        .set('Authorization', `Bearer ${token}`)
        .send({ leadId: lead._id.toString(), type: 'email', message: 'Reminder', scheduledAt: new Date(Date.now() + 86400000).toISOString() });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
      const updated = await Lead.findById(lead._id);
      expect(updated.status).toBe('follow_up');
    });

    it('rejects missing required fields', async () => {
      const res = await request(app)
        .post('/api/outreach/schedule')
        .set('Authorization', `Bearer ${token}`)
        .send({ leadId: '507f1f77bcf86cd799439011' });
      expect(res.status).toBe(400);
    });
  });
});
