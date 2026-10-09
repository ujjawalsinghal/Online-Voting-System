const express = require("express");

const {
    getCandidates
} = require("../controllers/adminController");

const {
    getActiveElection,
    getVotingStatus
} = require("../controllers/electionController");

const {
    protect
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/:electionId/candidates",
    protect,
    getCandidates
);

router.get(
    "/:electionId/status",
    protect,
    getVotingStatus
);

router.get(
    "/active",
    protect,
    getActiveElection
);

module.exports = router;