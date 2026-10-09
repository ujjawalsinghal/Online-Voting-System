const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
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
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["voter", "admin"],
            default: "voter"
        },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);