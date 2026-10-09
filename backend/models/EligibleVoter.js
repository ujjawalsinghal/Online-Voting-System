
const mongoose = require("mongoose");

const eligibleVoterSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        studentId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },

        isRegistered: {
            type: Boolean,
            default: false
        },

        registeredUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "EligibleVoter",
    eligibleVoterSchema
);
