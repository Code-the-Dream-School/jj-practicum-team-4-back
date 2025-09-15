const User = require("../../models/User");

module.exports = async function requireAdmin(req, res, next) {
  try {
    if (!req.user?.id)
      return res
        .status(401)
        .json({ error: "Unauthorized", code: "UNAUTHORIZED" });
    const user = await User.findById(req.user.id).select("is_admin");
    if (!user)
      return res
        .status(401)
        .json({ error: "Unauthorized", code: "UNAUTHORIZED" });
    if (!user.is_admin)
      return res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
    next();
  } catch (e) {
    console.error("requireAdmin error:", e);
    res
      .status(500)
      .json({ error: "Internal Server Error", code: "INTERNAL_SERVER_ERROR" });
  }
};
