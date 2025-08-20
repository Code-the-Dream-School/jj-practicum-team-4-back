// test.js — CommonJS - checking DB connection
require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'arthive_dev';

(async () => {
  try {
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`Connected to MongoDB database: ${dbName}`);

    const admin = mongoose.connection.db.admin();
    const pingResult = await admin.ping();
    console.log('Ping result:', pingResult);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
})();
