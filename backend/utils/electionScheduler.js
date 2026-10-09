
const cron = require("node-cron");
const Election = require("../models/Election");

const updateElectionStatuses = async () => {
    const now = new Date();
    console.log("Election scheduler running at:", now.toISOString());

    try {
        // Close elections whose end time has passed.
        await Election.updateMany(
            {
                status: { $ne: "completed" },
                endTime: { $lt: now }
            },
            {
                $set: { status: "completed" }
            }
        );

        // Activate elections whose voting window has opened.
        await Election.updateMany(
            {
                status: "upcoming",
                startTime: { $lte: now },
                endTime: { $gte: now }
            },
            {
                $set: { status: "active" }
            }
        );
    } catch (error) {
        console.error("Election status update failed:", error);
    }
};

const startElectionScheduler = () => {
    // Run once immediately at server startup.
    updateElectionStatuses();

    // Then check every minute.
    cron.schedule("* * * * *", updateElectionStatuses);
};

module.exports = { startElectionScheduler };
