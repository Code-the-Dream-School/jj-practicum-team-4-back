// src/middleware/uploadArtwork.js
const multer = require("multer");
const path = require("path");

// Define storage destination and filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Create Multer instance
const uploadArtwork = multer({ storage });

// Export the Multer instance
module.exports = uploadArtwork;
