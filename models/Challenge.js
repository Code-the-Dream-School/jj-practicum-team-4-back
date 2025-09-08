const mongoose = require("mongoose");

const ChallengeSchema = new mongoose.Schema(
  {
    prompt_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prompt",
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
          return value > this.start_date;
        },
        message: "Start date must come before end date",
      },
    },
    artworks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artwork" }],
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// indexes for faster queries and weekly uniqueness
ChallengeSchema.index({ start_date: 1, end_date: 1 }, { unique: true });
ChallengeSchema.index({ end_date: 1 });
ChallengeSchema.index({ prompt_id: 1 });

module.exports = mongoose.model("Challenge", ChallengeSchema);

//Notes:
//https://mongoosejs.com/docs/validation.html
//https://mongoosejs.com/docs/api/schematype.html#SchemaType.prototype.validate()
