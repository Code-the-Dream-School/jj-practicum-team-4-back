const mongoose = require('mongoose')


const challengeSchema = new mongoose.Schema({
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
})


module.exports = mongoose.model('Challenge', challengeSchema)


//Other Code Needed:
//controller or index that only allows one prompt overr a given period of time