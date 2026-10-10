
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { getAdminToken } from "../services/authStorage";
import "./AdminCandidates.css";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

function AdminCandidates() {
    const [elections, setElections] = useState([]);
    const [selectedElectionId, setSelectedElectionId] = useState("");
    const [candidates, setCandidates] = useState([]);

    const [loadingElections, setLoadingElections] = useState(true);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const [editingId, setEditingId] = useState("");
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editImageUrl, setEditImageUrl] = useState("");
    const [editImageFile, setEditImageFile] = useState(null);
    const [editImagePreview, setEditImagePreview] = useState("");

    const selectedElection =
        elections.find((item) => item._id === selectedElectionId) ||
        elections.find((item) => item.status === "active") ||
        elections[0] ||
        null;

    const currentElectionId = selectedElection?._id || "";
    const canEditCandidates = selectedElection?.status === "upcoming";

    const [prevElectionId, setPrevElectionId] = useState(currentElectionId);

    if (currentElectionId !== prevElectionId) {
        setPrevElectionId(currentElectionId);
        setCandidates([]);
        setLoadingCandidates(Boolean(currentElectionId));
    }

    const authHeaders = () => ({
        Authorization: `Bearer ${getAdminToken()}`,
    });

    const fetchCandidates = useCallback(async (electionId) => {
        if (!electionId) {
            setCandidates([]);
            setLoadingCandidates(false);
            return;
        }

        setLoadingCandidates(true);
        setError("");

        try {
            const response = await api.get(
                `/admin/elections/${electionId}/candidates`,
                { headers: authHeaders() }
            );

            setCandidates(response.data.candidates || []);
        } catch (err) {
            setCandidates([]);
            setError(
                err.response?.data?.message ||
                "Failed to load candidates."
            );
        } finally {
            setLoadingCandidates(false);
        }
    }, []);

    useEffect(() => {
        let isCancelled = false;

        const loadElections = async () => {
            try {
                setError("");

                const response = await api.get("/admin/elections", {
                    headers: authHeaders(),
                });

                if (!isCancelled) {
                    const items = response.data.elections || [];
                    setElections(items);

                    setSelectedElectionId((prevId) => {
                        if (prevId && items.some((item) => item._id === prevId)) {
                            return prevId;
                        }

                        const active = items.find(
                            (item) => item.status === "active"
                        );

                        return active?._id || items[0]?._id || "";
                    });
                }
            } catch (err) {
                if (!isCancelled) {
                    setError(
                        err.response?.data?.message ||
                        "Failed to load elections."
                    );
                }
            } finally {
                if (!isCancelled) {
                    setLoadingElections(false);
                }
            }
        };

        loadElections();

        return () => {
            isCancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!currentElectionId) {
            return;
        }

        let isCancelled = false;

        const loadCandidates = async () => {
            try {
                const response = await api.get(
                    `/admin/elections/${currentElectionId}/candidates`,
                    { headers: authHeaders() }
                );

                if (!isCancelled) {
                    setCandidates(response.data.candidates || []);
                }
            } catch (err) {
                if (!isCancelled) {
                    setCandidates([]);
                    setError(
                        err.response?.data?.message ||
                        "Failed to load candidates."
                    );
                }
            } finally {
                if (!isCancelled) {
                    setLoadingCandidates(false);
                }
            }
        };

        loadCandidates();

        return () => {
            isCancelled = true;
        };
    }, [currentElectionId]);

    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    useEffect(() => {
        return () => {
            if (editImagePreview) URL.revokeObjectURL(editImagePreview);
        };
    }, [editImagePreview]);

    const validateImage = (file) => {
        if (!file) return "";

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return "Only JPEG, PNG, and WebP images are allowed.";
        }

        if (file.size > MAX_IMAGE_SIZE) {
            return "Image must be 2 MB or smaller.";
        }

        return "";
    };

    const handleImageSelection = (file, isEditing = false) => {
        const validationError = validateImage(file);

        if (validationError) {
            setError(validationError);
            return;
        }

        setError("");
        setMessage("");

        if (isEditing) {
            setEditImageFile(file);
            setEditImagePreview(
                file ? URL.createObjectURL(file) : ""
            );
            return;
        }

        setImageFile(file);
        setImagePreview(file ? URL.createObjectURL(file) : "");
    };

    const uploadCandidateImage = async (file) => {
        const formData = new FormData();
        formData.append("image", file);

        const response = await api.post(
            "/admin/upload-candidate-image",
            formData,
            { headers: authHeaders() }
        );

        return response.data.imageUrl;
    };

    const handleAddCandidate = async (event) => {
        event.preventDefault();
        setMessage("");
        setError("");

        if (!currentElectionId) {
            setError("Please select an election.");
            return;
        }

        if (!name.trim()) {
            setError("Candidate name is required.");
            return;
        }

        try {
            setSaving(true);

            const imageUrl = imageFile
                ? await uploadCandidateImage(imageFile)
                : "";

            await api.post(
                "/admin/candidates",
                {
                    name: name.trim(),
                    description: description.trim(),
                    image: imageUrl,
                    electionId: currentElectionId,
                },
                { headers: authHeaders() }
            );

            setMessage("Candidate added successfully.");
            setName("");
            setDescription("");
            setImageFile(null);
            setImagePreview("");

            await fetchCandidates(currentElectionId);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to add candidate."
            );
        } finally {
            setSaving(false);
        }
    };

    const startEditing = (candidate) => {
        if (!canEditCandidates) {
            setError(
                "Candidates can only be edited in upcoming elections."
            );
            return;
        }

        setEditingId(candidate._id);
        setEditName(candidate.name || "");
        setEditDescription(candidate.description || "");
        setEditImageUrl(candidate.image || "");
        setEditImageFile(null);
        setEditImagePreview("");
        setMessage("");
        setError("");
    };

    const cancelEditing = () => {
        setEditingId("");
        setEditName("");
        setEditDescription("");
        setEditImageUrl("");
        setEditImageFile(null);
        setEditImagePreview("");
    };

    const handleUpdateCandidate = async (event) => {
        event.preventDefault();

        if (!editingId || !editName.trim()) {
            setError("Candidate name is required.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setMessage("");

            const imageUrl = editImageFile
                ? await uploadCandidateImage(editImageFile)
                : editImageUrl.trim();

            const response = await api.put(
                `/admin/candidates/${editingId}`,
                {
                    name: editName.trim(),
                    description: editDescription.trim(),
                    image: imageUrl,
                },
                { headers: authHeaders() }
            );

            setMessage(
                response.data.message ||
                "Candidate updated successfully."
            );

            cancelEditing();
            await fetchCandidates(currentElectionId);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to update candidate."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCandidate = async (candidate) => {
        if (!canEditCandidates) {
            setError(
                "Candidates can only be deleted from upcoming elections."
            );
            return;
        }

        const confirmed = window.confirm(
            `Delete candidate "${candidate.name}"? This cannot be undone.`
        );

        if (!confirmed) return;

        try {
            setDeletingId(candidate._id);
            setError("");
            setMessage("");

            const response = await api.delete(
                `/admin/candidates/${candidate._id}`,
                { headers: authHeaders() }
            );

            if (editingId === candidate._id) {
                cancelEditing();
            }

            setMessage(
                response.data.message ||
                "Candidate deleted successfully."
            );

            await fetchCandidates(currentElectionId);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to delete candidate."
            );
        } finally {
            setDeletingId("");
        }
    };

    if (loadingElections) {
        return <p role="status">Loading elections...</p>;
    }

    return (
        <div className="admin-candidates">
            <div className="candidates-heading">
                <div>
                    <h2>Candidates</h2>
                    <p>Add and manage candidates for each election.</p>
                </div>

                <button
                    type="button"
                    className="candidate-secondary-button"
                    onClick={() => fetchCandidates(currentElectionId)}
                    disabled={!currentElectionId || loadingCandidates}
                >
                    {loadingCandidates ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {message && (
                <p className="candidate-message" role="status">
                    {message}
                </p>
            )}

            {error && (
                <p className="candidate-error" role="alert">
                    {error}
                </p>
            )}

            <section className="candidate-panel">
                <label htmlFor="candidate-election">
                    Select Election
                </label>

                <select
                    id="candidate-election"
                    value={currentElectionId}
                    onChange={(event) => {
                        setSelectedElectionId(event.target.value);
                        setLoadingCandidates(true);
                        setEditingId("");
                        setMessage("");
                    }}
                >
                    {elections.length === 0 && (
                        <option value="">No elections available</option>
                    )}

                    {elections.map((item) => (
                        <option key={item._id} value={item._id}>
                            {item.title} — {item.status}
                        </option>
                    ))}
                </select>

                {selectedElection && (
                    <div className="candidate-election-info">
                        <span
                            className={`candidate-status status-${selectedElection.status}`}
                        >
                            {selectedElection.status}
                        </span>
                        <span>
                            {canEditCandidates
                                ? "Candidates can be added, edited, or removed."
                                : "Editing and deletion are disabled outside upcoming elections."}
                        </span>
                    </div>
                )}
            </section>

            <section className="candidate-panel">
                <h3>Add Candidate</h3>

                {!currentElectionId ? (
                    <p>Create an election before adding candidates.</p>
                ) : (
                    <form onSubmit={handleAddCandidate}>
                        <div className="candidate-form-grid">
                            <label>
                                Candidate Name
                                <input
                                    value={name}
                                    onChange={(event) =>
                                        setName(event.target.value)
                                    }
                                    placeholder="Enter candidate name"
                                    maxLength={120}
                                    required
                                />
                            </label>

                            <label className="candidate-full-width">
                                Description
                                <textarea
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(event.target.value)
                                    }
                                    placeholder="Enter candidate description"
                                    rows={3}
                                    maxLength={2000}
                                />
                            </label>

                            <label className="candidate-full-width">
                                Candidate Photo (optional)
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(event) => {
                                        const file =
                                            event.target.files?.[0] || null;

                                        handleImageSelection(file);

                                        if (file && validateImage(file)) {
                                            event.target.value = "";
                                        }
                                    }}
                                />
                                <span className="candidate-help">
                                    JPEG, PNG, or WebP. Maximum 2 MB.
                                </span>
                            </label>
                        </div>

                        {imagePreview && (
                            <img
                                className="candidate-preview"
                                src={imagePreview}
                                alt="Candidate preview"
                            />
                        )}

                        <button
                            type="submit"
                            className="candidate-primary-button"
                            disabled={saving}
                        >
                            {saving ? "Adding..." : "Add Candidate"}
                        </button>
                    </form>
                )}
            </section>

            <section className="candidate-list-section">
                <div className="candidate-list-heading">
                    <h3>Existing Candidates</h3>
                    <span>{candidates.length} candidates</span>
                </div>

                {loadingCandidates ? (
                    <p role="status">Loading candidates...</p>
                ) : !currentElectionId ? (
                    <p>Select an election to view its candidates.</p>
                ) : candidates.length === 0 ? (
                    <div className="candidate-empty">
                        No candidates have been added to this election yet.
                    </div>
                ) : (
                    <div className="candidate-card-grid">
                        {candidates.map((candidate) => (
                            <article
                                className="candidate-card"
                                key={candidate._id}
                            >
                                {candidate.image && (
                                    <img
                                        className="candidate-photo"
                                        src={candidate.image}
                                        alt={candidate.name}
                                        loading="lazy"
                                    />
                                )}

                                {editingId === candidate._id ? (
                                    <form
                                        onSubmit={handleUpdateCandidate}
                                        className="candidate-edit-form"
                                    >
                                        <h4>Edit Candidate</h4>

                                        <label>
                                            Name
                                            <input
                                                value={editName}
                                                onChange={(event) =>
                                                    setEditName(event.target.value)
                                                }
                                                maxLength={120}
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

                                        <label>
                                            Existing Image URL
                                            <input
                                                type="url"
                                                value={editImageUrl}
                                                onChange={(event) => {
                                                    setEditImageUrl(event.target.value);
                                                    setEditImageFile(null);
                                                    setEditImagePreview("");
                                                }}
                                                placeholder="https://example.com/photo.jpg"
                                            />
                                        </label>

                                        <label>
                                            Upload Replacement Photo
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={(event) => {
                                                    const file =
                                                        event.target.files?.[0] || null;

                                                    handleImageSelection(file, true);

                                                    if (file && validateImage(file)) {
                                                        event.target.value = "";
                                                    }
                                                }}
                                            />
                                        </label>

                                        {(editImagePreview || editImageUrl) && (
                                            <img
                                                className="candidate-preview"
                                                src={editImagePreview || editImageUrl}
                                                alt="Replacement preview"
                                            />
                                        )}

                                        <div className="candidate-actions">
                                            <button
                                                type="submit"
                                                className="candidate-primary-button"
                                                disabled={saving}
                                            >
                                                {saving ? "Saving..." : "Save"}
                                            </button>

                                            <button
                                                type="button"
                                                className="candidate-secondary-button"
                                                onClick={cancelEditing}
                                                disabled={saving}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div className="candidate-card-body">
                                            <h4>{candidate.name}</h4>
                                            <p>
                                                {candidate.description ||
                                                    "No description provided."}
                                            </p>
                                        </div>

                                        <div className="candidate-actions">
                                            <button
                                                type="button"
                                                className="candidate-secondary-button"
                                                onClick={() => startEditing(candidate)}
                                                disabled={
                                                    !canEditCandidates ||
                                                    saving ||
                                                    Boolean(deletingId)
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                className="candidate-danger-button"
                                                onClick={() =>
                                                    handleDeleteCandidate(candidate)
                                                }
                                                disabled={
                                                    !canEditCandidates ||
                                                    saving ||
                                                    Boolean(deletingId)
                                                }
                                            >
                                                {deletingId === candidate._id
                                                    ? "Deleting..."
                                                    : "Delete"}
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

export default AdminCandidates;
