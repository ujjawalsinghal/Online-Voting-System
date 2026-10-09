const Election = require("../models/Election");
const ElectionVoter = require("../models/ElectionVoter");

const getActiveElection = async (req, res) => {
    try {
        const now = new Date();

        const election = await Election.findOne({
            status: "active",
            startTime: { $lte: now },
            endTime: { $gte: now }
        }).sort({ startTime: 1 });

        if (!election) {
            return res.status(404).json({
                message: "No active election is currently available"
            });
        }

        res.json({
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
        console.error(
            "Get active election error:",
            error
        );

        res.status(500).json({
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