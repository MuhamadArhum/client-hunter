const Lead = require('../models/Lead');
const scraperService = require('../services/scraperService');
const { analyzeLead, generateAutoReplyDraft } = require('../services/aiAnalysisService');
const { notifyNewLead } = require('../services/slackService');
const { analyzeWebsite } = require('../services/websiteAnalyzerService');
const { enrichLead } = require('../services/emailEnrichmentService');

const runAIAnalysis = async (lead) => {
  try {
    const analysis = await analyzeLead(lead);
    await Lead.findByIdAndUpdate(lead._id, analysis);
    const updated = await Lead.findById(lead._id);
    await notifyNewLead(updated);
    return updated;
  } catch (err) {
    console.error(`[AI Analysis] Failed for ${lead.companyName}:`, err.message);
    return lead;
  }
};

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
      companyName, contactName, email, phone, website,
      source: source || 'manual',
      industry, description, budget,
      tags: tags || [],
      assignedTo: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Lead created successfully', data: lead });

    // Run AI analysis in background after responding
    runAIAnalysis(lead);
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

    if (source === 'upwork') scrapedData = await scraperService.scrapeUpwork(query);
    else if (source === 'linkedin') scrapedData = await scraperService.scrapeLinkedIn(query);
    else if (source === 'freelancer') scrapedData = await scraperService.scrapeFreelancer(query);
    else if (source === 'crunchbase') scrapedData = await scraperService.scrapeCrunchbase(query);
    else if (source === 'clutch') scrapedData = await scraperService.scrapeClutch(query);
    else return res.status(400).json({ success: false, message: 'Invalid source' });

    const leadsToInsert = scrapedData.map((item) => ({
      ...item, source, assignedTo: req.user._id,
    }));

    const insertedLeads = await Lead.insertMany(leadsToInsert, { ordered: false });

    res.status(201).json({
      success: true,
      message: `Successfully scraped ${insertedLeads.length} leads`,
      data: insertedLeads,
    });

    // Run AI analysis for each scraped lead in background
    insertedLeads.forEach((lead) => runAIAnalysis(lead));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Re-analyze a lead with AI
// @route   POST /api/leads/:id/analyze
// @access  Private
const analyzeSingleLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead || lead.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const analysis = await analyzeLead(lead);
    const updated = await Lead.findByIdAndUpdate(req.params.id, analysis, { new: true });

    res.status(200).json({ success: true, message: 'AI analysis complete', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate AI auto-reply draft
// @route   POST /api/leads/:id/auto-reply
// @access  Private
const getAutoReplyDraft = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Incoming message is required' });

    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const draft = await generateAutoReplyDraft(lead, message);
    res.status(200).json({ success: true, data: draft });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Schedule follow-up for a lead
// @route   POST /api/leads/:id/schedule-followup
// @access  Private
const scheduleFollowUp = async (req, res) => {
  try {
    const { daysFromNow = 3 } = req.body;
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + parseInt(daysFromNow));

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { followUpScheduled: followUpDate, followUpSent: false },
      { new: true }
    );

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    res.status(200).json({
      success: true,
      message: `Follow-up scheduled for ${followUpDate.toDateString()}`,
      data: lead,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Analyze lead's website with AI
// @route   POST /api/leads/:id/analyze-website
const analyzeLeadWebsite = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const url = req.body.url || lead.website;
    if (!url) return res.status(400).json({ success: false, message: 'No website URL provided' });

    const analysis = await analyzeWebsite(url);
    res.status(200).json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Enrich lead email via Hunter.io
// @route   POST /api/leads/:id/enrich-email
const enrichLeadEmail = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    if (!lead.website) {
      return res.status(400).json({ success: false, message: 'Lead has no website URL to search from' });
    }

    const result = await enrichLead(lead);
    if (!result) {
      return res.status(404).json({ success: false, message: 'No email found for this domain' });
    }

    const updates = { email: result.email };
    if (!lead.contactName && result.contactName) updates.contactName = result.contactName;

    const updated = await Lead.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.status(200).json({
      success: true,
      message: `Email found: ${result.email} (${result.confidence}% confidence)`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk enrich emails for all leads without email
// @route   POST /api/leads/bulk-enrich
const bulkEnrichEmails = async (req, res) => {
  try {
    const leads = await Lead.find({
      email: { $in: ['', null] },
      website: { $nin: ['', null] },
      status: { $ne: 'deleted' },
    }).limit(20);

    if (leads.length === 0) {
      return res.status(200).json({ success: true, message: 'No leads need enrichment', enriched: 0 });
    }

    res.status(200).json({
      success: true,
      message: `Enriching ${leads.length} leads in background...`,
      total: leads.length,
    });

    // Run in background
    let enriched = 0;
    for (const lead of leads) {
      try {
        const result = await enrichLead(lead);
        if (result?.email) {
          const updates = { email: result.email };
          if (!lead.contactName && result.contactName) updates.contactName = result.contactName;
          await Lead.findByIdAndUpdate(lead._id, updates);
          enriched++;
          console.log(`[Enrich] ${lead.companyName} → ${result.email}`);
        }
      } catch (e) {
        console.error(`[Enrich] Failed for ${lead.companyName}:`, e.message);
      }
      await new Promise(r => setTimeout(r, 500)); // rate limit: 2 req/sec
    }
    console.log(`[Enrich] Done. Enriched ${enriched}/${leads.length} leads.`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save internal notes for a lead
// @route   PUT /api/leads/:id/notes
const saveNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { notes },
      { new: true }
    );
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.status(200).json({ success: true, message: 'Notes saved', data: lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLeads, getLead, createLead, updateLead, deleteLead,
  scrapeLeads, analyzeSingleLead, getAutoReplyDraft, scheduleFollowUp,
  analyzeLeadWebsite, saveNotes, enrichLeadEmail, bulkEnrichEmails,
};
