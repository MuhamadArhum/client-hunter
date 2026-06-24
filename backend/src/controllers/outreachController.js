const OutreachLog = require('../models/OutreachLog');
const Lead = require('../models/Lead');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');

// @desc    Send an email to a lead
// @route   POST /api/outreach/email
// @access  Private
const sendEmail = async (req, res) => {
  try {
    const { leadId, subject, message, to } = req.body;

    if (!leadId || !subject || !message) {
      return res.status(400).json({ success: false, message: 'leadId, subject, and message are required' });
    }

    const lead = await Lead.findById(leadId);
    if (!lead || lead.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const recipientEmail = to || lead.email;
    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: 'No email address available for this lead' });
    }

    let logStatus = 'sent';
    let errorMessage = '';

    try {
      await emailService.sendEmail({
        to: recipientEmail,
        subject,
        text: message,
        html: `<div style="font-family: Arial, sans-serif;">${message.replace(/\n/g, '<br/>')}</div>`,
      });
    } catch (emailError) {
      logStatus = 'failed';
      errorMessage = emailError.message;
    }

    const log = await OutreachLog.create({
      lead: leadId,
      type: 'email',
      subject,
      message,
      status: logStatus,
      sentAt: logStatus === 'sent' ? new Date() : null,
      response: errorMessage,
    });

    if (logStatus === 'sent' && lead.status === 'new') {
      await Lead.findByIdAndUpdate(leadId, { status: 'contacted' });
    }

    if (logStatus === 'failed') {
      return res.status(500).json({ success: false, message: `Email failed: ${errorMessage}`, data: log });
    }

    res.status(200).json({ success: true, message: 'Email sent successfully', data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send a WhatsApp message to a lead
// @route   POST /api/outreach/whatsapp
// @access  Private
const sendWhatsApp = async (req, res) => {
  try {
    const { leadId, message, to } = req.body;

    if (!leadId || !message) {
      return res.status(400).json({ success: false, message: 'leadId and message are required' });
    }

    const lead = await Lead.findById(leadId);
    if (!lead || lead.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const recipientPhone = to || lead.phone;
    if (!recipientPhone) {
      return res.status(400).json({ success: false, message: 'No phone number available for this lead' });
    }

    let logStatus = 'sent';
    let errorMessage = '';

    try {
      await whatsappService.sendMessage({ to: recipientPhone, message });
    } catch (waError) {
      logStatus = 'failed';
      errorMessage = waError.message;
    }

    const log = await OutreachLog.create({
      lead: leadId,
      type: 'whatsapp',
      message,
      status: logStatus,
      sentAt: logStatus === 'sent' ? new Date() : null,
      response: errorMessage,
    });

    if (logStatus === 'sent' && lead.status === 'new') {
      await Lead.findByIdAndUpdate(leadId, { status: 'contacted' });
    }

    if (logStatus === 'failed') {
      return res.status(500).json({ success: false, message: `WhatsApp message failed: ${errorMessage}`, data: log });
    }

    res.status(200).json({ success: true, message: 'WhatsApp message sent successfully', data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get outreach history for a lead
// @route   GET /api/outreach/history/:leadId
// @access  Private
const getOutreachHistory = async (req, res) => {
  try {
    const { leadId } = req.params;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const logs = await OutreachLog.find({ lead: leadId }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: logs, total: logs.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Schedule a follow-up outreach
// @route   POST /api/outreach/schedule
// @access  Private
const scheduleFollowUp = async (req, res) => {
  try {
    const { leadId, type, subject, message, scheduledAt } = req.body;

    if (!leadId || !type || !message || !scheduledAt) {
      return res.status(400).json({ success: false, message: 'leadId, type, message, and scheduledAt are required' });
    }

    const lead = await Lead.findById(leadId);
    if (!lead || lead.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const log = await OutreachLog.create({
      lead: leadId,
      type,
      subject: subject || '',
      message,
      status: 'pending',
      scheduledAt: new Date(scheduledAt),
    });

    await Lead.findByIdAndUpdate(leadId, { status: 'follow_up' });

    res.status(201).json({ success: true, message: 'Follow-up scheduled successfully', data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all outreach logs with optional filters
// @route   GET /api/outreach
// @access  Private
const getAllOutreachLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, leadId, type, status } = req.query;
    const query = {};
    if (leadId) query.lead = leadId;
    if (type) query.type = type;
    if (status) query.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      OutreachLog.find(query)
        .populate('lead', 'companyName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      OutreachLog.countDocuments(query),
    ]);
    res.status(200).json({ success: true, data: logs, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { sendEmail, sendWhatsApp, getOutreachHistory, scheduleFollowUp, getAllOutreachLogs };
