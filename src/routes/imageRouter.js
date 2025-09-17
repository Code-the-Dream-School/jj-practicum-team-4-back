const express = require("express")
const router = express.Router()
const imageController = require("../controllers/imageController")

router.post('/upload', imageController.uploadSingleImage,imageController.uploadImage)

router.get('/:filename', imageController.getImage)

module.exports = router