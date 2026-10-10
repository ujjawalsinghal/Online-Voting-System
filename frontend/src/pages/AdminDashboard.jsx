import { useEffect, useState } from "react";

import { io } from "socket.io-client";

import api from "../services/api";
import { getAdminToken } from "../services/authStorage";

import { jsPDF } from "jspdf";

import "./AdminDashboard.css";

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

    const [candidateImageFile, setCandidateImageFile] = useState(null);

    const [candidateImagePreview, setCandidateImagePreview] = useState("");

    const [candidates, setCandidates] = useState([]);

    const [candidatesLoading, setCandidatesLoading] = useState(false);

    const [candidatesError, setCandidatesError] = useState("");

    // Edit candidate states

    const [editingCandidateId, setEditingCandidateId] = useState("");

    const [editCandidateName, setEditCandidateName] = useState("");

    const [editCandidateDescription, setEditCandidateDescription] = useState("");

    const [editCandidateImage, setEditCandidateImage] = useState("");

    const [editCandidateImageFile, setEditCandidateImageFile] = useState(null);

    const [editCandidateImagePreview, setEditCandidateImagePreview] = useState("");

    const [savingCandidate, setSavingCandidate] = useState(false);

    const [deletingCandidateId, setDeletingCandidateId] = useState("");

    // Eligible voter states

    const [eligibleName, setEligibleName] = useState("");

    const [eligibleStudentId, setEligibleStudentId] = useState("");

    const [addingEligibleVoter, setAddingEligibleVoter] = useState(false);

    // Update election schedule states

    const [editStartTime, setEditStartTime] = useState("");

    const [editEndTime, setEditEndTime] = useState("");

    const [updatingSchedule, setUpdatingSchedule] = useState(false);

    // Edit election details states

    const [editingElectionId, setEditingElectionId] = useState("");

    const [editTitle, setEditTitle] = useState("");

    const [editDescription, setEditDescription] = useState("");

    const [savingElectionDetails, setSavingElectionDetails] = useState(false);

    // --------------------------------------------------

    useEffect(() => {

        return () => {

            if (candidateImagePreview) {

                URL.revokeObjectURL(candidateImagePreview);

            }

        };

    }, [candidateImagePreview]);



    useEffect(() => {

        return () => {

            if (editCandidateImagePreview) {

                URL.revokeObjectURL(editCandidateImagePreview);

            }

        };

    }, [editCandidateImagePreview]);



    const uploadCandidateImage = async (file, token) => {

        const formData = new FormData();

        formData.append("image", file);

        const response = await api.post("/admin/upload-candidate-image", formData, {

            headers: { Authorization: `Bearer ${token}` },

        });

        return response.data.imageUrl;

    };



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

            const token = getAdminToken();

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

    const fetchCandidates = async (electionId) => {

        if (!electionId) {

            setCandidates([]);

            setCandidatesError("");

            return;

        }

        try {

            setCandidatesLoading(true);

            setCandidatesError("");

            const token = getAdminToken();

            const response = await api.get(`/admin/elections/${electionId}/candidates`, {

                headers: { Authorization: `Bearer ${token}` }

            });

            setCandidates(response.data.candidates || []);

        } catch (error) {

            setCandidates([]);

            setCandidatesError(error.response?.data?.message || "Failed to load candidates for this election.");

        } finally {

            setCandidatesLoading(false);

        }

    };

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

            const token = getAdminToken();

            const imageUrl = candidateImageFile

                ? await uploadCandidateImage(candidateImageFile, token)

                : "";

            await api.post(

                "/admin/candidates",

                {

                    name: candidateName.trim(),

                    description: candidateDescription,

                    image: imageUrl,

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

            setCandidateImageFile(null);

            setCandidateImagePreview("");

            await fetchCandidates(selectedElectionId);

        } catch (error) {

            setMessage(

                error.response?.data?.message ||

                "Failed to add candidate"

            );

        } finally {

            setAddingCandidate(false);

        }

    };

    const handleStartEditCandidate = (candidate) => {

        const selectedElection = elections.find(

            (item) => item._id === selectedElectionId

        );

        if (selectedElection?.status !== "upcoming") {

            setMessage("Candidates can only be edited in upcoming elections.");

            return;

        }

        setEditingCandidateId(candidate._id);

        setEditCandidateName(candidate.name || "");

        setEditCandidateDescription(candidate.description || "");

        setEditCandidateImage(candidate.image || "");

        setEditCandidateImageFile(null);

        setMessage("");

        document.getElementById("candidate-list-title")?.scrollIntoView({

            behavior: "smooth",

            block: "start"

        });

    };

    const handleCancelEditCandidate = () => {

        setEditingCandidateId("");

        setEditCandidateName("");

        setEditCandidateDescription("");

        setEditCandidateImage("");

        setEditCandidateImageFile(null);

        setEditCandidateImagePreview("");

    };

    const handleUpdateCandidate = async (e) => {

        e.preventDefault();

        if (!editingCandidateId || !editCandidateName.trim()) {

            setMessage("Candidate name is required.");

            return;

        }

        try {

            setSavingCandidate(true);

            setMessage("");

            const token = getAdminToken();

            const imageUrl = editCandidateImageFile

                ? await uploadCandidateImage(editCandidateImageFile, token)

                : editCandidateImage.trim();

            const response = await api.put(

                `/admin/candidates/${editingCandidateId}`,

                {

                    name: editCandidateName.trim(),

                    description: editCandidateDescription.trim(),

                    image: imageUrl

                },

                {

                    headers: { Authorization: `Bearer ${token}` }

                }

            );

            setMessage(response.data.message || "Candidate updated successfully.");

            handleCancelEditCandidate();

            await fetchCandidates(selectedElectionId);

        } catch (error) {

            setMessage(

                error.response?.data?.message || "Failed to update candidate."

            );

        } finally {

            setSavingCandidate(false);

        }

    };

    const handleDeleteCandidate = async (candidate) => {

        const selectedElection = elections.find(

            (item) => item._id === selectedElectionId

        );

        if (selectedElection?.status !== "upcoming") {

            setMessage("Candidates can only be deleted from upcoming elections.");

            return;

        }

        const confirmed = window.confirm(

            `Delete candidate "${candidate.name}"? This cannot be undone.`

        );

        if (!confirmed) return;

        try {

            setDeletingCandidateId(candidate._id);

            setMessage("");

            const token = getAdminToken();

            const response = await api.delete(

                `/admin/candidates/${candidate._id}`,

                {

                    headers: { Authorization: `Bearer ${token}` }

                }

            );

            if (editingCandidateId === candidate._id) {

                handleCancelEditCandidate();

            }

            setMessage(response.data.message || "Candidate deleted successfully.");

            await fetchCandidates(selectedElectionId);

        } catch (error) {

            setMessage(

                error.response?.data?.message || "Failed to delete candidate."

            );

        } finally {

            setDeletingCandidateId("");

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

            const token = getAdminToken();

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

            const token = getAdminToken();

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

    const handleEditElection = (item) => {

        if (item.status !== "upcoming") {

            setMessage("Only upcoming elections can be edited.");

            return;

        }

        setEditingElectionId(item._id);

        setEditTitle(item.title || "");

        setEditDescription(item.description || "");

        setMessage("");

        document.getElementById("election-management-title")?.scrollIntoView({

            behavior: "smooth",

            block: "start"

        });

    };

    const handleSaveElectionDetails = async (e) => {

        e.preventDefault();

        if (!editingElectionId) return;

        if (!editTitle.trim()) {

            setMessage("Election title is required.");

            return;

        }

        try {

            setSavingElectionDetails(true);

            setMessage("");

            const token = getAdminToken();

            const response = await api.put(

                `/admin/elections/${editingElectionId}/details`,

                {

                    title: editTitle.trim(),

                    description: editDescription.trim()

                },

                {

                    headers: {

                        Authorization: `Bearer ${token}`

                    }

                }

            );

            setMessage(response.data.message || "Election details updated successfully.");

            setEditingElectionId("");

            setEditTitle("");

            setEditDescription("");

            await fetchElections();

            await fetchResults(editingElectionId);

        } catch (error) {

            setMessage(error.response?.data?.message || "Failed to update election details.");

        } finally {

            setSavingElectionDetails(false);

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

            const token = getAdminToken();

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

            setCandidateName("");

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

            const token = getAdminToken();

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

    // Reload the candidate list whenever the selected election changes.

    useEffect(() => {

        const timeoutId = setTimeout(() => {

            fetchCandidates(selectedElectionId);

        }, 0);

        return () => clearTimeout(timeoutId);

    }, [selectedElectionId]);

    const fetchResults = async (electionId) => {

        if (!electionId) {

            return;

        }

        try {

            const token = getAdminToken();

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

    const exportResultsToCSV = () => {
        if (!election || !results) {
            setMessage("Please load election results first.");
            return;
        }

        const escapeCSV = (value) => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
        };

        const total = Number(totalVotes) || 0;

        const rows = [
            ["Election Results"],
            ["Election Title", election.title],
            ["Election Status", election.status],
            ["Total Votes", total],
            [],
            ["Candidate Name", "Votes", "Percentage"],
            ...results.map((candidate) => {
                const votes = Number(candidate.votes) || 0;
                const percentage =
                    total > 0 ? ((votes / total) * 100).toFixed(2) : "0.00";

                return [
                    candidate.candidateName,
                    votes,
                    `${percentage}%`
                ];
            })
        ];

        const csvContent = rows
            .map((row) => row.map(escapeCSV).join(","))
            .join("\r\n");

        const blob = new Blob(["\uFEFF" + csvContent], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `election-results-${election.title
            .replace(/[^a-z0-9]/gi, "-")
            .toLowerCase()}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    };

    const exportResultsToPDF = () => {
        if (!election || !results) {
            setMessage("Please load election results first.");
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        const total = Number(totalVotes) || 0;

        const safeText = (value) => String(value ?? "");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("Election Results Report", margin, 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(`Election: ${safeText(election.title)}`, margin, 32);
        doc.text(`Status: ${safeText(election.status)}`, margin, 40);
        doc.text(`Total Votes: ${total}`, margin, 48);

        const tableStartY = 60;
        const rowHeight = 10;
        const colX = [margin, 100, 140];

        doc.setFont("helvetica", "bold");
        doc.setFillColor(230, 230, 230);
        doc.rect(margin, tableStartY - 7, pageWidth - margin * 2, rowHeight, "F");

        doc.text("Candidate", colX[0], tableStartY);
        doc.text("Votes", colX[1], tableStartY);
        doc.text("Percentage", colX[2], tableStartY);

        let y = tableStartY + rowHeight;

        doc.setFont("helvetica", "normal");

        results.forEach((candidate) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            const votes = Number(candidate.votes) || 0;
            const percentage =
                total > 0 ? ((votes / total) * 100).toFixed(2) : "0.00";

            const name = safeText(candidate.candidateName);

            doc.text(
                doc.splitTextToSize(name, 80)[0] || "",
                colX[0],
                y
            );
            doc.text(String(votes), colX[1], y);
            doc.text(`${percentage}%`, colX[2], y);

            y += rowHeight;
        });

        if (results.length === 0) {
            doc.text("No votes have been recorded.", margin, y);
        }

        const safeTitle = safeText(election.title)
            .replace(/[^a-z0-9]/gi, "-")
            .toLowerCase();

        doc.save(`election-results-${safeTitle}.pdf`);
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

        const socketUrl =
            import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
        const socket = io(socketUrl);

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

    const totalElections = elections.length;

    const activeElections = elections.filter(

        (item) => item.status === "active"

    ).length;

    const upcomingElections = elections.filter(

        (item) => item.status === "upcoming"

    ).length;

    const completedElections = elections.filter(

        (item) => item.status === "completed"

    ).length;

    // Include candidates with zero votes, not only those returned by aggregation.
    const chartResults = candidates.map((candidate) => {
        const matchingResult = results.find(
            (result) => String(result.candidateId) === String(candidate._id)
        );
        return {
            candidateId: candidate._id,
            candidateName: candidate.name,
            votes: matchingResult?.votes || 0,
        };
    }).sort((a, b) => b.votes - a.votes);

    const leadingCandidate = totalVotes > 0
        ? chartResults.find((candidate) => candidate.votes === Math.max(...chartResults.map((item) => item.votes)))
        : null;

    // --------------------------------------------------

    // UI

    // --------------------------------------------------


    return (
        <div className="admin-dashboard">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <div className="admin-brand-icon">V</div>
                    <div>
                        <strong>VoteSphere</strong>
                        <span>Election Management</span>
                    </div>
                </div>

                <p className="admin-sidebar-label">WORKSPACE</p>

                <nav
                    className="admin-sidebar-nav"
                    aria-label="Admin dashboard sections"
                >
                    <a href="#dashboard-overview">Overview</a>
                    <a href="#election-management-title">Elections</a>
                    <a href="#create-election">Create Election</a>
                    <a href="#add-candidate">Candidates</a>
                    <a href="#eligible-voter">Eligible Voters</a>
                    <a href="#update-schedule">Schedule</a>
                    <a href="#election-results">Results</a>
                </nav>

                <div className="admin-sidebar-footer">
                    <span className="admin-status-dot" />
                    Admin Workspace
                </div>
            </aside>

            <div className="admin-main">
                <header className="admin-topbar">
                    <div>
                        <span className="admin-topbar-eyebrow">
                            ELECTION CONTROL CENTER
                        </span>
                        <h1>Admin Dashboard</h1>
                    </div>

                    <div className="admin-topbar-badge">
                        <span className="admin-status-dot" />
                        Management Portal
                    </div>
                </header>

                <main className="admin-content">
                    <section id="dashboard-overview">


                        <div

                            style={{

                                display: "grid",

                                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",

                                gap: "16px",

                                margin: "24px 0"

                            }}

                        >

                            {[

                                {

                                    title: "Total Elections",

                                    count: totalElections,

                                    color: "#2563eb"

                                },

                                {

                                    title: "Active Elections",

                                    count: activeElections,

                                    color: "#16a34a"

                                },

                                {

                                    title: "Upcoming Elections",

                                    count: upcomingElections,

                                    color: "#d97706"

                                },

                                {

                                    title: "Completed Elections",

                                    count: completedElections,

                                    color: "#64748b"

                                }

                            ].map((stat) => (

                                <div

                                    key={stat.title}

                                    style={{

                                        padding: "20px",

                                        borderRadius: "12px",

                                        border: "1px solid #374151",

                                        borderTop: `4px solid ${stat.color}`,

                                        background: "#1f2937",

                                        color: "#f9fafb",

                                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",

                                        transition: "transform 0.2s ease"

                                    }}

                                    onMouseEnter={(e) => {

                                        e.target.style.transform = "translateY(-2px)";

                                    }}

                                    onMouseLeave={(e) => {

                                        e.target.style.transform = "translateY(0)";

                                    }}

                                >

                                    <p style={{ color: "#d1d5db", margin: "0 0 10px" }}>

                                        {stat.title}

                                    </p>

                                    <h2 style={{ margin: 0, fontSize: "30px", color: "#ffffff" }}>

                                        {stat.count}

                                    </h2>

                                </div>

                            ))}

                        </div>

                        <nav

                            aria-label="Admin dashboard sections"

                            style={{

                                display: "flex",

                                flexWrap: "wrap",

                                justifyContent: "center",

                                gap: "10px",

                                padding: "16px",

                                marginBottom: "24px",

                                background: "#1f2937",

                                borderRadius: "12px"

                            }}

                        >

                            {[

                                ["Create Election", "create-election"],

                                ["Add Candidate", "add-candidate"],

                                ["Eligible Voters", "eligible-voter"],

                                ["Schedule", "update-schedule"],

                                ["Results", "election-results"]

                            ].map(([label, id]) => (

                                <a

                                    key={id}

                                    href={`#${id}`}

                                    style={{

                                        color: "#93c5fd",

                                        padding: "8px 12px",

                                        borderRadius: "6px",

                                        textDecoration: "none",

                                        border: "1px solid #374151"

                                    }}

                                >

                                    {label}

                                </a>

                            ))}

                        </nav>

                        {/* ==========================================

                CREATE ELECTION

            ========================================== */}

                        <h2 id="create-election">Create New Election</h2>

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

                        <h2 id="add-candidate">Add Candidate</h2>

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

                            <div style={{ margin: "12px 0" }}>

                                <label htmlFor="candidateImageFile">Candidate photo (optional; JPEG, PNG, or WebP, max 2 MB)</label>

                                <br />

                                <input

                                    id="candidateImageFile"

                                    type="file"

                                    accept="image/jpeg,image/png,image/webp"

                                    onChange={(e) => {

                                        const file = e.target.files?.[0] || null;

                                        if (file && file.size > 2 * 1024 * 1024) {

                                            setMessage("Image must be 2 MB or smaller.");

                                            e.target.value = "";

                                            setCandidateImageFile(null);

                                            setCandidateImagePreview("");

                                            return;

                                        }

                                        if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {

                                            setMessage("Only JPEG, PNG, and WebP images are allowed.");

                                            e.target.value = "";

                                            setCandidateImageFile(null);

                                            setCandidateImagePreview("");

                                            return;

                                        }

                                        setMessage("");

                                        setCandidateImageFile(file);

                                        setCandidateImagePreview(file ? URL.createObjectURL(file) : "");

                                    }}

                                />

                                {candidateImagePreview && <img src={candidateImagePreview} alt="Candidate photo preview" style={{ display: "block", width: "140px", maxHeight: "140px", objectFit: "cover", marginTop: "10px", borderRadius: "8px" }} />}

                            </div>

                            <button

                                type="submit"

                                disabled={addingCandidate}

                            >

                                {addingCandidate

                                    ? "Adding..."

                                    : "Add Candidate"}

                            </button>

                        </form>

                        <section aria-labelledby="candidate-list-title" style={{ margin: "24px 0" }}>

                            <h3 id="candidate-list-title">Existing Candidates</h3>

                            {!selectedElectionId ? (

                                <p>Select an election to view its candidates.</p>

                            ) : candidatesLoading ? (

                                <p role="status">Loading candidates...</p>

                            ) : candidatesError ? (

                                <p role="alert" style={{ color: "#dc2626" }}>{candidatesError}</p>

                            ) : candidates.length === 0 ? (

                                <p>No candidates have been added to this election yet.</p>

                            ) : (

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginTop: "14px" }}>

                                    {candidates.map((candidate) => (

                                        <article key={candidate._id} style={{ padding: "16px", border: "1px solid #374151", borderRadius: "10px", background: "#1f2937", color: "#f9fafb" }}>

                                            {candidate.image && <img src={candidate.image} alt={candidate.name} loading="lazy" style={{ width: "100%", maxHeight: "180px", objectFit: "cover", borderRadius: "8px", marginBottom: "10px" }} />}

                                            {editingCandidateId === candidate._id ? (

                                                <form onSubmit={handleUpdateCandidate}>

                                                    <h4>Edit Candidate</h4>

                                                    <label htmlFor={`edit-candidate-name-${candidate._id}`}>Name</label>

                                                    <input id={`edit-candidate-name-${candidate._id}`} type="text" value={editCandidateName} onChange={(e) => setEditCandidateName(e.target.value)} maxLength={120} required style={{ width: "100%", boxSizing: "border-box", padding: "9px", margin: "6px 0 12px" }} />

                                                    <label htmlFor={`edit-candidate-description-${candidate._id}`}>Description</label>

                                                    <textarea id={`edit-candidate-description-${candidate._id}`} value={editCandidateDescription} onChange={(e) => setEditCandidateDescription(e.target.value)} rows={3} maxLength={2000} style={{ width: "100%", boxSizing: "border-box", padding: "9px", margin: "6px 0 12px" }} />

                                                    <label htmlFor={`edit-candidate-image-${candidate._id}`}>Image URL (optional)</label>


                                                    <input id={`edit-candidate-image-${candidate._id}`} type="url" value={editCandidateImage} onChange={(e) => { setEditCandidateImage(e.target.value); setEditCandidateImageFile(null); }} placeholder="https://example.com/photo.jpg" style={{ width: "100%", boxSizing: "border-box", padding: "9px", margin: "6px 0 12px" }} />

                                                    <label htmlFor={`edit-candidate-image-file-${candidate._id}`}>Or upload a new photo (JPEG, PNG, or WebP, max 2 MB)</label>

                                                    <input

                                                        id={`edit-candidate-image-file-${candidate._id}`}

                                                        type="file"

                                                        accept="image/jpeg,image/png,image/webp"

                                                        onChange={(e) => {

                                                            const file = e.target.files?.[0] || null;

                                                            if (file && file.size > 2 * 1024 * 1024) {

                                                                setMessage("Image must be 2 MB or smaller.");

                                                                e.target.value = "";

                                                                setEditCandidateImageFile(null);

                                                                setEditCandidateImagePreview("");

                                                                return;

                                                            }

                                                            if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {

                                                                setMessage("Only JPEG, PNG, and WebP images are allowed.");

                                                                e.target.value = "";

                                                                setEditCandidateImageFile(null);

                                                                setEditCandidateImagePreview("");

                                                                return;

                                                            }

                                                            setMessage("");

                                                            setEditCandidateImageFile(file);

                                                            setEditCandidateImagePreview(file ? URL.createObjectURL(file) : "");

                                                        }}

                                                    />

                                                    {(editCandidateImagePreview || editCandidateImage) && <img src={editCandidateImagePreview || editCandidateImage} alt="Candidate photo preview" style={{ display: "block", width: "140px", maxHeight: "140px", objectFit: "cover", margin: "10px 0", borderRadius: "8px" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />}

                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>

                                                        <button type="submit" disabled={savingCandidate}>{savingCandidate ? "Saving..." : "Save Candidate"}</button>

                                                        <button type="button" onClick={handleCancelEditCandidate} disabled={savingCandidate}>Cancel</button>

                                                    </div>

                                                </form>

                                            ) : (

                                                <>

                                                    <h4 style={{ margin: "0 0 8px" }}>{candidate.name}</h4>

                                                    <p style={{ margin: 0, color: "#d1d5db", whiteSpace: "pre-wrap" }}>{candidate.description || "No description provided."}</p>

                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px" }}>

                                                        <button type="button" onClick={() => handleStartEditCandidate(candidate)} disabled={elections.find((item) => item._id === selectedElectionId)?.status !== "upcoming" || Boolean(deletingCandidateId)} title="Only candidates in upcoming elections can be edited">Edit</button>

                                                        <button type="button" onClick={() => handleDeleteCandidate(candidate)} disabled={elections.find((item) => item._id === selectedElectionId)?.status !== "upcoming" || Boolean(deletingCandidateId)} style={{ background: "#991b1b", color: "#fff" }} title="Only candidates in upcoming elections can be deleted">{deletingCandidateId === candidate._id ? "Deleting..." : "Delete"}</button>

                                                    </div>

                                                </>

                                            )}

                                        </article>

                                    ))}

                                </div>

                            )}

                            {selectedElectionId && !candidatesLoading && <button type="button" onClick={() => fetchCandidates(selectedElectionId)} style={{ marginTop: "12px" }}>Refresh Candidates</button>}

                        </section>

                        <hr />

                        {/* ==========================================

    ELIGIBLE VOTER MANAGEMENT

\========================================== */}

                        <hr />

                        <h2 id="eligible-voter">Register Eligible Voter</h2>

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

                        {/* ELECTION MANAGEMENT CARDS */}

                        <section aria-labelledby="election-management-title" style={{ margin: "28px 0" }}>

                            <h2 id="election-management-title">Election Management</h2>

                            <p>Review election schedules and select an election to manage its schedule or view results.</p>

                            <div

                                style={{

                                    display: "grid",

                                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",

                                    gap: "16px"

                                }}

                            >

                                {elections.map((item) => {

                                    const statusColor =

                                        item.status === "active"

                                            ? "#16a34a"

                                            : item.status === "upcoming"

                                                ? "#d97706"

                                                : "#94a3b8";

                                    return (

                                        <article

                                            key={item._id}

                                            style={{

                                                padding: "18px",

                                                border: "1px solid #374151",

                                                borderRadius: "12px",

                                                background: "#1f2937",

                                                color: "#f9fafb",

                                                display: "flex",

                                                flexDirection: "column",

                                                gap: "10px"

                                            }}

                                        >

                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "12px" }}>

                                                <h3 style={{ margin: 0 }}>{item.title}</h3>

                                                <span

                                                    style={{

                                                        background: statusColor,

                                                        color: "#ffffff",

                                                        borderRadius: "999px",

                                                        padding: "4px 9px",

                                                        fontSize: "12px",

                                                        whiteSpace: "nowrap"

                                                    }}

                                                >

                                                    {item.status}

                                                </span>

                                            </div>

                                            <p style={{ margin: 0, color: "#d1d5db" }}>

                                                {item.description || "No description provided."}

                                            </p>

                                            <div style={{ fontSize: "14px", color: "#cbd5e1" }}>

                                                <p style={{ margin: "4px 0" }}>

                                                    <strong>Starts:</strong>{" "}

                                                    {item.startTime

                                                        ? new Date(item.startTime).toLocaleString()

                                                        : "Not set"}

                                                </p>

                                                <p style={{ margin: "4px 0" }}>

                                                    <strong>Ends:</strong>{" "}

                                                    {item.endTime

                                                        ? new Date(item.endTime).toLocaleString()

                                                        : "Not set"}

                                                </p>

                                            </div>

                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "auto" }}>

                                                <button

                                                    type="button"

                                                    onClick={() => {

                                                        setSelectedElectionId(item._id);

                                                        setLoading(true);

                                                        setMessage("");

                                                        document.getElementById("update-schedule")?.scrollIntoView({

                                                            behavior: "smooth",

                                                            block: "start"

                                                        });

                                                    }}

                                                    style={{

                                                        padding: "9px 12px",

                                                        border: "1px solid #60a5fa",

                                                        borderRadius: "7px",

                                                        background: "#1d4ed8",

                                                        color: "#ffffff",

                                                        cursor: "pointer"

                                                    }}

                                                >

                                                    Select to Manage

                                                </button>

                                                <button

                                                    type="button"

                                                    onClick={() => handleEditElection(item)}

                                                    disabled={item.status !== "upcoming"}

                                                    title={item.status !== "upcoming" ? "Only upcoming elections can be edited" : "Edit election title and description"}

                                                    style={{

                                                        padding: "9px 12px",

                                                        border: "1px solid #fbbf24",

                                                        borderRadius: "7px",

                                                        background: item.status === "upcoming" ? "#92400e" : "#4b5563",

                                                        color: "#ffffff",

                                                        cursor: item.status === "upcoming" ? "pointer" : "not-allowed",

                                                        opacity: item.status === "upcoming" ? 1 : 0.65

                                                    }}

                                                >

                                                    Edit Election

                                                </button>

                                                <button

                                                    type="button"

                                                    onClick={() => {

                                                        setSelectedElectionId(item._id);

                                                        setCandidateName("");

                                                        setCandidateDescription("");

                                                        setCandidateImageFile(null);

                                                        setMessage("");

                                                        document.getElementById("add-candidate")?.scrollIntoView({

                                                            behavior: "smooth",

                                                            block: "start"

                                                        });

                                                    }}

                                                    style={{

                                                        padding: "9px 12px",

                                                        border: "1px solid #34d399",

                                                        borderRadius: "7px",

                                                        background: "#065f46",

                                                        color: "#ffffff",

                                                        cursor: "pointer"

                                                    }}

                                                >

                                                    Manage Candidates

                                                </button>

                                                <button

                                                    type="button"

                                                    onClick={() => {

                                                        setSelectedElectionId(item._id);

                                                        setMessage("");

                                                        fetchResults(item._id);

                                                        document.getElementById("election-results")?.scrollIntoView({

                                                            behavior: "smooth",

                                                            block: "start"

                                                        });

                                                    }}

                                                    style={{

                                                        padding: "9px 12px",

                                                        border: "1px solid #c4b5fd",

                                                        borderRadius: "7px",

                                                        background: "#5b21b6",

                                                        color: "#ffffff",

                                                        cursor: "pointer"

                                                    }}

                                                >

                                                    View Results

                                                </button>

                                            </div>

                                        </article>

                                    );

                                })}

                            </div>

                        </section>

                        {editingElectionId && (

                            <section

                                aria-labelledby="edit-election-title"

                                style={{

                                    margin: "24px 0",

                                    padding: "20px",

                                    border: "1px solid #fbbf24",

                                    borderRadius: "12px",

                                    background: "#1f2937",

                                    color: "#f9fafb"

                                }}

                            >

                                <h2 id="edit-election-title">Edit Election Details</h2>

                                <p>Update the title and description of this upcoming election.</p>

                                <form onSubmit={handleSaveElectionDetails}>

                                    <div style={{ marginBottom: "14px" }}>

                                        <label htmlFor="editElectionTitle">Election Title</label>

                                        <br />

                                        <input

                                            id="editElectionTitle"

                                            type="text"

                                            value={editTitle}

                                            onChange={(e) => setEditTitle(e.target.value)}

                                            maxLength={150}

                                            required

                                            style={{ width: "100%", maxWidth: "560px", padding: "10px", boxSizing: "border-box" }}

                                        />

                                    </div>

                                    <div style={{ marginBottom: "14px" }}>

                                        <label htmlFor="editElectionDescription">Description</label>

                                        <br />

                                        <textarea

                                            id="editElectionDescription"

                                            value={editDescription}

                                            onChange={(e) => setEditDescription(e.target.value)}

                                            rows={4}

                                            maxLength={2000}

                                            style={{ width: "100%", maxWidth: "560px", padding: "10px", boxSizing: "border-box" }}

                                        />

                                    </div>

                                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>

                                        <button type="submit" disabled={savingElectionDetails}>

                                            {savingElectionDetails ? "Saving..." : "Save Changes"}

                                        </button>

                                        <button

                                            type="button"

                                            disabled={savingElectionDetails}

                                            onClick={() => {

                                                setEditingElectionId("");

                                                setEditTitle("");

                                                setEditDescription("");

                                                setMessage("");

                                            }}

                                        >

                                            Cancel

                                        </button>

                                    </div>

                                </form>

                            </section>

                        )}

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

                        <h2 id="update-schedule">Update Election Schedule</h2>

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

                                <h2 id="election-results">

                                    Election Results

                                </h2>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px", margin: "16px 0" }}>
                                    <div style={{ padding: "16px", borderRadius: "10px", background: "#1f2937", color: "#f9fafb", border: "1px solid #374151" }}>
                                        <p style={{ margin: 0, color: "#cbd5e1" }}>Total votes</p>
                                        <strong style={{ display: "block", fontSize: "28px", marginTop: "6px" }}>{totalVotes}</strong>
                                    </div>
                                    <div style={{ padding: "16px", borderRadius: "10px", background: "#1f2937", color: "#f9fafb", border: "1px solid #374151" }}>
                                        <p style={{ margin: 0, color: "#cbd5e1" }}>Candidates</p>
                                        <strong style={{ display: "block", fontSize: "28px", marginTop: "6px" }}>{candidates.length}</strong>
                                    </div>
                                    <div style={{ padding: "16px", borderRadius: "10px", background: "#1f2937", color: "#f9fafb", border: "1px solid #374151" }}>
                                        <p style={{ margin: 0, color: "#cbd5e1" }}>Leading candidate</p>
                                        <strong style={{ display: "block", fontSize: "20px", marginTop: "6px", overflowWrap: "anywhere" }}>{leadingCandidate ? leadingCandidate.candidateName : "No votes yet"}</strong>
                                        {leadingCandidate && <span style={{ color: "#cbd5e1", fontSize: "14px" }}>{leadingCandidate.votes} vote{leadingCandidate.votes === 1 ? "" : "s"}</span>}
                                    </div>
                                </div>

                                <h3>Candidate-wise Results</h3>
                                {candidates.length === 0 ? (
                                    <p>No candidates have been added to this election yet.</p>
                                ) : (
                                    <div style={{ display: "grid", gap: "16px", margin: "16px 0" }}>
                                        {chartResults.map((candidate) => {
                                            const percentage = totalVotes > 0
                                                ? (candidate.votes / totalVotes) * 100
                                                : 0;
                                            return (
                                                <article key={candidate.candidateId} style={{ padding: "16px", border: "1px solid #374151", borderRadius: "10px", background: "#1f2937", color: "#f9fafb" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
                                                        <strong style={{ overflowWrap: "anywhere" }}>{candidate.candidateName}</strong>
                                                        <span>{candidate.votes} vote{candidate.votes === 1 ? "" : "s"} · {percentage.toFixed(1)}%</span>
                                                    </div>
                                                    <div
                                                        role="progressbar"
                                                        aria-label={`${candidate.candidateName} vote share`}
                                                        aria-valuemin={0}
                                                        aria-valuemax={100}
                                                        aria-valuenow={Number(percentage.toFixed(1))}
                                                        style={{ width: "100%", height: "14px", borderRadius: "999px", overflow: "hidden", background: "#374151" }}
                                                    >
                                                        <div style={{ width: `${Math.min(100, percentage)}%`, height: "100%", borderRadius: "999px", background: candidate.votes > 0 && leadingCandidate?.candidateId === candidate.candidateId ? "#22c55e" : "#60a5fa", transition: "width 0.3s ease" }} />
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
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

                                <button
                                    type="button"
                                    onClick={exportResultsToCSV}
                                    disabled={!results || results.length === 0}
                                    style={{ marginLeft: "10px" }}
                                >
                                    Export Results CSV
                                </button>

                                <button
                                    type="button"
                                    onClick={exportResultsToPDF}
                                    disabled={!results || results.length === 0}
                                >
                                    Download PDF Report
                                </button>

                            </>

                        )}

                        {/* ==========================================

                MESSAGE

            ========================================== */}


                        {message && (
                            <p role="status" className="admin-message">
                                {message}
                            </p>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );


};

export default AdminDashboard;