jest.mock('../src/services/aiAnalysisService', () => ({
  analyzeLead: jest.fn().mockResolvedValue({ aiScore: 8, aiQualification: 'hot' }),
  generateAutoReplyDraft: jest.fn().mockResolvedValue({ draft: 'Thanks for reaching out!' }),
}));
jest.mock('../src/services/slackService', () => ({
  notifyNewLead: jest.fn().mockResolvedValue(undefined),
  notifyLeadConverted: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/services/websiteAnalyzerService', () => ({
  analyzeWebsite: jest.fn().mockResolvedValue({ summary: 'Looks good' }),
}));
jest.mock('../src/services/emailEnrichmentService', () => ({
  enrichLead: jest.fn().mockResolvedValue({ email: 'found@company.com', confidence: 90, contactName: '' }),
}));

const { app, request, registerAndLogin } = require('./helpers');
const Lead = require('../src/models/Lead');

describe('Leads API', () => {
  let token;

  beforeEach(async () => {
    const auth = await registerAndLogin({ email: 'leadsuser@test.com' });
    token = auth.token;
  });

  describe('POST /api/leads', () => {
    it('creates a lead', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({ companyName: 'Acme Inc', email: 'contact@acme.com' });

      expect(res.status).toBe(201);
      expect(res.body.data.companyName).toBe('Acme Inc');
      expect(res.body.data.status).toBe('new');
    });

    it('rejects missing companyName (422 from validator)', async () => {
      const res = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'x@y.com' });
      expect(res.status).toBe(422);
    });

    it('requires authentication', async () => {
      const res = await request(app).post('/api/leads').send({ companyName: 'No Auth Co' });
      expect(res.status).toBe(401);
    });

    // Regression: the source validator once listed a stale, differently-cased
    // enum ('LinkedIn', 'Upwork', ...) than the Lead model's actual schema
    // enum ('linkedin', 'upwork', ...) - which the frontend's Add Lead form
    // always sends. Every manual lead creation from the UI was rejected with
    // a 422. This locks in that every value the frontend can actually send
    // is accepted.
    it.each(['manual', 'upwork', 'linkedin', 'freelancer', 'crunchbase', 'clutch'])(
      'accepts source=%s (the exact values the frontend Add Lead form sends)',
      async (source) => {
        const res = await request(app)
          .post('/api/leads')
          .set('Authorization', `Bearer ${token}`)
          .send({ companyName: `Source Test ${source}`, source });
        expect(res.status).toBe(201);
        expect(res.body.data.source).toBe(source);
      }
    );
  });

  describe('GET /api/leads', () => {
    it('lists leads with pagination and excludes deleted', async () => {
      await Lead.create({ companyName: 'Visible Co' });
      await Lead.create({ companyName: 'Deleted Co', status: 'deleted' });

      const res = await request(app)
        .get('/api/leads')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].companyName).toBe('Visible Co');
      expect(res.body.pagination.total).toBe(1);
    });

    it('filters by search term', async () => {
      await Lead.create({ companyName: 'Zebra Corp' });
      await Lead.create({ companyName: 'Alpha Corp' });

      const res = await request(app)
        .get('/api/leads')
        .query({ search: 'Zebra' })
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].companyName).toBe('Zebra Corp');
    });
  });

  describe('GET /api/leads/:id', () => {
    it('returns 404 for a deleted lead', async () => {
      const lead = await Lead.create({ companyName: 'Gone Co', status: 'deleted' });
      const res = await request(app)
        .get(`/api/leads/${lead._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it('returns 422 for a malformed id', async () => {
      const res = await request(app)
        .get('/api/leads/not-a-valid-id')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(422);
    });
  });

  describe('PUT /api/leads/:id', () => {
    it('updates a lead', async () => {
      const lead = await Lead.create({ companyName: 'Update Me' });
      const res = await request(app)
        .put(`/api/leads/${lead._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'contacted' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('contacted');
    });
  });

  describe('DELETE /api/leads/:id', () => {
    it('soft-deletes a lead', async () => {
      const lead = await Lead.create({ companyName: 'Delete Me' });
      const res = await request(app)
        .delete(`/api/leads/${lead._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);

      const inDb = await Lead.findById(lead._id);
      expect(inDb.status).toBe('deleted');
    });
  });

  describe('POST /api/leads/bulk-delete', () => {
    it('soft-deletes multiple leads by id', async () => {
      const l1 = await Lead.create({ companyName: 'Bulk 1' });
      const l2 = await Lead.create({ companyName: 'Bulk 2' });

      const res = await request(app)
        .post('/api/leads/bulk-delete')
        .set('Authorization', `Bearer ${token}`)
        .send({ ids: [l1._id, l2._id] });

      expect(res.status).toBe(200);
      const remaining = await Lead.find({ status: { $ne: 'deleted' } });
      expect(remaining.length).toBe(0);
    });

    it('rejects an empty ids array', async () => {
      const res = await request(app)
        .post('/api/leads/bulk-delete')
        .set('Authorization', `Bearer ${token}`)
        .send({ ids: [] });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/leads/:id/enrich-email', () => {
    it('enriches email using the mocked enrichment service', async () => {
      const lead = await Lead.create({ companyName: 'Enrich Co', website: 'enrichco.com' });
      const res = await request(app)
        .post(`/api/leads/${lead._id}/enrich-email`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('found@company.com');
    });

    it('rejects when lead has no website', async () => {
      const lead = await Lead.create({ companyName: 'No Website Co' });
      const res = await request(app)
        .post(`/api/leads/${lead._id}/enrich-email`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/leads/:id/analyze-website', () => {
    it('blocks SSRF attempts against private/internal hosts', async () => {
      const lead = await Lead.create({ companyName: 'SSRF Co' });
      const res = await request(app)
        .post(`/api/leads/${lead._id}/analyze-website`)
        .set('Authorization', `Bearer ${token}`)
        .send({ url: 'http://127.0.0.1:8080/admin' });
      expect(res.status).toBe(400);
    });

    it('analyzes a safe public url', async () => {
      const lead = await Lead.create({ companyName: 'Safe Co' });
      const res = await request(app)
        .post(`/api/leads/${lead._id}/analyze-website`)
        .set('Authorization', `Bearer ${token}`)
        .send({ url: 'https://example.com' });
      expect(res.status).toBe(200);
      expect(res.body.data.summary).toBe('Looks good');
    });
  });
});
