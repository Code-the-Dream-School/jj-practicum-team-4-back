// Handlers for auth endpoints (Google OAuth + email/password + refresh + me + logout)

const googleAuth = (req, res, next) => {
  // TODO: In router: passport.authenticate('google', { scope: ['profile', 'email'] })
  // This controller is a passthrough placeholder.
  next();
};

const googleCallback = async (req, res) => {
  // TODO: On success, issue JWT and return user payload
  // 200 { token, user } | 400/401/500
  return res.status(501).json({ message: 'Not implemented: /auth/google/callback' });
};

const register = async (req, res) => {
  // Body: { email, password }
  // TODO: validate, hash (bcrypt), create user, issue JWT
  // 201 { token, user } | 400 | 409 | 500
  return res.status(501).json({ message: 'Not implemented: /auth/register' });
};

const login = async (req, res) => {
  // Body: { email, password }
  // TODO: validate, verify password, throttle, issue JWT
  // 200 { token, user } | 400 | 401 | 500
  return res.status(501).json({ message: 'Not implemented: /auth/login' });
};

const refresh = async (req, res) => {
  // Body: { refreshToken }
  // TODO: validate and issue a new access token
  // 200 { token } | 400 | 401 | 500
  return res.status(501).json({ message: 'Not implemented: /auth/refresh' });
};

const me = async (req, res) => {
  // Auth required (JWT)
  // TODO: return current user profile
  // 200 { id, username, email, first_name, last_name, social_handle, is_admin, createdAt } | 401 | 500
  return res.status(501).json({ message: 'Not implemented: /auth/user' });
};

const logout = async (req, res) => {
  // Auth required
  // TODO: invalidate refresh token / client should discard access token
  // 200 { ok: true } | 401 | 500
  return res.status(501).json({ message: 'Not implemented: /auth/logout' });
};

module.exports = {
  googleAuth,
  googleCallback,
  register,
  login,
  refresh,
  me,
  logout,
};
