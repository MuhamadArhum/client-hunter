const { Resend } = require('resend');

const getClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured in .env');
  }
  return new Resend(process.env.RESEND_API_KEY);
};

const FROM_ADDRESS = process.env.EMAIL_FROM || 'ClientHunter <onboarding@resend.dev>';

const sendEmail = async ({ to, subject, html, text }) => {
  const resend = getClient();

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: Array.isArray(to) ? to : [to],
    subject,
    html: html || `<p>${text || ''}</p>`,
    text: text || '',
  });

  if (error) throw new Error(error.message);
  return data;
};

module.exports = { sendEmail };
