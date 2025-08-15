const mongoose = require('mongoose')


const artworkSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    prompt_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prompt',
    },
    image_url: {
        type: String,
        required: [true, 'Please Attach An Image'],
    },
    title: { //User
      type: String,
      required: true,
    },
    description: { //User
      type: String,
      required: true,
    },
    created_date: {
        type: Date,
        default: Date.now,
    },
    like_counter: {
        type: Number,
        default: 0,
    },
    media_tag: { 
      type: String,
      required: true,
    },
})


module.exports = mongoose.model('Artwork', artworkSchema)
