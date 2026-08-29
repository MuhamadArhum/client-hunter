const express = require('express');
const { protect } = require('../middleware/auth');
const { getIntegrations, updateIntegrations } = require('../controllers/settingsController');
const { getStatus } = require('../services/aiService');

const router = express.Router();

router.use(protect);

router.get('/integrations',  getIntegrations);
router.put('/integrations',  updateIntegrations);

router.get('/ai-status', async (req, res) => {
  try {
    const status = await getStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
