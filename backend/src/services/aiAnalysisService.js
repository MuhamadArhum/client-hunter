const Groq = require('groq-sdk');

const getGroqClient = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const analyzeLead = async (lead) => {
  const groq = getGroqClient();

  const prompt = `You are an AI Sales Development Representative (SDR) for Abyte Sol, a software agency.
Analyze this lead and respond ONLY with valid JSON — no markdown, no explanation.

Lead Data:
- Company: ${lead.companyName}
- Contact: ${lead.contactName || 'Unknown'}
- Industry: ${lead.industry || 'Unknown'}
- Description: ${lead.description || 'No description'}
- Budget: ${lead.budget || 'Unknown'}
- Website: ${lead.website || 'None'}
- Source: ${lead.source}

Respond with this exact JSON:
{
  "score": <number 1-10, 10 = hottest lead>,
  "qualification": <"hot" | "warm" | "cold">,
  "recommendedService": <"ERP System" | "Web Development" | "Mobile App" | "AI Integration" | "Cloud Solutions" | "CRM System" | "E-commerce" | "Custom Software" | "Digital Marketing" | "Automation">,
  "painPoints": [<max 3 short pain point strings>],
  "summary": <1-2 sentence executive summary of why this lead is valuable or not>
}

Scoring guide:
- 8-10: Hot — clear budget, specific need, decision maker
- 5-7: Warm — some info, potential fit
- 1-4: Cold — vague, low budget, poor fit`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 400,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content);

  return {
    aiScore: Math.min(10, Math.max(1, Number(result.score) || 5)),
    aiQualification: ['hot', 'warm', 'cold'].includes(result.qualification) ? result.qualification : 'warm',
    aiRecommendedService: result.recommendedService || '',
    aiPainPoints: Array.isArray(result.painPoints) ? result.painPoints.slice(0, 3) : [],
    aiSummary: result.summary || '',
  };
};

const generateAutoReplyDraft = async (lead, incomingMessage) => {
  const groq = getGroqClient();

  const prompt = `You are a professional sales rep for Abyte Sol, a software development agency.
Draft a reply to this incoming message from a lead. Be friendly, professional, and concise (80-120 words).
Address their concern directly and suggest a quick call/meeting.

Lead: ${lead.companyName} (${lead.contactName || 'Contact'})
Industry: ${lead.industry || 'Unknown'}
Their message: "${incomingMessage}"

Respond ONLY with this JSON:
{
  "subject": "Reply subject line",
  "body": "Email reply body"
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    max_tokens: 400,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
};

module.exports = { analyzeLead, generateAutoReplyDraft };
