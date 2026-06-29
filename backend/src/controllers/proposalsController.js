const crypto = require('crypto');
const Proposal = require('../models/Proposal');
const Lead = require('../models/Lead');
const groqService = require('../services/groqService');
const { notifyProposalGenerated } = require('../services/slackService');

// @desc    Get all proposals with optional filters
// @route   GET /api/proposals
// @access  Private
const getProposals = async (req, res) => {
  try {
    const { status, leadId, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (leadId) query.lead = leadId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [proposals, total] = await Promise.all([
      Proposal.find(query)
        .populate('lead', 'companyName contactName email status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Proposal.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: proposals,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate a proposal using OpenAI
// @route   POST /api/proposals/generate
// @access  Private
const generateProposal = async (req, res) => {
  try {
    const { leadId, customInstructions } = req.body;

    if (!leadId) {
      return res.status(400).json({ success: false, message: 'Lead ID is required' });
    }

    const lead = await Lead.findById(leadId);
    if (!lead || lead.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const { title, content } = await groqService.generateProposal(lead, customInstructions);

    const proposal = await Proposal.create({
      lead: leadId,
      title,
      content,
      status: 'draft',
      generatedBy: 'groq',
    });

    // Update lead status to proposal_sent if it was new or contacted
    if (lead.status === 'new' || lead.status === 'contacted') {
      await Lead.findByIdAndUpdate(leadId, { status: 'proposal_sent' });
    }

    await proposal.populate('lead', 'companyName contactName email status');

    res.status(201).json({
      success: true,
      message: 'Proposal generated successfully',
      data: proposal,
    });

    notifyProposalGenerated(lead, proposal);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a proposal
// @route   PUT /api/proposals/:id
// @access  Private
const updateProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    const { title, content, status } = req.body;
    const allowedUpdates = { title, content, status };
    Object.keys(allowedUpdates).forEach((k) => allowedUpdates[k] === undefined && delete allowedUpdates[k]);

    const updatedProposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).populate('lead', 'companyName contactName email status');

    res.status(200).json({
      success: true,
      message: 'Proposal updated successfully',
      data: updatedProposal,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a proposal
// @route   DELETE /api/proposals/:id
// @access  Private
const deleteProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    await Proposal.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Proposal deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Share a proposal via public link
// @route   POST /api/proposals/:id/share
// @access  Private
const shareProposal = async (req, res) => {
  try {
    const publicToken = crypto.randomBytes(32).toString('hex');
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      { publicToken, isPublic: true },
      { new: true }
    );
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }
    res.status(200).json({ success: true, data: { publicToken, proposal } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Revoke public sharing of a proposal
// @route   DELETE /api/proposals/:id/share
// @access  Private
const revokeShare = async (req, res) => {
  try {
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      { publicToken: null, isPublic: false },
      { new: true }
    );
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }
    res.status(200).json({ success: true, message: 'Proposal sharing revoked', data: proposal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a publicly shared proposal by token
// @route   GET /api/proposals/public/:token
// @access  Public
const getPublicProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findOne({ publicToken: req.params.token, isPublic: true })
      .populate('lead', 'companyName');
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found or no longer shared' });
    }
    res.status(200).json({ success: true, data: proposal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Client responds to a shared proposal
// @route   POST /api/proposals/public/:token/respond
// @access  Public
const clientRespond = async (req, res) => {
  try {
    const { clientDecision, clientMessage } = req.body;
    const updateData = { clientDecision, clientMessage };
    if (clientDecision === 'accepted' || clientDecision === 'rejected') {
      updateData.status = clientDecision;
    }
    const proposal = await Proposal.findOneAndUpdate(
      { publicToken: req.params.token, isPublic: true },
      updateData,
      { new: true, runValidators: true }
    ).populate('lead', 'companyName');
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found or no longer shared' });
    }
    res.status(200).json({ success: true, message: 'Response submitted successfully', data: proposal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProposals, generateProposal, updateProposal, deleteProposal, shareProposal, revokeShare, getPublicProposal, clientRespond };
