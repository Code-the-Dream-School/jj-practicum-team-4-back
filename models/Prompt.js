//https://www.geeksforgeeks.org/mongodb/how-to-create-and-use-enum-in-mongoose/
//https://mongoosejs.com/docs/tutorials/dates.html


const mongoose = require('mongoose')

const promptSchema = new mongoose.Schema({
    title: { 
      type: String,
      required: true,
      trim: true,
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
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    is_active: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true })

module.exports = mongoose.model('Prompt', promptSchema)

//Needed Code Elsewhere:
//-logic to determine which prompt is active to make sure one is active ata time (admin action)
// or add code that checks start and end dates 