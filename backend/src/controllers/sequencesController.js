const Sequence = require('../models/Sequence');
const SequenceEnrollment = require('../models/SequenceEnrollment');
const Lead = require('../models/Lead');

exports.getSequences = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const filter = { user: req.user._id };
    if (search) filter.name = { $regex: search, $options: 'i' };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [sequences, total] = await Promise.all([
      Sequence.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Sequence.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: sequences,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createSequence = async (req, res) => {
  try {
    const { name, description, steps } = req.body;
    const sequence = await Sequence.create({ user: req.user._id, name, description, steps });
    res.status(201).json({ success: true, data: sequence });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSequence = async (req, res) => {
  try {
    const { name, description, steps, isActive } = req.body;
    const sequence = await Sequence.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, description, steps, isActive },
      { new: true, runValidators: true }
    );
    if (!sequence) return res.status(404).json({ success: false, message: 'Sequence not found' });
    res.json({ success: true, data: sequence });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSequence = async (req, res) => {
  try {
    const sequence = await Sequence.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!sequence) return res.status(404).json({ success: false, message: 'Sequence not found' });
    await SequenceEnrollment.deleteMany({ sequence: req.params.id });
    res.json({ success: true, message: 'Sequence deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.enrollLead = async (req, res) => {
  try {
    const { leadId } = req.body;
    const sequence = await Sequence.findOne({ _id: req.params.id, user: req.user._id });
    if (!sequence) return res.status(404).json({ success: false, message: 'Sequence not found' });
    if (!sequence.steps.length) return res.status(400).json({ success: false, message: 'Sequence has no steps' });

    const existing = await SequenceEnrollment.findOne({ sequence: sequence._id, lead: leadId, status: 'active' });
    if (existing) return res.status(400).json({ success: false, message: 'Lead already enrolled in this sequence' });

    const nextSendAt = new Date();
    nextSendAt.setDate(nextSendAt.getDate() + (sequence.steps[0].delayDays || 0));

    const enrollment = await SequenceEnrollment.create({
      sequence: sequence._id, lead: leadId, user: req.user._id, currentStep: 0, nextSendAt,
    });
    res.status(201).json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEnrollments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { user: req.user._id };
    if (status && status !== 'all') filter.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [enrollments, total] = await Promise.all([
      SequenceEnrollment.find(filter)
        .populate('sequence', 'name steps')
        .populate('lead', 'companyName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SequenceEnrollment.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: enrollments,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.pauseEnrollment = async (req, res) => {
  try {
    const enrollment = await SequenceEnrollment.findOneAndUpdate(
      { _id: req.params.enrollmentId, user: req.user._id },
      { status: req.body.status === 'active' ? 'active' : 'paused' },
      { new: true }
    );
    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });
    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
