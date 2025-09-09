// src/routes/promptRouter.js
const express = require("express");
const router = express.Router();
const { getActivePrompt } = require("../controllers/promptController");
const { listArtworksByPrompt } = require("../controllers/artworkController");

// GET /api/prompts/active
router.get("/active", getActivePrompt);

// GET /api/prompts/:id/artworks
router.get("/:id/artworks", listArtworksByPrompt);

module.exports = router;
