// Handlers for prompt + challenge pairing

const getActivePrompt = (req, res) => {
  // Public
  // TODO: find active prompt and its challenge window
  // 200 { prompt, challenge } OR 200 { message: 'No active challenge' } | 500
  return res.status(501).json({ message: 'Not implemented: GET /api/prompt/active' });
};

const listAllPrompts = (req, res) => {
  // Admin only; supports pagination (page, limit)
  // TODO: return paginated list of prompts
  return res.status(501).json({ message: 'Not implemented: GET /api/prompt/all' });
};

const createPrompt = (req, res) => {
  // Admin only
  // Body: { title, description, rules, challenge: { start_date, end_date } }
  // TODO: validate, create prompt + challenge, default is_active=false
  return res.status(501).json({ message: 'Not implemented: POST /api/prompt' });
};

const updatePrompt = (req, res) => {
  // Admin only; Path: :id
  // Body: partial update of fields, incl. toggling is_active and adjusting challenge window
  return res.status(501).json({ message: 'Not implemented: PATCH /api/prompt/:id' });
};

const deletePrompt = (req, res) => {
  // Admin only; Path: :id
  // TODO: delete prompt (and associated challenge)
  // 204 No Content
  return res.status(501).json({ message: 'Not implemented: DELETE /api/prompt/:id' });
};

const listPromptArtworks = (req, res) => {
  // Public; Path: :id; Query: q?, media_tag?, page?, limit?, sort?(recent|likes)
  // TODO: return paginated artworks for a prompt
  return res.status(501).json({ message: 'Not implemented: GET /api/prompt/:id/artworks' });
};

module.exports = {
  getActivePrompt,
  listAllPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
  listPromptArtworks,
};
