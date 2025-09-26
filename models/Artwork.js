const mongoose = require('mongoose')


const ArtworkSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    prompt_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prompt',
        required: true,
    },
    image_url: {
        type: String,
        required: [true, 'Please Attach An Image'],
    },
    title: { 
      type: String,
      required: [true, 'Please Provide A Title'],
      trim: true,
    },
    description: { 
      type: String,
      required: [true, 'Please Provide A Description'],
      trim: true,
    },
    like_counter: {
      type: Number,
      default: 0,
      min: 0,
    },
     media_tag: {
      type: String,
      enum: ['Oil Paint',
    'Acrylic Paint', 
    'Watercolor',
    'Digital Art',
    'Pencil',
    'Charcoal',
    'Ink',
    'Pastel',
    'Mixed Media',
    'Photography',
    'Collage',
    'Sculpture',
    'Printmaking',
    'Gouache',
    'Marker'],
      default: 'Digital Art',
    },
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
 },
  { timestamps: true }
)


module.exports = mongoose.model('Artwork', ArtworkSchema)







