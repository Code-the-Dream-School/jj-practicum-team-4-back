const mongoose = require('mongoose');

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


ChallengeSchema.index({ start_date: 1, end_date: 1 }, { unique: true });
ChallengeSchema.index({ end_date: 1 });
ChallengeSchema.index({ prompt_id: 1 });

module.exports = mongoose.model("Challenge", ChallengeSchema);

