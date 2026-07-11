require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedUser = {
  name: 'Abyte Admin',
  email: 'admin@abytehunter.com',
  password: 'abyte12345',
  role: 'admin',
};

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB Connected');

  const existing = await User.findOne({ email: seedUser.email });
  if (existing) {
    console.log('User already exists:', seedUser.email);
    process.exit(0);
  }

  await User.create(seedUser);
  console.log('Seed user created!');
  console.log('Email   :', seedUser.email);
  console.log('Password:', seedUser.password);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
