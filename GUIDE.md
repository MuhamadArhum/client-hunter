# Client Hunter — System Guide

## Overview

Client Hunter (internally also referred to as "Abyte Hunter" / "Abyte Hunt") is an AI-assisted lead-generation and outreach-automation tool. It scrapes/imports leads (Apollo.io, Apify, manual entry), enriches contact data (Hunter.io), scores/analyzes leads and their websites with AI (Groq / OpenAI / local Ollama), generates outreach content and proposals, and automates multi-step outreach sequences over email (Resend), WhatsApp (Meta Cloud API) and Slack notifications. It has a dashboard-style React frontend (Kanban board, analytics, chat, proposals, templates, sequences) backed by a Node/Express REST + WebSocket API and a MongoDB database.

## Tech Stack

**Backend** (`D:\client-hunter\backend`)
- Node.js, Express 4.18
- MongoDB via Mongoose 7.5
- Auth: JWT (`jsonwebtoken`), password hashing with `bcryptjs`
- Real-time: `socket.io` 4.8
- AI: `groq-sdk`, `openai` SDK (also a local Ollama integration via plain HTTP)
- Scraping/enrichment: `cheerio`, `puppeteer-core`, Apify (via HTTP), Hunter.io (via HTTP)
- Email: `resend`, `nodemailer`
- Security/middleware: `helmet`, `cors`, `express-mongo-sanitize`, `express-rate-limit`, `express-validator`, `morgan`
- Scheduling: `node-cron`
- Testing: `jest`, `supertest`, `mongodb-memory-server`, `autocannon` (load test)

**Frontend** (`D:\client-hunter\frontend`)
- React 18 + TypeScript, built with Vite 5
- Routing: `react-router-dom` v6
- Data/state: `@tanstack/react-query` 5, `react-hook-form` + `zod`
- UI: Radix UI primitives + Tailwind CSS 3 (shadcn/ui-style components), `lucide-react` icons, `framer-motion`, `recharts` for charts, `sonner` for toasts
- Realtime client: `socket.io-client`
- PWA: `vite-plugin-pwa`

**Unrelated bundled project** — `D:\client-hunter\material-shadcn-1.0.0` is a separate, third-party Replit/ThemeWagon "material-shadcn" admin template (its own Express + Vite + Drizzle ORM + PostgreSQL/Neon stack, own `package.json`, `.replit`, `replit.md`). It is not wired into the root `package.json` scripts and is not part of the Client Hunter application; it was left untouched by this task.

## Architecture & Modules

Two independently run Node/npm projects orchestrated from the repo root:

- `backend/` — REST API + WebSocket server
- `frontend/` — Single-page React app, talks to the backend over HTTP (`/api/*`) and Socket.IO

Root `package.json` only wires up convenience scripts (`concurrently` to run both dev servers, and an `install:all` helper). There is no shared code between backend and frontend.

**Backend folder breakdown** (`backend/src`):
- `app.js` — Express app bootstrap: security middleware (helmet, CORS, mongo-sanitize, rate limiting), mounts all routers under `/api/*`, sets up Socket.IO, health check (`/api/health`), starts cron jobs, and starts the HTTP server.
- `config/db.js` — Mongoose connection to MongoDB (`MONGODB_URI`).
- `routes/` + `controllers/` — one pair per feature:
  - `auth` — register/login/password reset, JWT issuance.
  - `leads` — CRUD, scraping/import, lead status/pipeline (Kanban) updates.
  - `proposals` — AI-generated proposals, public proposal view/acceptance links.
  - `outreach` — sending emails/WhatsApp messages, open/click tracking pixel, outreach logs.
  - `analytics` — dashboard stats/metrics.
  - `templates` — reusable email templates.
  - `sequences` — multi-step automated outreach sequences and enrollments.
  - `chat` — AI chat/assistant endpoint.
  - `activity` — activity feed/audit log.
  - `settings` — system/user configuration (`SystemConfig`), API keys for third-party services.
  - `apollo` — Apollo.io lead search/import integration.
