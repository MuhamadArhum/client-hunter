/**
 * Bulk seed — 10,000 entries per collection
 * Run: node backend/seed-bulk.js
 */
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User               = require('./src/models/User');
const Lead               = require('./src/models/Lead');
const Proposal           = require('./src/models/Proposal');
const OutreachLog        = require('./src/models/OutreachLog');
const EmailTemplate      = require('./src/models/EmailTemplate');
const Sequence           = require('./src/models/Sequence');
const SequenceEnrollment = require('./src/models/SequenceEnrollment');

/* ─── helpers ─── */
const rand  = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000);
const daysFromNow = (n) => new Date(Date.now() + n * 86_400_000);
const BATCH = 500; // insert N docs at a time

async function insertBatches(Model, docs) {
  let inserted = 0;
  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = docs.slice(i, i + BATCH);
    await Model.insertMany(batch, { ordered: false });
    inserted += batch.length;
    process.stdout.write(`\r   → ${inserted}/${docs.length}`);
  }
  process.stdout.write('\n');
  return inserted;
}

/* ─── data pools ─── */
const FIRST_NAMES = ['James','Maria','Ahmed','Priya','Liam','Sofia','Omar','Emily','Carlos','Fatima','David','Aisha','Ryan','Mei','Noah','Sara','Ethan','Leila','Lucas','Nina','Jack','Zara','Henry','Aya','Oliver','Nora','Leo','Hana','Max','Luna','Alex','Isla','Ben','Aria','Sam','Eva','Kai','Mia','Jordan','Chloe'];
const LAST_NAMES  = ['Mitchell','Okafor','Sharma','Rivera','Chen','Hassan','Patel','Torres','Dupont','Tanaka','Kim','Müller','Rossi','Garcia','Ahmed','Brown','Wilson','Anderson','Taylor','Thomas','Moore','Jackson','Martin','Lee','Walker','Hall','Young','King','Scott','Green','Adams','Baker','Carter','Davis','Evans','Foster','Gray','Hill','Jones','Kelly'];
const COMPANIES   = ['Nexflow','BrightEdge','Verdant','Titanium','Quantum','Orbital','Bloom','Carbon','Nova','Skyvault','Pulse','Ironforge','DeepRoot','Zara','Harbour','SwiftCargo','Neuron','Titan','CulinArt','BioSynth','Apex','Zenith','Luminary','Crest','Summit','Pinnacle','Vanguard','Atlas','Horizon','Meridian','Cipher','Nimbus','Stratos','Echo','Forge','Prism','Vector','Surge','Flux','Spark','Axon','Helios','Solaris','Polaris','Nova','Vertex','Core','Edge','Arc','Wave'];
const SUFFIXES    = ['Labs','Tech','AI','Digital','Studio','Group','Systems','Solutions','Cloud','IO','HQ','Co','Inc','Ventures','Works','Soft','Net','Hub','Space','Base'];
const INDUSTRIES  = ['SaaS','E-commerce','HealthTech','FinTech','EdTech','CleanTech','Logistics','Real Estate','Marketing','Media','Fitness','AI / Data','Robotics / IoT','Fashion Tech','Food Tech','Pharma / Biotech','Gaming','Legal Tech','HR Tech','PropTech','CyberSecurity','Retail','Manufacturing','Agriculture Tech'];
const SOURCES     = ['upwork','linkedin','freelancer','crunchbase','clutch','manual','scraped'];
const STATUSES    = ['new','contacted','proposal_sent','follow_up','converted','lost'];
const STATUS_WEIGHTS = [25, 20, 20, 15, 12, 8]; // roughly realistic distribution
const BUDGETS     = ['$500–$1,500','$1,000–$3,000','$2,000–$5,000','$3,000–$8,000','$5,000–$10,000','$8,000–$15,000','$10,000–$25,000','$15,000–$30,000','$20,000+','$50,000+'];
const TAGS_POOL   = ['saas','enterprise','b2b','b2c','mobile','web','api','design','ai','cloud','startup','scaleup','agency','e-commerce','automation','crm','analytics','fintech','healthtech','edtech'];
const COUNTRIES   = ['US','UK','CA','AU','DE','FR','AE','SG','IN','JP','ZA','BR','NL','SE','PK'];
const DOMAINS     = ['io','com','co','ai','tech','dev','app','net','org','digital'];
const AI_SERVICES = ['Full-Stack Web App','Mobile App (iOS + Android)','Custom SaaS Platform','E-commerce Store','API Integration','Data Dashboard','CRM System','Portfolio Website','Booking System','Marketplace','Admin Panel','AI Chatbot','Analytics Tool','Payment Gateway Integration','Cloud Migration','DevOps Setup','Headless CMS','ERP System','IoT Dashboard','Progressive Web App'];
const PAIN_POINTS = ['Manual reporting','No real-time data','Slow page load','Poor mobile UX','No API access','Excel-based tracking','No automation','Legacy backend','Paper-based records','No customer portal','High cart abandonment','No scalability','Manual billing','Duplicate data entry','No analytics','Poor SEO','No CRM integration','Slow onboarding','No notifications','Security vulnerabilities'];
const EMAIL_SUBJECTS = [
  'Quick question about your current tech stack',
  'Helping {{company}} scale its digital infrastructure',
  'Partnership opportunity — Abyte Sol × {{company}}',
  'How we helped similar companies 3× their efficiency',
  'Following up on our previous conversation',
  'Proposal ready — let\'s discuss next steps',
  'Case study: 40% cost reduction for a SaaS company',
  'Your custom proposal is ready',
  'Re: Our conversation about {{company}}',
  'One last follow-up from my end',
  'Checking in — are you ready to move forward?',
  'Quick win we spotted for {{company}}',
  '15-minute call this week?',
  'Introducing Abyte Sol to {{company}}',
  'We built something similar for a company in your space',
];
const TEMPLATE_NAMES = ['Cold Intro — SaaS','Cold Intro — Agency','Cold Intro — E-commerce','Follow-Up #1','Follow-Up #2 — Value','Follow-Up #3 — Final','Proposal Delivery','Re-Engagement','WhatsApp Intro','Partnership Pitch','Post-Demo Follow-Up','Referral Request','Win-Back Campaign','Seasonal Outreach','Event Follow-Up','LinkedIn Connection','Trial Offer','Case Study Share','ROI Calculator Offer','Executive Intro'];
const CATEGORIES  = ['cold-outreach','follow-up','proposal','general'];
const SEQ_NAMES   = ['5-Step SaaS Cold Outreach','Agency Follow-Up Drip','Post-Proposal Nurture','E-commerce Warm-Up','Enterprise Decision-Maker Sequence','Re-engagement Campaign','LinkedIn + Email Combo','Short 3-Touch Sequence','High-Value Account Sequence','Product Launch Outreach','Referral Request Sequence','Seasonal Push','Event-Based Follow-Up','Trial Conversion Sequence','Demo No-Show Follow-Up'];

