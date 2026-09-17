jest.mock('../src/services/aiAnalysisService', () => ({
  analyzeLead: jest.fn().mockResolvedValue({ aiScore: 5, aiQualification: 'warm' }),
  generateAutoReplyDraft: jest.fn().mockResolvedValue({ draft: 'Thanks, we will get back to you.' }),
}));
jest.mock('../src/services/slackService', () => ({
  notifyNewLead: jest.fn().mockResolvedValue(undefined),
  notifyLeadConverted: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/services/scraperService', () => ({
  scrapeUpwork: jest.fn(),
  scrapeLinkedIn: jest.fn(),
  scrapeFreelancer: jest.fn(),
  scrapeCrunchbase: jest.fn(),
  scrapeClutch: jest.fn(),
}));
jest.mock('../src/services/emailEnrichmentService', () => ({
  enrichLead: jest.fn(),
}));

const { app, request, registerAndLogin } = require('./helpers');
const Lead = require('../src/models/Lead');
const scraperService = require('../src/services/scraperService');
const { generateAutoReplyDraft } = require('../src/services/aiAnalysisService');
const { enrichLead } = require('../src/services/emailEnrichmentService');

describe('Leads API - extra endpoints', () => {
  let token;

  beforeEach(async () => {
    const auth = await registerAndLogin({ email: 'leadsextra@test.com' });
    token = auth.token;
    jest.clearAllMocks();
  });

  describe('POST /api/leads/scrape', () => {
    it('scrapes from upwork and inserts mapped leads', async () => {
      scraperService.scrapeUpwork.mockResolvedValueOnce([
        { companyName: 'Scraped Co 1' },
        { companyName: 'Scraped Co 2' },
      ]);
      const res = await request(app)
        .post('/api/leads/scrape')
        .set('Authorization', `Bearer ${token}`)
        .send({ source: 'upwork', query: 'web dev' });
      expect(res.status).toBe(201);
      expect(res.body.data.length).toBe(2);
      expect(await Lead.countDocuments({ source: 'upwork' })).toBe(2);
    });

    it('rejects an unknown source', async () => {
      const res = await request(app)
        .post('/api/leads/scrape')
        .set('Authorization', `Bearer ${token}`)
        .send({ source: 'not-a-real-source' });
      expect(res.status).toBe(400);
    });

    it('handles zero results without error', async () => {
      scraperService.scrapeLinkedIn.mockResolvedValueOnce([]);
      const res = await request(app)
        .post('/api/leads/scrape')
        .set('Authorization', `Bearer ${token}`)
        .send({ source: 'linkedin' });
      expect(res.status).toBe(201);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe('GET /api/leads/export/csv', () => {
    it('exports leads as CSV with correct headers and escaping', async () => {
      await Lead.create({ companyName: 'CSV "Quote" Co', status: 'new' });
      const res = await request(app).get('/api/leads/export/csv').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.text).toContain('Company,Contact,Email');
      expect(res.text).toContain('CSV ""Quote"" Co');
    });

    it('excludes deleted leads from export', async () => {
      await Lead.create({ companyName: 'Visible Export Co' });
      await Lead.create({ companyName: 'Deleted Export Co', status: 'deleted' });
      const res = await request(app).get('/api/leads/export/csv').set('Authorization', `Bearer ${token}`);
      expect(res.text).toContain('Visible Export Co');
      expect(res.text).not.toContain('Deleted Export Co');
    });
  });

  describe('POST /api/leads/import/csv', () => {
    it('imports valid rows and skips rows without a company name', async () => {
      const csvText = 'Company,Contact,Email\nImported Co,John Doe,john@co.com\n,Nobody,x@x.com';
      const res = await request(app)
        .post('/api/leads/import/csv')
        .set('Authorization', `Bearer ${token}`)
        .send({ csvText });
      expect(res.status).toBe(201);
      expect(res.body.count).toBe(1);
      const lead = await Lead.findOne({ companyName: 'Imported Co' });
      expect(lead.contactName).toBe('John Doe');
      expect(lead.source).toBe('manual');
    });

    it('rejects empty csvText', async () => {
      const res = await request(app)
        .post('/api/leads/import/csv')
        .set('Authorization', `Bearer ${token}`)
        .send({ csvText: '' });
      expect(res.status).toBe(400);
    });

    it('rejects a header-only CSV with no data rows', async () => {
      const res = await request(app)
        .post('/api/leads/import/csv')
        .set('Authorization', `Bearer ${token}`)
        .send({ csvText: 'Company,Contact,Email' });
      expect(res.status).toBe(400);
    });

    it('correctly parses a quoted field containing a comma', async () => {
      const csvText = 'Company,Description\n"Acme, Inc",Does great work';
      const res = await request(app)
        .post('/api/leads/import/csv')
        .set('Authorization', `Bearer ${token}`)
        .send({ csvText });
      expect(res.status).toBe(201);
      const lead = await Lead.findOne({ companyName: 'Acme, Inc' });
      expect(lead).not.toBeNull();
      expect(lead.description).toBe('Does great work');
    });

    // FINDING: the hand-rolled CSV parser toggles in/out of quote mode on every
    // `"` but never un-escapes a doubled `""` into a literal quote (the
    // standard CSV convention). A value like "Does ""great"" work" silently
    // loses its embedded quote characters instead of preserving them.
    it('[FINDING] silently drops embedded escaped quotes rather than preserving them', async () => {
      const csvText = 'Company,Description\nQuote Bug Co,"Does ""great"" work"';
      const res = await request(app)
        .post('/api/leads/import/csv')
        .set('Authorization', `Bearer ${token}`)
        .send({ csvText });
      expect(res.status).toBe(201);
      const lead = await Lead.findOne({ companyName: 'Quote Bug Co' });
      // Documents actual (imperfect) behavior - not what a spec-compliant CSV parser would do.
      expect(lead.description).toBe('Does great work');
    });
  });

  describe('PUT /api/leads/:id/notes', () => {
    it('saves internal notes', async () => {
      const lead = await Lead.create({ companyName: 'Notes Co' });
      const res = await request(app)
        .put(`/api/leads/${lead._id}/notes`)
        .set('Authorization', `Bearer ${token}`)
        .send({ notes: 'Called them, interested in premium tier' });
      expect(res.status).toBe(200);
      expect(res.body.data.notes).toBe('Called them, interested in premium tier');
    });

    it('404s for a non-existent lead', async () => {
      const res = await request(app)
        .put('/api/leads/507f1f77bcf86cd799439011/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ notes: 'x' });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/leads/:id/schedule-followup', () => {
    it('schedules a follow-up N days from now', async () => {
      const lead = await Lead.create({ companyName: 'Followup Co' });
      const res = await request(app)
        .post(`/api/leads/${lead._id}/schedule-followup`)
        .set('Authorization', `Bearer ${token}`)
        .send({ daysFromNow: 5 });
      expect(res.status).toBe(200);
      const updated = await Lead.findById(lead._id);
      const diffDays = Math.round((updated.followUpScheduled - Date.now()) / 86400000);
      expect(diffDays).toBe(5);
      expect(updated.followUpSent).toBe(false);
    });

    it('defaults to 3 days when daysFromNow is omitted', async () => {
      const lead = await Lead.create({ companyName: 'Default Followup Co' });
      const res = await request(app)
        .post(`/api/leads/${lead._id}/schedule-followup`)
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(200);
      const updated = await Lead.findById(lead._id);
      const diffDays = Math.round((updated.followUpScheduled - Date.now()) / 86400000);
      expect(diffDays).toBe(3);
    });
  });

  describe('POST /api/leads/:id/auto-reply', () => {
    it('generates an auto-reply draft from an incoming message', async () => {
      const lead = await Lead.create({ companyName: 'AutoReply Co' });
      const res = await request(app)
        .post(`/api/leads/${lead._id}/auto-reply`)
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Is this service still available?' });
      expect(res.status).toBe(200);
      expect(res.body.data.draft).toBe('Thanks, we will get back to you.');
      expect(generateAutoReplyDraft).toHaveBeenCalledTimes(1);
    });

    it('rejects a missing incoming message', async () => {
      const lead = await Lead.create({ companyName: 'AutoReply Co 2' });
      const res = await request(app)
        .post(`/api/leads/${lead._id}/auto-reply`)
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/leads/bulk-enrich', () => {
    it('reports zero when no leads need enrichment', async () => {
      await Lead.create({ companyName: 'Has Email Co', email: 'x@y.com', website: 'y.com' });
      const res = await request(app)
        .post('/api/leads/bulk-enrich')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.enriched).toBe(0);
    });

    it('kicks off background enrichment for eligible leads', async () => {
      await Lead.create({ companyName: 'Needs Enrich Co', website: 'needsenrich.com' });
      const res = await request(app)
        .post('/api/leads/bulk-enrich')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
    });
  });

  describe('POST /api/leads/:id/analyze', () => {
    it('re-runs AI analysis and persists the result', async () => {
      const lead = await Lead.create({ companyName: 'Reanalyze Co' });
      const res = await request(app)
        .post(`/api/leads/${lead._id}/analyze`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.aiScore).toBe(5);
      expect(res.body.data.aiQualification).toBe('warm');
    });
  });
});
