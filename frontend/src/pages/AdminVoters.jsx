
import { useState } from "react";
import api from "../services/api";
import "./AdminVoters.css";

function AdminVoters() {
    const [eligibleName, setEligibleName] = useState("");
    const [eligibleStudentId, setEligibleStudentId] = useState("");
    const [adding, setAdding] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleAddEligibleVoter = async (event) => {
        event.preventDefault();
        setMessage("");
        setError("");

        const name = eligibleName.trim();
        const studentId = eligibleStudentId.trim().toUpperCase();

        if (!name || !studentId) {
            setError("Student name and student ID are required.");
            return;
        }

        try {
            setAdding(true);

            const token = localStorage.getItem("token");

            const response = await api.post(
                "/admin/eligible-voters",
                { name, studentId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setMessage(
                response.data.message || "Eligible voter added successfully."
            );
            setEligibleName("");
            setEligibleStudentId("");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to add eligible voter."
            );
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="admin-voters">
            <div className="voters-heading">
                <h2>Eligible Voters</h2>
                <p>
                    Add students to the approved-voter registry so they can
                    create their voter accounts.
                </p>
            </div>

            {message && (
                <p className="voters-message" role="status">
                    {message}
                </p>
            )}

            {error && (
                <p className="voters-error" role="alert">
                    {error}
                </p>
            )}

            <section className="voters-panel">
                <div className="voters-panel-heading">
                    <div className="voters-icon" aria-hidden="true">
                        <span>+</span>
                    </div>
                    <div>
                        <h3>Register Eligible Voter</h3>
                        <p>Enter the student's official details below.</p>
                    </div>
                </div>

                <form onSubmit={handleAddEligibleVoter}>
                    <div className="voters-form-grid">
                        <label htmlFor="eligibleName">
                            Student Name
                            <input
                                id="eligibleName"
                                type="text"
                                value={eligibleName}
                                onChange={(event) =>
                                    setEligibleName(event.target.value)
                                }
                                placeholder="Enter student name"
                                autoComplete="name"
                                maxLength={150}
                                required
                            />
                        </label>

                        <label htmlFor="eligibleStudentId">
                            Student ID
                            <input
                                id="eligibleStudentId"
                                type="text"
                                value={eligibleStudentId}
                                onChange={(event) =>
                                    setEligibleStudentId(event.target.value)
                                }
                                placeholder="Enter student ID"
                                autoComplete="off"
                                maxLength={100}
                                required
                            />
                            <span className="voters-help">
                                Student IDs are converted to uppercase.
                            </span>
                        </label>
                    </div>

                    <div className="voters-form-actions">
                        <button
                            type="submit"
                            className="voters-primary-button"
                            disabled={adding}
                        >
                            {adding ? "Adding Student..." : "Add Eligible Voter"}
                        </button>
                    </div>
                </form>
            </section>

            <section className="voters-info-panel">
                <h3>How eligibility works</h3>
                <p>
                    Registering a student adds them to the approved-voter
                    registry. It does not cast a vote or create the student's
                    account automatically.
                </p>
            </section>
        </div>
    );
}

export default AdminVoters;
