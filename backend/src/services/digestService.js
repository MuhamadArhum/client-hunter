const cron = require('node-cron');
const Lead = require('../models/Lead');
const Proposal = require('../models/Proposal');
const OutreachLog = require('../models/OutreachLog');
const emailService = require('./emailService');

const sendDailyDigest = async () => {
  if (!process.env.DIGEST_EMAIL) return;
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [newLeads, proposals, outreach, hotLeads, totalLeads] = await Promise.all([
      Lead.countDocuments({ createdAt: { $gte: yesterday }, status: { $ne: 'deleted' } }),
      Proposal.countDocuments({ createdAt: { $gte: yesterday } }),
      OutreachLog.countDocuments({ createdAt: { $gte: yesterday }, status: 'sent' }),
      Lead.countDocuments({ aiQualification: 'hot', status: { $ne: 'deleted' } }),
      Lead.countDocuments({ status: { $ne: 'deleted' } }),
    ]);

    const topLeads = await Lead.find({ aiQualification: 'hot', status: { $nin: ['converted', 'lost', 'deleted'] } })
      .sort({ aiScore: -1 }).limit(5).lean();

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f9fafb">
        <div style="background:linear-gradient(135deg,#1DD2D7,#9F8DD4);padding:24px;border-radius:12px;color:white;margin-bottom:24px">
          <h1 style="margin:0;font-size:22px">📊 Daily Pipeline Digest</h1>
          <p style="margin:8px 0 0;opacity:0.85">${new Date().toDateString()}</p>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:24px">
          ${[
            ['🆕 New Leads', newLeads],
            ['📄 Proposals', proposals],
            ['📧 Emails Sent', outreach],
            ['🔥 Hot Leads', hotLeads],
          ].map(([label, val]) => `
            <div style="background:white;border-radius:10px;padding:16px;text-align:center;border:1px solid #e5e7eb">
              <div style="font-size:28px;font-weight:800;color:#1DD2D7">${val}</div>
              <div style="font-size:13px;color:#6b7280;margin-top:4px">${label}</div>
            </div>`).join('')}
        </div>
        ${topLeads.length > 0 ? `
        <div style="background:white;border-radius:10px;padding:20px;border:1px solid #e5e7eb">
          <h3 style="margin:0 0 12px;font-size:15px;color:#111827">🔥 Top Hot Leads</h3>
          ${topLeads.map((l) => `
            <div style="padding:10px 0;border-bottom:1px solid #f3f4f6">
              <strong>${l.companyName}</strong>
              <span style="float:right;background:#fef2f2;color:#ef4444;padding:2px 8px;border-radius:20px;font-size:12px">${l.aiScore}/10</span>
              <div style="font-size:12px;color:#6b7280;margin-top:2px">${l.industry || 'N/A'} · ${l.status}</div>
            </div>`).join('')}
        </div>` : ''}
        <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px">Abyte Hunt by Abyte Sol · Total leads: ${totalLeads}</p>
      </div>`;

    await emailService.sendEmail({
      to: process.env.DIGEST_EMAIL,
      subject: `📊 Daily Digest — ${new Date().toDateString()}`,
      html,
    });
    console.log('[Digest] Daily digest sent to', process.env.DIGEST_EMAIL);
  } catch (err) {
    console.error('[Digest] Failed:', err.message);
  }
};

const startDigestCron = () => {
  cron.schedule('0 8 * * *', sendDailyDigest); // 8am daily
  console.log('[Digest] Cron started — runs daily at 8am');
};

module.exports = { startDigestCron, sendDailyDigest };
