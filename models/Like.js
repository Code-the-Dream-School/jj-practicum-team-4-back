const mongoose = require('mongoose')


const likeSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    artwork_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artwork',
        required: true,
    },
 }, 
  { timestamps: true }
)

likeSchema.index({ user_id: 1, artwork_id: 1 }, 
    { unique: true }
)

module.exports = mongoose.model('Like', likeSchema)

