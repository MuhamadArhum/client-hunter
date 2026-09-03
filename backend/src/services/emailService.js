const { Resend } = require('resend');
const configService = require('./configService');

const sendEmail = async ({ to, subject, html, text, trackingId }) => {
  const apiKey   = await configService.get('RESEND_API_KEY');
  const fromAddr = (await configService.get('EMAIL_FROM')) || 'Abyte Hunt <onboarding@resend.dev>';

  if (!apiKey) throw new Error('Resend API key is not configured. Add it in Settings → Integrations.');

  const resend = new Resend(apiKey);
  const payload = {
    from:    fromAddr,
    to:      Array.isArray(to) ? to : [to],
    subject,
    html:    html || `<p>${text || ''}</p>`,
    text:    text || '',
  };
  if (trackingId) payload.tags = [{ name: 'trackingId', value: trackingId }];

  const { data, error } = await resend.emails.send(payload);

  if (error) throw new Error(error.message);
  return data;
};

module.exports = { sendEmail };
