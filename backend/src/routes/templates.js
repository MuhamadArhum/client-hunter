const express = require('express');
const router = express.Router();
const { getTemplates, createTemplate, updateTemplate, deleteTemplate, useTemplate } = require('../controllers/templatesController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getTemplates).post(createTemplate);
router.route('/:id').put(updateTemplate).delete(deleteTemplate);
router.post('/:id/use', useTemplate);

module.exports = router;
