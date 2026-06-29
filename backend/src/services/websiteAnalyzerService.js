const Groq = require('groq-sdk');
const axios = require('axios');

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not configured');
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const fetchWebsiteText = async (url) => {
  const normalized = url.startsWith('http') ? url : `https://${url}`;
  const res = await axios.get(normalized, {
    timeout: 8000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AbyteHuntBot/1.0)' },
  });
  // Strip HTML tags, keep only text, truncate to 3000 chars
  const text = res.data
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3000);
  return text;
};

const analyzeWebsite = async (url) => {
  const groq = getGroqClient();

  let websiteContent = '';
  try {
    websiteContent = await fetchWebsiteText(url);
  } catch {
    websiteContent = `Could not fetch content from ${url}. Analyze based on domain name only.`;
  }

  const prompt = `You are an AI Sales Analyst for Abyte Sol, a software development agency.
Analyze this website content and identify sales opportunities.
Respond ONLY with valid JSON — no markdown.

Website URL: ${url}
Website Content (first 3000 chars):
${websiteContent}

Respond with this exact JSON:
{
  "businessType": "What kind of business this is (1 sentence)",
  "techStack": ["list", "of", "detected", "technologies"],
  "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
  "opportunities": ["sales opportunity 1", "sales opportunity 2"],
  "recommendedService": "Most relevant service to pitch (e.g. ERP System, Web Development, Mobile App, AI Integration, CRM System, E-commerce, Automation)",
  "pitchAngle": "One-sentence pitch tailored to this business",
  "score": <number 1-10 how likely they need our services>
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 600,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
};

module.exports = { analyzeWebsite };
