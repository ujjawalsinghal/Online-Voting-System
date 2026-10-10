import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { setAdminSession, clearAdminSession } from "../services/authStorage";

const AdminLogin = () => {
    const [studentId, setStudentId] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        setMessage("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", {
                studentId,
                password
            });

            const { token, user } = response.data;

            // Make sure this account is actually an admin.
            // If not, discard the received token entirely — do not persist
            // a non-admin session in localStorage under any key.
            if (user.role !== "admin") {
                clearAdminSession();
                setMessage("Access denied. Admin account required.");
                return;
            }

            setAdminSession(token, user);

            navigate("/admin/dashboard");

        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Admin login failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Online Voting System</h1>

            <h2>Admin Login</h2>

            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="Admin ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Admin Login"}
                </button>
            </form>

            {message && <p>{message}</p>}
        </div>
    );
};

export default AdminLogin;