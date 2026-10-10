
import { useEffect, useState } from "react";
import api from "../services/api";
import { getAdminToken } from "../services/authStorage";

function AdminOverview() {
    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const fetchElections = async () => {
            try {
                const token = getAdminToken();

                const response = await api.get("/admin/elections", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!cancelled) {
                    setElections(response.data.elections || []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        "Failed to load election statistics."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchElections();

        return () => {
            cancelled = true;
        };
    }, []);

    const stats = [
        {
            label: "Total Elections",
            count: elections.length,
            className: "overview-blue",
        },
        {
            label: "Active Elections",
            count: elections.filter((e) => e.status === "active").length,
            className: "overview-green",
        },
        {
            label: "Upcoming Elections",
            count: elections.filter((e) => e.status === "upcoming").length,
            className: "overview-orange",
        },
        {
            label: "Completed Elections",
            count: elections.filter((e) => e.status === "completed").length,
            className: "overview-gray",
        },
    ];

    return (
        <div className="admin-overview">
            <div className="overview-heading">
                <div>
                    <h2>Overview</h2>
                    <p>Monitor elections and their current status.</p>
                </div>

                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    disabled={loading}
                >
                    Refresh
                </button>
            </div>

            {error && <p role="alert" className="overview-error">{error}</p>}

            {loading ? (
                <p role="status">Loading election statistics...</p>
            ) : (
                <>
                    <div className="overview-stats">
                        {stats.map((stat) => (
                            <article
                                className={`overview-stat ${stat.className}`}
                                key={stat.label}
                            >
                                <p>{stat.label}</p>
                                <strong>{stat.count}</strong>
                            </article>
                        ))}
                    </div>

                    <section className="overview-elections">
                        <h2>Recent Elections</h2>

                        {elections.length === 0 ? (
                            <p>No elections have been created yet.</p>
                        ) : (
                            <div className="overview-table-wrap">
                                <table className="overview-table">
                                    <thead>
                                        <tr>
                                            <th>Election</th>
                                            <th>Status</th>
                                            <th>Starts</th>
                                            <th>Ends</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {elections.map((election) => (
                                            <tr key={election._id}>
                                                <td>{election.title}</td>
                                                <td>
                                                    <span
                                                        className={`overview-status status-${election.status}`}
                                                    >
                                                        {election.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {election.startTime
                                                        ? new Date(election.startTime).toLocaleString()
                                                        : "Not set"}
                                                </td>
                                                <td>
                                                    {election.endTime
                                                        ? new Date(election.endTime).toLocaleString()
                                                        : "Not set"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

export default AdminOverview;
