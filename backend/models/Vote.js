const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
    {
        election: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Election",
            required: true
        },

        candidate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Candidate",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Vote", voteSchema);