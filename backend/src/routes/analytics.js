const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getLeadsBySource,
  getOutreachStats,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/leads-by-source', getLeadsBySource);
router.get('/outreach-stats', getOutreachStats);

module.exports = router;
