import { create } from "zustand";
import { authApi } from "../api/client";

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  init: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return set({ loading: false });
    try {
      const { data } = await authApi.me();
      set({ user: data, loading: false });
    } catch {
      localStorage.clear();
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    const me = await authApi.me();
    set({ user: me.data });
    return me.data;
  },

  logout: () => {
    localStorage.clear();
    set({ user: null });
  },
}));
