const mongoose = require('mongoose')

const ChallengeSchema = new mongoose.Schema({
    prompt_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prompt',
	      required: true,
    },
    start_date: {
        type: Date,
        required: true,
    },
    end_date: {
        type: Date,
        required: true,
    },
    artworks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artwork" }],
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]

})

module.exports = mongoose.model('Challenge', ChallengeSchema)