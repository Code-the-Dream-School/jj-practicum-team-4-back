/* eslint-disable no-console */
// src/seed/data/artworks.json: The temporary 'key' field is only for seeding.
// It lets JSON files reference each other without relying on non-unique 'title'.
// In the database the real identifier is MongoDB _id; 'key' is not part of the schema.

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
require("dotenv").config();

const Prompt = require("../../models/Prompt");
const User = require("../../models/User");
const Challenge = require("../../models/Challenge");
const Artwork = require("../../models/Artwork");

const DATA_DIR = path.join(__dirname, "data");

function readJSON(file) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
}

function dayOffset(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGODB_URI or MONGO_URI is missing in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  try {
    // clear
    await Artwork.deleteMany({});
    await Challenge.deleteMany({});
    await Prompt.deleteMany({});
    await User.deleteMany({});
    console.log("Collections cleared");

    // load fixtures
    const promptsData = readJSON("prompts.json");
    const usersData = readJSON("users.json");
    const challengesData = readJSON("challenges.json");
    const artworksData = readJSON("artworks.json");

    // 1) prompts
    const promptIdByKey = new Map();
    for (const p of promptsData) {
      const doc = await Prompt.create({
        title: p.title,
        description: p.description,
        rules: p.rules,
        is_active: !!p.is_active,
      });
      promptIdByKey.set(p.key, doc._id);
    }
    console.log(`Inserted prompts: ${promptIdByKey.size}`);

    // 2) users
    const userIdByKey = new Map();
    for (const u of usersData) {
      const doc = await User.create({
        username: u.username,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        social_handle: u.social_handle,
        is_admin: !!u.is_admin,
        googleId: u.googleId || `seed-${u.username}`,
      });
      userIdByKey.set(u.key, doc._id);
    }
    console.log(`Inserted users: ${userIdByKey.size}`);

    // 3) challenges (+ set active prompt)
    await Prompt.updateMany({}, { is_active: false });
    const now = new Date();
    let active = 0;
    for (const c of challengesData) {
      const start = dayOffset(c.start_in_days);
      const end = dayOffset(c.end_in_days);
      const pid = promptIdByKey.get(c.prompt_key);
      await Challenge.create({
        prompt_id: pid,
        start_date: start,
        end_date: end,
      });
      if (start <= now && now <= end) {
        await Prompt.findByIdAndUpdate(pid, { is_active: true });
        active += 1;
      }
    }
    console.log(
      `Inserted challenges: ${challengesData.length} (active now: ${active})`
    );

    // 4) artworks (create all, collect docs)
    const artworkDocs = [];
    for (const a of artworksData) {
      const userId = userIdByKey.get(a.user_key);
      const promptId = promptIdByKey.get(a.prompt_key);
      const doc = await Artwork.create({
        user_id: userId,
        prompt_id: promptId,
        image_url: a.image_url,
        title: a.title,
        description: a.description,
        media_tag: a.media_tag, // must be one of ['Tag1'..'Tag10']
        like_counter: a.like_counter || 0, // starting value from JSON
      });
      artworkDocs.push(doc);

      // attach to user's userArtworks
      await User.findByIdAndUpdate(userId, {
        $push: { userArtworks: doc._id },
      });
    }
    console.log(`Inserted artworks: ${artworkDocs.length}`);

    // 5) seed basic "likes" arrays on users (optional demo data)
    // For each user, like 2 random artworks and increment counters.
    // NOTE: This is only to populate User.
    const userIds = Array.from(userIdByKey.values());
    for (const uid of userIds) {
      // pick 2 random different artworks
      const shuffled = [...artworkDocs].sort(() => 0.5 - Math.random());
      const sample = shuffled.slice(0, 2);
      for (const art of sample) {
        await User.findByIdAndUpdate(uid, { $push: { likes: art._id } });
        await Artwork.findByIdAndUpdate(art._id, { $inc: { like_counter: 1 } });
      }
    }
    console.log("Filled User.likes and adjusted like_counter");

    console.log("Seeding done.");
  } catch (e) {
    console.error("Seed error:", e);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected");
  }
}

main();
