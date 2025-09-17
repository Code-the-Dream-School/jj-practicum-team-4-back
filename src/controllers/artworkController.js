const mongoose = require("mongoose");
const Artwork = require("../../models/Artwork");
const Prompt = require("../../models/Prompt");

// GET /api/artwork
// Query: q?, media_tag?, prompt_id?, page?, limit?, sort? (recent|likes)
// Defaults: page=1, limit=20 (max 100), sort=recent
const searchArtworks = async (req, res) => {
  try {
    const { q, media_tag, prompt_id, sort: rawSort } = req.query;

    // pagination
    const rawPage = parseInt(req.query.page, 10);
    const rawLimit = parseInt(req.query.limit, 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limitBase = Number.isFinite(rawLimit) ? rawLimit : 20; // default 20
    const limit = Math.max(1, Math.min(limitBase, 100));        // cap 100
    const skip = (page - 1) * limit;

    // validate sort
    const allowedSorts = ['recent', 'likes'];
    const sortField = rawSort && allowedSorts.includes(rawSort) ? rawSort : 'recent';
    if (rawSort && !allowedSorts.includes(rawSort)) {
      return res.status(400).json({
        error: 'Bad Request',
        code: 'BAD_REQUEST',
        details: { field: 'sort', reason: 'Supported values: recent | likes' },
      });
    }

    // validate prompt_id
    if (prompt_id && !mongoose.isValidObjectId(prompt_id)) {
      return res.status(400).json({
        error: 'Bad Request',
        code: 'BAD_REQUEST',
        details: { field: 'prompt_id', reason: 'Invalid ObjectId' },
      });
    }

    // build filter
    const filter = {};
    if (q) filter.title = { $regex: q, $options: 'i' };
    if (media_tag) filter.media_tag = media_tag;
    if (prompt_id) filter.prompt_id = prompt_id;

    // sort spec per spec
    const sortSpec =
      sortField === 'recent'
        ? { createdAt: -1, _id: -1 }
        : { like_counter: -1, createdAt: -1, _id: -1 };

    const [total, docs] = await Promise.all([
      Artwork.countDocuments(filter),
      Artwork.find(filter)
        .sort(sortSpec)
        .skip(skip)
        .limit(limit)
        .select('title image_url media_tag like_counter user_id prompt_id createdAt')
        .populate({ path: 'user_id', select: 'first_name' }),
    ]);

    const items = docs.map((a) => ({
      id: String(a._id),
      title: a.title,
      image_url: a.image_url ?? null,
      media_tag: a.media_tag ?? null,
      like_counter: a.like_counter ?? 0,
      user: a.user_id
        ? { id: String(a.user_id._id), first_name: a.user_id.first_name ?? null }
        : { id: null, first_name: null },
      prompt_id: a.prompt_id ? String(a.prompt_id) : null,
      createdAt: a.createdAt,
    }));

    return res.status(200).json({ items, page, limit, total });
  } catch (err) {
    console.error('searchArtworks error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
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

    // Delete artwork
    await doc.deleteOne();

    return res.status(200).json({ deleted: true, id: String(id) });
  } catch (err) {
    console.error("deleteArtwork error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


module.exports = {
  searchArtworks,
  createArtwork,
  getArtworkById,
  deleteArtwork,
};
