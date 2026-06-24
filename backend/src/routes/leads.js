const express = require('express');
const router = express.Router();
const {
  getLeads, getLead, createLead, updateLead, deleteLead,
  scrapeLeads, analyzeSingleLead, getAutoReplyDraft, scheduleFollowUp,
  analyzeLeadWebsite, saveNotes, enrichLeadEmail, bulkEnrichEmails,
} = require('../controllers/leadsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getLeads).post(createLead);
router.post('/scrape', scrapeLeads);
router.post('/bulk-enrich', bulkEnrichEmails);
router.route('/:id').get(getLead).put(updateLead).delete(deleteLead);
router.post('/:id/analyze', analyzeSingleLead);
router.post('/:id/analyze-website', analyzeLeadWebsite);
router.post('/:id/auto-reply', getAutoReplyDraft);
router.post('/:id/schedule-followup', scheduleFollowUp);
router.post('/:id/enrich-email', enrichLeadEmail);
router.put('/:id/notes', saveNotes);

module.exports = router;
