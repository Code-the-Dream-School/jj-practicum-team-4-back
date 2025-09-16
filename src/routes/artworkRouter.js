const express = require("express");
const router = express.Router();

const { isLoggedIn } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");
const { deleteArtwork } = require("../controllers/artworkController");

// Admin-only delete
router.delete("/:id", isLoggedIn, requireAdmin, deleteArtwork);

module.exports = router;
