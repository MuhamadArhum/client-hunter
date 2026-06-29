const cron = require('node-cron');
const Lead = require('../models/Lead');
const OutreachLog = require('../models/OutreachLog');
const emailService = require('./emailService');
const { generateFollowUpMessage } = require('./groqService');
const { notifyFollowUpSent } = require('./slackService');

const processFollowUps = async () => {
  try {
    const now = new Date();
    const leads = await Lead.find({
      followUpScheduled: { $lte: now },
      followUpSent: false,
      email: { $ne: '' },
      status: { $in: ['contacted', 'proposal_sent', 'follow_up'] },
    });

    console.log(`[Follow-up] Found ${leads.length} leads due for follow-up`);

    for (const lead of leads) {
      try {
        const { subject, message } = await generateFollowUpMessage(lead);
        await emailService.sendEmail({
          to: lead.email,
          subject,
          html: `<div style="font-family:sans-serif;line-height:1.6">${message.replace(/\n/g, '<br/>')}</div>`,
        });

        await Lead.findByIdAndUpdate(lead._id, {
          followUpSent: true,
          status: 'follow_up',
        });

        await notifyFollowUpSent(lead);
        console.log(`[Follow-up] Sent to ${lead.email}`);
      } catch (err) {
        console.error(`[Follow-up] Failed for ${lead.companyName}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Follow-up] Cron error:', err.message);
  }
};

const startFollowUpCron = () => {
  // Run every hour
  cron.schedule('0 * * * *', processFollowUps);
  console.log('[Follow-up] Cron job started — runs every hour');
};

const processProposalFollowUps = async () => {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    // Find leads in proposal_sent status for more than 3 days
    const leads = await Lead.find({
      status: 'proposal_sent',
      updatedAt: { $lte: threeDaysAgo },
      email: { $nin: ['', null] },
      followUpSent: false,
    }).limit(20);

    console.log(`[Proposal Follow-up] Found ${leads.length} leads needing follow-up`);

    for (const lead of leads) {
      try {
        const { subject, message } = await generateFollowUpMessage(lead);
        await emailService.sendEmail({
          to: lead.email,
          subject: `Follow-up: ${subject}`,
          html: `<div style="font-family:sans-serif;line-height:1.6">${message.replace(/\n/g, '<br/>')}</div>`,
        });
        await Lead.findByIdAndUpdate(lead._id, { status: 'follow_up', followUpSent: true });
        console.log(`[Proposal Follow-up] Sent to ${lead.email}`);
      } catch (err) {
        console.error(`[Proposal Follow-up] Failed for ${lead.companyName}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Proposal Follow-up] Cron error:', err.message);
  }
};

const startProposalFollowUpCron = () => {
  cron.schedule('0 9 * * *', processProposalFollowUps);
  console.log('[Proposal Follow-up] Cron started — runs daily at 9am');
};

module.exports = { startFollowUpCron, processFollowUps, startProposalFollowUpCron };
