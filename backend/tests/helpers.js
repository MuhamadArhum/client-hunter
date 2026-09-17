const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

const registerAndLogin = async (overrides = {}) => {
  const user = {
    name: 'Test Agent',
    email: 'agent@test.com',
    password: 'password123',
    ...overrides,
  };

  const res = await request(app).post('/api/auth/register').send(user);
  return { token: res.body.token, user: res.body.user, raw: res };
};

const makeAdmin = async (email) => {
  await User.findOneAndUpdate({ email }, { role: 'admin' });
};

module.exports = { app, request, registerAndLogin, makeAdmin };
