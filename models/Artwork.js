
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
      enum: ['oil paint',
    'acrylic paint', 
    'watercolor',
    'digital art',
    'pencil',
    'charcoal',
    'ink',
    'pastel',
    'mixed media',
    'photography',
    'collage',
    'sculpture',
    'printmaking',
    'gouache',
    'marker'],
      default: 'digital art',
    },
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
 },
  { timestamps: true }
)


module.exports = mongoose.model('Artwork', ArtworkSchema)







