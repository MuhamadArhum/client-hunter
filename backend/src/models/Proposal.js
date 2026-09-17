const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Proposal title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Proposal content is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'rejected'],
      default: 'draft',
    },
    generatedBy: {
      type: String,
      enum: ['openai', 'groq', 'manual'],
      default: 'manual',
    },
    // No `default: null` here on purpose: a sparse unique index only skips
    // documents where the field is truly absent, not ones explicitly set to
    // null. With a default of null, every proposal would get an explicit
    // `publicToken: null`, and the second one ever created would collide on
    // the unique index. Leaving it undefined-by-default keeps the field
    // absent until a real share token is set.
    publicToken: { type: String, unique: true, sparse: true },
    isPublic: { type: Boolean, default: false },
    clientDecision: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    clientMessage: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Proposal', proposalSchema);
