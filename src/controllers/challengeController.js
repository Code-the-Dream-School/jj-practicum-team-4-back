
const listWinners = (req, res) => {
  // Public; always returns top 5 winners
  // TODO: fetch artworks sorted by like_counter, limit = 5
  return res.status(501).json({ message: 'Not implemented: GET /api/challenge/winners' });
};

module.exports = { listWinners };
