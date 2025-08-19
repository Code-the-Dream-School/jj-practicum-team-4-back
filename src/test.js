const mongoose = require("mongoose");
const User = require("./models/User");
const Artwork = require("./models/Artwork");
const Prompt = require("./models/Prompt");
const Challenge = require("./models/Challenge");

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/mongoTest");
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Connection error:", err);
  }
}

async function runDemo() {
  await connectDB();

  // Clear collections for clean testing
  await User.deleteMany({});
  await Artwork.deleteMany({});
  await Prompt.deleteMany({});
  await Challenge.deleteMany({});

  // Create a prompt
  const prompt = await Prompt.create({
    title: "Sample Prompt",
    description: "This is a test prompt",
    rule: "Create something amazing!",
    is_active: true
  });

  // Create a user
  const user = await User.create({
    username: "John",
    first_name: "John",
    last_name: "Doe",
    email: "John@example.com",
    password: "secret123"
  });

  // Create an artwork linked to the user and prompt
  const artwork = await Artwork.create({
    title: "My First Artwork",
    description: "Generated from prompt",
    image_url: "https://example.com/artwork1.jpg",
    media_tag: "digital",
    createdBy: user._id,
    prompt_id: prompt._id
  });

  // Add artwork to user's list
  user.userArtworks.push(artwork._id);
  await user.save();

  // Create a challenge that includes the artwork and the user
  const challenge = await Challenge.create({
    prompt_id: prompt._id,
    start_date: new Date(),
    end_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day later
    artworks: [artwork._id],
    participants: [user._id]
  });

  // Populate references to check
  const populatedChallenge = await Challenge.findById(challenge._id)
    .populate("artworks")
    .populate("participants")
    .populate("prompt_id");

  console.log("Challenge with artworks and participants:\n", JSON.stringify(populatedChallenge, null, 2));

  mongoose.connection.close();
}

runDemo();
