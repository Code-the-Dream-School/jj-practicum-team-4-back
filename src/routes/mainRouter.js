const express = require("express");
const router = express.Router();
const mainController = require("../controllers/mainController.js");

// Homepage
router.get("/home", mainController.getHome);
// About
router.get("/about", mainController.getAbout);

router.get("/", mainController.get);

module.exports = router;
