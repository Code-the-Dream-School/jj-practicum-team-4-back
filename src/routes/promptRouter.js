const express = require("express");
const router = express.Router();
const {
  getActivePrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  listAllPrompts,
  listArtworksByPrompt,
} = require("../controllers/promptController");
const { isLoggedIn } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");

// GET /api/prompts/active
router.get("/active", getActivePrompt);

//GET /api/prompts/all (Admin only)
router.get("/all", isLoggedIn, requireAdmin, listAllPrompts);

// GET /api/prompts/:id/artworks
router.get("/:id/artworks", listArtworksByPrompt);

//Create weekly challenge (Admin only)
router.post("/", isLoggedIn, requireAdmin, createPrompt);

//Update weekly challenge
router.patch("/:id", isLoggedIn, requireAdmin, updatePrompt);

//Delete weekly challenge
router.delete("/:id", isLoggedIn, requireAdmin, deletePrompt);

module.exports = router;
