const mongoose = require("mongoose");
const Artwork = require("../../models/Artwork");
const Prompt = require("../../models/Prompt"); // проверь путь к модели Prompt

// GET /api/prompts/:id/artworks
// Public endpoint per docs: q?, media_tag?, page?, limit?, sort? (recent|likes, default=likes)
async function listArtworksByPrompt(req, res) {
  try {
    const { id } = req.params;

    // 1) validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "id", reason: "Invalid ObjectId" },
      });
    }

    // 2) ensure prompt exists (404, как в AC)
    const promptExists = await Prompt.exists({ _id: id });
    if (!promptExists) {
      return res.status(404).json({
        error: "Not Found",
        code: "NOT_FOUND",
      });
    }

    // 3) parse & validate query
    const rawPage = req.query.page;
    const rawLimit = req.query.limit;
    const rawSort = req.query.sort;              // 'recent' | 'likes'
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const media = typeof req.query.media_tag === "string" ? req.query.media_tag.trim() : "";

    const page = rawPage ? parseInt(rawPage, 10) : 1;
    const limit = rawLimit ? parseInt(rawLimit, 10) : 20;

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "page", reason: "Must be integer ≥ 1" },
      });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "limit", reason: "Must be integer between 1 and 100" },
      });
    }

    let sort = "likes";
    if (rawSort === "recent" || rawSort === "likes") {
      sort = rawSort;
    } else if (rawSort != null) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "sort", reason: "Supported values: recent | likes" },
      });
    }

    // 4) build filter
    const filter = { prompt_id: id };
    if (media) filter.media_tag = media;
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(safe, "i");
      filter.$or = [{ title: rx }, { description: rx }];
    }

    // 5) sort spec
    const sortSpec =
      sort === "recent"
        ? { createdAt: -1, _id: -1 }
        : { like_counter: -1, createdAt: -1, _id: -1 };

    // 6) query + pagination
    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      Artwork.countDocuments(filter),
      Artwork.find(filter)
        .sort(sortSpec)
        .skip(skip)
        .limit(limit)
        .select("title image_url media_tag like_counter user_id prompt_id createdAt")
        .populate({ path: "user_id", select: "username" }),
    ]);

    // 7) map to response contract
    const items = docs.map((a) => ({
      id: String(a._id),
      title: a.title,
      image_url: a.image_url,
      media_tag: a.media_tag ?? null,
      like_counter: a.like_counter ?? 0,
      user: a.user_id
        ? { id: String(a.user_id._id), username: a.user_id.username }
        : { id: null, username: null },
      prompt_id: String(a.prompt_id),
      createdAt: a.createdAt?.toISOString?.() ?? null,
    }));

    return res.status(200).json({ items, page, limit, total });
  } catch (err) {
    console.error("listArtworksByPrompt error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}
