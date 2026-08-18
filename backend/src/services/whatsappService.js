const axios = require('axios');
const configService = require('./configService');

const sendMessage = async ({ to, message }) => {
  const apiToken = await configService.get('WHATSAPP_API_TOKEN');
  const phoneId  = await configService.get('WHATSAPP_PHONE_ID');

  if (!apiToken || !phoneId) {
    throw new Error('WhatsApp credentials are not configured. Add them in Settings → Integrations.');
  }

  const formattedPhone = to.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
  const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;

  const response = await axios.post(url, {
    messaging_product: 'whatsapp',
    recipient_type:    'individual',
    to:                formattedPhone,
    type:              'text',
    text:              { preview_url: false, body: message },
  }, {
    headers: {
      Authorization:  `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};

module.exports = { sendMessage };
