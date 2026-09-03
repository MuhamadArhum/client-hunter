const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getLeadsBySource,
  getOutreachStats,
  getConversionBySource,
  getProposalStats,
  getAIBreakdown,
  getEmailTrackingStats,
  getMonthlyTrend,
  exportAnalyticsCSV,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/leads-by-source', getLeadsBySource);
router.get('/outreach-stats', getOutreachStats);
router.get('/conversion-by-source', getConversionBySource);
router.get('/proposal-stats', getProposalStats);
router.get('/ai-breakdown', getAIBreakdown);
router.get('/email-tracking', getEmailTrackingStats);
router.get('/monthly-trend', getMonthlyTrend);
router.get('/export/csv', exportAnalyticsCSV);

module.exports = router;
