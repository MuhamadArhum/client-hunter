// Scraper Service
// Note: These are mock implementations that return realistic sample data.
// For production use, replace with actual scraping logic using puppeteer-core
// with a real browser executable path, or integrate with a dedicated scraping API.

// Mock Upwork lead data generator
const scrapeUpwork = async (query) => {
  console.log(`[ScraperService] Scraping Upwork for: "${query}"`);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const industries = ['E-commerce', 'Healthcare', 'FinTech', 'EdTech', 'SaaS', 'Real Estate', 'Marketing'];
  const budgets = ['$500 - $1,000', '$1,000 - $5,000', '$5,000 - $10,000', '$10,000+'];

  const sampleLeads = [
    {
      companyName: 'TechVentures Inc.',
      contactName: 'John Smith',
      email: 'john@techventures.com',
      phone: '+1-555-0101',
      website: 'https://techventures.com',
      source: 'upwork',
      industry: 'SaaS',
      description: `Looking for ${query} expertise to build a scalable web application`,
      budget: '$5,000 - $10,000',
      tags: ['react', 'node.js', query.toLowerCase()],
      status: 'new',
    },
    {
      companyName: 'Digital Solutions LLC',
      contactName: 'Sarah Johnson',
      email: 'sarah@digitalsolutions.io',
      phone: '+1-555-0102',
      website: 'https://digitalsolutions.io',
      source: 'upwork',
      industry: 'Marketing',
      description: `Need a team for ${query} project with tight deadline`,
      budget: '$1,000 - $5,000',
      tags: ['typescript', 'aws', query.toLowerCase()],
      status: 'new',
    },
    {
      companyName: 'GrowthHackers Co.',
      contactName: 'Mike Chen',
      email: 'mike@growthhackers.co',
      phone: '+1-555-0103',
      website: 'https://growthhackers.co',
      source: 'upwork',
      industry: industries[Math.floor(Math.random() * industries.length)],
      description: `Seeking expert in ${query} for ongoing development work`,
      budget: budgets[Math.floor(Math.random() * budgets.length)],
      tags: [query.toLowerCase(), 'fullstack'],
      status: 'new',
    },
    {
      companyName: 'InnovateTech Startup',
      contactName: 'Emily Davis',
      email: 'emily@innovatetech.io',
      phone: '+1-555-0104',
      website: 'https://innovatetech.io',
      source: 'upwork',
      industry: 'FinTech',
      description: `Looking to hire ${query} developer for MVP development`,
      budget: '$10,000+',
      tags: ['startup', 'mvp', query.toLowerCase()],
      status: 'new',
    },
    {
      companyName: 'GlobalMart E-commerce',
      contactName: 'Robert Wilson',
      email: 'robert@globalmart.shop',
      phone: '+1-555-0105',
      website: 'https://globalmart.shop',
      source: 'upwork',
      industry: 'E-commerce',
      description: `Require ${query} specialist to optimize our online store`,
      budget: '$5,000 - $10,000',
      tags: ['ecommerce', 'optimization', query.toLowerCase()],
      status: 'new',
    },
  ];

  return sampleLeads;
};

// Mock LinkedIn lead data generator
const scrapeLinkedIn = async (query) => {
  console.log(`[ScraperService] Scraping LinkedIn for: "${query}"`);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const sampleLeads = [
    {
      companyName: 'Nexus Digital Agency',
      contactName: 'Amanda Foster',
      email: 'amanda.foster@nexusdigital.com',
      phone: '+44-20-7946-0001',
      website: 'https://nexusdigital.com',
      source: 'linkedin',
      industry: 'Digital Marketing',
      description: `CTO seeking ${query} solutions for their growing client base`,
      budget: '$5,000 - $10,000',
      tags: ['agency', 'digital', query.toLowerCase()],
      status: 'new',
    },
    {
      companyName: 'Quantum Software GmbH',
      contactName: 'Klaus Müller',
      email: 'k.muller@quantum-sw.de',
      phone: '+49-89-1234-5678',
      website: 'https://quantum-sw.de',
      source: 'linkedin',
      industry: 'Enterprise Software',
      description: `VP Engineering looking for ${query} contractors for Q4 project`,
      budget: '$10,000+',
      tags: ['enterprise', 'contract', query.toLowerCase()],
      status: 'new',
    },
    {
      companyName: 'BlueSky Ventures',
      contactName: 'Priya Sharma',
      email: 'priya@blueskyvc.com',
      phone: '+91-98765-43210',
      website: 'https://blueskyvc.com',
      source: 'linkedin',
      industry: 'Venture Capital',
      description: `Portfolio company needs ${query} expertise urgently`,
      budget: '$1,000 - $5,000',
      tags: ['startup', 'vc-backed', query.toLowerCase()],
      status: 'new',
    },
    {
      companyName: 'MedTech Solutions',
      contactName: 'Dr. James Parker',
      email: 'j.parker@medtechsolutions.health',
      phone: '+1-617-555-0199',
      website: 'https://medtechsolutions.health',
      source: 'linkedin',
      industry: 'Healthcare',
      description: `Looking for HIPAA-compliant ${query} development team`,
      budget: '$10,000+',
      tags: ['healthcare', 'hipaa', query.toLowerCase()],
      status: 'new',
    },
  ];

  return sampleLeads;
};

module.exports = { scrapeUpwork, scrapeLinkedIn };
