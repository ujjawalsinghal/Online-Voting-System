

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearAdminSession } from "../services/authStorage";
import "./AdminLayout.css";


const navigation = [
    { label: "Overview", path: "/admin/dashboard", end: true },
    { label: "Elections", path: "/admin/elections" },
    { label: "Candidates", path: "/admin/candidates" },
    { label: "Eligible Voters", path: "/admin/voters" },
    { label: "Schedule", path: "/admin/schedule" },
    { label: "Results & Reports", path: "/admin/results" },
];

function AdminLayout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        clearAdminSession();
        navigate("/admin/login");
    };

    return (
        <div className="admin-layout">
            <aside className="admin-layout-sidebar">
                <div className="admin-layout-brand">
                    <div className="admin-layout-logo">V</div>
                    <div>
                        <strong>VoteSphere</strong>
                        <span>Election Management</span>
                    </div>
                </div>

                <p className="admin-layout-label">WORKSPACE</p>

                <nav className="admin-layout-nav" aria-label="Admin navigation">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `admin-layout-link${isActive ? " active" : ""}`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="admin-layout-footer">
                    <span className="admin-layout-status-dot" />
                    Admin Workspace
                    <button
                        type="button"
                        className="admin-layout-logout"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </aside>


            <div className="admin-layout-main">
                <header className="admin-layout-header">
                    <div>
                        <span className="admin-layout-eyebrow">
                            ELECTION CONTROL CENTER
                        </span>
                        <h1>VoteSphere Admin</h1>
                    </div>
                    <span className="admin-layout-badge">
                        <span className="admin-layout-status-dot" />
                        Management Portal
                    </span>
                </header>

                <main className="admin-layout-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
