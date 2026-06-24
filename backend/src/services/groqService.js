const Groq = require('groq-sdk');

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const generateProposal = async (lead, customInstructions = '') => {
  const groq = getGroqClient();

  const systemPrompt = `You are a professional business proposal writer for ClientHunter by Abyte Sol, a software development and digital transformation agency.
Write compelling, personalized proposals that highlight expertise in web development, mobile apps, AI integration, and cloud solutions.
Keep proposals professional, concise (400-600 words), and focused on solving the client's specific needs.
Always respond with valid JSON only — no markdown, no explanation outside the JSON.`;

  const userPrompt = `Write a professional business proposal for this lead:

Company: ${lead.companyName}
Contact: ${lead.contactName || 'Decision Maker'}
Industry: ${lead.industry || 'Technology'}
Description/Need: ${lead.description || 'Software development services'}
Budget Range: ${lead.budget || 'To be discussed'}
Website: ${lead.website || 'N/A'}
Source: ${lead.source || 'N/A'}

${customInstructions ? `Additional instructions: ${customInstructions}` : ''}

Write a proposal that:
1. Opens with a personalized greeting using the contact name
2. Shows clear understanding of their business needs
3. Presents our relevant services and expertise
4. Includes brief approach and timeline
5. Ends with a strong call-to-action

Respond ONLY with this JSON:
{
  "title": "Proposal title here",
  "content": "Full proposal text here"
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content;
  const result = JSON.parse(raw);

  return {
    title: result.title || `Proposal for ${lead.companyName}`,
    content: result.content,
  };
};

const generateFollowUpMessage = async (lead, previousMessages = []) => {
  const groq = getGroqClient();

  const systemPrompt = `You are a professional outreach specialist for ClientHunter by Abyte Sol, a software development agency.
Write friendly but professional follow-up messages that are concise (100-150 words), non-pushy, and add value.
Always respond with valid JSON only.`;

  const previousContext = previousMessages.length > 0
    ? `\n\nPrevious messages sent:\n${previousMessages.map((m, i) => `${i + 1}. ${m}`).join('\n')}`
    : '';

  const userPrompt = `Write a follow-up email for:
Company: ${lead.companyName}
Contact: ${lead.contactName || 'there'}
Industry: ${lead.industry || 'their industry'}
${previousContext}

Write a short, friendly follow-up referencing our previous outreach and asking if they reviewed our proposal.
Respond ONLY with this JSON: { "subject": "email subject", "message": "email body" }`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 400,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
};

module.exports = { generateProposal, generateFollowUpMessage };
