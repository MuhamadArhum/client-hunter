const { body, param, query, validationResult } = require('express-validator');

// Run validation and return 422 if errors exist
const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }
    next();
  },
];

// ── Auth ──────────────────────────────────────────────────────────────────────
const registerRules = validate([
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
]);

const loginRules = validate([
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
]);

const updateProfileRules = validate([
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email').optional().trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
]);

const changePasswordRules = validate([
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').notEmpty().withMessage('New password is required').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
]);

const forgotPasswordRules = validate([
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
]);

const resetPasswordRules = validate([
  param('token').notEmpty().withMessage('Reset token is required'),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
]);

// ── Leads ─────────────────────────────────────────────────────────────────────
const createLeadRules = validate([
  body('companyName').trim().notEmpty().withMessage('Company name is required').isLength({ max: 100 }).withMessage('Company name cannot exceed 100 characters'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('website').optional({ checkFalsy: true }).isURL({ require_protocol: false }).withMessage('Please provide a valid website URL'),
  body('status').optional().isIn(['new', 'contacted', 'proposal_sent', 'follow_up', 'converted', 'lost']).withMessage('Invalid status value'),
  body('source').optional().isIn(['LinkedIn', 'Upwork', 'Fiverr', 'Referral', 'Website', 'Cold Outreach', 'Apify Scraped', 'Other']).withMessage('Invalid source value'),
]);

const updateLeadRules = validate([
  param('id').isMongoId().withMessage('Invalid lead ID'),
  body('companyName').optional().trim().notEmpty().withMessage('Company name cannot be empty').isLength({ max: 100 }).withMessage('Company name cannot exceed 100 characters'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('website').optional({ checkFalsy: true }).isURL({ require_protocol: false }).withMessage('Please provide a valid website URL'),
  body('status').optional().isIn(['new', 'contacted', 'proposal_sent', 'follow_up', 'converted', 'lost']).withMessage('Invalid status value'),
]);

const mongoIdParamRules = validate([
  param('id').isMongoId().withMessage('Invalid ID format'),
]);

// ── Outreach ──────────────────────────────────────────────────────────────────
const sendEmailRules = validate([
  body('leadId').notEmpty().withMessage('leadId is required').isMongoId().withMessage('Invalid lead ID'),
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 200 }).withMessage('Subject cannot exceed 200 characters'),
  body('message').trim().notEmpty().withMessage('Message is required'),
]);

const sendWhatsAppRules = validate([
  body('leadId').notEmpty().withMessage('leadId is required').isMongoId().withMessage('Invalid lead ID'),
  body('message').trim().notEmpty().withMessage('Message is required'),
]);

// ── Proposals ─────────────────────────────────────────────────────────────────
const generateProposalRules = validate([
  body('leadId').notEmpty().withMessage('leadId is required').isMongoId().withMessage('Invalid lead ID'),
  body('customInstructions').optional().isLength({ max: 500 }).withMessage('Custom instructions cannot exceed 500 characters'),
]);

module.exports = {
  registerRules, loginRules, updateProfileRules, changePasswordRules,
  forgotPasswordRules, resetPasswordRules,
  createLeadRules, updateLeadRules, mongoIdParamRules,
  sendEmailRules, sendWhatsAppRules,
  generateProposalRules,
};
