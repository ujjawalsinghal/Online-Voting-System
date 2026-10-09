const Election = require("../models/Election");
const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");
const EligibleVoter = require("../models/EligibleVoter");

const getAllElections = async (req, res) => {
    try {
        const elections = await Election
            .find()
            .sort({ startTime: -1 });

        res.json({
            elections
        });

    } catch (error) {
        console.error(
            "Get all elections error:",
            error
        );

        res.status(500).json({
            message: "Server error while getting elections"
        });
    }
};

// Create a new election
const createElection = async (req, res) => {
    try {
        const {
            title,
            description,
            startTime,
            endTime
        } = req.body;

        if (!title || !startTime || !endTime) {
            return res.status(400).json({
                message: "Title, start time and end time are required"
            });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                message: "Invalid date format"
            });
        }

        if (end <= start) {
            return res.status(400).json({
                message: "End time must be after start time"
            });
        }

        const election = await Election.create({
            title,
            description,
            startTime: start,
            endTime: end,
            status: "upcoming"
        });

        res.status(201).json({
            message: "Election created successfully",
            election
        });

    } catch (error) {
        console.error("Create election error:", error);

        res.status(500).json({
            message: "Server error while creating election"
        });
    }
};


const deleteElection = async (req, res) => {
    try {
        const { electionId } = req.params;

        const election = await Election.findById(electionId);

        if (!election) {
            return res.status(404).json({
                message: "Election not found"
            });
        }

        const voteCount = await Vote.countDocuments({
            election: electionId
        });

        if (voteCount > 0) {
            return res.status(400).json({
                message: "Cannot delete an election that contains votes"
            });
        }

        await Candidate.deleteMany({
            election: electionId
        });

        await Election.deleteOne({
            _id: electionId
        });

        res.json({
            message: "Election deleted successfully"
        });

    } catch (error) {
        console.error(
            "Delete election error:",
            error
        );

        res.status(500).json({
            message: "Server error while deleting election"
        });
    }
};


// Add candidate to an election
const createCandidate = async (req, res) => {
    try {
        const {
            name,
            description,
            image,
            electionId
        } = req.body;

        if (!name || !electionId) {
            return res.status(400).json({
                message: "Candidate name and election ID are required"
            });
        }

        const election = await Election.findById(electionId);

        if (!election) {
            return res.status(404).json({
                message: "Election not found"
            });
        }

        if (election.status === "completed") {
            return res.status(400).json({
                message: "Cannot add candidates to a completed election"
            });
        }

        const candidate = await Candidate.create({
            name,
            description,
            image: image || "",
            election: electionId
        });

        res.status(201).json({
            message: "Candidate created successfully",
            candidate
        });

    } catch (error) {
        console.error("Create candidate error:", error);

        res.status(500).json({
            message: "Server error while creating candidate"
        });
    }
};


// Get candidates for an election
const getCandidates = async (req, res) => {
    try {
        const { electionId } = req.params;

        const election = await Election.findById(electionId);

        if (!election) {
            return res.status(404).json({
                message: "Election not found"
            });
        }

        const candidates = await Candidate.find({
            election: electionId
        }).sort({ createdAt: 1 });

        res.json({
            election: {
                id: election._id,
                title: election.title
            },
            candidates
        });

    } catch (error) {
        console.error("Get candidates error:", error);

        res.status(500).json({
            message: "Server error while getting candidates"
        });
    }
};

// Activate an election
const activateElection = async (req, res) => {
    try {
        const { electionId } = req.params;

        const election = await Election.findById(electionId);

        if (!election) {
            return res.status(404).json({
                message: "Election not found"
            });
        }

        if (election.status === "completed") {
            return res.status(400).json({
                message: "Completed election cannot be activated"
            });
        }

        const now = new Date();

        if (now < election.startTime) {
            return res.status(400).json({
                message: "Election start time has not been reached"
            });
        }

        if (now > election.endTime) {
            return res.status(400).json({
                message: "Election end time has already passed"
            });
        }

        election.status = "active";

        await election.save();

        res.json({
            message: "Election activated successfully",
            election
        });

    } catch (error) {
        console.error("Activate election error:", error);

        res.status(500).json({
            message: "Server error while activating election"
        });
    }
};

