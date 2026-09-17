jest.mock('axios');
const axios = require('axios');

const { app, request, registerAndLogin } = require('./helpers');
const Lead = require('../src/models/Lead');

describe('Apollo API', () => {
  let token;

  beforeEach(async () => {
    const auth = await registerAndLogin({ email: 'apollouser@test.com' });
    token = auth.token;
    axios.post.mockReset();
  });

  describe('POST /api/apollo/search', () => {
    it('returns a helpful 400 when no API key is configured', async () => {
      const res = await request(app)
        .post('/api/apollo/search')
        .set('Authorization', `Bearer ${token}`)
        .send({ q_organization_name: 'Acme' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/API key/i);
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('maps Apollo results into lead-shaped records once a key is set', async () => {
      await request(app)
        .put('/api/settings/integrations')
        .set('Authorization', `Bearer ${token}`)
        .send({ APOLLO_API_KEY: 'fake-key-123' });

      axios.post.mockResolvedValueOnce({
        data: {
          people: [{
            id: 'p1', name: 'Jane Doe', title: 'CTO', email: 'jane@acme.com',
            phone_numbers: [{ sanitized_number: '+15551234567' }],
            organization: { name: 'Acme Inc', website_url: 'acme.com', industry: 'tech' },
            city: 'NYC', country: 'US', linkedin_url: 'linkedin.com/in/jane',
          }],
          pagination: { total_entries: 1 },
        },
      });

      const res = await request(app)
        .post('/api/apollo/search')
        .set('Authorization', `Bearer ${token}`)
        .send({ q_organization_name: 'Acme' });

      expect(res.status).toBe(200);
      expect(res.body.data[0]).toMatchObject({ name: 'Jane Doe', companyName: 'Acme Inc', email: 'jane@acme.com' });
      expect(res.body.total).toBe(1);
    });

    it('translates an Apollo 401 into a clear invalid-key message instead of a raw 500', async () => {
      await request(app)
        .put('/api/settings/integrations')
        .set('Authorization', `Bearer ${token}`)
        .send({ APOLLO_API_KEY: 'bad-key' });

      axios.post.mockRejectedValueOnce({ response: { status: 401 } });

      const res = await request(app)
        .post('/api/apollo/search')
        .set('Authorization', `Bearer ${token}`)
        .send({ q_organization_name: 'Acme' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid Apollo API key/);
    });
  });

  describe('POST /api/apollo/import', () => {
    it('imports new contacts and skips ones missing companyName', async () => {
      const res = await request(app)
        .post('/api/apollo/import')
        .set('Authorization', `Bearer ${token}`)
        .send({
          contacts: [
            { companyName: 'Imported Co', email: 'x@imported.com' },
            { name: 'No Company Person' }, // missing companyName -> skipped
          ],
        });
      expect(res.status).toBe(200);
      expect(res.body.data.created).toBe(1);
      expect(res.body.data.skipped).toBe(1);

      const lead = await Lead.findOne({ companyName: 'Imported Co' });
      expect(lead.source).toBe('apollo');
    });

    it('skips duplicates matched by companyName+email', async () => {
      await Lead.create({ companyName: 'Dup Import Co', email: 'dup@co.com' });
      const res = await request(app)
        .post('/api/apollo/import')
        .set('Authorization', `Bearer ${token}`)
        .send({ contacts: [{ companyName: 'Dup Import Co', email: 'dup@co.com' }] });
      expect(res.status).toBe(200);
      expect(res.body.data.created).toBe(0);
      expect(res.body.data.skipped).toBe(1);
    });

    it('rejects an empty or missing contacts array', async () => {
      const res = await request(app)
        .post('/api/apollo/import')
        .set('Authorization', `Bearer ${token}`)
        .send({ contacts: [] });
      expect(res.status).toBe(400);
    });
  });
});
