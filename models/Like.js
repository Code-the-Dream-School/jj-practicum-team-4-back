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
}, { timestamps: true })


module.exports = mongoose.model('Like', likeSchema)

//Needed Code Elsewhere:
//Controller or index that allows only one like per user