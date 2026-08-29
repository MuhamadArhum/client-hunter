const OutreachLog = require('../models/OutreachLog');
const Lead = require('../models/Lead');

const getActivity = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Fetch enough raw data to merge & sort before paginating
    const fetchLimit = pageNum * limitNum + 100;

    const outreachFilter = {};
    if (type === 'outreach') outreachFilter._always = true;

    const [logs, leads] = await Promise.all([
      (!type || type === 'outreach')
        ? OutreachLog.find()
            .populate('lead', 'companyName email')
            .sort({ createdAt: -1 })
            .limit(fetchLimit)
        : Promise.resolve([]),
      (!type || type === 'lead_new' || type === 'lead_update')
        ? Lead.find({ status: { $ne: 'deleted' } })
            .sort({ updatedAt: -1 })
            .limit(fetchLimit)
            .select('companyName status aiScore aiQualification updatedAt createdAt')
        : Promise.resolve([]),
    ]);

    const activities = [];

    for (const log of logs) {
      const companyName = log.lead?.companyName || 'Unknown';
      const item = {
        id: `outreach_${log._id}`,
        type: 'outreach',
        title: `${log.type === 'email' ? 'Email' : 'WhatsApp'} sent to ${companyName}`,
        subtitle: log.subject || '',
        status: log.status,
        timestamp: log.createdAt,
        icon: 'mail',
      };
      if (!type || type === item.type) activities.push(item);
    }

    for (const lead of leads) {
      const isNew = lead.createdAt >= sevenDaysAgo;
      const item = {
        id: isNew ? `lead_new_${lead._id}` : `lead_update_${lead._id}`,
        type: isNew ? 'lead_new' : 'lead_update',
        title: isNew ? `New lead: ${lead.companyName}` : `${lead.companyName} → ${lead.status}`,
        subtitle: isNew ? lead.status : (lead.aiQualification || ''),
        status: lead.status,
        timestamp: isNew ? lead.createdAt : lead.updatedAt,
        icon: isNew ? 'user-plus' : 'refresh-cw',
      };
      if (!type || type === item.type) activities.push(item);
    }

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = activities.length;
    const skip  = (pageNum - 1) * limitNum;
    const data  = activities.slice(skip, skip + limitNum);

    res.json({
      success: true,
      data,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('[Activity] Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch activity' });
  }
};

module.exports = { getActivity };
