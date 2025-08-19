

const mongoose = require('mongoose')

const PromptSchema = new mongoose.Schema({
    title: { 
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: { 
      type: String,
      required: true,
      trim: true,
    },
    rules: { 
      type: String,
      required: true,
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: false,
    },
 },
  { timestamps: true }
)

PromptSchema.index({ is_active: 1 })

module.exports = mongoose.model('Prompt', PromptSchema)

//Notes:
//https://www.geeksforgeeks.org/mongodb/how-to-create-and-use-enum-in-mongoose/
//https://mongoosejs.com/docs/tutorials/dates.html

