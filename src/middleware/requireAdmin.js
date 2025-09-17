const User = require("../../models/User");

async function requireAdmin(req, res, next) {
  try {
    // No authenticated user → 401
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
    }

    // Prefer admin flag from upstream middleware/token (no DB call)
    if (typeof req.user.is_admin === "boolean") {
      if (!req.user.is_admin) {
        return res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      }
      return next();
    }

    // Fallback: single DB read only if the flag is missing
    const user = await User.findById(req.user.id).select("is_admin");
    if (!user) {
      return res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" });
    }
    if (!user.is_admin) {
      return res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
    }

    // Cache the flag for the rest of the request
    req.user.is_admin = true;
    next();
  } catch (e) {
    console.error("requireAdmin error:", e);
    res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_SERVER_ERROR" });
  }
}

module.exports = { requireAdmin };
