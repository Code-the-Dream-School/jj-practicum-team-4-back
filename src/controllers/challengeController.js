const mongoose = require("mongoose");
const Artwork = require("../../models/Artwork");
const Challenge = require("../../models/Challenge");

// GET /api/challenge/winners
async function listWinners(req, res) {
  try {
    const raw = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(raw) ? Math.max(1, Math.min(raw, 100)) : 5;

    const now = new Date();

    const prevChallenge = await Challenge.findOne({
      end_date: { $lte: now },
    })
      .sort({ end_date: -1, _id: -1 })
      .lean();

    if (!prevChallenge) {
      return res.status(200).json([]); // Nothing finished yet
    }

    let filter = {
      createdAt: {
        $gte: new Date(prevChallenge.start_date),
        $lt: new Date(prevChallenge.end_date),
      },
    };
    if (prevChallenge.prompt_id) {
      filter.prompt_id = new mongoose.Types.ObjectId(prevChallenge.prompt_id);
    }

    const docs = await Artwork.find(filter)
      .sort({ like_counter: -1, createdAt: -1, _id: -1 }) // tie-breakers
      .limit(limit)
      .select("title image_url like_counter user_id media_tag prompt_id")
      .populate([
        { path: "user_id", select: "first_name" },
        { path: "prompt_id", select: "title description" },
      ]);

    const result = docs.map((a) => ({
      id: String(a._id),
      title: a.title,
      image_url: a.image_url ?? null,
      like_counter: a.like_counter ?? 0,
      media_tag: a.media_tag ?? null,
      prompt_id: a.prompt_id
        ? {
            id: String(a.prompt_id._id),
            title: a.prompt_id.title ?? null,
            description: a.prompt_id.description ?? null,
          }
        : { id: null, title: null, description: null },
      user: a.user_id
        ? {
            id: String(a.user_id._id),
            first_name: a.user_id.first_name ?? null,
          }
        : { id: null, first_name: null },
    }));

    return res.status(200).json(result);
  } catch (err) {
    console.error("listWinners error:", err);
    return res
      .status(500)
      .json({ error: "Internal Server Error", code: "INTERNAL_SERVER_ERROR" });
  }
}

module.exports = { listWinners };