/* weighted random status */
function pickStatus() {
  const total = STATUS_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < STATUSES.length; i++) {
    r -= STATUS_WEIGHTS[i];
    if (r <= 0) return STATUSES[i];
  }
  return STATUSES[0];
}

function companyName() {
  return `${rand(COMPANIES)} ${rand(SUFFIXES)}`;
}

function contactName() {
  return `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)}`;
}

function emailAddr(company, contact) {
  const local = contact.split(' ')[0].toLowerCase();
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
  return `${local}@${domain}.${rand(DOMAINS)}`;
}

function website(company) {
  return `${company.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}.${rand(DOMAINS)}`;
}

function aiScore(qual) {
  if (qual === 'hot')  return +(7 + Math.random() * 3).toFixed(1);
  if (qual === 'warm') return +(4 + Math.random() * 3).toFixed(1);
  return +(1 + Math.random() * 3).toFixed(1);
}

function pickQual(status) {
  if (status === 'converted') return rand(['hot','hot','warm']);
  if (status === 'lost')      return rand(['cold','cold','warm']);
  if (status === 'proposal_sent' || status === 'follow_up') return rand(['hot','warm','warm']);
  return rand(['hot','warm','cold']);
}

/* ─────────────── MAIN ─────────────── */
async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  /* ── USER ── */
  let user = await User.findOne({ email: 'demo@abyte.io' });
  if (!user) {
    const hash = await bcrypt.hash('Demo@1234', 10);
    user = await User.create({ name: 'Muhammad Arhum', email: 'demo@abyte.io', password: hash, role: 'admin' });
    console.log('✅ User created: demo@abyte.io / Demo@1234');
  } else {
    console.log('ℹ️  Using existing user: demo@abyte.io');
  }

  /* ── CLEAR ── */
  console.log('\n🗑️  Clearing old data...');
  await Promise.all([
    Lead.deleteMany({}),
    Proposal.deleteMany({}),
    OutreachLog.deleteMany({}),
    EmailTemplate.deleteMany({ user: user._id }),
    Sequence.deleteMany({ user: user._id }),
    SequenceEnrollment.deleteMany({}),
  ]);
  console.log('   Done.\n');

  /* ══════════════════════════════════
     1. LEADS — 10,000
  ══════════════════════════════════ */
  console.log('📋 Seeding 10,000 leads...');
  const leadDocs = Array.from({ length: 10_000 }, (_, i) => {
    const company  = companyName();
    const contact  = contactName();
    const status   = pickStatus();
    const qual     = pickQual(status);
    const score    = aiScore(qual);
    const industry = rand(INDUSTRIES);
    const painCount = randInt(1, 3);
    const tagCount  = randInt(1, 4);
    const createdDaysAgo = randInt(0, 180);

    return {
      companyName:          company,
      contactName:          contact,
      email:                emailAddr(company, contact),
      phone:                `+${randInt(1,99)}-${randInt(100,999)}-${randInt(100,999)}-${randInt(1000,9999)}`,
      website:              website(company),
      source:               rand(SOURCES),
      status,
      industry,
      budget:               rand(BUDGETS),
      tags:                 pick(TAGS_POOL, tagCount),
      aiScore:              score,
      aiQualification:      qual,
      aiRecommendedService: rand(AI_SERVICES),
      aiPainPoints:         pick(PAIN_POINTS, painCount),
      aiSummary:            `${company} is a ${industry} company looking for ${rand(AI_SERVICES)}. AI score: ${score}/10.`,
      notes:                i % 10 === 0 ? `Spoke with ${contact.split(' ')[0]} on ${new Date(daysAgo(randInt(1, 30))).toDateString()}. Interested but needs approval from board.` : '',
      followUpScheduled:    ['follow_up','contacted'].includes(status) ? daysFromNow(randInt(1, 7)) : null,
      followUpSent:         status === 'follow_up' && Math.random() > 0.5,
      createdAt:            daysAgo(createdDaysAgo),
      updatedAt:            daysAgo(randInt(0, createdDaysAgo)),
    };
  });

  await insertBatches(Lead, leadDocs);
  const leads = await Lead.find({}, '_id status aiQualification').lean();
  console.log(`✅ ${leads.length} leads inserted\n`);

  /* ══════════════════════════════════
     2. PROPOSALS — 10,000
  ══════════════════════════════════ */
  console.log('📄 Seeding 10,000 proposals...');
  const propStatuses = ['draft','sent','accepted','rejected'];
  const proposalDocs = Array.from({ length: 10_000 }, (_, i) => {
    const lead     = rand(leads);
    const service  = rand(AI_SERVICES);
    const pStatus  = rand(propStatuses);
    const createdDaysAgo = randInt(0, 120);

    return {
      lead:           lead._id,
      title:          `${service} Proposal — ${rand(COMPANIES)} ${rand(SUFFIXES)}`,
      content:        `# Proposal\n\n## Executive Summary\nWe propose to build a **${service}** solution.\n\n## Scope\n- Phase 1: Discovery & Design (1 week)\n- Phase 2: Development (4–6 weeks)\n- Phase 3: QA & Launch (1 week)\n\n## Investment\n${rand(BUDGETS)}\n\n## Why Abyte Sol?\n- 50+ successful projects\n- Dedicated PM\n- 6-month support\n\n*Generated by AI — ${new Date().toISOString()}*`,
      status:         pStatus,
      generatedBy:    rand(['groq','manual','openai']),
      publicToken:    `tok_${i}_${Math.random().toString(36).slice(2, 10)}`,
      isPublic:       i % 5 === 0,
      clientDecision: pStatus === 'accepted' ? 'accepted' : pStatus === 'rejected' ? 'rejected' : 'pending',
      clientMessage:  pStatus === 'accepted' ? 'Looks great, let\'s proceed!' : pStatus === 'rejected' ? 'Budget doesn\'t fit right now.' : '',
      createdAt:      daysAgo(createdDaysAgo),
      updatedAt:      daysAgo(randInt(0, createdDaysAgo)),
    };
  });

  await insertBatches(Proposal, proposalDocs);
  console.log(`✅ 10,000 proposals inserted\n`);

  /* ══════════════════════════════════
     3. OUTREACH LOGS — 10,000
  ══════════════════════════════════ */
  console.log('📧 Seeding 10,000 outreach logs...');
  const outreachTypes   = ['email','whatsapp','manual'];
  const outreachStatuses = ['sent','failed','pending'];

  const outreachDocs = Array.from({ length: 10_000 }, (_, i) => {
    const lead       = rand(leads);
    const type       = rand(outreachTypes);
    const oStatus    = Math.random() > 0.15 ? 'sent' : rand(['failed','pending']);
    const subject    = rand(EMAIL_SUBJECTS).replace('{{company}}', rand(COMPANIES));
    const createdDaysAgo = randInt(0, 150);
    const sentDate   = daysAgo(createdDaysAgo);
    const wasOpened  = oStatus === 'sent' && Math.random() > 0.45;
    const wasClicked = wasOpened && Math.random() > 0.55;

    return {
      lead:       lead._id,
      type,
      subject:    type === 'email' ? subject : '',
      message:    `Hi there,\n\nI wanted to reach out regarding ${rand(AI_SERVICES)}. We've helped companies in your space achieve significant results.\n\nWould you be open to a 15-minute call?\n\nBest,\nMuhammad Arhum\nAbyte Sol`,
      status:     oStatus,
      sentAt:     oStatus === 'sent' ? sentDate : null,
      openedAt:   wasOpened  ? new Date(sentDate.getTime() + randInt(1, 48) * 3_600_000) : null,
      clickedAt:  wasClicked ? new Date(sentDate.getTime() + randInt(2, 72) * 3_600_000) : null,
      trackingId: oStatus === 'sent' ? `trk_${i}_${Math.random().toString(36).slice(2, 10)}` : null,
      createdAt:  sentDate,
      updatedAt:  sentDate,
    };
  });

  await insertBatches(OutreachLog, outreachDocs);
  console.log(`✅ 10,000 outreach logs inserted\n`);

  /* ══════════════════════════════════
     4. EMAIL TEMPLATES — 10,000
  ══════════════════════════════════ */
  console.log('📝 Seeding 10,000 email templates...');
  const templateDocs = Array.from({ length: 10_000 }, (_, i) => {
    const name     = `${rand(TEMPLATE_NAMES)} — v${randInt(1, 50)}`;
    const category = rand(CATEGORIES);
    const industry = rand(INDUSTRIES);

    return {
      user:       user._id,
      name,
      subject:    rand(EMAIL_SUBJECTS).replace('{{company}}', rand(COMPANIES)),
      body:       `Hi {{contactName}},\n\nI came across {{companyName}} and noticed you're working in the ${industry} space.\n\nAt Abyte Sol, we specialize in building ${rand(AI_SERVICES)} for companies like yours.\n\nWould a quick 15-minute call make sense this week?\n\nBest,\n{{senderName}}\nAbyte Sol`,
      category,
      usageCount: randInt(0, 120),
      createdAt:  daysAgo(randInt(0, 180)),
    };
  });

  await insertBatches(EmailTemplate, templateDocs);
  console.log(`✅ 10,000 email templates inserted\n`);

  /* ══════════════════════════════════
     5. SEQUENCES — 10,000
  ══════════════════════════════════ */
  console.log('🔗 Seeding 10,000 sequences...');
  const sequenceDocs = Array.from({ length: 10_000 }, (_, i) => {
    const name   = `${rand(SEQ_NAMES)} — ${rand(INDUSTRIES)} #${i + 1}`;
    const steps  = randInt(2, 6);

    return {
      user:        user._id,
      name,
      description: `Automated ${steps}-step outreach sequence targeting ${rand(INDUSTRIES)} companies. Optimized for ${rand(['reply rate','open rate','click rate','conversion rate'])}.`,
      isActive:    Math.random() > 0.3,
      steps:       Array.from({ length: steps }, (__, s) => ({
        stepNumber: s + 1,
        delayDays:  s === 0 ? 0 : randInt(2, 10),
        subject:    rand(EMAIL_SUBJECTS).replace('{{company}}', '{{companyName}}'),
        body:       `Hi {{contactName}},\n\n${s === 0 ? 'I wanted to reach out' : s === steps - 1 ? 'This is my final follow-up' : 'Following up on my previous email'}.\n\nWe help ${rand(INDUSTRIES)} companies with ${rand(AI_SERVICES)}.\n\n${s === steps - 1 ? 'No worries if the timing isn\'t right — I\'ll leave the door open!' : 'Would you be open to a quick call?'}\n\nBest,\n{{senderName}}`,
      })),
      createdAt: daysAgo(randInt(0, 180)),
    };
  });

  await insertBatches(Sequence, sequenceDocs);
  const seqs = await Sequence.find({}, '_id').lean();
  console.log(`✅ 10,000 sequences inserted\n`);

  /* ══════════════════════════════════
     6. SEQUENCE ENROLLMENTS — 10,000
  ══════════════════════════════════ */
  console.log('📌 Seeding 10,000 sequence enrollments...');
  const enrollStatuses = ['active','completed','paused','cancelled'];
  const enrollDocs = Array.from({ length: 10_000 }, (_, i) => {
    const lead     = rand(leads);
    const seq      = rand(seqs);
    const eStatus  = rand(enrollStatuses);
    const step     = randInt(1, 5);
    const createdDaysAgo = randInt(0, 120);

    return {
      sequence:    seq._id,
      lead:        lead._id,
      user:        user._id,
      currentStep: step,
      status:      eStatus,
      nextSendAt:  eStatus === 'active' ? daysFromNow(randInt(1, 10)) : null,
      createdAt:   daysAgo(createdDaysAgo),
      updatedAt:   daysAgo(randInt(0, createdDaysAgo)),
    };
  });

  await insertBatches(SequenceEnrollment, enrollDocs);
  console.log(`✅ 10,000 sequence enrollments inserted\n`);

  /* ── FINAL COUNTS ── */
  const [lCount, pCount, oCount, tCount, sCount, eCount] = await Promise.all([
    Lead.countDocuments(),
    Proposal.countDocuments(),
    OutreachLog.countDocuments(),
    EmailTemplate.countDocuments(),
    Sequence.countDocuments(),
    SequenceEnrollment.countDocuments(),
  ]);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Bulk seed complete!');
  console.log(`   Leads               : ${lCount.toLocaleString()}`);
  console.log(`   Proposals           : ${pCount.toLocaleString()}`);
  console.log(`   Outreach Logs       : ${oCount.toLocaleString()}`);
  console.log(`   Email Templates     : ${tCount.toLocaleString()}`);
  console.log(`   Sequences           : ${sCount.toLocaleString()}`);
  console.log(`   Sequence Enrollments: ${eCount.toLocaleString()}`);
  console.log('');
  console.log('   Login → demo@abyte.io / Demo@1234');
  console.log('   URL   → http://localhost:5174/login');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
}

function pick(arr, n) {
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
