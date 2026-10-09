import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import api from "../services/api";

const AdminDashboard = () => {
    const [elections, setElections] = useState([]);
    const [selectedElectionId, setSelectedElectionId] = useState("");
    const [election, setElection] = useState(null);
    const [results, setResults] = useState([]);
    const [totalVotes, setTotalVotes] = useState(0);

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    // Create election states
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [creatingElection, setCreatingElection] = useState(false);

    // Add candidate states
    const [candidateName, setCandidateName] = useState("");
    const [candidateDescription, setCandidateDescription] = useState("");
    const [addingCandidate, setAddingCandidate] = useState(false);

    // Eligible voter states
    const [eligibleName, setEligibleName] = useState("");
    const [eligibleStudentId, setEligibleStudentId] = useState("");
    const [addingEligibleVoter, setAddingEligibleVoter] = useState(false);

    // Update election schedule states
    const [editStartTime, setEditStartTime] = useState("");
    const [editEndTime, setEditEndTime] = useState("");
    const [updatingSchedule, setUpdatingSchedule] = useState(false);

    // --------------------------------------------------
    // CREATE ELECTION
    // --------------------------------------------------

    const handleCreateElection = async (e) => {
        e.preventDefault();

        if (!title || !startTime || !endTime) {
            setMessage(
                "Title, start time and end time are required."
            );
            return;
        }

        try {
            setCreatingElection(true);
            setMessage("");

            const token = localStorage.getItem("token");

            await api.post(
                "/admin/elections",
                {
                    title,
                    description,
                    startTime,
                    endTime
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(
                "Election created successfully."
            );

            // Clear form
            setTitle("");
            setDescription("");
            setStartTime("");
            setEndTime("");

            // Reload elections
            await fetchElections();

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to create election"
            );
        } finally {
            setCreatingElection(false);
        }
    };

    // --------------------------------------------------
    // ADD CANDIDATE
    // --------------------------------------------------

    const handleAddCandidate = async (e) => {
        e.preventDefault();

        if (!selectedElectionId) {
            setMessage("Please select an election.");
            return;
        }

        if (!candidateName.trim()) {
            setMessage("Candidate name is required.");
            return;
        }

        try {
            setAddingCandidate(true);
            setMessage("");

            const token = localStorage.getItem("token");

            await api.post(
                "/admin/candidates",
                {
                    name: candidateName,
                    description: candidateDescription,
                    electionId: selectedElectionId
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(
                "Candidate added successfully."
            );

            // Clear candidate form
            setCandidateName("");
            setCandidateDescription("");

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to add candidate"
            );
        } finally {
            setAddingCandidate(false);
        }
    };


    const handleAddEligibleVoter = async (e) => {
        e.preventDefault();

        if (!eligibleName.trim() || !eligibleStudentId.trim()) {
            setMessage("Student name and student ID are required.");
            return;
        }

        try {
            setAddingEligibleVoter(true);
            setMessage("");

            const token = localStorage.getItem("token");

            const response = await api.post(
                "/admin/eligible-voters",
                {
                    name: eligibleName.trim(),
                    studentId: eligibleStudentId.trim().toUpperCase()
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(response.data.message);
            setEligibleName("");
            setEligibleStudentId("");
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to add eligible voter."
            );
        } finally {
            setAddingEligibleVoter(false);
        }
    };

    // UPDATE ELECTION SCHEDULE
    const handleUpdateSchedule = async (e) => {
        e.preventDefault();

        if (!selectedElectionId) {
            setMessage("Please select an election.");
            return;
        }

        if (!editStartTime || !editEndTime) {
            setMessage("Start time and end time are required.");
            return;
        }

        if (new Date(editEndTime) <= new Date(editStartTime)) {
            setMessage("End time must be after start time.");
            return;
        }

        try {
            setUpdatingSchedule(true);
            setMessage("");

            const token = localStorage.getItem("token");

            const response = await api.put(
                `/admin/elections/${selectedElectionId}/schedule`,
                {
                    startTime: new Date(editStartTime).toISOString(),
                    endTime: new Date(editEndTime).toISOString()
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(
                response.data.message ||
                "Election schedule updated successfully."
            );

            await fetchElections();
            await fetchResults(selectedElectionId);
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to update election schedule."
            );
        } finally {
            setUpdatingSchedule(false);
        }
    };



    const handleDeleteElection = async () => {
        if (!selectedElectionId) {
            setMessage("Please select an election.");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete this election? This action cannot be undone."
        );

        if (!confirmed) return;

        try {
            setMessage("");

            const token = localStorage.getItem("token");

            const response = await api.delete(
                `/admin/elections/${selectedElectionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(
                response.data.message || "Election deleted successfully."
            );

            setElection(null);
            setCandidateName([]);
            setResults([]);
            setTotalVotes(0);
            setSelectedElectionId("");

            await fetchElections();

        } catch (error) {
            console.error("Delete election error:", error);

            setMessage(
                error.response?.data?.message ||
                `Request failed (${error.response?.status || "network error"}). Check the browser console.`
            );
        }

    };


    // --------------------------------------------------
    // FETCH ALL ELECTIONS
    // --------------------------------------------------

    const fetchElections = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await api.get(
                "/admin/elections",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const fetchedElections =
                response.data.elections;

            setElections(fetchedElections);

            // Automatically select the active election
            const activeElection =
                fetchedElections.find(
                    (item) => item.status === "active"
                );

            if (activeElection) {
                setSelectedElectionId(
                    activeElection._id
                );
            } else if (
                fetchedElections.length > 0 &&
                !selectedElectionId
            ) {
                setSelectedElectionId(
                    fetchedElections[0]._id
                );
            }

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to load elections"
            );
        }
    };

    // --------------------------------------------------
    // FETCH RESULTS
    // --------------------------------------------------

    const fetchResults = async (electionId) => {
        if (!electionId) {
            return;
        }

        try {
            const token = localStorage.getItem("token");

            const response = await api.get(
                `/admin/results/${electionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setElection(response.data.election);
            setResults(response.data.results);
            setTotalVotes(response.data.totalVotes);

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to load election results"
            );
        } finally {
            setLoading(false);
        }
    };

    // --------------------------------------------------
    // INITIALIZE DASHBOARD
    // --------------------------------------------------

    useEffect(() => {
        const initializeDashboard = async () => {
            await fetchElections();
        };

        initializeDashboard();
    }, []);

    // --------------------------------------------------
    // FETCH RESULTS + SOCKET.IO
    // --------------------------------------------------

    useEffect(() => {
        if (!selectedElectionId) {
            return;
        }

        fetchResults(selectedElectionId);

        const socket = io("http://localhost:5000");

        socket.on("connect", () => {
            console.log(
                "Connected to Socket.IO"
            );

            socket.emit(
                "joinElection",
                selectedElectionId
            );
        });

        socket.on("resultsUpdated", (data) => {
            console.log(
                "Results update received:",
                data
            );

            if (
                data.electionId === selectedElectionId
            ) {
                fetchResults(selectedElectionId);
            }
        });

        socket.on("disconnect", () => {
            console.log(
                "Disconnected from Socket.IO"
            );
        });

        return () => {
            socket.disconnect();
        };

    }, [selectedElectionId]);

    // --------------------------------------------------
    // CHANGE SELECTED ELECTION
    // --------------------------------------------------

    const handleElectionChange = (e) => {
        setSelectedElectionId(
            e.target.value
        );

        setLoading(true);
        setMessage("");
    };

    // --------------------------------------------------
    // LOADING
    // --------------------------------------------------

    if (loading && !election) {
        return (
            <h2>
                Loading elections...
            </h2>
        );
    }

    // --------------------------------------------------
    // UI
    // --------------------------------------------------

    return (
        <div>

            <h1>Admin Dashboard</h1>

            {/* ==========================================
                CREATE ELECTION
            ========================================== */}

            <h2>Create New Election</h2>

            <form onSubmit={handleCreateElection}>

                <div>
                    <label>
                        Election Title
                    </label>

                    <br />

                    <input
                        type="text"
                        value={title}
                        onChange={(e) =>
                            setTitle(e.target.value)
                        }
                        placeholder="Enter election title"
                    />
                </div>

                <br />

                <div>
                    <label>
                        Description
                    </label>

                    <br />

                    <textarea
                        value={description}
                        onChange={(e) =>
                            setDescription(
                                e.target.value
                            )
                        }
                        placeholder="Enter election description"
                    />
                </div>

                <br />

                <div>
                    <label>
                        Start Time
                    </label>

                    <br />

                    <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) =>
                            setStartTime(
                                e.target.value
                            )
                        }
                    />
                </div>

                <br />

                <div>
                    <label>
                        End Time
                    </label>

                    <br />

                    <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) =>
                            setEndTime(
                                e.target.value
                            )
                        }
                    />
                </div>

                <br />

                <button
                    type="submit"
                    disabled={creatingElection}
                >
                    {creatingElection
                        ? "Creating..."
                        : "Create Election"}
                </button>

            </form>

            <hr />

            {/* ==========================================
                ADD CANDIDATE
            ========================================== */}

            <h2>Add Candidate</h2>

            <form onSubmit={handleAddCandidate}>

                <div>
                    <label>
                        Candidate Name
                    </label>

                    <br />

                    <input
                        type="text"
                        value={candidateName}
                        onChange={(e) =>
                            setCandidateName(
                                e.target.value
                            )
                        }
                        placeholder="Enter candidate name"
                    />
                </div>

                <br />

                <div>
                    <label>
                        Candidate Description
                    </label>

                    <br />

                    <textarea
                        value={candidateDescription}
                        onChange={(e) =>
                            setCandidateDescription(
                                e.target.value
                            )
                        }
                        placeholder="Enter candidate description"
                    />
                </div>

                <br />

                <button
                    type="submit"
                    disabled={addingCandidate}
                >
                    {addingCandidate
                        ? "Adding..."
                        : "Add Candidate"}
                </button>

            </form>

            <hr />


            {/* ==========================================
    ELIGIBLE VOTER MANAGEMENT
========================================== */}

            <hr />

            <h2>Register Eligible Voter</h2>

            <p>
                Add a student's details to the approved-voter registry.
                The student can then create their voter account.
            </p>

            <form onSubmit={handleAddEligibleVoter}>
                <div>
                    <label htmlFor="eligibleName">
                        Student Name
                    </label>
                    <br />
                    <input
                        id="eligibleName"
                        type="text"
                        value={eligibleName}
                        onChange={(e) => setEligibleName(e.target.value)}
                        placeholder="Enter student name"
                        required
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="eligibleStudentId">
                        Student ID
                    </label>
                    <br />
                    <input
                        id="eligibleStudentId"
                        type="text"
                        value={eligibleStudentId}
                        onChange={(e) => setEligibleStudentId(e.target.value)}
                        placeholder="Enter student ID"
                        required
                    />
                </div>

                <br />

                <button
                    type="submit"
                    disabled={addingEligibleVoter}
                >
                    {addingEligibleVoter
                        ? "Adding Student..."
                        : "Add Eligible Voter"}
                </button>
            </form>


            {/* ==========================================
                SELECT ELECTION
            ========================================== */}

            <div>

                <label>
                    <strong>
                        Select Election:
                    </strong>
                </label>

                <br />

                <select
                    value={selectedElectionId}
                    onChange={handleElectionChange}
                >

                    <option value="">
                        Select an election
                    </option>

                    {elections.map((item) => (
                        <option
                            key={item._id}
                            value={item._id}
                        >
                            {item.title} — {item.status}
                        </option>
                    ))}

                </select>

            </div>

            <hr />
            <hr />

            {/* UPDATE ELECTION SCHEDULE */}
            <h2>Update Election Schedule</h2>

            <p>
                Select an election above, then update its start and end time.
            </p>

            <form onSubmit={handleUpdateSchedule}>
                <div>
                    <label htmlFor="editStartTime">
                        New Start Time
                    </label>
                    <br />
                    <input
                        id="editStartTime"
                        type="datetime-local"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        required
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="editEndTime">
                        New End Time
                    </label>
                    <br />
                    <input
                        id="editEndTime"
                        type="datetime-local"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        required
                    />
                </div>

                <br />

                <button
                    type="submit"
                    disabled={updatingSchedule || !selectedElectionId}
                >
                    {updatingSchedule
                        ? "Updating Schedule..."
                        : "Update Schedule"}
                </button>
            </form>

            <hr />

            {/* ==========================================
                ELECTION RESULTS
            ========================================== */}

            {election && (
                <>

                    <h2>
                        {election.title}
                    </h2>

                    <h3>
                        Status: {election.status}
                    </h3>


                    <h3>
                        Total Votes: {totalVotes}
                    </h3>

                    <button
                        type="button"
                        onClick={handleDeleteElection}
                        disabled={!selectedElectionId}
                        style={{ margin: "10px" }}
                    >
                        Delete Selected Election
                    </button>

                    <hr />


                    <hr />

                    <h2>
                        Election Results
                    </h2>

                    {results.length === 0 ? (
                        <p>
                            No votes have been
                            recorded yet.
                        </p>
                    ) : (
                        results.map((candidate) => {

                            const percentage =
                                totalVotes > 0
                                    ? (
                                        (candidate.votes /
                                            totalVotes) *
                                        100
                                    ).toFixed(1)
                                    : 0;

                            return (
                                <div
                                    key={
                                        candidate.candidateId
                                    }
                                >

                                    <h3>
                                        {
                                            candidate.candidateName
                                        }
                                    </h3>

                                    <p>
                                        Votes:{" "}
                                        {candidate.votes}
                                    </p>

                                    <p>
                                        Percentage:{" "}
                                        {percentage}%
                                    </p>

                                </div>
                            );
                        })
                    )}

                    <button
                        onClick={() =>
                            fetchResults(
                                selectedElectionId
                            )
                        }
                    >
                        Refresh Results
                    </button>

                </>
            )}

            {/* ==========================================
                MESSAGE
            ========================================== */}

            {message && (
                <p role="status" style={{ color: "green", margin: "10px 0" }}>
                    {message}
                </p>
            )}

        </div>
    );
};

export default AdminDashboard;