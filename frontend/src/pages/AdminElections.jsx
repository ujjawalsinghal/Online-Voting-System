
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

import "./AdminElections.css";

function AdminElections() {
    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const [editingId, setEditingId] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    });

    const fetchElections = useCallback(async () => {
        try {
            setError("");

            const response = await api.get("/admin/elections", {
                headers: getAuthHeaders(),
            });

            setElections(response.data.elections || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load elections."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchElections();
        }, 0);

        return () => clearTimeout(timeoutId);
    }, [fetchElections]);

    const handleCreateElection = async (event) => {
        event.preventDefault();
        setMessage("");
        setError("");

        if (!title.trim() || !startTime || !endTime) {
            setError("Title, start time, and end time are required.");
            return;
        }

        if (new Date(endTime) <= new Date(startTime)) {
            setError("End time must be after start time.");
            return;
        }

        try {
            setSaving(true);

            await api.post(
                "/admin/elections",
                {
                    title: title.trim(),
                    description: description.trim(),
                    startTime,
                    endTime,
                },
                { headers: getAuthHeaders() }
            );

            setMessage("Election created successfully.");
            setTitle("");
            setDescription("");
            setStartTime("");
            setEndTime("");

            await fetchElections();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to create election."
            );
        } finally {
            setSaving(false);
        }
    };

    const startEditing = (election) => {
        if (election.status !== "upcoming") {
            setError("Only upcoming elections can be edited.");
            setMessage("");
            return;
        }

        setEditingId(election._id);
        setEditTitle(election.title || "");
        setEditDescription(election.description || "");
        setMessage("");
        setError("");
    };

    const cancelEditing = () => {
        setEditingId("");
        setEditTitle("");
        setEditDescription("");
    };

    const handleSaveEdit = async (event) => {
        event.preventDefault();

        if (!editTitle.trim()) {
            setError("Election title is required.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setMessage("");

            const response = await api.put(
                `/admin/elections/${editingId}/details`,
                {
                    title: editTitle.trim(),
                    description: editDescription.trim(),
                },
                { headers: getAuthHeaders() }
            );

            setMessage(
                response.data.message ||
                "Election details updated successfully."
            );

            cancelEditing();
            await fetchElections();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to update election."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteElection = async (election) => {
        const confirmed = window.confirm(
            `Delete "${election.title}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            setError("");
            setMessage("");

            const response = await api.delete(
                `/admin/elections/${election._id}`,
                { headers: getAuthHeaders() }
            );

            setMessage(
                response.data.message ||
                "Election deleted successfully."
            );

            if (editingId === election._id) {
                cancelEditing();
            }

            await fetchElections();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to delete election."
            );
        }
    };

    return (
        <div className="admin-elections">
            <div className="elections-heading">
                <div>
                    <h2>Elections</h2>
                    <p>Create and manage your college elections.</p>
                </div>

                <button
                    type="button"
                    className="elections-secondary-button"
                    onClick={fetchElections}
                    disabled={loading}
                >
                    Refresh
                </button>
            </div>

            {message && (
                <p className="elections-message" role="status">
                    {message}
                </p>
            )}

            {error && (
                <p className="elections-error" role="alert">
                    {error}
                </p>
            )}

            <section className="elections-form-panel">
                <h3>Create New Election</h3>

                <form onSubmit={handleCreateElection}>
                    <div className="elections-form-grid">
                        <label>
                            Election Title
                            <input
                                type="text"
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.target.value)
                                }
                                placeholder="e.g. College Council Election 2026"
                                maxLength={150}
                                required
                            />
                        </label>

                        <label className="elections-full-width">
                            Description
                            <textarea
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                                placeholder="Describe the purpose of this election"
                                rows={3}
                                maxLength={2000}
                            />
                        </label>

                        <label>
                            Start Time
                            <input
                                type="datetime-local"
                                value={startTime}
                                onChange={(event) =>
                                    setStartTime(event.target.value)
                                }
                                required
                            />
                        </label>

                        <label>
                            End Time
                            <input
                                type="datetime-local"
                                value={endTime}
                                onChange={(event) =>
                                    setEndTime(event.target.value)
                                }
                                min={startTime || undefined}
                                required
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="elections-primary-button"
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Create Election"}
                    </button>
                </form>
            </section>

            <section className="elections-list-section">
                <div className="elections-list-heading">
                    <h3>All Elections</h3>
                    <span>{elections.length} total</span>
                </div>

                {loading ? (
                    <p role="status">Loading elections...</p>
                ) : elections.length === 0 ? (
                    <div className="elections-empty">
                        <h4>No elections yet</h4>
                        <p>Create your first election using the form above.</p>
                    </div>
                ) : (
                    <div className="elections-card-grid">
                        {elections.map((election) => (
                            <article
                                className="election-card"
                                key={election._id}
                            >
                                <div className="election-card-top">
                                    <span
                                        className={`election-status status-${election.status}`}
                                    >
                                        {election.status}
                                    </span>
                                </div>

                                {editingId === election._id ? (
                                    <form
                                        onSubmit={handleSaveEdit}
                                        className="election-edit-form"
                                    >
                                        <label>
                                            Election Title
                                            <input
                                                value={editTitle}
                                                onChange={(event) =>
                                                    setEditTitle(event.target.value)
                                                }
                                                maxLength={150}
                                                required
                                            />
                                        </label>

                                        <label>
                                            Description
                                            <textarea
                                                value={editDescription}
                                                onChange={(event) =>
                                                    setEditDescription(event.target.value)
                                                }
                                                rows={3}
                                                maxLength={2000}
                                            />
                                        </label>

                                        <div className="election-card-actions">
                                            <button
                                                type="submit"
                                                className="elections-primary-button"
                                                disabled={saving}
                                            >
                                                {saving ? "Saving..." : "Save"}
                                            </button>

                                            <button
                                                type="button"
                                                className="elections-secondary-button"
                                                onClick={cancelEditing}
                                                disabled={saving}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <h4>{election.title}</h4>

                                        <p className="election-description">
                                            {election.description ||
                                                "No description provided."}
                                        </p>

                                        <div className="election-dates">
                                            <p>
                                                <span>Starts</span>
                                                {election.startTime
                                                    ? new Date(election.startTime).toLocaleString()
                                                    : "Not set"}
                                            </p>
                                            <p>
                                                <span>Ends</span>
                                                {election.endTime
                                                    ? new Date(election.endTime).toLocaleString()
                                                    : "Not set"}
                                            </p>
                                        </div>

                                        <div className="election-card-actions">
                                            <button
                                                type="button"
                                                className="elections-secondary-button"
                                                onClick={() => startEditing(election)}
                                                disabled={
                                                    saving ||
                                                    election.status !== "upcoming"
                                                }
                                                title={
                                                    election.status !== "upcoming"
                                                        ? "Only upcoming elections can be edited"
                                                        : "Edit election details"
                                                }
                                            >
                                                Edit Details
                                            </button>

                                            <button
                                                type="button"
                                                className="elections-danger-button"
                                                onClick={() =>
                                                    handleDeleteElection(election)
                                                }
                                                disabled={saving}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default AdminElections;
