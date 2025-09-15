// src/routes/artworkRouter.js - taken from ticket
const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware/auth");
const uploadArtwork = require("../middleware/uploadArtwork");
const {
  searchArtworks,
  createArtwork,
  getArtworkById,
  deleteArtwork,
  getArtworkLikes,
  addArtworkLike,
  removeArtworkLike,
} = require("../controllers/artworkController");
//Artwork Functionality
router.get("/", searchArtworks);
router.post("/", isLoggedIn, uploadArtwork.single("file"), createArtwork);
router.get("/:id", getArtworkById);
router.delete("/:id", isLoggedIn, deleteArtwork);
//Artwork Likes Functionality
//router.get("/:id/likes", getArtworkLikes);
//router.post("/:id/likes", isLoggedIn, addArtworkLike);
//router.delete("/:id/likes", isLoggedIn, removeArtworkLike);
module.exports = router;
