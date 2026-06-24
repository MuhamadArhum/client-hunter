const express = require('express');
const router = express.Router();
const {
  getProposals,
  generateProposal,
  updateProposal,
  deleteProposal,
} = require('../controllers/proposalsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getProposals);
router.post('/generate', generateProposal);
router.route('/:id').put(updateProposal).delete(deleteProposal);

module.exports = router;
