// src/routes/userRouter.js
const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { isLoggedIn } = require("../middleware/auth");

// GET /api/user/:id → public profile
router.get("/:id", userController.getPublicProfile);

// PATCH /api/user/me → update profile
router.patch("/me", isLoggedIn, userController.updateMe);

module.exports = router;
