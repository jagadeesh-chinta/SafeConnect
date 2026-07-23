import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === "development" ? "http://localhost:3000" : "");

export const axiosInstance = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true,
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Prevent raw "Unauthorized, no token provided" toasts from annoying unauthenticated users
        if (error.response?.status === 401 && error.response?.data?.message?.toLowerCase().includes("unauthorized")) {
            // Keep error structure intact for catch blocks while sanitizing message if needed
            error.isUnauthorized = true;
        }
        return Promise.reject(error);
    }
);