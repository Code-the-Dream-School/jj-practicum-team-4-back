const Artwork = require('../../models/Artwork');

// GET /api/challenge/winners
async function listWinners(req, res) {
  try {
    const raw = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(raw) ? Math.max(1, Math.min(raw, 100)) : 5;

    const docs = await Artwork.find({})
      .sort({ like_counter: -1, createdAt: -1, _id: -1 }) // tie-breakers
      .limit(limit)
      .select('title image_url like_counter user_id')       
      .populate({ path: 'user_id', select: 'first_name' }); 

    const result = docs.map((a) => ({
      id: String(a._id),
      title: a.title,
      image_url: a.image_url ?? null,
      like_counter: a.like_counter ?? 0,
      user: a.user_id
        ? { id: String(a.user_id._id), first_name: a.user_id.first_name?? null }
        : { id: null, first_name: null },
    }));

    return res.status(200).json(result);
  } catch (err) {
    console.error('listWinners error:', err);
    return res
      .status(500)
      .json({ error: 'Internal Server Error', code: 'INTERNAL_SERVER_ERROR' });
  }
}

module.exports = { listWinners };