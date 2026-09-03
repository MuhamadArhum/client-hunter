const crypto = require('crypto');
const OutreachLog = require('../models/OutreachLog');
const Lead = require('../models/Lead');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');

const isProd = process.env.NODE_ENV === 'production';
const serverError = (res, error) =>
  res.status(500).json({ success: false, message: isProd ? 'An unexpected error occurred.' : error.message });

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
    const trackingId = crypto.randomBytes(16).toString('hex');
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const pixelTag = `<img src="${baseUrl}/api/outreach/track/open/${trackingId}" width="1" height="1" style="display:none" />`;

    try {
      await emailService.sendEmail({
        to: recipientEmail,
        subject,
        text: message,
        html: `<div style="font-family: Arial, sans-serif;">${message.replace(/\n/g, '<br/>')}</div>${pixelTag}`,
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
      trackingId,
    });

    if (logStatus === 'sent' && lead.status === 'new') {
      await Lead.findByIdAndUpdate(leadId, { status: 'contacted' });
    }

    if (logStatus === 'failed') {
      return res.status(500).json({ success: false, message: `Email failed: ${errorMessage}`, data: log });
    }

    const io = req.app.get('io');
    if (io) io.emit('outreach:sent', { type: 'email', leadId });

    res.status(200).json({ success: true, message: 'Email sent successfully', data: log });
  } catch (error) {
    serverError(res, error);
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
    serverError(res, error);
  }
};

// @desc    Get outreach history for a lead
// @route   GET /api/outreach/history/:leadId
// @access  Private
const getOutreachHistory = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      OutreachLog.find({ lead: leadId }).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      OutreachLog.countDocuments({ lead: leadId }),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    serverError(res, error);
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
    serverError(res, error);
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
    serverError(res, error);
  }
};

const trackOpen = async (req, res) => {
  try {
    await OutreachLog.findOneAndUpdate(
      { trackingId: req.params.trackingId, openedAt: null },
      { openedAt: new Date() }
    );
  } catch (_) {}
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.set({ 'Content-Type': 'image/gif', 'Content-Length': pixel.length, 'Cache-Control': 'no-store' });
  res.end(pixel);
};

const trackClick = async (req, res) => {
  try {
    await OutreachLog.findOneAndUpdate(
      { trackingId: req.params.trackingId, clickedAt: null },
      { clickedAt: new Date() }
    );
  } catch (_) {}
  const url = req.query.url;
  if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ success: false, message: 'Invalid URL' });
  res.redirect(url);
};

// @desc    Handle Resend webhook delivery events
// @route   POST /api/outreach/webhook/resend
// @access  Public
const handleResendWebhook = async (req, res) => {
  try {
    const event = req.body;
    const trackingId = event?.data?.tags?.find?.((t) => t.name === 'trackingId')?.value || null;
    const type = event?.type;

    if (trackingId) {
      if (type === 'email.delivered') {
        await OutreachLog.findOneAndUpdate({ trackingId }, { deliveredAt: new Date(), status: 'delivered' });
      } else if (type === 'email.bounced') {
        await OutreachLog.findOneAndUpdate({ trackingId }, { bouncedAt: new Date(), status: 'bounced' });
      } else if (type === 'email.complained') {
        await OutreachLog.findOneAndUpdate({ trackingId }, { spamAt: new Date(), status: 'bounced' });
      }
    }
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Resend Webhook]', error.message);
    res.status(200).json({ received: true });
  }
};

// @desc    Retry a failed outreach
// @route   POST /api/outreach/retry/:logId
// @access  Private
const retryOutreach = async (req, res) => {
  try {
    const log = await OutreachLog.findById(req.params.logId).populate('lead');
    if (!log) return res.status(404).json({ success: false, message: 'Outreach log not found' });
    if (log.status !== 'failed') {
      return res.status(400).json({ success: false, message: 'Only failed outreach can be retried' });
    }

    let newStatus = 'sent';
    let errorMessage = '';

    if (log.type === 'email') {
      try {
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        const pixelTag = `<img src="${baseUrl}/api/outreach/track/open/${log.trackingId}" width="1" height="1" style="display:none" />`;
        await emailService.sendEmail({
          to: log.lead?.email,
          subject: log.subject,
          text: log.message,
          html: `<div style="font-family:Arial,sans-serif">${log.message.replace(/\n/g, '<br/>')}</div>${pixelTag}`,
          trackingId: log.trackingId,
        });
      } catch (e) { newStatus = 'failed'; errorMessage = e.message; }
    } else if (log.type === 'whatsapp') {
      try {
        await whatsappService.sendMessage({ to: log.lead?.phone, message: log.message });
      } catch (e) { newStatus = 'failed'; errorMessage = e.message; }
    }

    await OutreachLog.findByIdAndUpdate(log._id, {
      status: newStatus,
      sentAt: newStatus === 'sent' ? new Date() : log.sentAt,
      response: errorMessage,
    });

    if (newStatus === 'failed') {
      return res.status(500).json({ success: false, message: `Retry failed: ${errorMessage}` });
    }
    res.status(200).json({ success: true, message: 'Outreach retried successfully' });
  } catch (error) {
    serverError(res, error);
  }
};

module.exports = { sendEmail, sendWhatsApp, getOutreachHistory, scheduleFollowUp, getAllOutreachLogs, trackOpen, trackClick, handleResendWebhook, retryOutreach };
