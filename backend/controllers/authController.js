const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Register a new user
const registerUser = async (req, res) => {
    try {
        const { name, studentId, password } = req.body;

        // Check required fields
        if (!name || !studentId || !password) {
            return res.status(400).json({
                message: "Name, student ID and password are required"
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ studentId });

        if (existingUser) {
            return res.status(400).json({
                message: "User with this student ID already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            studentId,
            password: hashedPassword,
            role: "voter"
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                studentId: user.studentId,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            message: "Server error during registration"
        });
    }
};


// Login user
const loginUser = async (req, res) => {
    try {
        const { studentId, password } = req.body;

        if (!studentId || !password) {
            return res.status(400).json({
                message: "Student ID and password are required"
            });
        }

        // Find user
        const user = await User.findOne({ studentId });

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