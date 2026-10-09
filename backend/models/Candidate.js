const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        image: {
            type: String,
            default: ""
        },

        election: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Election",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Candidate", candidateSchema);