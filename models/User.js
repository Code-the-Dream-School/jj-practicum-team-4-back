
const mongoose = require('mongoose')


const UserSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: function () {
            return !this.password //googleId is required if there is no password present
        },
    },
    username: {
        type: String,
        required: [true, 'Please Provide A Username For Your Account '],
        minlength: 3,
        maxlength: 20,
        trim: true,
        match: [
            /^[A-Za-z0-9_-]+$/,
            'Username can only contain letters, numbers, underscores, or dashes',
        ],
        unique: true,
    },
    first_name: {
        type: String,
        required: [true, 'Please Provide Your First Name'],
        trim: true,
    },
    last_name: {
        type: String,
        required: [true, 'Please Provide Your Last Name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please Provide An Email'],
        lowercase: true,
        trim: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please provide valid email',
        ],
        unique:true,
    },
    password: {
        type: String,
        minlength: 6,
        required: function () {
            return !this.googleId //password is required is there is no googleId
        },
    },
    social_handle: {
        type: String, 
        trim: true,
    },
    is_admin: {
        type: Boolean,
        default: false, 
    },
	userArtworks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artwork" }],
	likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artwork" }],    
  },
   { timestamps: true }
)


module.exports = mongoose.model('User', UserSchema)



//Notes:
//https://mongoosejs.com/docs/guide.html
//https://youtu.be/jZ-dzj6ut54?si=IK-79zPcCJYJWoAd
//https://www.geeksforgeeks.org/python/python-program-to-verify-that-a-string-only-contains-letters-numbers-underscores-and-dashes/
