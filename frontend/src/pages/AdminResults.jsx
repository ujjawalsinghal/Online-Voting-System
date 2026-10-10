import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { jsPDF } from "jspdf";
import api from "../services/api";
import { getAdminToken } from "../services/authStorage";
import "./AdminResults.css";

function AdminResults() {
    const [elections, setElections] = useState([]);
    const [selectedElectionId, setSelectedElectionId] = useState("");
    const [election, setElection] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [results, setResults] = useState([]);
    const [totalVotes, setTotalVotes] = useState(0);
    const [loadingElections, setLoadingElections] = useState(true);
    const [loadingResults, setLoadingResults] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const authConfig = useCallback(() => ({
        headers: {
            Authorization: `Bearer ${getAdminToken()}`,
        },
    }), []);

    const fetchElections = useCallback(async () => {
        try {
            setError("");

            const response = await api.get(
                "/admin/elections",
                authConfig()
            );

            const items = response.data.elections || [];
            setElections(items);

            setSelectedElectionId((currentId) => {
                if (items.some((item) => item._id === currentId)) {
                    return currentId;
                }

                return items.find((item) => item.status === "active")?._id
                    || items[0]?._id
                    || "";
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load elections."
            );
        } finally {
            setLoadingElections(false);
        }
    }, [authConfig]);

    const fetchResults = useCallback(async (electionId) => {
        if (!electionId) {
            setElection(null);
            setCandidates([]);
            setResults([]);
            setTotalVotes(0);
            return;
        }

        try {
            setLoadingResults(true);
            setError("");

            const [resultsResponse, candidatesResponse] = await Promise.all([
                api.get(
                    `/admin/results/${electionId}`,
                    authConfig()
                ),
                api.get(
                    `/admin/elections/${electionId}/candidates`,
                    authConfig()
                ),
            ]);

            setElection(resultsResponse.data.election);
            setResults(resultsResponse.data.results || []);
            setTotalVotes(Number(resultsResponse.data.totalVotes) || 0);
            setCandidates(candidatesResponse.data.candidates || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load election results."
            );
        } finally {
            setLoadingResults(false);
        }
    }, [authConfig]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchElections();
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [fetchElections]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
 
            if (selectedElectionId) {
                fetchResults(selectedElectionId);
            } else if (!loadingElections) {
                setElection(null);
                setCandidates([]);
                setResults([]);
                setTotalVotes(0);
            }
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [selectedElectionId, loadingElections, fetchResults]);

    useEffect(() => {
        if (!selectedElectionId) return;

        const socketUrl =
            import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
        const socket = io(socketUrl);

        socket.on("connect", () => {
            socket.emit("joinElection", selectedElectionId);
        });

        socket.on("resultsUpdated", (data) => {
            if (String(data.electionId) === String(selectedElectionId)) {
                fetchResults(selectedElectionId);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [selectedElectionId, fetchResults]);

    const chartResults = useMemo(() => {
        return candidates.map((candidate) => {
            const matchingResult = results.find(
                (result) =>
                    String(result.candidateId) === String(candidate._id)
            );

            return {
                candidateId: candidate._id,
                candidateName: candidate.name,
                votes: Number(matchingResult?.votes) || 0,
            };
        }).sort((a, b) => b.votes - a.votes);
    }, [candidates, results]);

    const leadingCandidate = totalVotes > 0
        ? chartResults.find(
            (candidate) =>
                candidate.votes === Math.max(
                    ...chartResults.map((item) => item.votes)
                )
        )
        : null;

    const handleElectionChange = (event) => {
        setSelectedElectionId(event.target.value);
        setMessage("");
        setError("");
    };

    const exportResultsToCSV = () => {
        if (!election) {
            setError("Load election results before exporting.");
            return;
        }

        const escapeCSV = (value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`;

        const rows = [
            ["Election Results"],
            ["Election Title", election.title],
            ["Election Status", election.status],
            ["Total Votes", totalVotes],
            [],
            ["Candidate Name", "Votes", "Percentage"],
            ...chartResults.map((candidate) => {
                const percentage = totalVotes > 0
                    ? ((candidate.votes / totalVotes) * 100).toFixed(2)
                    : "0.00";

                return [
                    candidate.candidateName,
                    candidate.votes,
                    `${percentage}%`,
                ];
            }),
        ];

        const csvContent = rows
            .map((row) => row.map(escapeCSV).join(","))
            .join("\r\n");

        const blob = new Blob(["\uFEFF" + csvContent], {
            type: "text/csv;charset=utf-8;",
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
        setMessage("CSV report downloaded.");
    };

    const exportResultsToPDF = () => {
        if (!election) {
            setError("Load election results before exporting.");
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        const safeText = (value) => String(value ?? "");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("Election Results Report", margin, 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(`Election: ${safeText(election.title)}`, margin, 32);
        doc.text(`Status: ${safeText(election.status)}`, margin, 40);
        doc.text(`Total Votes: ${totalVotes}`, margin, 48);

        const tableStartY = 60;
        const rowHeight = 10;
        const colX = [margin, 105, 145];

        doc.setFont("helvetica", "bold");
        doc.setFillColor(230, 230, 230);
        doc.rect(
            margin,
            tableStartY - 7,
            pageWidth - margin * 2,
            rowHeight,
            "F"
        );

        doc.text("Candidate", colX[0], tableStartY);
        doc.text("Votes", colX[1], tableStartY);
        doc.text("Percentage", colX[2], tableStartY);

        let y = tableStartY + rowHeight;
        doc.setFont("helvetica", "normal");

        chartResults.forEach((candidate) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            const percentage = totalVotes > 0
                ? ((candidate.votes / totalVotes) * 100).toFixed(2)
                : "0.00";

            doc.text(
                doc.splitTextToSize(
                    safeText(candidate.candidateName),
                    80
                )[0] || "",
                colX[0],
                y
            );
            doc.text(String(candidate.votes), colX[1], y);
            doc.text(`${percentage}%`, colX[2], y);
            y += rowHeight;
        });

        if (chartResults.length === 0) {
            doc.text("No candidates have been added.", margin, y);
        } else if (totalVotes === 0) {
            doc.text("No votes have been recorded.", margin, y);
        }

        const safeTitle = safeText(election.title)
            .replace(/[^a-z0-9]/gi, "-")
            .toLowerCase();

        doc.save(`election-results-${safeTitle}.pdf`);
        setMessage("PDF report downloaded.");
    };

    return (
        <div className="admin-results">
            <div className="results-heading">
                <div>
                    <h2>Results & Reports</h2>
                    <p>Review election performance and export reports.</p>
                </div>

                <button
                    type="button"
                    className="results-secondary-button"
                    onClick={() => fetchResults(selectedElectionId)}
                    disabled={!selectedElectionId || loadingResults}
                >
                    {loadingResults ? "Refreshing..." : "Refresh Results"}
                </button>
            </div>

            {message && (
                <p className="results-message" role="status">{message}</p>
            )}

            {error && (
                <p className="results-error" role="alert">{error}</p>
            )}

            <section className="results-panel">
                <label htmlFor="results-election">Select Election</label>

                {loadingElections ? (
                    <p>Loading elections...</p>
                ) : elections.length === 0 ? (
                    <p>No elections found. Create an election first.</p>
                ) : (
                    <select
                        id="results-election"
                        value={selectedElectionId}
                        onChange={handleElectionChange}
                    >
                        <option value="">Choose an election</option>
                        {elections.map((item) => (
                            <option key={item._id} value={item._id}>
                                {item.title} — {item.status}
                            </option>
                        ))}
                    </select>
                )}
            </section>

            {loadingResults && (
                <p role="status">Loading election results...</p>
            )}

            {!loadingResults && election && (
                <>
                    <section className="results-stats">
                        <article className="results-stat-card">
                            <span>Total Votes</span>
                            <strong>{totalVotes}</strong>
                        </article>

                        <article className="results-stat-card">
                            <span>Candidates</span>
                            <strong>{candidates.length}</strong>
                        </article>

                        <article className="results-stat-card">
                            <span>Election Status</span>
                            <strong className="results-status">
                                {election.status}
                            </strong>
                        </article>

                        <article className="results-stat-card">
                            <span>Leading Candidate</span>
                            <strong className="results-leader">
                                {leadingCandidate
                                    ? leadingCandidate.candidateName
                                    : "No votes yet"}
                            </strong>
                            {leadingCandidate && (
                                <small>
                                    {leadingCandidate.votes} vote
                                    {leadingCandidate.votes === 1 ? "" : "s"}
                                </small>
                            )}
                        </article>
                    </section>

                    <section className="results-panel">
                        <h3>{election.title}</h3>
                        <p className="results-muted">
                            Candidate-wise vote distribution
                        </p>

                        {chartResults.length === 0 ? (
                            <p>No candidates have been added to this election.</p>
                        ) : (
                            <div className="results-candidate-list">
                                {chartResults.map((candidate) => {
                                    const percentage = totalVotes > 0
                                        ? (candidate.votes / totalVotes) * 100
                                        : 0;

                                    return (
                                        <article
                                            className="results-candidate"
                                            key={candidate.candidateId}
                                        >
                                            <div className="results-candidate-info">
                                                <strong>{candidate.candidateName}</strong>
                                                <span>
                                                    {candidate.votes} vote
                                                    {candidate.votes === 1 ? "" : "s"}
                                                    {" · "}
                                                    {percentage.toFixed(1)}%
                                                </span>
                                            </div>

                                            <div
                                                className="results-progress-track"
                                                role="progressbar"
                                                aria-label={`${candidate.candidateName} vote share`}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                                aria-valuenow={Number(percentage.toFixed(1))}
                                            >
                                                <div
                                                    className={`results-progress-fill ${
                                                        candidate.votes > 0 &&
                                                        leadingCandidate?.candidateId === candidate.candidateId
                                                            ? "results-progress-leader"
                                                            : ""
                                                    }`}
                                                    style={{
                                                        width: `${Math.min(100, percentage)}%`,
                                                    }}
                                                />
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        <div className="results-export-actions">
                            <button
                                type="button"
                                onClick={exportResultsToCSV}
                                disabled={!election}
                            >
                                Export CSV
                            </button>

                            <button
                                type="button"
                                onClick={exportResultsToPDF}
                                disabled={!election}
                            >
                                Download PDF
                            </button>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

export default AdminResults;
