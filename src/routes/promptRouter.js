// src/routes/promptRouter.js
const express = require("express");
const router = express.Router();
const { getActivePrompt } = require("../controllers/promptController");

// GET /api/prompts/active
router.get("/active", getActivePrompt);

module.exports = router;
