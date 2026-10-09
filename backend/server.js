const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const voteRoutes = require("./routes/voteRoutes");
const adminRoutes = require("./routes/adminRoutes");
const electionRoutes = require("./routes/electionRoutes");
const { startElectionScheduler } = require("./utils/electionScheduler");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(
    cors({
        origin: "http://localhost:5173"
    })
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/elections", electionRoutes);

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "Online Voting System API is running"
    });
});

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Make Socket.IO available to controllers
app.set("io", io);

// Socket.IO connections
io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("joinElection", (electionId) => {
        socket.join(`election:${electionId}`);

        console.log(
            `Socket ${socket.id} joined election ${electionId}`
        );
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    startElectionScheduler();
});