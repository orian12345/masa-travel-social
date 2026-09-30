// Demo-only entry point: starts an in-memory MongoDB, seeds it, and boots
// the real app against it — so the site can be previewed without waiting on
// MongoDB Atlas. Not part of the course submission; see README for the real
// startup path (npm start, with a real MONGO_URI in .env).
require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const connectDB = require('../config/db');
const seed = require('../config/seed');

process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'demo-only-secret';

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri('masa');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Demo database up, seeding...');
  await seed();
  console.log('Seed complete — starting server...');

  require('../app.js');
})().catch((err) => {
  console.error('Demo failed to start:', err);
  process.exit(1);
});
