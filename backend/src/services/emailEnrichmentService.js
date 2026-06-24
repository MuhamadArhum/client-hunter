const axios = require('axios');

const HUNTER_KEY = process.env.HUNTER_API_KEY;

// Extract domain from website URL
const extractDomain = (website) => {
  if (!website) return null;
  try {
    const url = website.startsWith('http') ? website : `https://${website}`;
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return null;
  }
};

// Find email by company domain using Hunter.io
const findEmailByDomain = async (domain) => {
  if (!HUNTER_KEY) throw new Error('HUNTER_API_KEY not configured');
  if (!domain) throw new Error('No domain provided');

  const res = await axios.get('https://api.hunter.io/v2/domain-search', {
    params: {
      domain,
      api_key: HUNTER_KEY,
      limit: 5,
    },
  });

  const emails = res.data?.data?.emails || [];
  if (emails.length === 0) return null;

  // Prefer decision makers
  const priority = ['ceo', 'founder', 'owner', 'director', 'manager', 'head'];
  const best = emails.find(e =>
    priority.some(p => (e.position || '').toLowerCase().includes(p))
  ) || emails[0];

  return {
    email: best.value,
    contactName: [best.first_name, best.last_name].filter(Boolean).join(' '),
    position: best.position || '',
    confidence: best.confidence || 0,
  };
};

// Find email by person name + domain using Hunter.io
const findEmailByName = async (firstName, lastName, domain) => {
  if (!HUNTER_KEY) throw new Error('HUNTER_API_KEY not configured');

  const res = await axios.get('https://api.hunter.io/v2/email-finder', {
    params: {
      domain,
      first_name: firstName,
      last_name: lastName,
      api_key: HUNTER_KEY,
    },
  });

  const data = res.data?.data;
  if (!data?.email) return null;
  return { email: data.email, confidence: data.score || 0 };
};

// Enrich a lead — try domain search first
const enrichLead = async (lead) => {
  const domain = extractDomain(lead.website);
  if (!domain) return null;

  try {
    // If we have a contact name, try name+domain search
    if (lead.contactName) {
      const parts = lead.contactName.trim().split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      if (firstName && lastName) {
        const found = await findEmailByName(firstName, lastName, domain);
        if (found?.email) return { ...found, source: 'hunter-name' };
      }
    }

    // Fallback: domain search
    const found = await findEmailByDomain(domain);
    if (found?.email) return { ...found, source: 'hunter-domain' };

    return null;
  } catch (err) {
    console.error(`[Hunter] Enrichment failed for ${domain}:`, err.message);
    return null;
  }
};

module.exports = { enrichLead, findEmailByDomain, findEmailByName, extractDomain };
