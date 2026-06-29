const express = require('express');
const router = express.Router();
const { getSequences, createSequence, updateSequence, deleteSequence, enrollLead, getEnrollments, pauseEnrollment } = require('../controllers/sequencesController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getSequences).post(createSequence);
router.route('/:id').put(updateSequence).delete(deleteSequence);
router.post('/:id/enroll', enrollLead);
router.get('/enrollments/all', getEnrollments);
router.patch('/enrollments/:enrollmentId', pauseEnrollment);

module.exports = router;
