const axios = require('axios');

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const send = async (payload) => {
  if (!SLACK_WEBHOOK_URL) return;
  try {
    await axios.post(SLACK_WEBHOOK_URL, payload);
  } catch (e) {
    console.error('Slack notification failed:', e.message);
  }
};

const QUAL_EMOJI = { hot: '🔥', warm: '🟡', cold: '🔵' };
const SCORE_COLOR = (score) => score >= 8 ? '#E53E3E' : score >= 5 ? '#DD6B20' : '#3182CE';

const notifyNewLead = async (lead) => {
  const qual = lead.aiQualification || 'warm';
  await send({
    attachments: [{
      color: SCORE_COLOR(lead.aiScore || 5),
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${QUAL_EMOJI[qual]} *New Lead: ${lead.companyName}*\n${lead.aiSummary || 'New lead added to ClientHunter.'}`,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Score:* ${lead.aiScore || '?'}/10` },
            { type: 'mrkdwn', text: `*Qualification:* ${qual.toUpperCase()}` },
            { type: 'mrkdwn', text: `*Service:* ${lead.aiRecommendedService || 'TBD'}` },
            { type: 'mrkdwn', text: `*Source:* ${lead.source}` },
          ],
        },
        ...(lead.aiPainPoints?.length ? [{
          type: 'section',
          text: { type: 'mrkdwn', text: `*Pain Points:*\n${lead.aiPainPoints.map(p => `• ${p}`).join('\n')}` },
        }] : []),
      ],
    }],
  });
};

const notifyProposalGenerated = async (lead, proposal) => {
  await send({
    attachments: [{
      color: '#9F8DD4',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📄 *Proposal Generated*\n*${proposal.title}*\nFor: ${lead.companyName}`,
          },
        },
      ],
    }],
  });
};

const notifyFollowUpSent = async (lead) => {
  await send({
    attachments: [{
      color: '#1DD2D7',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📧 *Follow-up Sent*\nAuto follow-up email sent to *${lead.companyName}* (${lead.email})`,
          },
        },
      ],
    }],
  });
};

module.exports = { notifyNewLead, notifyProposalGenerated, notifyFollowUpSent };
