const Proposal = require('../models/Proposal');
const Lead = require('../models/Lead');
const openaiService = require('../services/openaiService');

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

    const { title, content } = await openaiService.generateProposal(lead, customInstructions);

    const proposal = await Proposal.create({
      lead: leadId,
      title,
      content,
      status: 'draft',
      generatedBy: 'openai',
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

    const updatedProposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
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

module.exports = { getProposals, generateProposal, updateProposal, deleteProposal };
