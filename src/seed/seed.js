// src/seed/data/likes.json and src/seed/data/artworks.json: The temporary 'key' field was introduced only for seeding purposes. It gives each seed record a unique identifier so that related JSON files (artworks, likes, etc.) can reference each other reliably without depending on non-unique fields like 'title'. In the database, the actual identifier is the MongoDB _id, and this 'key' field is not part of the production schema.

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
require("dotenv").config();

const Prompt = require("../../models/Prompt");
const User = require("../../models/User");
const Challenge = require("../../models/Challenge");
const Artwork = require("../../models/Artwork");
const Like = require("../../models/Like");

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
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is missing in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  try {
    // clear
    await Like.deleteMany({});
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
    let likesData = [];
    try {
      likesData = readJSON("likes.json");
    } catch {
      console.warn("likes.json not found — skip likes");
    }

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

    // 4) artworks (temporary like_counter from JSON; will sync later)
    const artworkIdByKey = new Map();
    for (const a of artworksData) {
      const doc = await Artwork.create({
        user_id: userIdByKey.get(a.user_key),
        prompt_id: promptIdByKey.get(a.prompt_key),
        image_url: a.image_url,
        title: a.title,
        description: a.description,
        media_tag: a.media_tag,
        like_counter: a.like_counter || 0,
      });
      artworkIdByKey.set(a.key, doc._id);
    }
    console.log(`Inserted artworks: ${artworkIdByKey.size}`);

    // 5) likes from JSON
    let createdLikes = 0,
      skipped = 0;
    for (const l of likesData) {
      const uid = userIdByKey.get(l.user_key);
      const aid = artworkIdByKey.get(l.artwork_key);
      if (!uid || !aid) {
        skipped++;
        continue;
      }
      try {
        await Like.create({ user_id: uid, artwork_id: aid });
        createdLikes++;
      } catch {
        /* ignore duplicates if unique index exists */
      }
    }
    console.log(`Inserted likes: ${createdLikes} (skipped: ${skipped})`);

    // sync like_counter to actual counts
    for (const [, aid] of artworkIdByKey) {
      const count = await Like.countDocuments({ artwork_id: aid });
      await Artwork.findByIdAndUpdate(aid, { like_counter: count });
    }
    console.log("like_counter synced to Like collection");

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
