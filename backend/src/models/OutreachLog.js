const mongoose = require('mongoose');

const outreachLogSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead reference is required'],
    },
    type: {
      type: String,
      enum: ['email', 'whatsapp', 'manual'],
      required: [true, 'Outreach type is required'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    subject: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending',
    },
    sentAt: {
      type: Date,
      default: null,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    response: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OutreachLog', outreachLogSchema);
