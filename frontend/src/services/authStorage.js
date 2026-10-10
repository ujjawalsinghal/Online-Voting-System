/**
 * Centralized session storage helpers for Admin and Voter sessions.
 *
 * Separates session keys into "adminToken"/"adminUser" and "voterToken"/"voterUser"
 * so that admin and voter sessions on the same client do not overwrite each other.
 */

export const ADMIN_TOKEN_KEY = "adminToken";
export const ADMIN_USER_KEY = "adminUser";

export const VOTER_TOKEN_KEY = "voterToken";
export const VOTER_USER_KEY = "voterUser";

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);

export const getAdminUser = () => {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

export const setAdminSession = (token, user) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
};

export const clearAdminSession = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
};

export const getVoterToken = () => localStorage.getItem(VOTER_TOKEN_KEY);

export const getVoterUser = () => {
    const raw = localStorage.getItem(VOTER_USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

export const setVoterSession = (token, user) => {
    localStorage.setItem(VOTER_TOKEN_KEY, token);
    localStorage.setItem(VOTER_USER_KEY, JSON.stringify(user));
};

export const clearVoterSession = () => {
    localStorage.removeItem(VOTER_TOKEN_KEY);
    localStorage.removeItem(VOTER_USER_KEY);
};

