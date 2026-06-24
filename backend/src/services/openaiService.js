const OpenAI = require('openai');

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

// Generate a professional proposal for a lead
const generateProposal = async (lead, customInstructions = '') => {
  const openai = getOpenAIClient();

  const systemPrompt = `You are a professional business proposal writer for AbyteHunt, a software development and digital transformation company.
Write compelling, personalized proposals that highlight our expertise in web development, mobile apps, AI integration, and cloud solutions.
Keep proposals professional, concise (400-600 words), and focused on solving the client's specific needs.`;

  const userPrompt = `Write a professional business proposal for the following lead:

Company: ${lead.companyName}
Contact: ${lead.contactName || 'Decision Maker'}
Industry: ${lead.industry || 'Technology'}
Description/Need: ${lead.description || 'Software development services'}
Budget Range: ${lead.budget || 'To be discussed'}
Website: ${lead.website || 'N/A'}

${customInstructions ? `Additional instructions: ${customInstructions}` : ''}

Please write a proposal that:
1. Opens with a personalized greeting
2. Demonstrates understanding of their business needs
3. Presents AbyteHunt's relevant services and expertise
4. Includes a brief approach/methodology
5. Mentions timeline and value proposition
6. Ends with a clear call-to-action

Return a JSON object with:
{
  "title": "Proposal title here",
  "content": "Full proposal content here"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content);
  return {
    title: result.title || `Proposal for ${lead.companyName}`,
    content: result.content,
  };
};

// Generate a follow-up message based on previous interactions
const generateFollowUpMessage = async (lead, previousMessages = []) => {
  const openai = getOpenAIClient();

  const systemPrompt = `You are a professional outreach specialist for AbyteHunt, a software development company.
Write friendly but professional follow-up messages that are concise (100-150 words), non-pushy, and add value.`;

  const previousContext = previousMessages.length > 0
    ? `\n\nPrevious messages sent:\n${previousMessages.map((m, i) => `${i + 1}. ${m}`).join('\n')}`
    : '';

  const userPrompt = `Write a follow-up email for:
Company: ${lead.companyName}
Contact: ${lead.contactName || 'there'}
Industry: ${lead.industry || 'their industry'}
${previousContext}

Write a short, friendly follow-up that references our previous outreach and gently asks if they had a chance to review our proposal.
Return JSON: { "subject": "email subject", "message": "email body" }`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
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
