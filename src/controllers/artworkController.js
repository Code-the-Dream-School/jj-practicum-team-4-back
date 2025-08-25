const searchArtworks = (req, res) => {
  // Public; Query: q?, media_tag?, prompt_id?, page?, limit?, sort?(recent|likes) // default sort=recent
  // TODO: search & paginate
  return res.status(501).json({ message: 'Not implemented: GET /api/artwork' });
};

const createArtwork = (req, res) => {
  // Auth required; multipart/form-data (file + fields)
  // Enforce challenge window, file type/size, title/description lengths
  // 201 { created artwork } | 400 | 401 | 403 | 413 | 500
  return res.status(501).json({ message: 'Not implemented: POST /api/artwork' });
};

const getArtworkById = (req, res) => {
  // Public; Path: :id
  // 200 { artwork } | 404 | 500
  return res.status(501).json({ message: 'Not implemented: GET /api/artwork/:id' });
};

const deleteArtwork = (req, res) => {
  // Owner or Admin; Path: :id
  // 204 | 401 | 403 | 404 | 500
  return res.status(501).json({ message: 'Not implemented: DELETE /api/artwork/:id' });
};

module.exports = {
  searchArtworks,
  createArtwork,
  getArtworkById,
  deleteArtwork,
};
