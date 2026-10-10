
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminOverview from "./pages/AdminOverview";
import AdminLayout from "./pages/AdminLayout";
import AdminElections from "./pages/AdminElections";
import AdminCandidates from "./pages/AdminCandidates";
import AdminVoters from "./pages/AdminVoters";
import AdminSchedule from "./pages/AdminSchedule";
import AdminResults from "./pages/AdminResults";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Existing user routes */}
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Admin login remains separate */}
                <Route path="/admin" element={<AdminLogin />} />

                {/* Shared admin layout and nested pages */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route
                        path="dashboard"
                        element={<AdminOverview />}
                    />
                    <Route
                        path="elections"
                        element={<AdminElections />}
                    />
                    <Route
                        path="candidates"
                        element={<AdminCandidates />}
                    />
                    <Route
                        path="voters"
                        element={<AdminVoters />}
                    />
                    <Route
                        path="schedule"
                        element={<AdminSchedule />}
                    />
                    <Route
                        path="results"
                        element={<AdminResults />}
                    />
                    <Route
                        index
                        element={<Navigate to="/admin/dashboard" replace />}
                    />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
