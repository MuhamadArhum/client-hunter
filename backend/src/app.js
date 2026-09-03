require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const leadsRoutes = require('./routes/leads');
const proposalsRoutes = require('./routes/proposals');
const outreachRoutes = require('./routes/outreach');
const analyticsRoutes = require('./routes/analytics');
const templatesRoutes = require('./routes/templates');
const sequencesRoutes = require('./routes/sequences');
const chatRoutes = require('./routes/chat');
const activityRoutes  = require('./routes/activity');
const settingsRoutes  = require('./routes/settings');
const apolloRoutes    = require('./routes/apollo');

const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { startFollowUpCron, startProposalFollowUpCron } = require('./services/followUpService');
const { startDigestCron } = require('./services/digestService');
const { startSequenceCron } = require('./services/sequenceService');

connectDB();

const isProd = process.env.NODE_ENV === 'production';

const app = express();
const httpServer = http.createServer(app);

// ── Security headers (helmet) ──
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProd ? undefined : false, // only enforce CSP in prod
}));

const devOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
];
const allowedOrigins = [
  ...(isProd ? [] : devOrigins),
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));   // reduced from 10mb
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(mongoSanitize());
if (!isProd) app.use(morgan('dev'));

// ── Socket.io (production uses only FRONTEND_URL) ──
const ioOrigins = isProd
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : allowedOrigins;
const io = new Server(httpServer, { cors: { origin: ioOrigins, credentials: true } });
io.on('connection', (socket) => {
  console.log('[WS] Client connected:', socket.id);
  socket.on('disconnect', () => console.log('[WS] Client disconnected:', socket.id));
});
app.set('io', io);

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/proposals', proposalsRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/sequences', sequencesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/activity',  activityRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/apollo',   apolloRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Abyte Hunt API is running', timestamp: new Date().toISOString() });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    // never expose internal error messages in production
    message: isProd ? 'An unexpected error occurred.' : (err.message || 'Internal Server Error'),
    ...(!isProd && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  startFollowUpCron();
  startProposalFollowUpCron();
  startDigestCron();
  startSequenceCron();
});

module.exports = app;
