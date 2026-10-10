import { Navigate } from "react-router-dom";
import { getAdminUser } from "../services/authStorage";

/**
 * AdminRoute — frontend route guard for all /admin/* pages.
 *
 * Reads the JWT user object that AdminLogin stores in localStorage under "adminUser" after
 * confirming role === "admin" from the server response. If the entry is
 * missing or the role is not "admin", the user is redirected to the admin
 * login page.
 *
 * IMPORTANT: this guard is a UX convenience only. Every /api/admin/* route
 * on the backend is independently protected by the `protect` + `adminOnly`
 * middleware chain (authMiddleware.js), so a voter token bypassing this
 * component would still receive HTTP 403 from the API.
 */
function AdminRoute({ children }) {
    const user = getAdminUser();

    if (!user || user.role !== "admin") {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
}

export default AdminRoute;
