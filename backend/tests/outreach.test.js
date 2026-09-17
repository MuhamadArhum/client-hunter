jest.mock('../src/services/emailService', () => ({ sendEmail: jest.fn() }));
jest.mock('../src/services/whatsappService', () => ({ sendMessage: jest.fn() }));

const { app, request, registerAndLogin } = require('./helpers');
const Lead = require('../src/models/Lead');
const OutreachLog = require('../src/models/OutreachLog');
const emailService = require('../src/services/emailService');
const whatsappService = require('../src/services/whatsappService');

describe('Outreach API', () => {
  let token;

  beforeEach(async () => {
    const auth = await registerAndLogin({ email: 'outreachuser@test.com' });
    token = auth.token;
    emailService.sendEmail.mockReset().mockResolvedValue({ id: 'msg_1' });
    whatsappService.sendMessage.mockReset().mockResolvedValue({ id: 'wa_1' });
  });

  describe('POST /api/outreach/email', () => {
    it('sends an email and marks a new lead as contacted', async () => {
      const lead = await Lead.create({ companyName: 'Email Co', email: 'lead@email.com', status: 'new' });
      const res = await request(app)
        .post('/api/outreach/email')
        .set('Authorization', `Bearer ${token}`)
        .send({ leadId: lead._id.toString(), subject: 'Hello', message: 'Hi there' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('sent');
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);

      const updatedLead = await Lead.findById(lead._id);
      expect(updatedLead.status).toBe('contacted');
    });

    it('logs a failed send as status=failed and returns 500 without throwing', async () => {
      emailService.sendEmail.mockRejectedValueOnce(new Error('SMTP down'));
      const lead = await Lead.create({ companyName: 'Fail Email Co', email: 'lead2@email.com' });
      const res = await request(app)
        .post('/api/outreach/email')
        .set('Authorization', `Bearer ${token}`)
        .send({ leadId: lead._id.toString(), subject: 'Hello', message: 'Hi there' });

      expect(res.status).toBe(500);
      const log = await OutreachLog.findOne({ lead: lead._id });
      expect(log.status).toBe('failed');
      expect(log.response).toBe('SMTP down');
    });

    it('rejects when the lead has no email and none was provided', async () => {
      const lead = await Lead.create({ companyName: 'No Email Co' });
      const res = await request(app)
        .post('/api/outreach/email')
        .set('Authorization', `Bearer ${token}`)
        .send({ leadId: lead._id.toString(), subject: 'Hello', message: 'Hi' });
      expect(res.status).toBe(400);
    });

    it('rejects missing required fields', async () => {
      const res = await request(app)
        .post('/api/outreach/email')
        .set('Authorization', `Bearer ${token}`)
        .send({ subject: 'Hello' });
      expect([400, 422]).toContain(res.status);
    });
  });

  describe('POST /api/outreach/whatsapp', () => {
    it('sends a WhatsApp message and marks lead contacted', async () => {
      const lead = await Lead.create({ companyName: 'WA Co', phone: '+15551234567', status: 'new' });
      const res = await request(app)
        .post('/api/outreach/whatsapp')
        .set('Authorization', `Bearer ${token}`)
        .send({ leadId: lead._id.toString(), message: 'Hi via WhatsApp' });
      expect(res.status).toBe(200);
      expect(whatsappService.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('rejects when lead has no phone number', async () => {
      const lead = await Lead.create({ companyName: 'No Phone Co' });
      const res = await request(app)
        .post('/api/outreach/whatsapp')
        .set('Authorization', `Bearer ${token}`)
        .send({ leadId: lead._id.toString(), message: 'Hi' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/outreach/retry/:logId', () => {
    it('retries a failed email and flips it to sent', async () => {
      const lead = await Lead.create({ companyName: 'Retry Co', email: 'retry@co.com' });
      const log = await OutreachLog.create({
        lead: lead._id, type: 'email', subject: 'S', message: 'M', status: 'failed', trackingId: 'abc',
      });
      const res = await request(app)
        .post(`/api/outreach/retry/${log._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      const updated = await OutreachLog.findById(log._id);
      expect(updated.status).toBe('sent');
    });

    it('refuses to retry a log that already succeeded', async () => {
      const lead = await Lead.create({ companyName: 'AlreadySent Co', email: 'a@co.com' });
      const log = await OutreachLog.create({ lead: lead._id, type: 'email', message: 'M', status: 'sent' });
      const res = await request(app)
        .post(`/api/outreach/retry/${log._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('404s for a non-existent log', async () => {
      const res = await request(app)
        .post('/api/outreach/retry/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/outreach/track/open/:trackingId (public pixel)', () => {
    it('always returns a 1x1 gif even for an unknown tracking id (never breaks the email)', async () => {
      const res = await request(app).get('/api/outreach/track/open/does-not-exist');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('image/gif');
    });

    it('marks the matching log as opened exactly once (idempotent)', async () => {
      const lead = await Lead.create({ companyName: 'Open Track Co' });
      const log = await OutreachLog.create({ lead: lead._id, type: 'email', message: 'M', trackingId: 'track-open-1' });

      await request(app).get('/api/outreach/track/open/track-open-1');
      const first = await OutreachLog.findById(log._id);
      expect(first.openedAt).not.toBeNull();

      await request(app).get('/api/outreach/track/open/track-open-1');
      const second = await OutreachLog.findById(log._id);
      expect(second.openedAt.getTime()).toBe(first.openedAt.getTime()); // not overwritten on 2nd open
    });
  });

  describe('GET /api/outreach/track/click/:trackingId (public redirect) - security', () => {
    it('rejects a non-http(s) url (blocks javascript:/data: schemes)', async () => {
      const res = await request(app)
        .get('/api/outreach/track/click/whatever')
        .query({ url: 'javascript:alert(1)' });
      expect(res.status).toBe(400);
    });

    it('rejects a missing url', async () => {
      const res = await request(app).get('/api/outreach/track/click/whatever');
      expect(res.status).toBe(400);
    });

    // Fixed: previously this endpoint redirected to ANY http(s) url with a 302
    // even when trackingId didn't correspond to a real outreach log, making it
    // an open redirect through a trusted domain (e.g.
    // https://ourapp.com/api/outreach/track/click/x?url=https://evil-phishing.example).
    // It now requires trackingId to match a real log first.
    it('rejects a fake/unknown trackingId instead of redirecting (no more open redirect)', async () => {
      const res = await request(app)
        .get('/api/outreach/track/click/totally-made-up-id-123')
        .query({ url: 'https://example.com/not-our-site' });
      expect(res.status).toBe(404);
    });

    it('redirects to the target url only for a real, known trackingId', async () => {
      const lead = await Lead.create({ companyName: 'Click Track Co' });
      await OutreachLog.create({ lead: lead._id, type: 'email', message: 'M', trackingId: 'real-click-track-1' });

      const res = await request(app)
        .get('/api/outreach/track/click/real-click-track-1')
        .query({ url: 'https://example.com/real-target' });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('https://example.com/real-target');

      const log = await OutreachLog.findOne({ trackingId: 'real-click-track-1' });
      expect(log.clickedAt).not.toBeNull();
    });

    it('preserves the first click time on a second click (idempotent)', async () => {
      const lead = await Lead.create({ companyName: 'Double Click Co' });
      const log = await OutreachLog.create({ lead: lead._id, type: 'email', message: 'M', trackingId: 'double-click-1' });

      await request(app).get('/api/outreach/track/click/double-click-1').query({ url: 'https://example.com/a' });
      const first = await OutreachLog.findById(log._id);

      await request(app).get('/api/outreach/track/click/double-click-1').query({ url: 'https://example.com/b' });
      const second = await OutreachLog.findById(log._id);

      expect(second.clickedAt.getTime()).toBe(first.clickedAt.getTime());
    });
  });

  describe('POST /api/outreach/webhook/resend (public)', () => {
    it('updates the matching log on a delivered event', async () => {
      const lead = await Lead.create({ companyName: 'Webhook Co' });
      await OutreachLog.create({ lead: lead._id, type: 'email', message: 'M', trackingId: 'webhook-track-1', status: 'sent' });

      const res = await request(app).post('/api/outreach/webhook/resend').send({
        type: 'email.delivered',
        data: { tags: [{ name: 'trackingId', value: 'webhook-track-1' }] },
      });
      expect(res.status).toBe(200);
      const log = await OutreachLog.findOne({ trackingId: 'webhook-track-1' });
      expect(log.status).toBe('delivered');
    });

    it('never fails the webhook even with a totally malformed payload (Resend will retry on non-2xx)', async () => {
      const res = await request(app).post('/api/outreach/webhook/resend').send({ garbage: true, nested: { a: [1, 2, 3] } });
      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
    });

    it('handles a payload with no body at all', async () => {
      const res = await request(app).post('/api/outreach/webhook/resend').send();
      expect(res.status).toBe(200);
    });
  });
});
