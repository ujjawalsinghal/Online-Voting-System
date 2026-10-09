const mongoose = require("mongoose");

const Vote = require("../models/Vote");
const User = require("../models/User");
const Candidate = require("../models/Candidate");
const Election = require("../models/Election");
const ElectionVoter = require("../models/ElectionVoter");

const castVote = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { candidateId, electionId } = req.body;

        // Validate request
        if (!candidateId || !electionId) {
            return res.status(400).json({
                message: "Candidate ID and election ID are required"
            });
        }

        // Start MongoDB transaction
        session.startTransaction();

        // Find the authenticated voter
        const user = await User.findById(req.user.userId).session(session);

        if (!user) {
            await session.abortTransaction();

            return res.status(404).json({
                message: "User not found"
            });
        }

        // Only voters can cast votes
        if (user.role !== "voter") {
            await session.abortTransaction();

            return res.status(403).json({
                message: "Only voters can cast votes"
            });
        }


        // Find election
        const election = await Election
            .findById(electionId)
            .session(session);

        if (!election) {
            await session.abortTransaction();

            return res.status(404).json({
                message: "Election not found"
            });
        }

        // Check election status

        const now = new Date();

        const votingWindowOpen =
            now >= election.startTime &&
            now <= election.endTime;

        if (election.status !== "active" || !votingWindowOpen) {
            await session.abortTransaction();

            return res.status(400).json({
                message: "Voting is not currently open"
            });
        }


        // Find candidate
        const candidate = await Candidate
            .findById(candidateId)
            .session(session);

        if (!candidate) {
            await session.abortTransaction();

            return res.status(404).json({
                message: "Candidate not found"
            });
        }

        // Make sure candidate belongs to this election
        if (candidate.election.toString() !== electionId) {
            await session.abortTransaction();

            return res.status(400).json({
                message: "Candidate does not belong to this election"
            });
        }

        const existingParticipation = await ElectionVoter.findOne({
            election: election._id,
            voter: user._id
        }).session(session);

        if (existingParticipation) {
            await session.abortTransaction();

            return res.status(409).json({
                message: "You have already voted in this election"
            });
        }

        await ElectionVoter.create(
            [
                {
                    election: election._id,
                    voter: user._id
                }
            ],
            { session }
        );

        await Vote.create(
            [
                {
                    election: election._id,
                    candidate: candidate._id
                }
            ],
            { session }
        );

        // Commit transaction
        await session.commitTransaction();

        // Notify connected clients that election results changed
        const io = req.app.get("io");

        io.to(`election:${electionId}`).emit(
            "resultsUpdated",
            {
                electionId
            }
        );

        res.status(201).json({
            message: "Vote submitted successfully"
        });

    } catch (error) {
        await session.abortTransaction();

        console.error("Vote error:", error);

        res.status(500).json({
            message: "Server error while submitting vote"
        });

    } finally {
        session.endSession();
    }
};

module.exports = {
    castVote
};