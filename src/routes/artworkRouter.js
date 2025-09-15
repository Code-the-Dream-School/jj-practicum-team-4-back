
const express = require("express")
const router = express.Router()

const { isLoggedIn } = require('../middleware/auth')
const uploadArtwork = require("../middleware/uploadArtwork")
const { searchArtworks, createArtwork, getArtworkById, deleteArtwork } = require("../controllers/artworkController")

//Artwork Functionality
router.get("/", searchArtworks)
router.post("/", isLoggedIn, uploadArtwork.single("file"), createArtwork)
router.get("/:id", getArtworkById)
router.delete("/:id", isLoggedIn, deleteArtwork)

module.exports = router