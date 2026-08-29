const { chatWithAI } = require('../services/aiService');

const SYSTEM_PROMPT = `You are an intelligent AI assistant for "Abyte Hunter" — a Client Finding & Outreach Automation System built by Abyte Sol.

You help sales and outreach teams with:
- Finding and qualifying leads
- Writing proposals and outreach messages
- Analyzing lead quality and scores
- Suggesting follow-up strategies
- Providing insights on outreach performance
- General sales and business development advice

Be concise, professional, and actionable. Use bullet points when listing items. Keep responses under 300 words unless a detailed answer is needed.`;

exports.chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ];

    const reply = await chatWithAI(messages, { temperature: 0.7, maxTokens: 800 });

    res.json({ success: true, reply });
  } catch (err) {
    console.error('[Chat]', err.message);
    res.status(500).json({ success: false, message: 'AI service error. Try again.' });
  }
};
