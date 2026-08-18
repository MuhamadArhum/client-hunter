const express = require('express');
const { protect } = require('../middleware/auth');
const { getIntegrations, updateIntegrations } = require('../controllers/settingsController');

const router = express.Router();

router.use(protect);

router.get('/integrations',  getIntegrations);
router.put('/integrations',  updateIntegrations);

module.exports = router;
