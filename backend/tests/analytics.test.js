const { app, request, registerAndLogin } = require('./helpers');
const Lead = require('../src/models/Lead');
const Proposal = require('../src/models/Proposal');
const OutreachLog = require('../src/models/OutreachLog');

describe('Analytics API', () => {
  let token;

  beforeEach(async () => {
    const auth = await registerAndLogin({ email: 'analyticsuser@test.com' });
    token = auth.token;
  });

  describe('GET /api/analytics/dashboard', () => {
    it('computes totals and conversion rate correctly from seeded data', async () => {
      await Lead.create({ companyName: 'Converted Co', status: 'converted' });
      await Lead.create({ companyName: 'New Co 1', status: 'new' });
      await Lead.create({ companyName: 'New Co 2', status: 'new' });
      await Lead.create({ companyName: 'Trashed Co', status: 'deleted' });

      const res = await request(app).get('/api/analytics/dashboard').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.totalLeads).toBe(3); // deleted excluded
      expect(res.body.data.conversionRate).toBeCloseTo(33.3, 1);
    });

    it('returns zero conversion rate (not NaN/Infinity) with no leads at all', async () => {
      const res = await request(app).get('/api/analytics/dashboard').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.totalLeads).toBe(0);
      expect(res.body.data.conversionRate).toBe(0);
    });
  });

  describe('GET /api/analytics/leads-by-source', () => {
    it('groups leads by source, excluding deleted', async () => {
      await Lead.create({ companyName: 'A', source: 'linkedin' });
      await Lead.create({ companyName: 'B', source: 'linkedin' });
      await Lead.create({ companyName: 'C', source: 'upwork' });
      await Lead.create({ companyName: 'D', source: 'linkedin', status: 'deleted' });

      const res = await request(app).get('/api/analytics/leads-by-source').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      const linkedin = res.body.data.find((d) => d._id === 'linkedin');
      expect(linkedin.count).toBe(2);
    });
  });

  describe('GET /api/analytics/conversion-by-source', () => {
    it('does not divide by zero / NaN when a source has leads but zero conversions', async () => {
      await Lead.create({ companyName: 'A', source: 'crunchbase', status: 'new' });
      const res = await request(app).get('/api/analytics/conversion-by-source').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      const crunchbase = res.body.data.find((d) => d.source === 'crunchbase');
      expect(crunchbase.conversionRate).toBe(0);
      expect(Number.isNaN(crunchbase.conversionRate)).toBe(false);
    });
  });

  describe('GET /api/analytics/outreach-stats', () => {
    it('counts sent/failed for email and whatsapp separately', async () => {
      const lead = await Lead.create({ companyName: 'Outreach Stats Co' });
      await OutreachLog.create({ lead: lead._id, type: 'email', message: 'm', status: 'sent' });
      await OutreachLog.create({ lead: lead._id, type: 'email', message: 'm', status: 'failed' });
      await OutreachLog.create({ lead: lead._id, type: 'whatsapp', message: 'm', status: 'sent' });

      const res = await request(app).get('/api/analytics/outreach-stats').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ emailSent: 1, emailFailed: 1, whatsappSent: 1, whatsappFailed: 0 });
    });
  });

  describe('GET /api/analytics/export/csv', () => {
    it('returns a metrics-summary CSV reflecting seeded counts', async () => {
      await Lead.create({ companyName: 'A', status: 'converted' });
      await Lead.create({ companyName: 'B', status: 'new' });
      const res = await request(app).get('/api/analytics/export/csv').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.text).toContain('"Total Leads","2"');
      expect(res.text).toContain('"Conversion Rate (%)","50.0"');
    });
  });

  describe('Auth requirement', () => {
    it('rejects analytics endpoints without a token', async () => {
      const res = await request(app).get('/api/analytics/dashboard');
      expect(res.status).toBe(401);
    });
  });
});
