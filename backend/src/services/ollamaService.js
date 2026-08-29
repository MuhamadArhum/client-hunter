const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';

const chat = async (messages, options = {}) => {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: { temperature: options.temperature ?? 0.7 },
    }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.message?.content || '';
};

const isAvailable = async () => {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return false;
    const data = await res.json();
    const models = data.models || [];
    return models.some((m) => m.name.startsWith(OLLAMA_MODEL));
  } catch {
    return false;
  }
};

const generateProposal = async (lead, customInstructions = '') => {
  const systemPrompt = `You are a professional business proposal writer for Abyte Hunt by Abyte Sol, a software development and digital transformation agency.
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

Respond ONLY with this JSON:
{
  "title": "Proposal title here",
  "content": "Full proposal text here"
}`;

  const raw = await chat(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.7 }
  );

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Ollama did not return valid JSON');
  const result = JSON.parse(jsonMatch[0]);

  return {
    title: result.title || `Proposal for ${lead.companyName}`,
    content: result.content,
  };
};

const generateFollowUpMessage = async (lead, previousMessages = []) => {
  const systemPrompt = `You are a professional outreach specialist for Abyte Hunt by Abyte Sol, a software development agency.
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

Respond ONLY with this JSON: { "subject": "email subject", "message": "email body" }`;

  const raw = await chat(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.7 }
  );

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Ollama did not return valid JSON');
  return JSON.parse(jsonMatch[0]);
};

module.exports = { generateProposal, generateFollowUpMessage, isAvailable, chat };
