const express = require("express");
const upload = require("../middleware/uploadMiddleware");
const { uploadCandidateImage } = require("../controllers/uploadController");

const {
    getAllElections,
    createElection,
    createCandidate,
    getCandidates,
    updateCandidate,
    deleteCandidate,
    updateElectionDetails,
    updateElectionSchedule,
    activateElection,
    closeElection,
    getResults,
    deleteElection,
    addEligibleVoter
} = require("../controllers/adminController");

const {
    protect,
    adminOnly
} = require("../middleware/authMiddleware");

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

router.post(
    "/upload-candidate-image",
    upload.single("image"),
    uploadCandidateImage
);

// Eligible voter management
router.post("/eligible-voters", addEligibleVoter);

// Election management
router.post("/elections", createElection);

router.delete("/elections/:electionId", deleteElection);

router.get("/elections", getAllElections);

router.get(
    "/elections/:electionId/candidates",
    getCandidates
);

router.put("/candidates/:candidateId", updateCandidate);
router.delete("/candidates/:candidateId", deleteCandidate);

router.put(
    "/elections/:electionId/details",
    updateElectionDetails
);


router.put(
    "/elections/:electionId/schedule",
    updateElectionSchedule
);

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
    "/results/:electionId",
    getResults
);

module.exports = router;