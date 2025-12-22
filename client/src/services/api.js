import axios from "axios";

const api = axios.create({
  baseURL: "https://daily-progress-tracker-backend-mydm.onrender.com/api",
  headers: {
    "Content-Type": "application/json"
  }
});

// ✅ Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Login API
export const loginUser = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data; // { token }
};


export default api;
