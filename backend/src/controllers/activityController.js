const OutreachLog = require('../models/OutreachLog');
const Lead = require('../models/Lead');

const getActivity = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [logs, leads] = await Promise.all([
      OutreachLog.find()
        .populate('lead', 'companyName email')
        .sort({ createdAt: -1 })
        .limit(100),
      Lead.find({ status: { $ne: 'deleted' } })
        .sort({ updatedAt: -1 })
        .limit(50)
        .select('companyName status aiScore aiQualification updatedAt createdAt'),
    ]);

    const activities = [];

    // Map outreach logs
    for (const log of logs) {
      const companyName = log.lead?.companyName || 'Unknown';
      activities.push({
        id: `outreach_${log._id}`,
        type: 'outreach',
        title: `Email sent to ${companyName}`,
        subtitle: log.subject || '',
        status: log.status,
        timestamp: log.createdAt,
        icon: 'mail',
      });
    }

    // Map leads
    for (const lead of leads) {
      const isNew = lead.createdAt >= sevenDaysAgo;

      if (isNew) {
        activities.push({
          id: `lead_new_${lead._id}`,
          type: 'lead_new',
          title: `New lead: ${lead.companyName}`,
          subtitle: lead.status,
          status: lead.status,
          timestamp: lead.createdAt,
          icon: 'user-plus',
        });
      } else {
        activities.push({
          id: `lead_update_${lead._id}`,
          type: 'lead_update',
          title: `${lead.companyName} → ${lead.status}`,
          subtitle: lead.aiQualification || '',
          status: lead.status,
          timestamp: lead.updatedAt,
          icon: 'refresh-cw',
        });
      }
    }

    // Sort by timestamp descending and return top 80
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const result = activities.slice(0, 80);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Activity] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch activity' });
  }
};

module.exports = { getActivity };
