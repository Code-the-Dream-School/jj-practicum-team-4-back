const mongoose = require("mongoose");
const Artwork = require("../../models/Artwork");
const Prompt = require("../../models/Prompt");

const searchArtworks = (req, res) => {
  // Public; Query: q?, media_tag?, prompt_id?, page?, limit?, sort?(recent|likes) // default sort=recent
  // TODO: search & paginate
  return res.status(501).json({ message: "Not implemented: GET /api/artwork" });
};

const createArtwork = (req, res) => {
  // Auth required; multipart/form-data (file + fields)
  // Enforce challenge window, file type/size, title/description lengths
  // 201 { created artwork } | 400 | 401 | 403 | 413 | 500
  return res
    .status(501)
    .json({ message: "Not implemented: POST /api/artwork" });
};

const getArtworkById = (req, res) => {
  // Public; Path: :id
  // 200 { artwork } | 404 | 500
  return res
    .status(501)
    .json({ message: "Not implemented: GET /api/artwork/:id" });
};

  // Owner or Admin; Path: :id
  // 204 | 401 | 403 | 404 | 500
async function deleteArtwork(req, res) {
  try {
    // Ensure only admin can delete
    if (!req.user || req.user.is_admin !== true) {
      return res.status(403).json({ error: "Admin only" });
    }

    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid artwork id" });
    }

    // Find artwork by id
    const doc = await Artwork.findById(id);
    if (!doc) {
      return res.status(404).json({ error: "Artwork not found" });
    }

    // Delete artwork (optionally cascade delete likes/comments or file)
    await doc.deleteOne();

    return res.status(200).json({ deleted: true, id: String(id) });
  } catch (err) {
    console.error("deleteArtwork error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


// GET /api/prompts/:id/artworks
// Public endpoint that will return artworks for a given prompt

async function listArtworksByPrompt(req, res) {
  try {
    const { id } = req.params;

    // validate ObjectId

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "id", reason: "Invalid ObjectId" },
      });
    }

    // ensure prompt exists

    const promptExists = await Prompt.exists({ _id: id });
    if (!promptExists) {
      return res.status(404).json({
        error: "Not Found",
        code: "NOT_FOUND",
      });
    }

    // parse and validate entry

    const rawPage = req.query.page;
    const rawLimit = req.query.limit;
    const rawSort = req.query.sort; // 'recent' | 'likes'
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const media =
      typeof req.query.media_tag === "string" ? req.query.media_tag.trim() : "";

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
        details: {
          field: "limit",
          reason: "Must be integer between 1 and 100",
        },
      });
    }

    let sort = "likes";
    if (rawSort === "recent" || rawSort === "likes") {
      sort = rawSort;
    } else if (rawSort !== undefined) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "sort", reason: "Supported values: recent | likes" },
      });
    }

    // build filter

    const filter = { prompt_id: id };
    if (media) filter.media_tag = media;
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(safe, "i");
      filter.$or = [{ title: rx }, { description: rx }];
    }

    // sort spec // tie-breaker: ensure stable order when values are equal

    const sortSpec =
      sort === "recent"
        ? { createdAt: -1, _id: -1 }
        : { like_counter: -1, createdAt: -1, _id: -1 };

    // query and pagination

    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      //it's faster to use promise
      Artwork.countDocuments(filter), // need to count artworks after filter and return correct total to count pages
      Artwork.find(filter)
        .sort(sortSpec) // by rule: recent -> createdAr desc, likes -> like_counter desc
        .skip(skip) // skipping needed number of documents to be at the needed page
        .limit(limit)
        .select(
          "title image_url media_tag like_counter user_id prompt_id createdAt"
        ) // requesting from DB only needed fields
        .populate({ path: "user_id", select: "first_name" }),
    ]);
    // map to response
    const items = docs.map((a) => ({
      id: String(a._id),
      title: a.title,
      image_url: a.image_url,
      media_tag: a.media_tag ?? null,
      like_counter: a.like_counter ?? 0,
      user: a.user_id
        ? { id: String(a.user_id._id), first_name: a.user_id.first_name }
        : { id: null, first_name: null },
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

module.exports = {
  searchArtworks,
  createArtwork,
  getArtworkById,
  deleteArtwork,
  listArtworksByPrompt,
};
