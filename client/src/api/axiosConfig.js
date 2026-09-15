import axios from "axios"

export const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "https://proyecto-ipvu.onrender.com/api",
    headers: {
        "Content-Type": "application/json"
    }
})

// INTERCEPTOR: Se ejecuta antes de que CUALQUIER petición viaje al backend
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});