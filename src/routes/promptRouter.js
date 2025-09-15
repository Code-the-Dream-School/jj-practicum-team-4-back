const express = require("express");
const router = express.Router();
const {
  getActivePrompt,
  createPrompt,
  updatePrompt,
} = require("../controllers/promptController");
const { listArtworksByPrompt } = require("../controllers/artworkController");
const { isLoggedIn } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");

// GET /api/prompts/active
router.get("/active", getActivePrompt);

// GET /api/prompts/:id/artworks
router.get("/:id/artworks", listArtworksByPrompt);

//Create weekly challenge (Admin only)
router.post("/", isLoggedIn, requireAdmin, createPrompt);

//Update weekly challenge
router.patch("/:id", isLoggedIn, requireAdmin, updatePrompt);


module.exports = router;
