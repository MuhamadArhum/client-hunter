const EmailTemplate = require('../models/EmailTemplate');

exports.getTemplates = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const filter = { user: req.user._id };
    if (category && category !== 'all') filter.category = category;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [templates, total] = await Promise.all([
      EmailTemplate.find(filter).sort({ usageCount: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      EmailTemplate.countDocuments(filter),
    ]);

    // Category counts (unfiltered by search/category for tab badges)
    const allCounts = await EmailTemplate.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const categoryCounts = { all: await EmailTemplate.countDocuments({ user: req.user._id }) };
    allCounts.forEach(({ _id, count }) => { categoryCounts[_id] = count; });

    res.json({
      success: true,
      data: templates,
      categoryCounts,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const { name, subject, body, category } = req.body;
    const template = await EmailTemplate.create({ user: req.user._id, name, subject, body, category });
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { name, subject, body, category } = req.body;
    const template = await EmailTemplate.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, subject, body, category },
      { new: true, runValidators: true }
    );
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.useTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $inc: { usageCount: 1 } },
      { new: true }
    );
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
