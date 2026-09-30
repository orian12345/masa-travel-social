const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri || uri.includes('REPLACE_ME')) {
    console.error(
      '\nMONGO_URI is not set. Copy .env.example to .env and fill in your MongoDB Atlas connection string.\n'
    );
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected:', mongoose.connection.name);
}

module.exports = connectDB;
