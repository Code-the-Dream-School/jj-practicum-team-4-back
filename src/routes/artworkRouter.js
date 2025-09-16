const express = require("express")
const router = express.Router()

const { isLoggedIn } = require('../middleware/auth')
const { uploadSingleImage } = require("../controllers/imageController")
const { searchArtworks, createArtwork, getArtworkById, deleteArtwork } = require("../controllers/artworkController")

// Artwork functionality
router.get("/", searchArtworks)
router.post("/", isLoggedIn, uploadSingleImage, createArtwork)
router.get("/:id", getArtworkById)
router.delete("/:id", isLoggedIn, deleteArtwork)

module.exports = router