// Update election schedule
const updateElectionSchedule = async (req, res) => {
    try {
        const { electionId } = req.params;
        const { startTime, endTime } = req.body;

        const election = await Election.findById(electionId);

        if (!election) {
            return res.status(404).json({
                message: "Election not found"
            });
        }

        if (startTime) {
            const start = new Date(startTime);

            if (isNaN(start.getTime())) {
                return res.status(400).json({
                    message: "Invalid start time"
                });
            }

            election.startTime = start;
        }

        if (endTime) {
            const end = new Date(endTime);

            if (isNaN(end.getTime())) {
                return res.status(400).json({
                    message: "Invalid end time"
                });
            }

            election.endTime = end;
        }

        if (election.endTime <= election.startTime) {
            return res.status(400).json({
                message: "End time must be after start time"
            });
        }

        await election.save();

        res.json({
            message: "Election schedule updated successfully",
            election
        });

    } catch (error) {
        console.error("Update election schedule error:", error);

        res.status(500).json({
            message: "Server error while updating election schedule"
        });
    }
};


// Close an election
const closeElection = async (req, res) => {
    try {
        const { electionId } = req.params;

        const election = await Election.findById(electionId);

        if (!election) {
            return res.status(404).json({
                message: "Election not found"
            });
        }

        election.status = "completed";

        await election.save();

        res.json({
            message: "Election closed successfully",
            election
        });

    } catch (error) {
        console.error("Close election error:", error);

        res.status(500).json({
            message: "Server error while closing election"
        });
    }
};


// Get election results
const getResults = async (req, res) => {
    try {
        const { electionId } = req.params;

        const election = await Election.findById(electionId);

        if (!election) {
            return res.status(404).json({
                message: "Election not found"
            });
        }

        const results = await Vote.aggregate([
            {
                $match: {
                    election: election._id
                }
            },
            {
                $group: {
                    _id: "$candidate",
                    votes: {
                        $sum: 1
                    }
                }
            },
            {
                $lookup: {
                    from: "candidates",
                    localField: "_id",
                    foreignField: "_id",
                    as: "candidate"
                }
            },
            {
                $unwind: "$candidate"
            },
            {
                $project: {
                    _id: 0,
                    candidateId: "$candidate._id",
                    candidateName: "$candidate.name",
                    votes: 1
                }
            },
            {
                $sort: {
                    votes: -1
                }
            }
        ]);

        const totalVotes = results.reduce(
            (total, candidate) => total + candidate.votes,
            0
        );

        res.json({
            election: {
                id: election._id,
                title: election.title,
                status: election.status
            },
            totalVotes,
            results
        });

    } catch (error) {
        console.error("Get results error:", error);

        res.status(500).json({
            message: "Server error while getting results"
        });
    }
};

//Eligible Voter Management
const addEligibleVoter = async (req, res) => {
    try {
        const { name, studentId } = req.body;

        if (
            typeof name !== "string" ||
            typeof studentId !== "string" ||
            !name.trim() ||
            !studentId.trim()
        ) {
            return res.status(400).json({
                message: "Name and student ID are required"
            });
        }

        const normalizedStudentId = studentId.trim().toUpperCase();

        const existingVoter = await EligibleVoter.findOne({
            studentId: normalizedStudentId
        });

        if (existingVoter) {
            return res.status(409).json({
                message: "This student ID is already in the eligible-voter registry"
            });
        }

        const eligibleVoter = await EligibleVoter.create({
            name: name.trim(),
            studentId: normalizedStudentId
        });

        return res.status(201).json({
            message: "Eligible voter added successfully",
            eligibleVoter: {
                id: eligibleVoter._id,
                name: eligibleVoter.name,
                studentId: eligibleVoter.studentId,
                isRegistered: eligibleVoter.isRegistered
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "This student ID is already in the eligible-voter registry"
            });
        }

        console.error("Add eligible voter error:", error);

        return res.status(500).json({
            message: "Server error while adding eligible voter"
        });
    }
};



module.exports = {
    getAllElections,
    createElection,
    deleteElection,
    createCandidate,
    getCandidates,
    updateElectionSchedule,
    activateElection,
    closeElection,
    getResults,
    deleteElection,
    addEligibleVoter
};