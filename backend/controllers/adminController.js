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

        if (election.status !== "upcoming") {
            return res.status(400).json({
                message: "Candidates can only be added to upcoming elections"
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


const updateCandidate = async (req, res) => {
    try {
        const { candidateId } = req.params;
        const { name, description, image } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                message: "Candidate name is required"
            });
        }

        const candidate = await Candidate.findById(candidateId);

        if (!candidate) {
            return res.status(404).json({
                message: "Candidate not found"
            });
        }

        const election = await Election.findById(candidate.election);

        if (!election) {
            return res.status(404).json({
                message: "Election not found"
            });
        }

        if (election.status !== "upcoming") {
            return res.status(400).json({
                message: "Candidates can only be edited before an election starts"
            });
        }

        const voteCount = await Vote.countDocuments({
            candidate: candidate._id
        });

        if (voteCount > 0) {
            return res.status(400).json({
                message: "Cannot edit a candidate who has votes"
            });
        }

        if (
            description !== undefined &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                message: "Description must be a string"
            });
        }

        if (image !== undefined && typeof image !== "string") {
            return res.status(400).json({
                message: "Image must be a URL string"
            });
        }

        candidate.name = name.trim();

        if (description !== undefined) {
            candidate.description = description.trim();
        }

        if (image !== undefined) {
            candidate.image = image.trim();
        }

        await candidate.save();

        return res.json({
            message: "Candidate updated successfully",
            candidate
        });
    } catch (error) {
        console.error("Update candidate error:", error);

        return res.status(500).json({
            message: "Server error while updating candidate"
        });
    }
};


const deleteCandidate = async (req, res) => {
    try {
        const { candidateId } = req.params;

        const candidate = await Candidate.findById(candidateId);

        if (!candidate) {
            return res.status(404).json({
                message: "Candidate not found"
            });
        }

        const election = await Election.findById(candidate.election);

        if (!election) {
            return res.status(404).json({
                message: "Election not found"
            });
        }

        if (election.status !== "upcoming") {
            return res.status(400).json({
                message: "Candidates can only be deleted before an election starts"
            });
        }

        const voteCount = await Vote.countDocuments({
            candidate: candidate._id
        });

        if (voteCount > 0) {
            return res.status(400).json({
                message: "Cannot delete a candidate who has votes"
            });
        }

        await Candidate.deleteOne({
            _id: candidate._id
        });

        return res.json({
            message: "Candidate deleted successfully"
        });
    } catch (error) {
        console.error("Delete candidate error:", error);

        return res.status(500).json({
            message: "Server error while deleting candidate"
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


const updateElectionDetails = async (req, res) => {
    try {
        const { electionId } = req.params;
        const { title, description } = req.body;

        if (
            typeof title !== "string" ||
            !title.trim() ||
            typeof description !== "string"
        ) {
            return res.status(400).json({
                message: "A valid title and description are required"
            });
        }

        const election = await Election.findById(electionId);

        if (!election) {
            return res.status(404).json({
                message: "Election not found"
            });
        }

        if (election.status !== "upcoming") {
            return res.status(400).json({
                message: "Only upcoming elections can be edited"
            });
        }

        election.title = title.trim();
        election.description = description.trim();

        await election.save();

        return res.json({
            message: "Election details updated successfully",
            election
        });
    } catch (error) {
        console.error("Update election details error:", error);

        return res.status(500).json({
            message: "Server error while updating election details"
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

        if (election.status !== "upcoming") {
            return res.status(400).json({
                message: "Schedule can only be updated for upcoming elections"
            });
        }

        if (!startTime && !endTime) {
            return res.status(400).json({
                message: "Start time or end time is required"
            });
        }

        const resolvedStart = startTime ? new Date(startTime) : election.startTime;
        const resolvedEnd = endTime ? new Date(endTime) : election.endTime;

        if (isNaN(resolvedStart.getTime())) {
            return res.status(400).json({
                message: "Invalid start time"
            });
        }

        if (isNaN(resolvedEnd.getTime())) {
            return res.status(400).json({
                message: "Invalid end time"
            });
        }

        if (resolvedEnd <= resolvedStart) {
            return res.status(400).json({
                message: "End time must be after start time"
            });
        }

        election.startTime = resolvedStart;
        election.endTime = resolvedEnd;

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

        if (election.status === "completed") {
            return res.status(400).json({
                message: "Election is already closed"
            });
        }

        if (election.status === "upcoming") {
            return res.status(400).json({
                message: "Cannot close an upcoming election that has not started"
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
    updateCandidate,
    deleteCandidate,
    updateElectionDetails,
    updateElectionSchedule,
    activateElection,
    closeElection,
    getResults,
    addEligibleVoter
};