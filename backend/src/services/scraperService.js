const axios = require('axios');

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_BASE = 'https://api.apify.com/v2';

// Run an Apify actor and return dataset items
const runActor = async (actorId, input) => {
  const url = `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items`;
  const res = await axios.post(url, input, {
    params: { token: APIFY_TOKEN, timeout: 120, memory: 256 },
    headers: { 'Content-Type': 'application/json' },
    timeout: 130000,
  });
  return Array.isArray(res.data) ? res.data : [];
};

// Map Apify Upwork output → our Lead schema
// Field reference from actual actor output:
// id, url, title, description, budget, clientLocation, clientName,
// clientTotalSpent, jobType, experienceLevel, tags[], relativeDate
const mapUpworkItem = (item) => {
  const budgetStr = item.budget
    ? `$${item.budget}/hr (${item.jobType || 'Hourly'})`
    : '';

  // Use job title as company name since Upwork doesn't expose company
  const shortTitle = item.title
    ? item.title.replace(/span class="highlight"/g, '').replace(/<[^>]+>/g, '').slice(0, 60)
    : '';

  return {
    companyName: shortTitle || `Upwork Client (${item.clientName || 'Unknown'})`,
    contactName: item.clientName || '',
    email: '',
    phone: '',
    website: item.url || '',
    source: 'upwork',
    industry: (item.tags && item.tags[0]) || '',
    description: item.description
      ? item.description.slice(0, 500)
      : item.title || '',
    budget: budgetStr,
    tags: [
      ...(item.tags || []),
      item.experienceLevel,
      item.clientLocation,
      item.jobType,
    ].filter(Boolean).slice(0, 10),
    status: 'new',
  };
};

// Map Apify LinkedIn Jobs output → our Lead schema
// Fields: companyName, companyLinkedinUrl, companyDescription, companySlogan,
//         title, industries, location, seniorityLevel, employmentType, jobFunction,
//         descriptionText, link, postedAt, companyEmployeesCount
const mapLinkedInItem = (item) => ({
  companyName: item.companyName || 'Unknown Company',
  contactName: '',
  email: '',
  phone: '',
  website: item.companyLinkedinUrl || item.link || '',
  source: 'linkedin',
  industry: item.industries || item.jobFunction || '',
  description: item.companyDescription
    ? item.companyDescription.slice(0, 500)
    : item.descriptionText
    ? item.descriptionText.slice(0, 500)
    : '',
  budget: '',
  tags: [
    item.seniorityLevel,
    item.employmentType,
    item.jobFunction,
    item.location,
  ].filter(Boolean).slice(0, 8),
  status: 'new',
});

const scrapeUpwork = async (query) => {
  console.log(`[Apify] Scraping Upwork for: "${query}"`);

  if (!APIFY_TOKEN) {
    throw new Error('APIFY_API_TOKEN is not set in .env');
  }

  try {
    const items = await runActor('XYTgO05GT5qAoSlxy', {
      query,
      clientHistory: ['noHires', '1to9Hires', '10+Hires'],
      experienceLevel: ['entry', 'intermediate', 'expert'],
      jobType: ['fixed', 'hourly'],
      maxJobAge: { value: 24, unit: 'hours' },
      paymentVerified: false,
    });

    const leads = items.map(mapUpworkItem).filter((l) => l.companyName);
    console.log(`[Apify] Upwork returned ${leads.length} leads`);
    return leads;
  } catch (err) {
    console.error('[Apify] Upwork scrape failed:', err.message);
    throw new Error(`Upwork scrape failed: ${err.response?.data?.error?.message || err.message}`);
  }
};

