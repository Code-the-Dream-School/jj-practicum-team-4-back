//https://mongoosejs.com/docs/validation.html
//https://mongoosejs.com/docs/api/schematype.html#SchemaType.prototype.validate()


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
        validate: {
            validator: function (value) {
                return value > this.start_date
            },
            message: 'Start date must come before end date',
        },
    },
 },
  { timestamps: true }
)


module.exports = mongoose.model('Challenge', ChallengeSchema)


