const express = require('express');
const router = express.Router();
const {
  sendEmail, sendWhatsApp, getOutreachHistory, scheduleFollowUp, getAllOutreachLogs, trackOpen, trackClick,
  handleResendWebhook, retryOutreach,
} = require('../controllers/outreachController');
const { protect } = require('../middleware/auth');
const { sendEmailRules, sendWhatsAppRules } = require('../middleware/validate');

// Public endpoints (no auth required)
router.get('/track/open/:trackingId', trackOpen);
router.get('/track/click/:trackingId', trackClick);
router.post('/webhook/resend', handleResendWebhook);

router.use(protect);

router.get('/', getAllOutreachLogs);
router.post('/email', sendEmailRules, sendEmail);
router.post('/whatsapp', sendWhatsAppRules, sendWhatsApp);
router.get('/history/:leadId', getOutreachHistory);
router.post('/schedule', scheduleFollowUp);
router.post('/retry/:logId', retryOutreach);

module.exports = router;
