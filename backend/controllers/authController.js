const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mongoose = require("mongoose");
const EligibleVoter = require("../models/EligibleVoter");

// Register a new user

const registerUser = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { name, studentId, password } = req.body;

        if (
            typeof name !== "string" ||
            typeof studentId !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !studentId.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Name, student ID and password are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long"
            });
        }

        const normalizedStudentId = studentId.trim().toUpperCase();

        session.startTransaction();

        const eligibleVoter = await EligibleVoter.findOne({
            studentId: normalizedStudentId
        }).session(session);

        if (!eligibleVoter) {
            await session.abortTransaction();

            return res.status(403).json({
                message: "This student ID is not approved for registration"
            });
        }

        if (
            eligibleVoter.name.trim().toLowerCase() !==
            name.trim().toLowerCase()
        ) {
            await session.abortTransaction();

            return res.status(403).json({
                message: "Name does not match the eligible-voter record"
            });
        }

        if (eligibleVoter.isRegistered) {
            await session.abortTransaction();

            return res.status(409).json({
                message: "This student has already registered"
            });
        }

        const existingUser = await User.findOne({
            studentId: normalizedStudentId
        }).session(session);

        if (existingUser) {
            await session.abortTransaction();

            return res.status(409).json({
                message: "An account with this student ID already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [user] = await User.create(
            [{
                name: name.trim(),
                studentId: normalizedStudentId,
                password: hashedPassword,
                role: "voter"
            }],
            { session }
        );

        eligibleVoter.isRegistered = true;
        eligibleVoter.registeredUser = user._id;

        await eligibleVoter.save({ session });
        await session.commitTransaction();

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                studentId: user.studentId,
                role: user.role
            }
        });
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        if (error.code === 11000) {
            return res.status(409).json({
                message: "An account or eligibility record already exists"
            });
        }

        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Server error during registration"
        });
    } finally {
        await session.endSession();
    }
};



// Login user
const loginUser = async (req, res) => {
    try {
        const { studentId, password } = req.body;

        if (
            typeof studentId !== "string" ||
            typeof password !== "string" ||
            !studentId.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Student ID and password are required"
            });
        }

        const normalizedStudentId = studentId.trim().toUpperCase();

        // Find user
        const user = await User.findOne({ studentId: normalizedStudentId });

        if (!user) {
            return res.status(401).json({
                message: "Invalid student ID or password"
            });
        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid student ID or password"
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                studentId: user.studentId,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            message: "Server error during login"
        });
    }
};

module.exports = {
    registerUser,
    loginUser
};