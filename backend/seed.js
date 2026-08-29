/**
 * Seed script — run with: node backend/seed.js
 * Seeds: 1 user, 20 leads, proposals, outreach logs, templates, sequences
 */
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/* ── Models ── */
const User              = require('./src/models/User');
const Lead              = require('./src/models/Lead');
const Proposal          = require('./src/models/Proposal');
const OutreachLog       = require('./src/models/OutreachLog');
const EmailTemplate     = require('./src/models/EmailTemplate');
const Sequence          = require('./src/models/Sequence');
const SequenceEnrollment = require('./src/models/SequenceEnrollment');

/* ── Helpers ── */
const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pick = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

/* ─────────────────────────────────────────── */

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  /* ── 1. USER ── */
  let user = await User.findOne({ email: 'demo@abyte.io' });
  if (!user) {
    const hash = await bcrypt.hash('Demo@1234', 10);
    user = await User.create({
      name: 'Muhammad Arhum',
      email: 'demo@abyte.io',
      password: hash,
      role: 'admin',
    });
    console.log('✅ Demo user created  →  demo@abyte.io / Demo@1234');
  } else {
    console.log('ℹ️  Demo user already exists');
  }

  /* ── 2. CLEAR OLD SEED DATA ── */
  await Promise.all([
    Lead.deleteMany({}),
    Proposal.deleteMany({}),
    OutreachLog.deleteMany({}),
    EmailTemplate.deleteMany({ user: user._id }),
    Sequence.deleteMany({ user: user._id }),
    SequenceEnrollment.deleteMany({}),
  ]);
  console.log('🗑️  Old seed data cleared');

  /* ── 3. LEADS ── */
  const LEADS_DATA = [
    { companyName: 'Nexflow Labs',      contactName: 'Sarah Mitchell',   email: 'sarah@nexflow.io',      phone: '+1-415-555-0101', website: 'nexflow.io',      source: 'linkedin',   status: 'converted',     industry: 'SaaS',            budget: '$5,000–$10,000', aiScore: 9.2, aiQualification: 'hot',  tags: ['enterprise', 'saas'],  aiRecommendedService: 'Full-Stack Web App', aiSummary: 'High-growth SaaS startup scaling their data pipeline. Ready to invest.', aiPainPoints: ['Manual reporting', 'No real-time analytics'], },
    { companyName: 'BrightEdge Studio', contactName: 'James Okafor',     email: 'james@brightedge.co',   phone: '+44-20-5550-0120', website: 'brightedge.co',  source: 'upwork',     status: 'proposal_sent', industry: 'Design Agency',   budget: '$2,000–$5,000',  aiScore: 8.1, aiQualification: 'hot',  tags: ['agency', 'design'],    aiRecommendedService: 'Portfolio Website',  aiSummary: 'Creative agency seeking a polished portfolio rebuild.', aiPainPoints: ['Outdated website', 'No CMS'], },
    { companyName: 'Verdant Health',    contactName: 'Priya Sharma',     email: 'priya@verdanthealth.com', phone: '+91-98765-43210', website: 'verdanthealth.com', source: 'clutch',  status: 'follow_up',     industry: 'Healthcare',      budget: '$10,000+',       aiScore: 7.5, aiQualification: 'hot',  tags: ['health', 'mobile'],    aiRecommendedService: 'Patient Portal Mobile App', aiSummary: 'HealthTech company needing a HIPAA-compliant patient portal.', aiPainPoints: ['Paper-based records', 'Poor UX'], },
    { companyName: 'Titanium Commerce', contactName: 'Alex Rivera',      email: 'alex@titaniumcmrc.com', phone: '+1-312-555-0134', website: 'titaniumcmrc.com', source: 'crunchbase', status: 'contacted',    industry: 'E-commerce',      budget: '$3,000–$8,000',  aiScore: 7.8, aiQualification: 'warm', tags: ['ecommerce', 'shopify'], aiRecommendedService: 'Custom Shopify Theme + Integrations', aiSummary: 'Mid-size e-commerce brand wanting a Shopify headless migration.', aiPainPoints: ['Slow page load', 'No custom checkout'], },
    { companyName: 'Quantum Fintech',   contactName: 'Emily Chen',       email: 'emily@quantumft.com',   phone: '+65-9123-4567',   website: 'quantumft.com',  source: 'linkedin',   status: 'new',           industry: 'Fintech',         budget: '$15,000+',       aiScore: 9.5, aiQualification: 'hot',  tags: ['fintech', 'enterprise'], aiRecommendedService: 'Trading Dashboard & API Integration', aiSummary: 'Series-A funded fintech building a retail trading platform.', aiPainPoints: ['Legacy backend', 'No mobile app'], },
    { companyName: 'Orbital Logistics', contactName: 'Tom Harrington',   email: 'tom@orbitallog.com',    phone: '+61-412-555-0156', website: 'orbitallog.com', source: 'manual',     status: 'new',           industry: 'Logistics',       budget: '$5,000–$12,000', aiScore: 6.4, aiQualification: 'warm', tags: ['logistics', 'tracking'], aiRecommendedService: 'Fleet Tracking Dashboard', aiSummary: 'Logistics startup needing real-time fleet tracking software.', aiPainPoints: ['Excel-based tracking', 'No live map view'], },
    { companyName: 'Bloom Edu',         contactName: 'Fatima Al-Zahra',  email: 'fatima@bloomedu.org',   phone: '+971-55-555-0167', website: 'bloomedu.org',  source: 'freelancer', status: 'contacted',     industry: 'EdTech',          budget: '$2,000–$4,000',  aiScore: 5.9, aiQualification: 'warm', tags: ['edtech', 'lms'],       aiRecommendedService: 'LMS Platform', aiSummary: 'Online education startup building a course marketplace.', aiPainPoints: ['No quiz engine', 'Manual certificate generation'], },
    { companyName: 'CarbonTrace',       contactName: 'Luca Bianchi',     email: 'luca@carbontrace.eu',   phone: '+39-02-5550-0178', website: 'carbontrace.eu', source: 'linkedin',  status: 'proposal_sent', industry: 'CleanTech',       budget: '$8,000–$20,000', aiScore: 8.7, aiQualification: 'hot',  tags: ['sustainability', 'b2b'], aiRecommendedService: 'Carbon Footprint SaaS Dashboard', aiSummary: 'EU-based CleanTech startup building ESG reporting tools.', aiPainPoints: ['No automated data ingestion', 'PDF-only reports'], },
    { companyName: 'NovaPets',          contactName: 'Jessica Park',     email: 'jess@novapets.com',     phone: '+1-647-555-0189', website: 'novapets.com',  source: 'clutch',     status: 'lost',          industry: 'Pet Tech',        budget: '$1,000–$3,000',  aiScore: 3.2, aiQualification: 'cold', tags: ['consumer', 'mobile'],  aiRecommendedService: 'Pet Health Tracker App', aiSummary: 'B2C pet tech app. Budget too small for scope.', aiPainPoints: ['No vet booking', 'No health logs'], },
    { companyName: 'Skyvault Cloud',    contactName: 'Omar Abdullah',    email: 'omar@skyvault.io',      phone: '+966-55-555-0190', website: 'skyvault.io',  source: 'upwork',     status: 'follow_up',     industry: 'Cloud Services',  budget: '$6,000–$15,000', aiScore: 7.1, aiQualification: 'warm', tags: ['cloud', 'devops'],     aiRecommendedService: 'Cloud Cost Optimisation Dashboard', aiSummary: 'Cloud MSP looking to build a self-service customer portal.', aiPainPoints: ['Manual billing', 'No usage analytics'], },
    { companyName: 'PulseMedia',        contactName: 'Diana Voronova',   email: 'diana@pulsemedia.co',   phone: '+380-44-555-0201', website: 'pulsemedia.co', source: 'scraped',   status: 'new',           industry: 'Media & Content', budget: '$3,000–$6,000',  aiScore: 6.0, aiQualification: 'warm', tags: ['media', 'cms'],        aiRecommendedService: 'Headless CMS + Newsletter Platform', aiSummary: 'Independent media house wanting a custom editorial workflow.', aiPainPoints: ['WordPress limitations', 'No subscriber analytics'], },
    { companyName: 'Ironforge Gym',     contactName: 'Chris Donovan',    email: 'chris@ironforge.gym',   phone: '+353-1-555-0212', website: 'ironforge.gym', source: 'manual',    status: 'converted',     industry: 'Fitness',         budget: '$1,500–$3,000',  aiScore: 5.5, aiQualification: 'warm', tags: ['fitness', 'booking'],  aiRecommendedService: 'Membership & Booking App', aiSummary: 'Gym chain needing an app for class bookings and membership management.', aiPainPoints: ['No mobile booking', 'Manual waitlists'], },
    { companyName: 'DeepRoot Analytics',contactName: 'Raj Patel',        email: 'raj@deeproot.ai',       phone: '+1-514-555-0223', website: 'deeproot.ai',  source: 'crunchbase', status: 'proposal_sent', industry: 'AI / Data',       budget: '$12,000–$25,000',aiScore: 9.0, aiQualification: 'hot',  tags: ['ai', 'b2b', 'saas'],   aiRecommendedService: 'Custom ML Pipeline Dashboard', aiSummary: 'AI startup needing a data labelling and pipeline monitoring UI.', aiPainPoints: ['No visibility into model training', 'Manual QA'], },
    { companyName: 'Zara Fashion Tech', contactName: 'Isabella Torres',  email: 'isabella@zaraft.com',   phone: '+34-91-555-0234', website: 'zaraft.com',   source: 'linkedin',   status: 'contacted',     industry: 'Fashion Tech',    budget: '$4,000–$9,000',  aiScore: 6.8, aiQualification: 'warm', tags: ['fashion', 'ar'],       aiRecommendedService: 'AR Virtual Try-On Widget', aiSummary: 'Fashion retailer exploring AR for virtual try-on feature.', aiPainPoints: ['High cart abandonment', 'No AR capability'], },
    { companyName: 'Harbour Real Estate',contactName:'William Fong',     email: 'william@harbourre.hk',  phone: '+852-9123-5678',  website: 'harbourre.hk', source: 'clutch',    status: 'new',           industry: 'Real Estate',     budget: '$8,000–$18,000', aiScore: 7.3, aiQualification: 'warm', tags: ['real-estate', 'crm'],  aiRecommendedService: 'Property CRM & Listing Portal', aiSummary: 'Hong Kong property firm wanting a modern CRM + public listing site.', aiPainPoints: ['Using spreadsheets', 'No client portal'], },
    { companyName: 'SwiftCargo',        contactName: 'Amara Diallo',     email: 'amara@swiftcargo.ng',   phone: '+234-803-555-0256',website: 'swiftcargo.ng', source: 'freelancer', status: 'lost',         industry: 'Logistics',       budget: '$500–$1,500',    aiScore: 2.1, aiQualification: 'cold', tags: ['logistics', 'startup']},
    { companyName: 'Neuron Marketing',  contactName: 'Claire Dupont',    email: 'claire@neuronmktg.fr',  phone: '+33-1-5550-0267',  website: 'neuronmktg.fr', source: 'upwork',   status: 'follow_up',     industry: 'Marketing',       budget: '$3,500–$7,000',  aiScore: 6.6, aiQualification: 'warm', tags: ['marketing', 'automation'], aiRecommendedService: 'Lead Scoring & CRM Integration', aiSummary: 'Performance marketing agency that wants better lead attribution.', aiPainPoints: ['No unified attribution', 'Manual reporting'], },
    { companyName: 'Titan Robotics',    contactName: 'Henrik Larsson',   email: 'henrik@titanrobotics.se',phone: '+46-8-555-0278', website: 'titanrobotics.se',source: 'crunchbase', status: 'new',         industry: 'Robotics / IoT',  budget: '$20,000+',       aiScore: 8.9, aiQualification: 'hot',  tags: ['robotics', 'iot', 'b2b'], aiRecommendedService: 'IoT Fleet Management Dashboard', aiSummary: 'Swedish robotics company building industrial automation monitoring.', aiPainPoints: ['No remote diagnostics', 'Excel maintenance logs'], },
    { companyName: 'CulinArt',          contactName: 'Mei Tanaka',       email: 'mei@culinart.jp',        phone: '+81-3-5550-0289', website: 'culinart.jp',  source: 'scraped',   status: 'contacted',     industry: 'Food Tech',       budget: '$2,500–$5,000',  aiScore: 5.3, aiQualification: 'warm', tags: ['food', 'marketplace'],  aiRecommendedService: 'Chef Booking Marketplace', aiSummary: 'Japanese food startup building an Airbnb-style chef marketplace.', aiPainPoints: ['No booking system', 'Manual payments'], },
    { companyName: 'BioSynth Pharma',   contactName: 'Dr. Amir Hassan',  email: 'amir@biosynth.com',      phone: '+49-89-5550-0290', website: 'biosynth.com', source: 'linkedin',  status: 'proposal_sent', industry: 'Pharma / Biotech',budget: '$15,000–$30,000',aiScore: 8.4, aiQualification: 'hot',  tags: ['pharma', 'compliance', 'b2b'], aiRecommendedService: 'Clinical Trial Management System', aiSummary: 'German pharma startup building a CTMS for oncology trials.', aiPainPoints: ['Paper-based trials', 'No regulatory audit trail'], },
  ];

  const leads = await Lead.insertMany(
    LEADS_DATA.map((l) => ({
      ...l,
      createdAt: daysAgo(Math.floor(Math.random() * 45)),
      followUpScheduled: ['follow_up', 'contacted'].includes(l.status) ? daysAgo(-2) : null,
    }))
  );
  console.log(`✅ ${leads.length} leads seeded`);

  /* ── 4. PROPOSALS ── */
  const proposalLeads = leads.filter((l) => ['proposal_sent', 'converted', 'follow_up', 'contacted'].includes(l.status));
  const proposals = await Proposal.insertMany(
    proposalLeads.map((lead, i) => ({
      lead: lead._id,
      title: `Custom ${lead.industry} Solution for ${lead.companyName}`,
      content: `# Proposal for ${lead.companyName}\n\n## Executive Summary\nWe are excited to present this proposal for **${lead.aiRecommendedService || 'Digital Transformation'}** tailored specifically for ${lead.companyName}.\n\n## Problem Statement\n${(lead.aiPainPoints || ['Inefficient manual processes', 'Lack of scalability']).map((p) => `- ${p}`).join('\n')}\n\n## Proposed Solution\nOur team at **Abyte Sol** will deliver a world-class ${lead.aiRecommendedService || 'software solution'} with the following key modules:\n\n1. **Core Platform** — Robust, scalable backend with REST/GraphQL APIs\n2. **User Interface** — Responsive, accessible design system\n3. **Analytics Dashboard** — Real-time KPIs and reporting\n4. **Integrations** — Seamless connection to your existing tools\n\n## Timeline\n| Phase | Duration | Deliverables |\n|---|---|---|\n| Discovery | 1 week | Tech spec, wireframes |\n| Development | 4–6 weeks | Full-stack build |\n| QA & Launch | 1 week | Testing, deployment |\n\n## Investment\nBudget range: **${lead.budget || '$5,000–$10,000'}**\n\n## Why Abyte Sol?\n- 50+ successful SaaS projects\n- Dedicated project manager\n- 6-month post-launch support\n\n---\n*Ready to move forward? Accept this proposal and we'll schedule a kickoff call within 24 hours.*`,
      status: lead.status === 'converted' ? 'accepted' : lead.status === 'follow_up' ? 'sent' : 'sent',
      generatedBy: 'groq',
      isPublic: i % 3 === 0,
      publicToken: `tok_${lead._id}_${i}_${Math.random().toString(36).slice(2)}`,
      clientDecision: lead.status === 'converted' ? 'accepted' : 'pending',
      createdAt: daysAgo(Math.floor(Math.random() * 20)),
    }))
  );
  console.log(`✅ ${proposals.length} proposals seeded`);

  /* ── 5. OUTREACH LOGS ── */
  const outreachLeads = leads.filter((l) => l.status !== 'new' && l.status !== 'deleted');
  const outreachLogs = [];
  const emailSubjects = [
    'Quick question about your current tech stack',
    'Partnership opportunity for {{company}}',
    'How we helped similar companies 3x their efficiency',
    'Following up on our previous conversation',
    'Proposal ready — let\'s discuss',
    'Checking in — are you ready to move forward?',
    'Case study: 40% cost reduction for a SaaS company like yours',
  ];
  const emailBodies = [
    `Hi {{name}},\n\nI came across {{company}} and was genuinely impressed by what you're building in the {{industry}} space.\n\nWe've recently helped similar companies streamline their operations with custom software. I'd love to share how we could do the same for you.\n\nWould you have 20 minutes this week for a quick call?\n\nBest,\nMuhammad Arhum\nAbyte Sol`,
    `Hi {{name}},\n\nFollowing up on my previous email — I know inboxes get busy!\n\nI wanted to share a quick case study of a client in your industry who reduced manual work by 60% with a solution we built for them.\n\nWould love to explore if we could do the same for {{company}}.\n\nCheers,\nMuhammad`,
    `Hi {{name}},\n\nI've put together a custom proposal for {{company}} based on the pain points I noticed. I think we can genuinely help.\n\nThe proposal covers timeline, budget, and a detailed technical approach — happy to walk you through it on a call.\n\nLet me know a time that works!\n\nBest,\nMuhammad Arhum`,
  ];

  for (const lead of outreachLeads) {
    const count = lead.status === 'converted' ? 3 : lead.status === 'follow_up' ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const isEmail = Math.random() > 0.2;
      const daysBack = 30 - i * 7 - Math.floor(Math.random() * 5);
      const sentDate = daysAgo(daysBack);
      outreachLogs.push({
        lead: lead._id,
        type: isEmail ? 'email' : 'whatsapp',
        subject: isEmail ? rand(emailSubjects).replace('{{company}}', lead.companyName) : '',
        message: rand(emailBodies)
          .replace(/\{\{name\}\}/g, lead.contactName || 'there')
          .replace(/\{\{company\}\}/g, lead.companyName)
          .replace(/\{\{industry\}\}/g, lead.industry || 'your industry'),
        status: 'sent',
        sentAt: sentDate,
        openedAt: Math.random() > 0.4 ? new Date(sentDate.getTime() + 3600000 * Math.floor(Math.random() * 24)) : null,
        clickedAt: Math.random() > 0.6 ? new Date(sentDate.getTime() + 3600000 * (Math.floor(Math.random() * 24) + 24)) : null,
        trackingId: `trk_${lead._id}_${i}_${Date.now()}`,
        createdAt: sentDate,
      });
    }
  }
  await OutreachLog.insertMany(outreachLogs);
  console.log(`✅ ${outreachLogs.length} outreach logs seeded`);

  /* ── 6. EMAIL TEMPLATES ── */
  const templates = await EmailTemplate.insertMany([
    {
      user: user._id,
      name: 'Cold Intro — SaaS',
      subject: 'Quick question about your tech stack, {{companyName}}',
      body: `Hi {{contactName}},\n\nI came across {{companyName}} and was impressed by what you're building. We specialize in helping SaaS companies like yours ship faster with scalable architecture.\n\nWould you be open to a 15-minute call this week?\n\nBest,\n{{senderName}}`,
      category: 'cold-outreach',
      usageCount: 14,
    },
    {
      user: user._id,
      name: 'Follow-Up #1 — Soft',
      subject: 'Re: Our conversation about {{companyName}}',
      body: `Hi {{contactName}},\n\nJust checking in — I know things get busy. Wanted to see if you had a chance to review my previous email.\n\nI genuinely think we could save {{companyName}} significant time and cost. Happy to share a quick case study if helpful.\n\nCheers,\n{{senderName}}`,
      category: 'follow-up',
      usageCount: 22,
    },
    {
      user: user._id,
      name: 'Follow-Up #2 — Value Prop',
      subject: 'One thing I wanted to share with you',
      body: `Hi {{contactName}},\n\nI wanted to share how we recently helped a {{industry}} company reduce their operational overhead by 40% in under 6 weeks.\n\nI have a feeling we could do something similar for {{companyName}}. Would you like to see the case study?\n\nBest,\n{{senderName}}`,
      category: 'follow-up',
      usageCount: 8,
    },
    {
      user: user._id,
      name: 'Proposal Delivery',
      subject: 'Your custom proposal is ready — {{companyName}}',
      body: `Hi {{contactName}},\n\nThank you for your time earlier. As promised, I've put together a custom proposal for {{companyName}}.\n\nIt covers:\n✅ Proposed solution architecture\n✅ Project timeline (6–8 weeks)\n✅ Investment breakdown\n\nPlease find the proposal at the link below. I'd love to walk you through it on a call — does Thursday at 3pm work?\n\n{{proposalLink}}\n\nLooking forward to partnering with you!\n\nBest,\n{{senderName}}`,
      category: 'proposal',
      usageCount: 6,
    },
    {
      user: user._id,
      name: 'WhatsApp — Quick Intro',
      subject: 'WhatsApp — Quick Intro Message',
      body: `Hi {{contactName}} 👋 This is {{senderName}} from Abyte Sol. I came across {{companyName}} and thought our work in {{industry}} might be relevant to you. Mind if I send over a quick overview? Takes 2 mins to read 🙂`,
      category: 'cold-outreach',
      usageCount: 11,
    },
    {
      user: user._id,
      name: 'Re-Engagement — Cold Lead',
      subject: '{{companyName}} — still exploring options?',
      body: `Hi {{contactName}},\n\nIt's been a while since we last spoke. I wanted to reach out because we've just launched some new capabilities that might be a great fit for {{companyName}}.\n\nIf the timing is better now, I'd love to reconnect. Even a quick 10-minute call could be worthwhile.\n\nNo pressure at all — just wanted to stay in touch!\n\nBest,\n{{senderName}}`,
      category: 'general',
      usageCount: 3,
    },
  ]);
  console.log(`✅ ${templates.length} email templates seeded`);

  /* ── 7. SEQUENCES ── */
  const sequences = await Sequence.insertMany([
    {
      user: user._id,
      name: '5-Step SaaS Cold Outreach',
      description: 'Proven 5-email sequence for reaching SaaS decision makers. 28% average reply rate.',
      isActive: true,
      steps: [
        { stepNumber: 1, delayDays: 0,  subject: 'Quick question, {{companyName}}', body: `Hi {{contactName}},\n\nI noticed {{companyName}} is scaling fast — congrats on the growth!\n\nWe help SaaS companies like yours build and ship product features 2x faster. Would a 15-min call make sense?\n\n— {{senderName}}` },
        { stepNumber: 2, delayDays: 3,  subject: 'Re: Quick question, {{companyName}}', body: `Hi {{contactName}},\n\nFollowing up in case my last email got buried. Happy to share a case study of a similar company we worked with — they cut their dev cycle by 40%.\n\nWorth a quick chat?\n\n— {{senderName}}` },
        { stepNumber: 3, delayDays: 7,  subject: 'One more thought on {{companyName}}', body: `Hi {{contactName}},\n\nI know this is my third email — I'll keep it short. We have a slot opening up next month for one new client. Given what {{companyName}} is building, I think the fit is strong.\n\nIf the timing is off, totally understand. But if you're open to it, I'd love 15 minutes.\n\n— {{senderName}}` },
        { stepNumber: 4, delayDays: 14, subject: 'Case study you might find useful', body: `Hi {{contactName}},\n\nSharing this case study that might be relevant — a SaaS company in your space went from 3-month to 3-week feature releases after partnering with us.\n\nHappy to share the full story on a call.\n\n— {{senderName}}` },
        { stepNumber: 5, delayDays: 21, subject: 'Closing the loop, {{contactName}}', body: `Hi {{contactName}},\n\nThis will be my last email — I don't want to clog your inbox. If the timing isn't right now, I completely understand.\n\nFeel free to reach out whenever the timing is better. I'll be here!\n\nBest of luck with {{companyName}},\n{{senderName}}` },
      ],
    },
    {
      user: user._id,
      name: 'Agency Follow-Up Drip',
      description: '3-step follow-up for warm agency leads who showed interest but went quiet.',
      isActive: true,
      steps: [
        { stepNumber: 1, delayDays: 2, subject: 'Checking in — {{companyName}}', body: `Hi {{contactName}},\n\nJust checking in after our last conversation. Did you get a chance to look over what we discussed?\n\nHappy to answer any questions or set up a quick call.\n\n— {{senderName}}` },
        { stepNumber: 2, delayDays: 6, subject: 'Still thinking it over?', body: `Hi {{contactName}},\n\nNo rush at all — just wanted to pop back in. If budget or timing is the main concern, we do offer flexible payment plans and phased delivery.\n\nWould that help? Happy to talk through options.\n\n— {{senderName}}` },
        { stepNumber: 3, delayDays: 12, subject: 'Last check-in from my end', body: `Hi {{contactName}},\n\nI'll leave it here after this — just wanted to make sure {{companyName}} has everything needed to make a decision.\n\nIf you'd like to move forward in the future, just reply to this email and we'll pick up right where we left off.\n\nBest,\n{{senderName}}` },
      ],
    },
    {
      user: user._id,
      name: 'Post-Proposal Nurture',
      description: 'Automated follow-up after sending a proposal. Keeps the deal warm.',
      isActive: false,
      steps: [
        { stepNumber: 1, delayDays: 1, subject: 'Did you get a chance to review the proposal?', body: `Hi {{contactName}},\n\nJust making sure the proposal landed in your inbox. Let me know if you have any questions — happy to walk you through it on a quick call.\n\n— {{senderName}}` },
        { stepNumber: 2, delayDays: 4, subject: 'Any feedback on our proposal for {{companyName}}?', body: `Hi {{contactName}},\n\nChecking in on the proposal. If anything needs adjusting — scope, timeline, budget — I'm very open to making it work.\n\nBest,\n{{senderName}}` },
        { stepNumber: 3, delayDays: 10, subject: 'One last follow-up on the proposal', body: `Hi {{contactName}},\n\nI don't want to be pushy, but I did want to follow up one more time on the proposal for {{companyName}}.\n\nIf you've decided to go a different direction, no hard feelings — I'd just appreciate knowing so I can plan accordingly.\n\nEither way, I hope things are going well!\n\n— {{senderName}}` },
      ],
    },
  ]);
  console.log(`✅ ${sequences.length} sequences seeded`);

  /* ── 8. SEQUENCE ENROLLMENTS ── */
  const hotLeads = leads.filter((l) => l.aiQualification === 'hot' && l.status !== 'converted');
  const seq = sequences[0];
  if (hotLeads.length && seq) {
    await SequenceEnrollment.insertMany(
      hotLeads.slice(0, 3).map((lead, i) => ({
        sequence: seq._id,
        lead: lead._id,
        user: user._id,
        currentStep: i + 1,
        status: 'active',
        nextSendAt: daysAgo(-(i + 1)),
        createdAt: daysAgo(10 - i * 2),
      }))
    );
    console.log(`✅ ${Math.min(hotLeads.length, 3)} sequence enrollments seeded`);
  }

  /* ── SUMMARY ── */
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Seed complete! Login credentials:');
  console.log('   Email    → demo@abyte.io');
  console.log('   Password → Demo@1234');
  console.log('   URL      → http://localhost:5174/login');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