- `models/` — Mongoose schemas: `User`, `Lead`, `Proposal`, `OutreachLog`, `EmailTemplate`, `Sequence`, `SequenceEnrollment`, `SystemConfig`.
- `services/` — business logic: `aiService`/`aiAnalysisService`/`groqService`/`ollamaService` (AI provider abstraction with Groq/OpenAI/Ollama fallback), `scraperService` (lead scraping), `websiteAnalyzerService` (site analysis for lead scoring), `emailService`/`emailEnrichmentService`, `whatsappService`, `slackService`, `followUpService`/`digestService`/`sequenceService` (cron-driven follow-ups, daily digest, sequence progression), `configService` (reads runtime settings from DB/env).
- `middleware/` — `auth` (JWT verification), `rateLimiter`, `validate` (express-validator wrapper).
- `seed.js` / `seed-bulk.js` — scripts to seed demo/bulk data plus a demo login (`demo@abyte.io` / `Demo@1234`).
- `tests/` — Jest + Supertest integration tests per feature, plus a load test (`tests/load/loadtest.js`).

**Frontend folder breakdown** (`frontend/src`):
- `main.tsx` / `App.tsx` — app entry and route table.
- `pages/` — one per screen: `Dashboard`, `Leads`, `LeadDetail`, `Kanban` (pipeline board), `Proposals` + `ProposalPublic` (public-facing shareable proposal page), `Outreach`, `Sequences`, `Templates`, `Analytics`, `ActivityFeed`, `Chat`, `ApolloSearch`, `Notifications`, `Settings`, `Profile`, `auth/*` (Login variants, SignUp, ForgotPassword, ResetPassword), `NotFound`, `DashboardPreview`.
- `components/layout` and `components/ui` — shared layout shell and shadcn/ui-style component library.
- `context/AuthContext.tsx` — auth/session state; `ThemeContext.tsx` — light/dark theme.
- `services/api.ts` — Axios instance with JWT bearer header injection and 401 redirect-to-login handling; base URL comes from `VITE_API_URL` or defaults to relative `/api` (proxied by Vite in dev).
- `hooks/useSocket.ts` — Socket.IO client hook for real-time `lead:new`, `outreach:sent`, `agent:action` events.
- `hooks/use-toast.ts`, `use-mobile.ts` — UI utility hooks.

## Database

