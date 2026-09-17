const mongoose = require('mongoose');
const User = require('../src/models/User');
const Lead = require('../src/models/Lead');
const Proposal = require('../src/models/Proposal');
const OutreachLog = require('../src/models/OutreachLog');
const Sequence = require('../src/models/Sequence');
const EmailTemplate = require('../src/models/EmailTemplate');

describe('Model-layer validation (direct, no HTTP)', () => {
  describe('User', () => {
    it('hashes the password on save and never stores it in plaintext', async () => {
      const user = await User.create({ name: 'A', email: 'hash@test.com', password: 'plaintext123' });
      const stored = await User.findById(user._id).select('+password');
      expect(stored.password).not.toBe('plaintext123');
      expect(await stored.matchPassword('plaintext123')).toBe(true);
      expect(await stored.matchPassword('wrongpass')).toBe(false);
    });

    it('does not re-hash the password when other fields are updated', async () => {
      const user = await User.create({ name: 'A', email: 'rehash@test.com', password: 'plaintext123' });
      const firstHash = (await User.findById(user._id).select('+password')).password;

      user.name = 'Updated Name';
      await user.save();

      const secondHash = (await User.findById(user._id).select('+password')).password;
      expect(secondHash).toBe(firstHash);
    });

    it('enforces unique email at the DB layer', async () => {
      await User.create({ name: 'A', email: 'dup@test.com', password: 'password123' });
      await expect(User.create({ name: 'B', email: 'dup@test.com', password: 'password123' }))
        .rejects.toThrow();
    });

    it('rejects an invalid email format', async () => {
      await expect(User.create({ name: 'A', email: 'not-an-email', password: 'password123' }))
        .rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('rejects a password shorter than 6 characters', async () => {
      await expect(User.create({ name: 'A', email: 'short@test.com', password: '123' }))
        .rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('rejects an unknown role value', async () => {
      await expect(User.create({ name: 'A', email: 'role@test.com', password: 'password123', role: 'superadmin' }))
        .rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('generateResetToken returns a raw token but stores only its SHA-256 hash', async () => {
      const user = await User.create({ name: 'A', email: 'reset@test.com', password: 'password123' });
      const rawToken = user.generateResetToken();
      expect(user.resetPasswordToken).not.toBe(rawToken);
      expect(user.resetPasswordToken).toHaveLength(64); // sha256 hex
      expect(user.resetPasswordExpire.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Lead', () => {
    it('requires companyName', async () => {
      await expect(Lead.create({})).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('defaults status to new and source to manual', async () => {
      const lead = await Lead.create({ companyName: 'Default Co' });
      expect(lead.status).toBe('new');
      expect(lead.source).toBe('manual');
    });

    it('rejects an out-of-enum status', async () => {
      await expect(Lead.create({ companyName: 'Bad Status Co', status: 'archived' }))
        .rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('rejects an out-of-enum source', async () => {
      await expect(Lead.create({ companyName: 'Bad Source Co', source: 'cold-call' }))
        .rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('accepts aiQualification=null but rejects an arbitrary string', async () => {
      const lead = await Lead.create({ companyName: 'Null Qual Co', aiQualification: null });
      expect(lead.aiQualification).toBeNull();
      await expect(Lead.create({ companyName: 'Bad Qual Co', aiQualification: 'lukewarm' }))
        .rejects.toThrow(mongoose.Error.ValidationError);
    });
  });

  describe('Proposal', () => {
    it('requires lead, title, and content', async () => {
      await expect(Proposal.create({})).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('defaults status to draft and clientDecision to pending', async () => {
      const lead = await Lead.create({ companyName: 'Prop Model Co' });
      const proposal = await Proposal.create({ lead: lead._id, title: 'T', content: 'C' });
      expect(proposal.status).toBe('draft');
      expect(proposal.clientDecision).toBe('pending');
    });

    it('enforces a unique publicToken when one is set', async () => {
      const lead = await Lead.create({ companyName: 'Token Uniq Co' });
      await Proposal.create({ lead: lead._id, title: 'T1', content: 'C', publicToken: 'shared-token-abc' });
      await expect(
        Proposal.create({ lead: lead._id, title: 'T2', content: 'C', publicToken: 'shared-token-abc' })
      ).rejects.toThrow();
    });

    it('allows multiple proposals with no publicToken (sparse unique index)', async () => {
      const lead = await Lead.create({ companyName: 'No Token Co' });
      await Proposal.create({ lead: lead._id, title: 'T1', content: 'C' });
      await expect(Proposal.create({ lead: lead._id, title: 'T2', content: 'C' })).resolves.toBeDefined();
    });
  });

  describe('OutreachLog', () => {
    it('requires lead, type, and message', async () => {
      await expect(OutreachLog.create({})).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('rejects an invalid type', async () => {
      const lead = await Lead.create({ companyName: 'Log Co' });
      await expect(OutreachLog.create({ lead: lead._id, type: 'carrier-pigeon', message: 'm' }))
        .rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('defaults status to pending', async () => {
      const lead = await Lead.create({ companyName: 'Pending Log Co' });
      const log = await OutreachLog.create({ lead: lead._id, type: 'email', message: 'm' });
      expect(log.status).toBe('pending');
    });
  });

  describe('Sequence', () => {
    it('requires user and name', async () => {
      await expect(Sequence.create({})).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('requires each step to have subject, body, and delayDays', async () => {
      const user = await User.create({ name: 'A', email: 'seqmodel@test.com', password: 'password123' });
      await expect(
        Sequence.create({ user: user._id, name: 'Bad Steps', steps: [{ stepNumber: 1 }] })
      ).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('defaults isActive to true', async () => {
      const user = await User.create({ name: 'A', email: 'seqmodel2@test.com', password: 'password123' });
      const seq = await Sequence.create({ user: user._id, name: 'Active By Default', steps: [] });
      expect(seq.isActive).toBe(true);
    });
  });

  describe('EmailTemplate', () => {
    it('requires user, name, subject, and body', async () => {
      await expect(EmailTemplate.create({})).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('rejects an invalid category', async () => {
      const user = await User.create({ name: 'A', email: 'tplmodel@test.com', password: 'password123' });
      await expect(
        EmailTemplate.create({ user: user._id, name: 'T', subject: 'S', body: 'B', category: 'not-a-category' })
      ).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('defaults usageCount to 0', async () => {
      const user = await User.create({ name: 'A', email: 'tplmodel2@test.com', password: 'password123' });
      const tpl = await EmailTemplate.create({ user: user._id, name: 'T', subject: 'S', body: 'B' });
      expect(tpl.usageCount).toBe(0);
    });
  });
});
