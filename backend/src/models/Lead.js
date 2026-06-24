const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    contactName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      enum: ['upwork', 'linkedin', 'manual', 'scraped'],
      default: 'manual',
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'proposal_sent', 'follow_up', 'converted', 'lost', 'deleted'],
      default: 'new',
    },
    industry: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    budget: {
      type: String,
      trim: true,
      default: '',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Index for search and filtering
leadSchema.index({ companyName: 'text', contactName: 'text', email: 'text' });
leadSchema.index({ status: 1, source: 1 });

module.exports = mongoose.model('Lead', leadSchema);
