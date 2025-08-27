const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI;

async function run() {
  try {
    console.log('Connecting to', uri);
    await mongoose.connect(uri);
    console.log('Connected!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
