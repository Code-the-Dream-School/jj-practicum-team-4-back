const mongoose = require('mongoose')


const challengeSchema = new mongoose.Schema({
    prompt_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prompt',
	    required: true,
    },
    start_date: {
        type: Date,
        default: Date.now,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },
})


module.exports = mongoose.model('Challenge', challengeSchema)
