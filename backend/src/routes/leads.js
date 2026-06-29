const express = require('express');
const router = express.Router();
const {
  getLeads, getLead, createLead, updateLead, deleteLead,
  scrapeLeads, analyzeSingleLead, getAutoReplyDraft, scheduleFollowUp,
  analyzeLeadWebsite, saveNotes, enrichLeadEmail, bulkEnrichEmails,
  bulkDeleteLeads, exportLeadsCSV, importLeadsCSV,
} = require('../controllers/leadsController');
const { protect } = require('../middleware/auth');
const { createLeadRules, updateLeadRules, mongoIdParamRules } = require('../middleware/validate');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(protect);

router.route('/').get(getLeads).post(createLeadRules, createLead);
router.post('/scrape', scrapeLeads);
router.post('/bulk-enrich', bulkEnrichEmails);
router.post('/bulk-delete', bulkDeleteLeads);
router.get('/export/csv', exportLeadsCSV);
router.post('/import/csv', importLeadsCSV);
router.route('/:id').get(mongoIdParamRules, getLead).put(updateLeadRules, updateLead).delete(mongoIdParamRules, deleteLead);
router.post('/:id/analyze', mongoIdParamRules, aiLimiter, analyzeSingleLead);
router.post('/:id/analyze-website', mongoIdParamRules, aiLimiter, analyzeLeadWebsite);
router.post('/:id/auto-reply', mongoIdParamRules, aiLimiter, getAutoReplyDraft);
router.post('/:id/schedule-followup', mongoIdParamRules, scheduleFollowUp);
router.post('/:id/enrich-email', mongoIdParamRules, enrichLeadEmail);
router.put('/:id/notes', mongoIdParamRules, saveNotes);

module.exports = router;
