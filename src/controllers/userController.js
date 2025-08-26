const getPublicProfile = (req, res) => {
  // Public; Path: :id
  // 200 { id, username, first_name, last_name, social_handle, createdAt } | 404 | 500
  return res.status(501).json({ message: 'Not implemented: GET /api/user/:id' });
};

const updateMe = (req, res) => {
  // Auth required
  // Body: { username?, first_name?, last_name?, social_handle? }
  // 200 updated profile | 400 | 401 | 409 | 500
  return res.status(501).json({ message: 'Not implemented: PATCH /api/user/me' });
};

module.exports = { getPublicProfile, updateMe };
