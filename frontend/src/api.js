import axios from "axios";

/* ✅ VITE ENV (NO process.env) */
// prefer explicit env var, fall back to same‑origin relative path
const API_URL = import.meta.env.VITE_API_URL || "/api";
console.log("API base URL:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

