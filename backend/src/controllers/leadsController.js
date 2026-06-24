const Lead = require('../models/Lead');
const scraperService = require('../services/scraperService');

// @desc    Get all leads with pagination, filtering, search
// @route   GET /api/leads
// @access  Private
const getLeads = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      source,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = { status: { $ne: 'deleted' } };

    if (status && status !== 'all') query.status = status;
    if (source && source !== 'all') query.source = source;

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [leads, total] = await Promise.all([
      Lead.find(query)
        .populate('assignedTo', 'name email')
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(parseInt(limit)),
      Lead.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: leads,
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

// @desc    Get single lead by ID
// @route   GET /api/leads/:id
// @access  Private
const getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name email');
    if (!lead || lead.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }
    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new lead
// @route   POST /api/leads
// @access  Private
const createLead = async (req, res) => {
  try {
    const { companyName, contactName, email, phone, website, source, industry, description, budget, tags } = req.body;

    if (!companyName) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    const lead = await Lead.create({
      companyName,
      contactName,
      email,
      phone,
      website,
      source: source || 'manual',
      industry,
      description,
      budget,
      tags: tags || [],
      assignedTo: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Lead created successfully', data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a lead
// @route   PUT /api/leads/:id
// @access  Private
const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead || lead.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    res.status(200).json({ success: true, message: 'Lead updated successfully', data: updatedLead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Soft delete a lead
// @route   DELETE /api/leads/:id
// @access  Private
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead || lead.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    await Lead.findByIdAndUpdate(req.params.id, { status: 'deleted' });

    res.status(200).json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Scrape leads from external sources
// @route   POST /api/leads/scrape
// @access  Private
const scrapeLeads = async (req, res) => {
  try {
    const { source = 'upwork', query = 'web development' } = req.body;

    let scrapedData = [];

    if (source === 'upwork') {
      scrapedData = await scraperService.scrapeUpwork(query);
    } else if (source === 'linkedin') {
      scrapedData = await scraperService.scrapeLinkedIn(query);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid source. Use upwork or linkedin' });
    }

    const leadsToInsert = scrapedData.map((item) => ({
      ...item,
      source: source === 'upwork' ? 'upwork' : 'linkedin',
      assignedTo: req.user._id,
    }));

    const insertedLeads = await Lead.insertMany(leadsToInsert, { ordered: false });

    res.status(201).json({
      success: true,
      message: `Successfully scraped and inserted ${insertedLeads.length} leads`,
      data: insertedLeads,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getLeads, getLead, createLead, updateLead, deleteLead, scrapeLeads };