- **Type**: MongoDB (document store)
- **Driver/ORM**: Mongoose 7.5
- **Connection config**: `backend/src/config/db.js`, using `MONGODB_URI` from `backend/.env` (local: `mongodb://localhost:27017/client-hunter`; a commented-out MongoDB Atlas cloud URI is also present as an alternative in `.env.example`/`.env`).
- **Collections (Mongoose models in `backend/src/models/`)**: `User` (auth/accounts), `Lead` (companies/contacts with `source`, `status` pipeline fields), `Proposal`, `OutreachLog` (sent messages + open/click tracking), `EmailTemplate`, `Sequence` (multi-step outreach definitions), `SequenceEnrollment` (a lead's progress through a sequence), `SystemConfig` (runtime-editable settings such as API keys, read through `services/configService.js`).
- Tests use `mongodb-memory-server` to run an in-memory Mongo instance (`backend/tests/setup.js`), so no real DB is required to run the Jest suite.

## Location

- Repo root: `D:\client-hunter`
- Backend folder: `D:\client-hunter\backend`
- Frontend folder: `D:\client-hunter\frontend`
- (Unrelated bundled template, not part of this app): `D:\client-hunter\material-shadcn-1.0.0`

## Ports

- **Backend**: `3014` (was `5000` in local dev)
- **Frontend**: `5187` (was `5173` in local dev; other stray dev-origin values `5174`/`5175`/`5176` were also cleaned up)

These are the ports this app runs on locally per this task's assignment. Production deployment on Render (`render.yaml`, `backend/.env.production`) still uses its own platform-assigned port (`10000`) — see Notes.

## Environment Variables

**Backend** — set in `backend/.env` (local dev; not committed) / `backend/.env.example` (template) / `backend/.env.production` (Render production values):
- `PORT` — HTTP port the Express server listens on (now `3014`).
- `NODE_ENV` — `development` | `production` | `test`.
- `MONGODB_URI` — MongoDB connection string.
- `JWT_SECRET`, `JWT_EXPIRE` — auth token signing secret and expiry.
- `OPENAI_API_KEY` / `GROQ_API_KEY` — AI providers for proposals/analysis/chat.
- `OLLAMA_URL`, `OLLAMA_MODEL`, `AI_PROVIDER` — optional local-AI fallback config (`auto`/`groq`/`ollama`).
- `APIFY_API_TOKEN`, `APOLLO_API_KEY` — lead scraping/import sources.
- `HUNTER_API_KEY` — email enrichment.
- `RESEND_API_KEY`, `EMAIL_FROM`, `DIGEST_EMAIL` — outbound email sending and daily digest recipient.
- `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN` — Meta WhatsApp Cloud API.
- `SLACK_WEBHOOK_URL` — Slack notifications.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` — SMS (present in `.env` but not seen wired into `app.js`'s active routes — may be unused/future).
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — payments (marked "Future SaaS" in `.env`; not currently used).
- `BACKEND_URL` — this server's own public base URL, used to build tracking-pixel links (now defaults to `http://localhost:3014` when unset).
- `FRONTEND_URL` — the frontend's origin, used for CORS allow-list and password-reset links (now defaults to `http://localhost:5187` when unset).

**Frontend** — set in `frontend/.env.example` (no `frontend/.env` currently exists in the repo):
- `VITE_API_URL` — base URL of the backend API. Left empty for local dev (Vite dev-server proxy at `/api` → backend); set to the deployed backend URL in production. The frontend's own dev/preview port is controlled by `vite.config.ts` (`server.port` / `preview.port`), not an env var.

## How to Run

1. **Install dependencies** (run once, from repo root or per-folder):
   ```
   npm run install:all
   ```
   (equivalent to `npm install --prefix backend && npm install --prefix frontend`)

2. **Run backend and frontend together in dev mode** (from repo root):
   ```
   npm run dev
   ```
   This runs `npm run dev --prefix backend` (nodemon on port 3014) and `npm run dev --prefix frontend` (Vite dev server on port 5187) concurrently.

   Or run them **separately**:
   - Backend dev: `cd backend && npm run dev` → starts on `http://localhost:3014` (nodemon, auto-restarts on file changes).
   - Frontend dev: `cd frontend && npm run dev` → starts on `http://localhost:5187` (Vite; proxies `/api` calls to `http://localhost:3014`).

3. **Build for production**:
   - Frontend: `cd frontend && npm run build` (runs `tsc && vite build`, outputs to `frontend/dist`).
   - Backend: no build step required (plain Node/CommonJS).

4. **Run in production mode**:
   - Backend: `cd backend && npm start` (runs `node src/app.js`; listens on `process.env.PORT`, defaulting to `3014` if unset).
   - Frontend: serve the built `frontend/dist` folder as static files (e.g. `npm run preview` for a local check on port `5187`, or deploy `dist` to a static host — see `render.yaml`).

5. **Run backend tests**: `cd backend && npm test` (Jest + Supertest, uses in-memory MongoDB — no real DB needed).

## Notes

- This task assigned local dev ports **3014 (backend)** and **5187 (frontend)** for this project, per instructions to avoid conflicts with other apps on the same machine. Files edited for this: `backend/.env`, `backend/.env.example`, `backend/src/app.js` (CORS `devOrigins` list and the `PORT` fallback), `backend/src/controllers/authController.js`, `backend/src/controllers/outreachController.js`, `backend/src/services/sequenceService.js`, `backend/seed.js`, `backend/seed-bulk.js`, `frontend/vite.config.ts`, and `frontend/src/hooks/useSocket.ts`, `frontend/src/pages/ProposalPublic.tsx` (hardcoded `localhost:5000`/`5173`/`5174` fallbacks and dev origins updated to `3014`/`5187`).
- **Not changed on purpose**: `backend/.env.production` and `render.yaml` still declare `PORT=10000` for the Render-hosted production deployment — that is a cloud-platform-assigned port for the live/production service, unrelated to this machine's local port assignment, so it was left as-is to avoid breaking the existing Render deploy config.
- The `OLLAMA_URL` default (`http://localhost:11434`) and the private-IP regex in `leadsController.js` (SSRF guard for scraping) both reference `localhost` but are unrelated services/checks, not this app's own HTTP server — left unchanged per instructions.
- `D:\client-hunter\material-shadcn-1.0.0` is a separate, unrelated third-party admin-template project (own Express/Vite/Drizzle/PostgreSQL stack) bundled in the repo but not referenced by the root `package.json` or by the Client Hunter backend/frontend. It was not touched and is not covered by the port reassignment.
- `TWILIO_*` and `STRIPE_*` environment variables exist in `backend/.env` but no corresponding routes/controllers were found wired into `app.js`; they appear to be placeholders for planned/future features.
- Root also contains `Test.md` (a placeholder "This is a test file." doc), an empty `updates.txt`, and `srs.docx` (an SRS document, not read as part of this task) — their purpose beyond documentation/notes is unclear and not investigated further.
- `frontend/README.md` exists (default Vite template readme) and the root `README.md` contains only the project name; neither had additional project documentation beyond what was already discovered in code.
