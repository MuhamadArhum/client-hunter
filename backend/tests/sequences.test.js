const { app, request, registerAndLogin } = require('./helpers');
const Lead = require('../src/models/Lead');
const Sequence = require('../src/models/Sequence');
const SequenceEnrollment = require('../src/models/SequenceEnrollment');

const sampleSteps = [
  { stepNumber: 1, delayDays: 0, subject: 'Intro', body: 'Hi {{name}}' },
  { stepNumber: 2, delayDays: 3, subject: 'Follow up', body: 'Just checking in' },
];

describe('Sequences API', () => {
  let token, userId;

  beforeEach(async () => {
    const auth = await registerAndLogin({ email: 'sequser@test.com' });
    token = auth.token;
    userId = auth.user.id || auth.user._id;
  });

  describe('POST /api/sequences', () => {
    it('creates a sequence owned by the requesting user', async () => {
      const res = await request(app)
        .post('/api/sequences')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cold Outreach', steps: sampleSteps });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Cold Outreach');
      expect(res.body.data.steps.length).toBe(2);
    });
  });

  describe('Ownership isolation', () => {
    it('a sequence created by user A is invisible to user B', async () => {
      await request(app).post('/api/sequences').set('Authorization', `Bearer ${token}`)
        .send({ name: 'Owner Only Seq', steps: sampleSteps });

      const other = await registerAndLogin({ email: 'sequser2@test.com' });
      const listRes = await request(app).get('/api/sequences').set('Authorization', `Bearer ${other.token}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBe(0);
    });

    it('user B cannot update user A\'s sequence by guessing its id', async () => {
      const createRes = await request(app).post('/api/sequences').set('Authorization', `Bearer ${token}`)
        .send({ name: 'Protected Seq', steps: sampleSteps });
      const seqId = createRes.body.data._id;

      const other = await registerAndLogin({ email: 'sequser3@test.com' });
      const res = await request(app)
        .put(`/api/sequences/${seqId}`)
        .set('Authorization', `Bearer ${other.token}`)
        .send({ name: 'Hijacked Name' });
      expect(res.status).toBe(404);

      const stillOriginal = await Sequence.findById(seqId);
      expect(stillOriginal.name).toBe('Protected Seq');
    });

    it('user B cannot delete user A\'s sequence', async () => {
      const createRes = await request(app).post('/api/sequences').set('Authorization', `Bearer ${token}`)
        .send({ name: 'Undeletable By Others', steps: sampleSteps });
      const seqId = createRes.body.data._id;

      const other = await registerAndLogin({ email: 'sequser4@test.com' });
      const res = await request(app)
        .delete(`/api/sequences/${seqId}`)
        .set('Authorization', `Bearer ${other.token}`);
      expect(res.status).toBe(404);
      expect(await Sequence.findById(seqId)).not.toBeNull();
    });
  });

  describe('POST /api/sequences/:id/enroll', () => {
    it('enrolls a lead and computes nextSendAt from the first step delay', async () => {
      const seqRes = await request(app).post('/api/sequences').set('Authorization', `Bearer ${token}`)
        .send({ name: 'Enroll Seq', steps: sampleSteps });
      const lead = await Lead.create({ companyName: 'Enroll Target Co' });

      const res = await request(app)
        .post(`/api/sequences/${seqRes.body.data._id}/enroll`)
        .set('Authorization', `Bearer ${token}`)
        .send({ leadId: lead._id.toString() });
      expect(res.status).toBe(201);
      expect(res.body.data.currentStep).toBe(0);
      expect(res.body.data.status).toBe('active');
    });

    it('rejects enrolling into a sequence with no steps', async () => {
      const seqRes = await request(app).post('/api/sequences').set('Authorization', `Bearer ${token}`)
        .send({ name: 'Empty Seq', steps: [] });
      const lead = await Lead.create({ companyName: 'Empty Seq Lead' });
      const res = await request(app)
        .post(`/api/sequences/${seqRes.body.data._id}/enroll`)
        .set('Authorization', `Bearer ${token}`)
        .send({ leadId: lead._id.toString() });
      expect(res.status).toBe(400);
    });

    it('prevents double-enrolling the same active lead in the same sequence', async () => {
      const seqRes = await request(app).post('/api/sequences').set('Authorization', `Bearer ${token}`)
        .send({ name: 'Dup Seq', steps: sampleSteps });
      const lead = await Lead.create({ companyName: 'Dup Lead Co' });

      await request(app).post(`/api/sequences/${seqRes.body.data._id}/enroll`)
        .set('Authorization', `Bearer ${token}`).send({ leadId: lead._id.toString() });

      const res = await request(app).post(`/api/sequences/${seqRes.body.data._id}/enroll`)
        .set('Authorization', `Bearer ${token}`).send({ leadId: lead._id.toString() });
      expect(res.status).toBe(400);

      const count = await SequenceEnrollment.countDocuments({ sequence: seqRes.body.data._id, lead: lead._id });
      expect(count).toBe(1);
    });
  });

  describe('PATCH /api/sequences/enrollments/:enrollmentId', () => {
    it('pauses and resumes an enrollment', async () => {
      const seqRes = await request(app).post('/api/sequences').set('Authorization', `Bearer ${token}`)
        .send({ name: 'Pause Seq', steps: sampleSteps });
      const lead = await Lead.create({ companyName: 'Pause Lead Co' });
      const enrollRes = await request(app).post(`/api/sequences/${seqRes.body.data._id}/enroll`)
        .set('Authorization', `Bearer ${token}`).send({ leadId: lead._id.toString() });

      const pauseRes = await request(app)
        .patch(`/api/sequences/enrollments/${enrollRes.body.data._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'paused' });
      expect(pauseRes.status).toBe(200);
      expect(pauseRes.body.data.status).toBe('paused');
    });
  });

  describe('DELETE /api/sequences/:id', () => {
    it('cascades and removes enrollments when a sequence is deleted', async () => {
      const seqRes = await request(app).post('/api/sequences').set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cascade Seq', steps: sampleSteps });
      const lead = await Lead.create({ companyName: 'Cascade Lead' });
      await request(app).post(`/api/sequences/${seqRes.body.data._id}/enroll`)
        .set('Authorization', `Bearer ${token}`).send({ leadId: lead._id.toString() });

      const delRes = await request(app)
        .delete(`/api/sequences/${seqRes.body.data._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(delRes.status).toBe(200);

      const remainingEnrollments = await SequenceEnrollment.countDocuments({ sequence: seqRes.body.data._id });
      expect(remainingEnrollments).toBe(0);
    });
  });
});
