import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Injecte le token JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh automatique si 401
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post("/api/v1/auth/refresh", {
            refresh_token: refreshToken,
          });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
};

// ── Properties ────────────────────────────────────────────────────────────────
export const propertiesApi = {
  list: (params) => api.get("/properties", { params }),
  get: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post("/properties", data),
  update: (id, data) => api.patch(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),

  // Photos
  uploadPhoto: (id, file, caption) => {
    const form = new FormData();
    form.append("file", file);
    if (caption) form.append("caption", caption);
    return api.post(`/properties/${id}/photos`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  setCover: (propertyId, photoId) =>
    api.patch(`/properties/${propertyId}/photos/${photoId}/cover`),
  deletePhoto: (propertyId, photoId) =>
    api.delete(`/properties/${propertyId}/photos/${photoId}`),

  // Rooms
  listRooms: (id) => api.get(`/properties/${id}/rooms`),
  addRoom: (id, data) => api.post(`/properties/${id}/rooms`, data),
  updateRoom: (propertyId, roomId, data) =>
    api.patch(`/properties/${propertyId}/rooms/${roomId}`, data),
  deleteRoom: (propertyId, roomId) =>
    api.delete(`/properties/${propertyId}/rooms/${roomId}`),
};

// ── Contracts ─────────────────────────────────────────────────────────────────
export const contractsApi = {
  list:     (params) => api.get("/contracts", { params }),
  get:      (id)     => api.get(`/contracts/${id}`),
  create:   (data)   => api.post("/contracts", data),
  update:   (id, data) => api.patch(`/contracts/${id}`, data),
  resilier: (id)     => api.post(`/contracts/${id}/resilier`),
  delete:   (id)     => api.delete(`/contracts/${id}`),
};
