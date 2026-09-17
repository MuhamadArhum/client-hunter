/**
 * Standalone load test (not part of the Jest suite - run with `npm run test:load`).
 * Boots the real Express app against an in-memory MongoDB on a random local
 * port, then fires concurrent HTTP traffic at it with autocannon to measure
 * throughput/latency and surface any crashes under load.
 *
 * NODE_ENV stays 'test' so this measures raw app capacity (rate limiting is
 * disabled here by design - it's covered separately in tests/rateLimiter.test.js).
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'load-test-secret';
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const autocannon = require('autocannon');
const app = require('../../src/app');

const DURATION = parseInt(process.env.LOAD_DURATION || '10', 10); // seconds per scenario
const CONNECTIONS = parseInt(process.env.LOAD_CONNECTIONS || '50', 10);

const printResult = (title, result) => {
  console.log(`\n=== ${title} ===`);
  console.log(`  requests/sec : avg ${result.requests.average}  min ${result.requests.min}  max ${result.requests.max}`);
  console.log(`  latency (ms) : avg ${result.latency.average}  p99 ${result.latency.p99}  max ${result.latency.max}`);
  console.log(`  throughput   : ${(result.throughput.average / 1024).toFixed(1)} KB/s`);
  console.log(`  total reqs   : ${result.requests.total}   errors: ${result.errors}   timeouts: ${result.timeouts}`);
  console.log(`  status codes : ${JSON.stringify(result.statusCodeStats)}`);
};

(async () => {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  console.log(`Load-test server up on ${base} (PID ${process.pid})`);

  // Seed one user + a batch of leads so read endpoints have real data to page through.
  const registerRes = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Load Test', email: 'loadtest@example.com', password: 'password123' }),
  }).then((r) => r.json());
  const token = registerRes.token;
  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  for (let i = 0; i < 30; i++) {
    await fetch(`${base}/api/leads`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ companyName: `Seed Co ${i}` }),
    });
  }

  const scenarios = [
    {
      title: 'GET /api/health (unauthenticated, no DB)',
      opts: { url: `${base}/api/health` },
    },
    {
      title: 'GET /api/leads (authenticated, DB read + pagination)',
      opts: { url: `${base}/api/leads`, headers: authHeaders },
    },
    {
      title: 'POST /api/leads (authenticated, DB write)',
      opts: {
        url: `${base}/api/leads`,
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ companyName: 'Load Test Co' }),
      },
    },
    {
      title: 'POST /api/auth/login (bcrypt hashing under load)',
      opts: {
        url: `${base}/api/auth/login`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'loadtest@example.com', password: 'password123' }),
      },
    },
    {
      title: 'Mixed traffic (health + reads + writes interleaved)',
      opts: {
        requests: [
          { method: 'GET', path: '/api/health' },
          { method: 'GET', path: '/api/leads', headers: authHeaders },
          {
            method: 'POST', path: '/api/leads', headers: authHeaders,
            body: JSON.stringify({ companyName: 'Mixed Load Co' }),
          },
        ],
      },
    },
  ];

  for (const { title, opts } of scenarios) {
    const result = await autocannon({
      url: base,
      connections: CONNECTIONS,
      duration: DURATION,
      pipelining: 1,
      ...opts,
    });
    printResult(title, result);
  }

  await new Promise((resolve) => setTimeout(resolve, 500)); // let in-flight requests drain
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
  console.log('\nLoad test complete.');
  process.exit(0);
})().catch((err) => {
  console.error('Load test failed:', err);
  process.exit(1);
});
