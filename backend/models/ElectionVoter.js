const mongoose = require("mongoose");

const electionVoterSchema = new mongoose.Schema(
    {
        election: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Election",
            required: true
        },

        voter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        votedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// One voter can participate only once in one election
electionVoterSchema.index(
    {
        election: 1,
        voter: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model(
    "ElectionVoter",
    electionVoterSchema
);