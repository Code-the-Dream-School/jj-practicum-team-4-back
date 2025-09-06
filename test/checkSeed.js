const mongoose = require('mongoose');
require('dotenv').config();

const Prompt = require('../models/Prompt');
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const Artwork = require('../models/Artwork');


async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const countPrompts = await Prompt.countDocuments();
  const countUsers = await User.countDocuments();
  const countChallenges = await Challenge.countDocuments();
  const countArtworks = await Artwork.countDocuments();


  console.log('Prompts:', countPrompts);
  console.log('Users:', countUsers);
  console.log('Challenges:', countChallenges);
  console.log('Artworks:', countArtworks);

  const sampleArtworks = await Artwork.find().limit(10).populate('user_id', 'username');
  console.log('Sample artworks:', sampleArtworks);

  await mongoose.disconnect();
}

run();
