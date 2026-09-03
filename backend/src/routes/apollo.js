const express = require('express');
const router = express.Router();
const { searchApollo, importApolloLeads } = require('../controllers/apolloController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/search', searchApollo);
router.post('/import', importApolloLeads);

module.exports = router;
