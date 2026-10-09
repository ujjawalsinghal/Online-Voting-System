import { useEffect, useState } from "react";
import api from "../services/api";


const Dashboard = () => {
    const [candidates, setCandidates] = useState([]);
    const [election, setElection] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [message, setMessage] = useState("");


useEffect(() => {
    let isMounted = true;

    const fetchElection = async () => {
        try {
            const token = localStorage.getItem("token");

            const electionResponse = await api.get(
                "/elections/active",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const activeElection =
                electionResponse.data.election;

            if (!isMounted) return;

            // No active election is available
            if (!activeElection) {
                setElection(null);
                setCandidates([]);
                setHasVoted(false);
                setMessage("No election is currently available.");
                return;
            }

            setElection(activeElection);

            const statusResponse = await api.get(
                `/elections/${activeElection.id}/status`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!isMounted) return;

            setHasVoted(statusResponse.data.hasVoted);

            const candidatesResponse = await api.get(
                `/elections/${activeElection.id}/candidates`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!isMounted) return;

            setCandidates(candidatesResponse.data.candidates);
            setMessage("");
        } catch (error) {
            if (!isMounted) return;

            setElection(null);
            setCandidates([]);
            setMessage(
                error.response?.data?.message ||
                "Failed to load election. Retrying shortly."
            );
        } finally {
            if (isMounted) {
                setLoading(false);
            }
        }
    };

    fetchElection();

    const intervalId = setInterval(fetchElection, 30000);

    return () => {
        isMounted = false;
        clearInterval(intervalId);
    };
}, []);


    const handleVote = async (candidateId, candidateName) => {
        const confirmed = window.confirm(
            `Are you sure you want to vote for ${candidateName}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setVoting(true);
            setMessage("");

            const token = localStorage.getItem("token");

            await api.post(
                "/votes",
                {
                    candidateId,
                    electionId: election.id
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Update UI immediately
            setHasVoted(true);

            setMessage(
                "Your vote has been successfully recorded."
            );

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to submit vote"
            );
        } finally {
            setVoting(false);
        }
    };

    if (loading) {
        return <h2>Loading election...</h2>;
    }

    return (
        <div>
            <h1>Voter Dashboard</h1>

            {election && (
                <>
                    <h2>{election.title}</h2>

                    {hasVoted ? (
                        <div>
                            <h3>You have already voted.</h3>

                            <p>
                                Your vote has been successfully recorded.
                            </p>
                        </div>
                    ) : (
                        <>
                            <h3>Select your candidate</h3>

                            {candidates.map((candidate) => (
                                <div key={candidate._id}>
                                    <h3>{candidate.name}</h3>

                                    <p>
                                        {candidate.description}
                                    </p>

                                    <button
                                        onClick={() =>
                                            handleVote(
                                                candidate._id,
                                                candidate.name
                                            )
                                        }
                                        disabled={voting}
                                    >
                                        {voting
                                            ? "Submitting..."
                                            : `Vote for ${candidate.name}`}
                                    </button>
                                </div>
                            ))}
                        </>
                    )}
                </>
            )}

            {message && !hasVoted && <p>{message}</p>}
        </div>
    );
};

export default Dashboard;