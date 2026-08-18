const axios = require('axios');
const configService = require('./configService');

const extractDomain = (website) => {
  if (!website) return null;
  try {
    const url = website.startsWith('http') ? website : `https://${website}`;
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
};

const findEmailByDomain = async (domain) => {
  const hunterKey = await configService.get('HUNTER_API_KEY');
  if (!hunterKey) throw new Error('Hunter.io API key is not configured. Add it in Settings → Integrations.');
  if (!domain)    throw new Error('No domain provided');

  const res = await axios.get('https://api.hunter.io/v2/domain-search', {
    params: { domain, api_key: hunterKey, limit: 5 },
  });

  const emails = res.data?.data?.emails || [];
  if (!emails.length) return null;

  const priority = ['ceo', 'founder', 'owner', 'director', 'manager', 'head'];
  const best = emails.find((e) =>
    priority.some((p) => (e.position || '').toLowerCase().includes(p))
  ) || emails[0];

  return {
    email:       best.value,
    contactName: [best.first_name, best.last_name].filter(Boolean).join(' '),
    position:    best.position || '',
    confidence:  best.confidence || 0,
  };
};

const findEmailByName = async (firstName, lastName, domain) => {
  const hunterKey = await configService.get('HUNTER_API_KEY');
  if (!hunterKey) throw new Error('Hunter.io API key is not configured. Add it in Settings → Integrations.');

  const res = await axios.get('https://api.hunter.io/v2/email-finder', {
    params: { domain, first_name: firstName, last_name: lastName, api_key: hunterKey },
  });

  const data = res.data?.data;
  if (!data?.email) return null;
  return { email: data.email, confidence: data.score || 0 };
};

const enrichLead = async (lead) => {
  const domain = extractDomain(lead.website);
  if (!domain) return null;

  try {
    if (lead.contactName) {
      const parts     = lead.contactName.trim().split(' ');
      const firstName = parts[0] || '';
      const lastName  = parts.slice(1).join(' ') || '';
      if (firstName && lastName) {
        const found = await findEmailByName(firstName, lastName, domain);
        if (found?.email) return { ...found, source: 'hunter-name' };
      }
    }
    const found = await findEmailByDomain(domain);
    if (found?.email) return { ...found, source: 'hunter-domain' };
    return null;
  } catch (err) {
    console.error(`[Hunter] Enrichment failed for ${domain}:`, err.message);
    return null;
  }
};

module.exports = { enrichLead, findEmailByDomain, findEmailByName, extractDomain };
