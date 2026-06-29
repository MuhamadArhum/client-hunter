const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  sequence: { type: mongoose.Schema.Types.ObjectId, ref: 'Sequence', required: true },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currentStep: { type: Number, default: 0 },
  nextSendAt: { type: Date, required: true },
  status: { type: String, enum: ['active', 'completed', 'paused', 'unsubscribed'], default: 'active' },
  completedSteps: [{ type: Number }],
}, { timestamps: true });

enrollmentSchema.index({ nextSendAt: 1, status: 1 });
module.exports = mongoose.model('SequenceEnrollment', enrollmentSchema);
