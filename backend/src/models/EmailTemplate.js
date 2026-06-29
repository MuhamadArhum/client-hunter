const mongoose = require('mongoose');
const emailTemplateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  body: { type: String, required: true },
  category: { type: String, enum: ['cold-outreach', 'follow-up', 'proposal', 'general'], default: 'general' },
  usageCount: { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
