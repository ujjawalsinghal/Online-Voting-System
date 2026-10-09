import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
    const [name, setName] = useState("");
    const [studentId, setStudentId] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage("");

        try {
            setLoading(true);

            const response = await api.post("/auth/register", {
                name: name.trim(),
                studentId: studentId.trim().toUpperCase(),
                password
            });

            setMessage(
                response.data.message || "Registration successful!"
            );

            setTimeout(() => navigate("/"), 1500);
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Online Voting System</h1>
            <h2>Voter Registration</h2>

            <form onSubmit={handleRegister}>
                <div>
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <br />

                <div>
                    <input
                        type="text"
                        placeholder="Student ID"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        required
                    />
                </div>

                <br />

                <div>
                    <input
                        type="password"
                        placeholder="Password (minimum 8 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required
                    />
                </div>

                <br />

                <button type="submit" disabled={loading}>
                    {loading ? "Registering..." : "Register"}
                </button>
            </form>

            {message && (
                <p role="status">{message}</p>
            )}

            <p>
                Already registered? <Link to="/">Login here</Link>
            </p>
        </div>
    );
}

export default Register;