const scrapeLinkedIn = async (query) => {
  console.log(`[Apify] Scraping LinkedIn for: "${query}"`);

  if (!APIFY_TOKEN) {
    throw new Error('APIFY_API_TOKEN is not set in .env');
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodedQuery}&position=1&pageNum=0`;

    const items = await runActor('hKByXkMQaC5Qt9UMN', {
      count: 20,
      scrapeCompany: true,
      splitByLocation: false,
      urls: [searchUrl],
    });

    const leads = items
      .map(mapLinkedInItem)
      .filter((l) => l.companyName && l.companyName !== 'Unknown Company');

    console.log(`[Apify] LinkedIn returned ${leads.length} leads`);
    return leads;
  } catch (err) {
    console.error('[Apify] LinkedIn scrape failed:', err.message);
    throw new Error(`LinkedIn scrape failed: ${err.response?.data?.error?.message || err.message}`);
  }
};

// Map Apify Freelancer output → our Lead schema
// Fields: id, title, description, url, budget{min,max}, currency{code,sign}, bid_stats{avg,count}
const mapFreelancerItem = (item) => {
  const min = item.budget?.minimum ?? '';
  const max = item.budget?.maximum ?? '';
  const sign = item.currency?.sign || '$';
  const code = item.currency?.code || 'USD';
  const budgetStr = min && max ? `${sign}${min} - ${sign}${max} ${code}` : '';

  const shortTitle = item.title ? item.title.slice(0, 80) : '';

  return {
    companyName: shortTitle || `Freelancer Project #${item.id}`,
    contactName: '',
    email: '',
    phone: '',
    website: item.url || '',
    source: 'freelancer',
    industry: '',
    description: item.description ? item.description.slice(0, 500) : '',
    budget: budgetStr,
    tags: [],
    status: 'new',
  };
};

const scrapeFreelancer = async (query) => {
  console.log(`[Apify] Scraping Freelancer for: "${query}"`);

  if (!APIFY_TOKEN) {
    throw new Error('APIFY_API_TOKEN is not set in .env');
  }

  try {
    const items = await runActor('piCT0NKlESaNutruy', {
      limit: 20,
      is_fixed: false,
      is_hourly: false,
      include_owner: false,
      dev_dataset_clear: false,
      dev_no_strip: false,
    });

    const leads = items.map(mapFreelancerItem).filter((l) => l.companyName);
    console.log(`[Apify] Freelancer returned ${leads.length} leads`);
    return leads;
  } catch (err) {
    console.error('[Apify] Freelancer scrape failed:', err.message);
    throw new Error(`Freelancer scrape failed: ${err.response?.data?.error?.message || err.message}`);
  }
};

// Map Apify Crunchbase output → our Lead schema
// Fields: name, website, about, full_description, industries[], region, address,
//         contact_phone, founders[], current_employees[], contacts[], featured_list[]
const mapCrunchbaseItem = (item) => {
  // Get CEO or first founder as contact
  const ceo = (item.current_employees || []).find((e) =>
    e.title && e.title.toLowerCase().includes('ceo')
  );
  const contactName = ceo?.name || (item.founders?.[0]?.value) || '';

  // Get primary industry
  const industry = item.industries?.[0]?.value || '';

  // Get latest funding amount from featured_list
  const funding = item.featured_list?.[0]?.org_funding_total?.formatted_value || '';
  const budgetStr = funding ? `Total Funding: ${funding}` : '';

  // Build tags from industries + region
  const industryTags = (item.industries || []).map((i) => i.value).slice(0, 5);
  const tags = [...industryTags, item.region].filter(Boolean).slice(0, 8);

  return {
    companyName: item.name || 'Unknown Company',
    contactName,
    email: '',
    phone: item.contact_phone || item.phone_number || '',
    website: item.website || item.url || '',
    source: 'crunchbase',
    industry,
    description: item.about || item.company_overview || item.full_description?.slice(0, 500) || '',
    budget: budgetStr,
    tags,
    status: 'new',
  };
};

