jest.mock('../src/services/aiService', () => ({
  generateProposal: jest.fn().mockResolvedValue({ title: 'Custom Proposal', content: 'Proposal body text' }),
}));
jest.mock('../src/services/slackService', () => ({
  notifyProposalGenerated: jest.fn().mockResolvedValue(undefined),
}));

const { app, request, registerAndLogin } = require('./helpers');
const Lead = require('../src/models/Lead');
const Proposal = require('../src/models/Proposal');
const aiService = require('../src/services/aiService');

describe('Proposals API', () => {
  let token;

  beforeEach(async () => {
    const auth = await registerAndLogin({ email: 'propsuser@test.com' });
    token = auth.token;
    aiService.generateProposal.mockClear();
  });

  describe('POST /api/proposals/generate', () => {
    it('generates a proposal for a lead and moves lead to proposal_sent', async () => {
      const lead = await Lead.create({ companyName: 'Prospect Co', status: 'new' });
      const res = await request(app)
        .post('/api/proposals/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ leadId: lead._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Custom Proposal');
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.lead.companyName).toBe('Prospect Co');

      const updatedLead = await Lead.findById(lead._id);
      expect(updatedLead.status).toBe('proposal_sent');
    });

    it('rejects missing leadId (422 from validator)', async () => {
      const res = await request(app)
        .post('/api/proposals/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(422);
    });

    it('returns 404 for a non-existent lead', async () => {
      const res = await request(app)
        .post('/api/proposals/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ leadId: '507f1f77bcf86cd799439011' });
      expect(res.status).toBe(404);
    });

    it('surfaces an AI-provider failure as a 500 instead of crashing', async () => {
      aiService.generateProposal.mockRejectedValueOnce(new Error('Groq unavailable'));
      const lead = await Lead.create({ companyName: 'Flaky AI Co' });
      const res = await request(app)
        .post('/api/proposals/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ leadId: lead._id.toString() });
      expect(res.status).toBe(500);
    });
  });

  describe('PUT /api/proposals/:id', () => {
    it('updates title/content/status', async () => {
      const lead = await Lead.create({ companyName: 'Update Prop Co' });
      const proposal = await Proposal.create({ lead: lead._id, title: 'Old', content: 'Old content' });
      const res = await request(app)
        .put(`/api/proposals/${proposal._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'sent' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('sent');
    });

    it('rejects an invalid status enum value', async () => {
      const lead = await Lead.create({ companyName: 'Bad Status Co' });
      const proposal = await Proposal.create({ lead: lead._id, title: 'T', content: 'C' });
      const res = await request(app)
        .put(`/api/proposals/${proposal._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'not-a-real-status' });
      expect(res.status).toBe(500); // mongoose validation error caught by generic handler
      const stillDraft = await Proposal.findById(proposal._id);
      expect(stillDraft.status).toBe('draft');
    });
  });

  describe('DELETE /api/proposals/:id', () => {
    it('deletes a proposal', async () => {
      const lead = await Lead.create({ companyName: 'Delete Prop Co' });
      const proposal = await Proposal.create({ lead: lead._id, title: 'T', content: 'C' });
      const res = await request(app)
        .delete(`/api/proposals/${proposal._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(await Proposal.findById(proposal._id)).toBeNull();
    });
  });

  describe('Public sharing flow', () => {
    it('shares a proposal and makes it fetchable via public token without auth', async () => {
      const lead = await Lead.create({ companyName: 'Share Co' });
      const proposal = await Proposal.create({ lead: lead._id, title: 'Shared', content: 'Body' });

      const shareRes = await request(app)
        .post(`/api/proposals/${proposal._id}/share`)
        .set('Authorization', `Bearer ${token}`);
      expect(shareRes.status).toBe(200);
      const publicToken = shareRes.body.data.publicToken;
      expect(publicToken).toHaveLength(64); // 32 bytes hex

      const publicRes = await request(app).get(`/api/proposals/public/${publicToken}`);
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.data.title).toBe('Shared');
    });

    it('revoking a share makes the public link 404', async () => {
      const lead = await Lead.create({ companyName: 'Revoke Co' });
      const proposal = await Proposal.create({ lead: lead._id, title: 'T', content: 'C' });
      const shareRes = await request(app)
        .post(`/api/proposals/${proposal._id}/share`)
        .set('Authorization', `Bearer ${token}`);
      const publicToken = shareRes.body.data.publicToken;

      await request(app).delete(`/api/proposals/${proposal._id}/share`).set('Authorization', `Bearer ${token}`);

      const publicRes = await request(app).get(`/api/proposals/public/${publicToken}`);
      expect(publicRes.status).toBe(404);
    });

    it('rejects a garbage/guessed public token', async () => {
      const res = await request(app).get('/api/proposals/public/not-a-real-token-at-all');
      expect(res.status).toBe(404);
    });

    it('does not expose a non-shared proposal via public token guessing', async () => {
      const lead = await Lead.create({ companyName: 'Private Prop Co' });
      await Proposal.create({ lead: lead._id, title: 'Private', content: 'Body', publicToken: 'abc123', isPublic: false });
      const res = await request(app).get('/api/proposals/public/abc123');
      expect(res.status).toBe(404);
    });

    it('lets a client accept a shared proposal without auth', async () => {
      const lead = await Lead.create({ companyName: 'Accept Co' });
      const proposal = await Proposal.create({
        lead: lead._id, title: 'T', content: 'C', publicToken: 'accept-token-123', isPublic: true,
      });
      const res = await request(app)
        .post('/api/proposals/public/accept-token-123/respond')
        .send({ clientDecision: 'accepted', clientMessage: 'Looks great!' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('accepted');
      expect(res.body.data.clientDecision).toBe('accepted');
    });

    it('rejects an invalid clientDecision value at the model layer', async () => {
      const lead = await Lead.create({ companyName: 'Bad Decision Co' });
      await Proposal.create({
        lead: lead._id, title: 'T', content: 'C', publicToken: 'bad-decision-token', isPublic: true,
      });
      const res = await request(app)
        .post('/api/proposals/public/bad-decision-token/respond')
        .send({ clientDecision: 'maybe-later-lol' });
      expect(res.status).toBe(500); // validation error, not silently stored as garbage
    });
  });
});
