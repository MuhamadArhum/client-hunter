const EmailTemplate = require('../models/EmailTemplate');

exports.getTemplates = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { user: req.user._id };
    if (category) filter.category = category;
    const templates = await EmailTemplate.find(filter).sort({ usageCount: -1, createdAt: -1 });
    res.json({ success: true, data: templates });
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
