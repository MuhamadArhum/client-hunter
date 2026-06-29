const cron = require('node-cron');
const SequenceEnrollment = require('../models/SequenceEnrollment');
const Sequence = require('../models/Sequence');
const Lead = require('../models/Lead');
const OutreachLog = require('../models/OutreachLog');
const { Resend } = require('resend');
const crypto = require('crypto');

async function processSequenceEmails() {
  const now = new Date();
  const enrollments = await SequenceEnrollment.find({
    status: 'active',
    nextSendAt: { $lte: now },
  }).populate('sequence').populate('lead');

  for (const enrollment of enrollments) {
    try {
      const { sequence, lead } = enrollment;
      if (!sequence || !lead) { await enrollment.updateOne({ status: 'completed' }); continue; }

      const step = sequence.steps[enrollment.currentStep];
      if (!step) { await enrollment.updateOne({ status: 'completed' }); continue; }

      if (lead.email && process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const trackingId = crypto.randomBytes(16).toString('hex');
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        const pixelTag = `<img src="${baseUrl}/api/outreach/track/open/${trackingId}" width="1" height="1" style="display:none" />`;

        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'noreply@example.com',
          to: lead.email,
          subject: step.subject,
          html: step.body + pixelTag,
        });

        await OutreachLog.create({
          lead: lead._id, type: 'email', subject: step.subject, message: step.body,
          status: 'sent', sentAt: now, trackingId,
        });
      }

      const nextStepIndex = enrollment.currentStep + 1;
      if (nextStepIndex >= sequence.steps.length) {
        await enrollment.updateOne({ status: 'completed', currentStep: nextStepIndex });
      } else {
        const nextStep = sequence.steps[nextStepIndex];
        const nextSendAt = new Date();
        nextSendAt.setDate(nextSendAt.getDate() + nextStep.delayDays);
        await enrollment.updateOne({ currentStep: nextStepIndex, nextSendAt, $push: { completedSteps: enrollment.currentStep } });
      }
    } catch (err) {
      console.error('[Sequence] Error processing enrollment:', enrollment._id, err.message);
    }
  }
}

function startSequenceCron() {
  cron.schedule('0 * * * *', async () => {
    console.log('[Sequence] Processing sequence emails...');
    try { await processSequenceEmails(); } catch (err) { console.error('[Sequence] Cron error:', err); }
  });
  console.log('[Sequence] Sequence cron started (every hour)');
}

module.exports = { startSequenceCron, processSequenceEmails };
