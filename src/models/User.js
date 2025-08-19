const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
	googleId: String,
	username: {
		type: String,
		required: true,
		unique: true
	},
	first_name: {
		type: String,
		required: true,
		trim: true,
	},
	last_name: {
		type: String,
		required: true,
		trim: true,
	},
	email: {
		type: String,
		required: true,
		lowercase: true,
		trim: true,
		unique: true,
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
	likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artwork" }]
});

module.exports = mongoose.model("User", UserSchema);