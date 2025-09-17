const mongoose = require("mongoose");
const User = require("../../models/User");

const getPublicProfile = (req, res) => {
  // Public; Path: :id
  // 200 { id, username, first_name, last_name, social_handle, createdAt } | 404 | 500
  return res
    .status(501)
    .json({ message: "Not implemented: GET /api/user/:id" });
};

const updateMe = (req, res) => {
  // Auth required
  // Body: { username?, first_name?, last_name?, social_handle? }
  // 200 updated profile | 400 | 401 | 409 | 500
  return res
    .status(501)
    .json({ message: "Not implemented: PATCH /api/user/me" });
};

async function adminUpdateUser(req, res) {
  // Auth and Admin required
  try {
    const { id } = req.params;
    const { is_admin } = req.body || {};

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "id" },
      });
    }
    if (typeof is_admin !== "boolean") {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "is_admin must be boolean" },
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { is_admin } },
      { new: true }
    ).select("_id username email is_admin createdAt");

    if (!user) {
      return res.status(404).json({ error: "Not Found", code: "NOT_FOUND" });
    }

    return res.json({
      id: String(user._id),
      username: user.username ?? null,
      email: user.email ?? null,
      is_admin: !!user.is_admin,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("adminUpdateUser error:", err);
    return res
      .status(500)
      .json({ error: "Internal Server Error", code: "INTERNAL_SERVER_ERROR" });
  }
}

module.exports = { getPublicProfile, updateMe, adminUpdateUser };
