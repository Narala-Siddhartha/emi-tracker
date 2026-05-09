import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("emi_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — auto logout if token expired
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("emi_token");
      localStorage.removeItem("emi_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post("/auth/register", data),
  login:    (data) => API.post("/auth/login", data),
  getMe:    ()     => API.get("/auth/me"),
  updateProfile:  (data) => API.put("/auth/me", data),
  changePassword: (data) => API.put("/auth/change-password", data),
};

// ─── EMIs ──────────────────────────────────────────────────────────────────────
export const emiAPI = {
  getAll:    (params) => API.get("/emis", { params }),
  getById:   (id)     => API.get(`/emis/${id}`),
  create:    (data)   => API.post("/emis", data),
  update:    (id, data) => API.put(`/emis/${id}`, data),
  delete:    (id)     => API.delete(`/emis/${id}`),
  markPaid:  (id)     => API.patch(`/emis/${id}/pay`),
  getSummary: ()      => API.get("/emis/summary"),
  getUpcoming: (days) => API.get("/emis/upcoming", { params: { days } }),
};

export default API;
