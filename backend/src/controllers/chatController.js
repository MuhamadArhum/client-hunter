const Groq = require('groq-sdk');

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not configured');
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

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

    const groq = getGroqClient();

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ];

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 800,
    });

    const reply = response.choices[0].message.content;

    res.json({ success: true, reply });
  } catch (err) {
    console.error('[Chat]', err.message);
    res.status(500).json({ success: false, message: 'AI service error. Try again.' });
  }
};
