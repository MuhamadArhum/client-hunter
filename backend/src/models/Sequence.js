const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  stepNumber: { type: Number, required: true },
  delayDays: { type: Number, required: true, default: 1 },
  subject: { type: String, required: true },
  body: { type: String, required: true },
}, { _id: false });

const sequenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  steps: [stepSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Sequence', sequenceSchema);
