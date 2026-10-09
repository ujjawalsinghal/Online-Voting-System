const express = require("express");

const {
    getAllElections,
    createElection,
    createCandidate,
    getCandidates,
    updateElectionSchedule,
    activateElection,
    closeElection,
    getResults,
    deleteElection
} = require("../controllers/adminController");

const {
    protect,
    adminOnly
} = require("../middleware/authMiddleware");

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// Election management
router.post("/elections", createElection);

router.delete("/elections/:electionId", deleteElection);

router.get("/elections", getAllElections);

router.put(
    "/elections/:electionId/schedule",
    updateElectionSchedule
);

router.post("/elections", createElection);

router.post(
    "/elections/:electionId/activate",
    activateElection
);

router.post(
    "/elections/:electionId/close",
    closeElection
);

// Candidate management
router.post("/candidates", createCandidate);

// Results
router.get(
    "/elections/:electionId/candidates",
    getCandidates
);

router.get(
    "/results/:electionId",
    getResults
);

module.exports = router;