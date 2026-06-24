const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  scrapeLeads,
} = require('../controllers/leadsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getLeads).post(createLead);
router.post('/scrape', scrapeLeads);
router.route('/:id').get(getLead).put(updateLead).delete(deleteLead);

module.exports = router;
