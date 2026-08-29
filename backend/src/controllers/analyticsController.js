const Lead = require('../models/Lead');
const Proposal = require('../models/Proposal');
const OutreachLog = require('../models/OutreachLog');

const isProd = process.env.NODE_ENV === 'production';
const serverError = (res, error) =>
  res.status(500).json({ success: false, message: isProd ? 'An unexpected error occurred.' : error.message });

const getDashboardStats = async (req, res) => {
  try {
    const totalLeads = await Lead.countDocuments({ status: { $ne: 'deleted' } });

    const statusCounts = await Lead.aggregate([
      { $match: { status: { $ne: 'deleted' } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const convertedCount = statusCounts.find(s => s._id === 'converted')?.count || 0;
    const conversionRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : 0;

    const sentProposals = await Proposal.countDocuments({ status: { $in: ['sent', 'accepted', 'rejected'] } });
    const totalEmails = await OutreachLog.countDocuments({ type: 'email', status: 'sent' });

    const recentLeads = await Lead.find({ status: { $ne: 'deleted' } })
      .sort({ createdAt: -1 }).limit(5);

    const recentOutreach = await OutreachLog.find()
      .sort({ createdAt: -1 }).limit(5)
      .populate('lead', 'companyName');

    res.status(200).json({
      success: true,
      data: {
        totalLeads,
        conversionRate: parseFloat(conversionRate),
        sentProposals,
        totalEmails,
        statusBreakdown: statusCounts,
        recentLeads,
        recentOutreach,
      },
    });
  } catch (error) {
    serverError(res, error);
  }
};

const getLeadsBySource = async (req, res) => {
  try {
    const sourceData = await Lead.aggregate([
      { $match: { status: { $ne: 'deleted' } } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.status(200).json({ success: true, data: sourceData });
  } catch (error) {
    serverError(res, error);
  }
};

const getOutreachStats = async (req, res) => {
  try {
    const emailSent = await OutreachLog.countDocuments({ type: 'email', status: 'sent' });
    const emailFailed = await OutreachLog.countDocuments({ type: 'email', status: 'failed' });
    const whatsappSent = await OutreachLog.countDocuments({ type: 'whatsapp', status: 'sent' });
    const whatsappFailed = await OutreachLog.countDocuments({ type: 'whatsapp', status: 'failed' });

    res.status(200).json({
      success: true,
      data: { emailSent, emailFailed, whatsappSent, whatsappFailed },
    });
  } catch (error) {
    serverError(res, error);
  }
};

// @desc    Conversion rate by source
// @route   GET /api/analytics/conversion-by-source
const getConversionBySource = async (req, res) => {
  try {
    const data = await Lead.aggregate([
      { $match: { status: { $ne: 'deleted' } } },
      {
        $group: {
          _id: '$source',
          total: { $sum: 1 },
          converted: {
            $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          source: '$_id',
          total: 1,
          converted: 1,
          conversionRate: {
            $round: [{ $multiply: [{ $divide: ['$converted', '$total'] }, 100] }, 1],
          },
        },
      },
      { $sort: { conversionRate: -1 } },
    ]);
    res.status(200).json({ success: true, data });
  } catch (error) {
    serverError(res, error);
  }
};

// @desc    Proposal acceptance rate + breakdown
// @route   GET /api/analytics/proposal-stats
const getProposalStats = async (req, res) => {
  try {
    const total = await Proposal.countDocuments();
    const accepted = await Proposal.countDocuments({ status: 'accepted' });
    const rejected = await Proposal.countDocuments({ status: 'rejected' });
    const sent = await Proposal.countDocuments({ status: 'sent' });
    const draft = await Proposal.countDocuments({ status: 'draft' });

    const acceptanceRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        total, accepted, rejected, sent, draft,
        acceptanceRate: parseFloat(acceptanceRate),
      },
    });
  } catch (error) {
    serverError(res, error);
  }
};

// @desc    AI qualification breakdown (hot/warm/cold)
// @route   GET /api/analytics/ai-breakdown
const getAIBreakdown = async (req, res) => {
  try {
    const qualData = await Lead.aggregate([
      { $match: { status: { $ne: 'deleted' }, aiQualification: { $ne: null } } },
      { $group: { _id: '$aiQualification', count: { $sum: 1 } } },
    ]);

    const avgScore = await Lead.aggregate([
      { $match: { status: { $ne: 'deleted' }, aiScore: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$aiScore' } } },
    ]);

    const topLeads = await Lead.find({ aiScore: { $gte: 8 }, status: { $ne: 'deleted' } })
      .sort({ aiScore: -1 })
      .limit(5)
      .select('companyName aiScore aiQualification aiRecommendedService');

    res.status(200).json({
      success: true,
      data: {
        qualBreakdown: qualData,
        avgScore: avgScore[0]?.avg?.toFixed(1) || 0,
        topLeads,
      },
    });
  } catch (error) {
    serverError(res, error);
  }
};

// @desc    Email open & click tracking stats
// @route   GET /api/analytics/email-tracking
const getEmailTrackingStats = async (req, res) => {
  try {
    const totalSent = await OutreachLog.countDocuments({ type: 'email', status: 'sent' });
    const totalOpened = await OutreachLog.countDocuments({ type: 'email', status: 'sent', openedAt: { $ne: null } });
    const totalClicked = await OutreachLog.countDocuments({ type: 'email', status: 'sent', clickedAt: { $ne: null } });

    const openRate = totalSent > 0 ? parseFloat(((totalOpened / totalSent) * 100).toFixed(1)) : 0;
    const clickRate = totalSent > 0 ? parseFloat(((totalClicked / totalSent) * 100).toFixed(1)) : 0;
    const clickToOpenRate = totalOpened > 0 ? parseFloat(((totalClicked / totalOpened) * 100).toFixed(1)) : 0;

    res.status(200).json({
      success: true,
      data: { totalSent, totalOpened, totalClicked, openRate, clickRate, clickToOpenRate },
    });
  } catch (error) {
    serverError(res, error);
  }
};

// @desc    Monthly outreach trend (last 6 months)
// @route   GET /api/analytics/monthly-trend
const getMonthlyTrend = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [outreachTrend, leadsTrend] = await Promise.all([
      OutreachLog.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo }, status: 'sent' } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, type: '$type' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Lead.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $ne: 'deleted' } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString('en', { month: 'short' }) });
    }

    const result = months.map(({ year, month, label }) => {
      const emailEntry = outreachTrend.find(e => e._id.year === year && e._id.month === month && e._id.type === 'email');
      const waEntry = outreachTrend.find(e => e._id.year === year && e._id.month === month && e._id.type === 'whatsapp');
      const leadsEntry = leadsTrend.find(e => e._id.year === year && e._id.month === month);
      return {
        month: label,
        emails: emailEntry?.count || 0,
        whatsapp: waEntry?.count || 0,
        leads: leadsEntry?.count || 0,
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    serverError(res, error);
  }
};

module.exports = {
  getDashboardStats,
  getLeadsBySource,
  getOutreachStats,
  getConversionBySource,
  getProposalStats,
  getAIBreakdown,
  getEmailTrackingStats,
  getMonthlyTrend,
};
