const axios = require('axios');
const Lead = require('../models/Lead');
const configService = require('../services/configService');

const isProd = process.env.NODE_ENV === 'production';
const serverError = (res, error) =>
  res.status(500).json({ success: false, message: isProd ? 'An unexpected error occurred.' : error.message });

// @desc    Search people on Apollo.io
// @route   POST /api/apollo/search
// @access  Private
const searchApollo = async (req, res) => {
  try {
    const apiKey = await configService.get('APOLLO_API_KEY');
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Apollo API key not configured. Add it in Settings → Integrations.',
      });
    }

    const { q_organization_name, q_keywords, person_titles, page = 1 } = req.body;

    const payload = {
      api_key: apiKey,
      page,
      per_page: 25,
    };
    if (q_organization_name) payload.q_organization_name = q_organization_name;
    if (q_keywords) payload.q_keywords = q_keywords;
    if (person_titles) payload.person_titles = [person_titles];

    const response = await axios.post('https://api.apollo.io/v1/mixed_people/search', payload, {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    });

    const people = response.data?.people || [];
    const results = people.map((p) => ({
      apolloId: p.id,
      name: p.name || '',
      title: p.title || '',
      email: p.email || '',
      phone: p.phone_numbers?.[0]?.sanitized_number || '',
      companyName: p.organization?.name || p.employment_history?.[0]?.organization_name || '',
      website: p.organization?.website_url || '',
      industry: p.organization?.industry || '',
      city: p.city || '',
      country: p.country || '',
      linkedin: p.linkedin_url || '',
    }));

    res.json({
      success: true,
      data: results,
      total: response.data?.pagination?.total_entries || results.length,
    });
  } catch (error) {
    if (error.response?.status === 401) {
      return res.status(400).json({ success: false, message: 'Invalid Apollo API key.' });
    }
    serverError(res, error);
  }
};

// @desc    Import Apollo contacts as leads
// @route   POST /api/apollo/import
// @access  Private
const importApolloLeads = async (req, res) => {
  try {
    const { contacts } = req.body;
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ success: false, message: 'No contacts provided' });
    }

    const created = [];
    const skipped = [];

    for (const c of contacts) {
      if (!c.companyName) { skipped.push(c); continue; }

      const exists = await Lead.findOne({
        companyName: c.companyName,
        ...(c.email ? { email: c.email } : {}),
      });
      if (exists) { skipped.push(c); continue; }

      const lead = await Lead.create({
        companyName: c.companyName,
        contactName: c.name || '',
        email: c.email || '',
        phone: c.phone || '',
        website: c.website || '',
        industry: c.industry || 'technology',
        source: 'apollo',
        status: 'new',
        notes: [
          c.title ? `Title: ${c.title}` : '',
          c.linkedin ? `LinkedIn: ${c.linkedin}` : '',
        ].filter(Boolean).join('\n') || 'Imported from Apollo.io',
      });
      created.push(lead);
    }

    res.json({
      success: true,
      message: `Imported ${created.length} leads, skipped ${skipped.length} duplicates.`,
      data: { created: created.length, skipped: skipped.length },
    });
  } catch (error) {
    serverError(res, error);
  }
};

module.exports = { searchApollo, importApolloLeads };
