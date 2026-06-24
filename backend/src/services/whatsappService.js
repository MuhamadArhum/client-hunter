const axios = require('axios');

// Send a WhatsApp message via WhatsApp Cloud API
const sendMessage = async ({ to, message }) => {
  if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_ID) {
    throw new Error('WhatsApp credentials are not configured. Please set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_ID in .env');
  }

  // Format phone number: remove spaces, dashes, and ensure it starts with country code
  const formattedPhone = to.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');

  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'text',
    text: {
      preview_url: false,
      body: message,
    },
  };

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};

module.exports = { sendMessage };
