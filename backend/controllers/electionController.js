const Election = require("../models/Election");
const ElectionVoter = require("../models/ElectionVoter");


const getActiveElection = async (req, res) => {
    try {
        const now = new Date();

        // Find an election whose scheduled voting window is open.
        // Exclude completed elections.
        const election = await Election.findOne({
            status: { $ne: "completed" },
            startTime: { $lte: now },
            endTime: { $gte: now }
        }).sort({ startTime: 1 });

        if (!election) {
            return res.status(200).json({
                election: null,
                message: "No active election is currently available"
            });
        }

        // Mark the election active when its scheduled window opens.
        if (election.status !== "active") {
            election.status = "active";
            await election.save();
        }

        return res.json({
            election: {
                id: election._id,
                title: election.title,
                description: election.description,
                startTime: election.startTime,
                endTime: election.endTime,
                status: election.status
            }
        });
    } catch (error) {
        console.error("Get active election error:", error);

        return res.status(500).json({
            message: "Server error while getting active election"
        });
    }
};


const getVotingStatus = async (req, res) => {
    try {
        const { electionId } = req.params;

        const election = await Election.findById(electionId);

        if (!election) {
            return res.status(404).json({
                message: "Election not found"
            });
        }

        const participation = await ElectionVoter.findOne({
            election: electionId,
            voter: req.user.userId
        });

        res.json({
            electionId,
            hasVoted: !!participation
        });

    } catch (error) {
        console.error(
            "Get voting status error:",
            error
        );

        res.status(500).json({
            message: "Server error while checking voting status"
        });
    }
};

module.exports = {
    getActiveElection,
    getVotingStatus
};