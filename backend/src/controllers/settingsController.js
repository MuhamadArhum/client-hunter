const configService = require('../services/configService');

const INTEGRATION_KEYS = [
  { key: 'RESEND_API_KEY',       label: 'Resend API Key',       group: 'email',         sensitive: true  },
  { key: 'EMAIL_FROM',           label: 'From Address',          group: 'email',         sensitive: false },
  { key: 'DIGEST_EMAIL',         label: 'Digest Email',          group: 'email',         sensitive: false },
  { key: 'WHATSAPP_API_TOKEN',   label: 'WhatsApp API Token',    group: 'whatsapp',      sensitive: true  },
  { key: 'WHATSAPP_PHONE_ID',    label: 'WhatsApp Phone ID',     group: 'whatsapp',      sensitive: false },
  { key: 'HUNTER_API_KEY',       label: 'Hunter.io API Key',     group: 'enrichment',    sensitive: true  },
  { key: 'SLACK_WEBHOOK_URL',    label: 'Slack Webhook URL',     group: 'notifications', sensitive: true  },
];

const ALLOWED_KEYS = new Set(INTEGRATION_KEYS.map((i) => i.key));

const mask = (value) => {
  if (!value || value.length <= 4) return value;
  return '••••' + value.slice(-4);
};

// GET /api/settings/integrations
const getIntegrations = async (req, res) => {
  try {
    const data = {};
    for (const item of INTEGRATION_KEYS) {
      const value = await configService.get(item.key);
      data[item.key] = {
        label:       item.label,
        group:       item.group,
        configured:  !!value,
        displayValue: item.sensitive ? mask(value) : (value || ''),
      };
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/settings/integrations
const updateIntegrations = async (req, res) => {
  try {
    const updates = req.body || {};
    const updated = [];
    for (const [key, value] of Object.entries(updates)) {
      if (ALLOWED_KEYS.has(key)) {
        await configService.set(key, String(value || '').trim());
        updated.push(key);
      }
    }
    res.json({ success: true, message: 'Settings saved successfully', updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getIntegrations, updateIntegrations };
