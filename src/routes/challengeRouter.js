const express = require("express");
const router = express.Router();
const { listWinners } = require("../controllers/challengeController");

// GET /api/challenge/winners → top artworks by likes
router.get("/winners", listWinners);

module.exports = router;
