
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import "./AdminSchedule.css";

function toLocalDateTime(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const pad = (number) => String(number).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function AdminSchedule() {
    const [elections, setElections] = useState([]);
    const [selectedElectionId, setSelectedElectionId] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const selectedElection = elections.find(
        (item) => item._id === selectedElectionId
    );

    const authConfig = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });

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

                return items.find((item) => item.status === "upcoming")?._id
                    || items.find((item) => item.status === "active")?._id
                    || items[0]?._id
                    || "";
            });
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

    const handleUpdateSchedule = async (event, startTime, endTime) => {
        event.preventDefault();
        setMessage("");
        setError("");

        if (!selectedElectionId) {
            setError("Please select an election.");
            return;
        }

        if (!startTime || !endTime) {
            setError("Both start and end times are required.");
            return;
        }

        if (new Date(endTime) <= new Date(startTime)) {
            setError("End time must be after start time.");
            return;
        }

        try {
            setSaving(true);

            // This endpoint and payload must match the existing backend.

            const response = await api.put(
                `/admin/elections/${selectedElectionId}/schedule`,
                {
                    startTime: new Date(startTime).toISOString(),
                    endTime: new Date(endTime).toISOString(),
                },
                authConfig()
            );

            setMessage(
                response.data.message ||
                "Election schedule updated successfully."
            );
            await fetchElections();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to update the election schedule."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-schedule">
            <div className="schedule-heading">
                <div>
                    <h2>Election Schedule</h2>
                    <p>Manage when elections open and close.</p>
                </div>

                <button
                    type="button"
                    className="schedule-secondary-button"
                    onClick={fetchElections}
                    disabled={loading}
                >
                    Refresh
                </button>
            </div>

            {message && (
                <p className="schedule-message" role="status">
                    {message}
                </p>
            )}

            {error && (
                <p className="schedule-error" role="alert">
                    {error}
                </p>
            )}

            <section className="schedule-panel">
                <h3>Select Election</h3>

                {loading ? (
                    <p role="status">Loading elections...</p>
                ) : elections.length === 0 ? (
                    <p>Create an election before configuring its schedule.</p>
                ) : (
                    <>
                        <label htmlFor="schedule-election">
                            Election
                        </label>

                        <select
                            id="schedule-election"
                            value={selectedElectionId}
                                        onChange={(event) => {
                                            setSelectedElectionId(event.target.value);
                                            setMessage("");
                                        }}
                        >
                            {elections.map((item) => (
                                <option key={item._id} value={item._id}>
                                    {item.title} — {item.status}
                                </option>
                            ))}
                        </select>

                        {selectedElection && (
                            <div className="schedule-current">
                                <span
                                    className={`schedule-status status-${selectedElection.status}`}
                                >
                                    {selectedElection.status}
                                </span>
                                <p>{selectedElection.title}</p>
                                <p>
                                    Current start:{" "}
                                    {selectedElection.startTime
                                        ? new Date(
                                            selectedElection.startTime
                                        ).toLocaleString()
                                        : "Not set"}
                                </p>
                                <p>
                                    Current end:{" "}
                                    {selectedElection.endTime
                                        ? new Date(
                                            selectedElection.endTime
                                        ).toLocaleString()
                                        : "Not set"}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </section>

            <ScheduleForm
                key={selectedElectionId}
                onSubmit={handleUpdateSchedule}
                loading={loading}
                saving={saving}
                hasElection={Boolean(selectedElectionId) && elections.length > 0}
                election={selectedElection}
            />
        </div>
    );
}

function ScheduleForm({ election, onSubmit, loading, saving, hasElection }) {
    const [startTime, setStartTime] = useState(
        election?.startTime ? toLocalDateTime(election.startTime) : ""
    );
    const [endTime, setEndTime] = useState(
        election?.endTime ? toLocalDateTime(election.endTime) : ""
    );

    return (
        <section className="schedule-panel">
            <h3>Update Election Schedule</h3>
            <p className="schedule-muted">
                Select an election above, adjust its dates, and save.
                The server remains responsible for enforcing scheduling rules.
            </p>

            <form onSubmit={(event) => onSubmit(event, startTime, endTime)}>
                <div className="schedule-form-grid">
                    <label htmlFor="schedule-start">
                        Start Time
                        <input
                            id="schedule-start"
                            type="datetime-local"
                            value={startTime}
                            onChange={(event) => setStartTime(event.target.value)}
                            required
                        />
                    </label>

                    <label htmlFor="schedule-end">
                        End Time
                        <input
                            id="schedule-end"
                            type="datetime-local"
                            value={endTime}
                            min={startTime || undefined}
                            onChange={(event) => setEndTime(event.target.value)}
                            required
                        />
                    </label>
                </div>

                <button
                    type="submit"
                    className="schedule-primary-button"
                    disabled={saving || loading || !hasElection}
                >
                    {saving ? "Updating..." : "Update Schedule"}
                </button>
            </form>
        </section>
    );
}

export default AdminSchedule;
