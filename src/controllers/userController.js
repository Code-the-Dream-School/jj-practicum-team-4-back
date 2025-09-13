const mongoose = require("mongoose");
const User = require("../../models/User");

const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // validate ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: "Bad Request",
        code: "BAD_REQUEST",
        details: { field: "id", reason: "Invalid ObjectId" },
      });
    }

    // select exactly the fields from the API doc
    const doc = await User.findById(id).select(
      "username first_name last_name social_handle createdAt"
    );

    if (!doc) {
      return res.status(404).json({ error: "Not Found", code: "NOT_FOUND" });
    }

    return res.status(200).json({
      id: String(doc._id),
      username: doc.username ?? null,
      first_name: doc.first_name ?? null,
      last_name: doc.last_name ?? null,
      social_handle: doc.social_handle ?? null,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    console.error("getPublicProfile error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
};

const updateMe = (req, res) => {
  // Auth required
  // Body: { username?, first_name?, last_name?, social_handle? }
  // 200 updated profile | 400 | 401 | 409 | 500
  return res
    .status(501)
    .json({ message: "Not implemented: PATCH /api/user/me" });
};

module.exports = { getPublicProfile, updateMe };
