const express = require('express');
const router = express.Router();
const {
  getProposals, generateProposal, updateProposal, deleteProposal,
  shareProposal, revokeShare, getPublicProposal, clientRespond,
} = require('../controllers/proposalsController');
const { protect } = require('../middleware/auth');
const { generateProposalRules, mongoIdParamRules } = require('../middleware/validate');
const { aiLimiter } = require('../middleware/rateLimiter');

// Public routes (no auth required)
router.get('/public/:token', getPublicProposal);
router.post('/public/:token/respond', clientRespond);

// Protected routes
router.use(protect);

router.get('/', getProposals);
router.post('/generate', generateProposalRules, aiLimiter, generateProposal);
router.route('/:id').put(mongoIdParamRules, updateProposal).delete(mongoIdParamRules, deleteProposal);
router.post('/:id/share', mongoIdParamRules, shareProposal);
router.delete('/:id/share', mongoIdParamRules, revokeShare);

module.exports = router;
