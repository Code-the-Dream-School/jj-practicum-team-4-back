// src/routes/userRouter.js
const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { isLoggedIn } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");
const { adminUpdateUser } = require("../controllers/userController");

// PATCH /api/user/me → update profile
router.patch("/me", isLoggedIn, userController.updateMe);

// GET /api/user/:id → public profile
router.get("/:id", userController.getPublicProfile);

// PATCH api/user/:id. -> Auth + Admin: update another user's admin flag
router.patch("/:id", isLoggedIn, requireAdmin, adminUpdateUser);

module.exports = router;
