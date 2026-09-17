jest.mock('../src/services/emailService', () => ({ sendEmail: jest.fn() }));
jest.mock('../src/services/aiService', () => ({
  generateFollowUpMessage: jest.fn().mockResolvedValue({ subject: 'Following up', message: 'Just checking in!' }),
}));
jest.mock('../src/services/slackService', () => ({
  notifyFollowUpSent: jest.fn().mockResolvedValue(undefined),
}));

const mockResendSend = jest.fn().mockResolvedValue({ id: 'resend_1' });
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockResendSend } })),
}));

const Lead = require('../src/models/Lead');
const OutreachLog = require('../src/models/OutreachLog');
const Sequence = require('../src/models/Sequence');
const SequenceEnrollment = require('../src/models/SequenceEnrollment');
const User = require('../src/models/User');
const configService = require('../src/services/configService');
const emailService = require('../src/services/emailService');
const { generateFollowUpMessage } = require('../src/services/aiService');
const { processFollowUps, processProposalFollowUps } = require('../src/services/followUpService');
const { sendDailyDigest } = require('../src/services/digestService');
const { processSequenceEmails } = require('../src/services/sequenceService');

describe('Background cron jobs (called directly, not via node-cron schedule)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResendSend.mockClear();
    configService.invalidateAll();
    emailService.sendEmail.mockResolvedValue({ id: 'msg_1' });
    generateFollowUpMessage.mockResolvedValue({ subject: 'Following up', message: 'Just checking in!' });
  });

  describe('followUpService.processFollowUps', () => {
    it('emails leads whose follow-up is due and marks them sent', async () => {
      const lead = await Lead.create({
        companyName: 'Due Followup Co', email: 'due@co.com', status: 'contacted',
        followUpScheduled: new Date(Date.now() - 1000), followUpSent: false,
      });
      await processFollowUps();

      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      const updated = await Lead.findById(lead._id);
      expect(updated.followUpSent).toBe(true);
      expect(updated.status).toBe('follow_up');
    });

    it('ignores leads whose follow-up is not due yet', async () => {
      await Lead.create({
        companyName: 'Future Followup Co', email: 'future@co.com', status: 'contacted',
        followUpScheduled: new Date(Date.now() + 86400000), followUpSent: false,
      });
      await processFollowUps();
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('ignores leads with no email even if due', async () => {
      await Lead.create({
        companyName: 'No Email Followup Co', status: 'contacted',
        followUpScheduled: new Date(Date.now() - 1000), followUpSent: false,
      });
      await processFollowUps();
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('does not stop processing remaining leads if one email send fails', async () => {
      emailService.sendEmail
        .mockRejectedValueOnce(new Error('SMTP down'))
        .mockResolvedValueOnce({ id: 'msg_ok' });

      const leadA = await Lead.create({
        companyName: 'Fails Co', email: 'fails@co.com', status: 'contacted',
        followUpScheduled: new Date(Date.now() - 1000), followUpSent: false,
      });
      const leadB = await Lead.create({
        companyName: 'Succeeds Co', email: 'succeeds@co.com', status: 'contacted',
        followUpScheduled: new Date(Date.now() - 1000), followUpSent: false,
      });

      await processFollowUps();

      expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
      expect((await Lead.findById(leadA._id)).followUpSent).toBe(false); // left for retry
      expect((await Lead.findById(leadB._id)).followUpSent).toBe(true);
    });
  });

  describe('followUpService.processProposalFollowUps', () => {
    it('follows up on proposals sent more than 3 days ago', async () => {
      const lead = await Lead.create({
        companyName: 'Stale Proposal Co', email: 'stale@co.com', status: 'proposal_sent', followUpSent: false,
      });
      // Bypass Mongoose's timestamps plugin (which would re-stamp updatedAt) by writing via the raw driver.
      await Lead.collection.updateOne({ _id: lead._id }, { $set: { updatedAt: new Date(Date.now() - 4 * 86400000) } });

      await processProposalFollowUps();
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      const updated = await Lead.findById(lead._id);
      expect(updated.status).toBe('follow_up');
    });

    it('leaves recently-sent proposals alone', async () => {
      await Lead.create({
        companyName: 'Fresh Proposal Co', email: 'fresh@co.com', status: 'proposal_sent', followUpSent: false,
      });
      await processProposalFollowUps();
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('digestService.sendDailyDigest', () => {
    it('does nothing when no digest email is configured', async () => {
      await sendDailyDigest();
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('sends a digest with correct counts when DIGEST_EMAIL is configured', async () => {
      await configService.set('DIGEST_EMAIL', 'owner@company.com');
      await Lead.create({ companyName: 'Today Lead', aiQualification: 'hot', aiScore: 9 });

      await sendDailyDigest();
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      const call = emailService.sendEmail.mock.calls[0][0];
      expect(call.to).toBe('owner@company.com');
      expect(call.html).toContain('Today Lead');
    });

    it('does not crash if the email provider throws', async () => {
      await configService.set('DIGEST_EMAIL', 'owner2@company.com');
      emailService.sendEmail.mockRejectedValueOnce(new Error('provider down'));
      await expect(sendDailyDigest()).resolves.not.toThrow();
    });
  });

  describe('sequenceService.processSequenceEmails', () => {
    it('sends the current step email via Resend, logs it, and advances to the next step', async () => {
      await configService.set('RESEND_API_KEY', 'fake-resend-key');
      await configService.set('EMAIL_FROM', 'sender@company.com');

      const user = await User.create({ name: 'Seq User', email: 'sequser_cron@test.com', password: 'password123' });
      const lead = await Lead.create({ companyName: 'Seq Lead Co', email: 'seqlead@co.com' });
      const sequence = await Sequence.create({
        user: user._id, name: 'Cron Seq',
        steps: [
          { stepNumber: 1, delayDays: 0, subject: 'Step 1', body: 'Hello step 1' },
          { stepNumber: 2, delayDays: 2, subject: 'Step 2', body: 'Hello step 2' },
        ],
      });
      const enrollment = await SequenceEnrollment.create({
        sequence: sequence._id, lead: lead._id, user: user._id, currentStep: 0, nextSendAt: new Date(Date.now() - 1000),
      });

      await processSequenceEmails();

      expect(mockResendSend).toHaveBeenCalledTimes(1);
      expect(mockResendSend.mock.calls[0][0].subject).toBe('Step 1');

      const log = await OutreachLog.findOne({ lead: lead._id });
      expect(log).not.toBeNull();
      expect(log.status).toBe('sent');

      const updatedEnrollment = await SequenceEnrollment.findById(enrollment._id);
      expect(updatedEnrollment.currentStep).toBe(1);
      expect(updatedEnrollment.completedSteps).toContain(0);
      expect(updatedEnrollment.status).toBe('active');
    });

    it('marks the enrollment completed after the final step', async () => {
      await configService.set('RESEND_API_KEY', 'fake-resend-key');
      const user = await User.create({ name: 'Seq User 2', email: 'sequser_cron2@test.com', password: 'password123' });
      const lead = await Lead.create({ companyName: 'Last Step Lead', email: 'laststep@co.com' });
      const sequence = await Sequence.create({
        user: user._id, name: 'One Step Seq',
        steps: [{ stepNumber: 1, delayDays: 0, subject: 'Only Step', body: 'Body' }],
      });
      await SequenceEnrollment.create({
        sequence: sequence._id, lead: lead._id, user: user._id, currentStep: 0, nextSendAt: new Date(Date.now() - 1000),
      });

      await processSequenceEmails();

      const enrollment = await SequenceEnrollment.findOne({ sequence: sequence._id });
      expect(enrollment.status).toBe('completed');
    });

    it('skips sending (but still exists) when no Resend API key is configured', async () => {
      const user = await User.create({ name: 'Seq User 3', email: 'sequser_cron3@test.com', password: 'password123' });
      const lead = await Lead.create({ companyName: 'No Key Lead', email: 'nokey@co.com' });
      const sequence = await Sequence.create({
        user: user._id, name: 'No Key Seq',
        steps: [{ stepNumber: 1, delayDays: 0, subject: 'S', body: 'B' }],
      });
      await SequenceEnrollment.create({
        sequence: sequence._id, lead: lead._id, user: user._id, currentStep: 0, nextSendAt: new Date(Date.now() - 1000),
      });

      await processSequenceEmails();
      expect(mockResendSend).not.toHaveBeenCalled();
    });

    it('completes the enrollment when the referenced sequence was deleted', async () => {
      const user = await User.create({ name: 'Seq User 4', email: 'sequser_cron4@test.com', password: 'password123' });
      const lead = await Lead.create({ companyName: 'Orphan Lead', email: 'orphan@co.com' });
      const sequence = await Sequence.create({
        user: user._id, name: 'To Be Deleted',
        steps: [{ stepNumber: 1, delayDays: 0, subject: 'S', body: 'B' }],
      });
      const enrollment = await SequenceEnrollment.create({
        sequence: sequence._id, lead: lead._id, user: user._id, currentStep: 0, nextSendAt: new Date(Date.now() - 1000),
      });
      await Sequence.findByIdAndDelete(sequence._id);

      await processSequenceEmails();
      const updated = await SequenceEnrollment.findById(enrollment._id);
      expect(updated.status).toBe('completed');
    });

    it('ignores enrollments that are not yet due', async () => {
      const user = await User.create({ name: 'Seq User 5', email: 'sequser_cron5@test.com', password: 'password123' });
      const lead = await Lead.create({ companyName: 'Not Due Lead', email: 'notdue@co.com' });
      const sequence = await Sequence.create({
        user: user._id, name: 'Not Due Seq',
        steps: [{ stepNumber: 1, delayDays: 0, subject: 'S', body: 'B' }],
      });
      await SequenceEnrollment.create({
        sequence: sequence._id, lead: lead._id, user: user._id, currentStep: 0, nextSendAt: new Date(Date.now() + 86400000),
      });

      await processSequenceEmails();
      expect(mockResendSend).not.toHaveBeenCalled();
    });
  });
});
