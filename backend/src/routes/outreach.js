const express = require('express');
const router = express.Router();
const {
  sendEmail,
  sendWhatsApp,
  getOutreachHistory,
  scheduleFollowUp,
} = require('../controllers/outreachController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/email', sendEmail);
router.post('/whatsapp', sendWhatsApp);
router.get('/history/:leadId', getOutreachHistory);
router.post('/schedule', scheduleFollowUp);

module.exports = router;
