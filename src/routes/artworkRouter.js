const express = require("express");
const router = express.Router();

const { isLoggedIn } = require('../middleware/auth')
const { uploadSingleImage } = require("../controllers/imageController")
const { searchArtworks, createArtwork, getArtworkById, deleteArtwork, getArtworkLikes, addArtworkLike, removeArtworkLike } = require("../controllers/artworkController")

// Artwork Functionality
router.get("/", searchArtworks)
router.post("/", isLoggedIn, uploadSingleImage, createArtwork)
router.get("/:id", getArtworkById)
router.delete("/:id", isLoggedIn, deleteArtwork)

// Like Functionality
router.get("/:id/likes", isLoggedIn, getArtworkLikes)
router.post("/:id/likes", isLoggedIn, addArtworkLike)
router.delete("/:id/likes", isLoggedIn, removeArtworkLike)


module.exports = router;
