//https://mongoosejs.com/docs/timestamps.html

const mongoose = require('mongoose')


const artworkSchema = new mongoose.Schema({
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
      required: true,
    },
 },
  { timestamps: true }
)


module.exports = mongoose.model('Artwork', artworkSchema)

//Needed Code Elsewhere:
//From user_id: need to get social media handle and username for each post
//Add code that checks to see if the user had already posted for this prompt or use index
//Add code for successful artwork submission 
//Add code to disable uploading the image when "challenge has closed" and sending message
//Add code that only allows thosee who have accounts to give likes