const scrapeCrunchbase = async (query) => {
  console.log(`[Apify] Scraping Crunchbase for: "${query}"`);

  if (!APIFY_TOKEN) {
    throw new Error('APIFY_API_TOKEN is not set in .env');
  }

  try {
    // Convert query to Crunchbase search URL — scrapes companies matching the keyword
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.crunchbase.com/discover/organizations?keywords=${encodedQuery}`;

    const items = await runActor('396WTOnKwBlrti2p0', {
      company_urls: [{ url: searchUrl }],
    });

    const leads = items
      .map(mapCrunchbaseItem)
      .filter((l) => l.companyName && l.companyName !== 'Unknown Company');

    console.log(`[Apify] Crunchbase returned ${leads.length} leads`);
    return leads;
  } catch (err) {
    console.error('[Apify] Crunchbase scrape failed:', err.message);
    throw new Error(`Crunchbase scrape failed: ${err.response?.data?.error?.message || err.message}`);
  }
};

// Map Apify Clutch output → our Lead schema
// Fields: name, url, websiteUrl, bio, rating, reviewCount, employeeSize,
//         profileDetails{min.project size, avg.hourly rate, locations},
//         chartPie.industries.slices[], serviceLines[]
const mapClutchItem = (item) => {
  const details = item.profileDetails || {};

  // Budget from min project size + hourly rate
  const minProject = details['min. project size'] || '';
  const hourlyRate = details['avg. hourly rate'] || '';
  const budgetStr = [minProject, hourlyRate].filter(Boolean).join(' | ');

  // Primary industry from industries chart
  const industries = item.chartPie?.industries?.slices || [];
  const industry = industries[0]?.name || item.serviceLines?.[0]?.GroupName || '';

  // Tags from service lines + industries
  const serviceTags = (item.serviceLines || []).map((s) => s.Name).slice(0, 4);
  const industryTags = industries.map((i) => i.name).slice(0, 3);
  const tags = [...new Set([...serviceTags, ...industryTags])].slice(0, 8);

  // Location
  const location = details.locations || item.locations?.[0]?.name || '';

  return {
    companyName: item.name || 'Unknown Company',
    contactName: '',
    email: '',
    phone: '',
    website: item.websiteUrl || item.url || '',
    source: 'clutch',
    industry,
    description: item.bio ? item.bio.replace('\nRead more', '').slice(0, 500) : '',
    budget: budgetStr,
    tags: [...tags, location].filter(Boolean).slice(0, 8),
    status: 'new',
  };
};

// Query maps to Clutch category URL
// e.g. "web development" → clutch.co/us/web-developers
// e.g. "mobile app" → clutch.co/us/app-developers
const buildClutchUrl = (query) => {
  const q = query.toLowerCase();
  if (q.includes('mobile') || q.includes('app')) return 'https://clutch.co/us/app-developers';
  if (q.includes('web') || q.includes('react') || q.includes('node')) return 'https://clutch.co/us/web-developers';
  if (q.includes('design') || q.includes('ui') || q.includes('ux')) return 'https://clutch.co/us/agencies/ui-ux-design';
  if (q.includes('software')) return 'https://clutch.co/us/agencies/software-development';
  if (q.includes('ecommerce') || q.includes('shopify')) return 'https://clutch.co/us/ecommerce-developers';
  if (q.includes('ai') || q.includes('machine learning')) return 'https://clutch.co/us/agencies/artificial-intelligence';
  if (q.includes('marketing')) return 'https://clutch.co/us/agencies/digital-marketing';
  if (q.includes('branding') || q.includes('creative')) return 'https://clutch.co/us/agencies/creative';
  // Default: software development
  return 'https://clutch.co/us/agencies/software-development';
};

const scrapeClutch = async (query) => {
  console.log(`[Apify] Scraping Clutch for: "${query}"`);

  if (!APIFY_TOKEN) {
    throw new Error('APIFY_API_TOKEN is not set in .env');
  }

  try {
    const clutchUrl = buildClutchUrl(query);
    console.log(`[Apify] Clutch URL: ${clutchUrl}`);

    const items = await runActor('FuFr3AKHFTGxvTXNf', {
      startUrls: [{ url: clutchUrl }],
      enrichEmails: false,
      includeCompanyReviews: false,
      proxy: {
        useApifyProxy: true,
        apifyProxyGroups: ['RESIDENTIAL'],
      },
    });

    const leads = items
      .map(mapClutchItem)
      .filter((l) => l.companyName && l.companyName !== 'Unknown Company');

    console.log(`[Apify] Clutch returned ${leads.length} leads`);
    return leads;
  } catch (err) {
    console.error('[Apify] Clutch scrape failed:', err.message);
    throw new Error(`Clutch scrape failed: ${err.response?.data?.error?.message || err.message}`);
  }
};

module.exports = { scrapeUpwork, scrapeLinkedIn, scrapeFreelancer, scrapeCrunchbase, scrapeClutch };
