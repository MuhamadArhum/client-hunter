const Lead = require('../models/Lead');
const Proposal = require('../models/Proposal');
const OutreachLog = require('../models/OutreachLog');

// @desc    Get dashboard stats
// @route   GET /api/analytics/dashboard
// @access  Private (admin)
const getDashboardStats = async (req, res) => {
  try {
    const totalLeads = await Lead.countDocuments({ status: { $ne: 'deleted' } });

    const statusCounts = await Lead.aggregate([
      { $match: { status: { $ne: 'deleted' } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusMap = {};
    statusCounts.forEach(({ _id, count }) => {
      statusMap[_id] = count;
    });

    const convertedCount = statusMap['converted'] || 0;
    const conversionRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : 0;

    const totalProposals = await Proposal.countDocuments();
    const sentProposals = await Proposal.countDocuments({ status: { $in: ['sent', 'accepted', 'rejected'] } });
    const totalEmails = await OutreachLog.countDocuments({ type: 'email', status: 'sent' });
    const totalWhatsApp = await OutreachLog.countDocuments({ type: 'whatsapp', status: 'sent' });

    const recentLeads = await Lead.find({ status: { $ne: 'deleted' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('assignedTo', 'name email');

    const recentOutreach = await OutreachLog.find({ status: 'sent' })
      .sort({ sentAt: -1 })
      .limit(5)
      .populate('lead', 'companyName contactName');

    res.status(200).json({
      success: true,
      data: {
        totalLeads,
        conversionRate: parseFloat(conversionRate),
        totalProposals,
        sentProposals,
        totalEmails,
        totalWhatsApp,
        statusBreakdown: statusMap,
        recentLeads,
        recentOutreach,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get leads breakdown by source
// @route   GET /api/analytics/leads-by-source
// @access  Private (admin)
const getLeadsBySource = async (req, res) => {
  try {
    const sourceData = await Lead.aggregate([
      { $match: { status: { $ne: 'deleted' } } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const formatted = sourceData.map(({ _id, count }) => ({
      source: _id || 'unknown',
      count,
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get outreach statistics
// @route   GET /api/analytics/outreach-stats
// @access  Private (admin)
const getOutreachStats = async (req, res) => {
  try {
    const emailsSent = await OutreachLog.countDocuments({ type: 'email', status: 'sent' });
    const whatsappSent = await OutreachLog.countDocuments({ type: 'whatsapp', status: 'sent' });
    const emailsFailed = await OutreachLog.countDocuments({ type: 'email', status: 'failed' });
    const whatsappFailed = await OutreachLog.countDocuments({ type: 'whatsapp', status: 'failed' });
    const pendingFollowUps = await OutreachLog.countDocuments({ status: 'pending' });

    const withResponse = await OutreachLog.countDocuments({
      status: 'sent',
      response: { $ne: '', $exists: true },
    });

    const totalSent = emailsSent + whatsappSent;
    const responseRate = totalSent > 0 ? ((withResponse / totalSent) * 100).toFixed(1) : 0;

    // Get outreach over last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const outreachOverTime = await OutreachLog.aggregate([
      {
        $match: {
          sentAt: { $gte: sevenDaysAgo },
          status: 'sent',
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$sentAt' } },
            type: '$type',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        emailsSent,
        whatsappSent,
        emailsFailed,
        whatsappFailed,
        pendingFollowUps,
        responseRate: parseFloat(responseRate),
        outreachOverTime,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats, getLeadsBySource, getOutreachStats };
