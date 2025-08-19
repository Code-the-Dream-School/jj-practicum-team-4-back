const mongoose = require('mongoose')

const ArtworkSchema = new mongoose.Schema({
  prompt_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prompt',
    required: true,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  image_url: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  like_counter: {
    type: Number,
    default: 0,
  },
  media_tag: {
    type: String,
    required: true,
  }
},
  { timestamps: true }
)


module.exports = mongoose.model('Artwork', ArtworkSchema)