import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAccessToken: (token) => set({ accessToken: token }),

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/login", credentials);

          if (data.requiresTwoFactor) {
            return { success: true, requiresTwoFactor: true, tempToken: data.tempToken };
          }

          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
          });
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || "Login failed",
            locked: error.response?.data?.locked || false,
          };
        }
      },

      loginWith2FA: async (tempToken, code) => {
        try {
          const { data } = await api.post("/auth/login/2fa", { tempToken, code });
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
          });
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || "Invalid code",
          };
        }
      },

      register: async (userData) => {
        try {
          const { data } = await api.post("/auth/register", userData);
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
          });
          return { success: true };
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || "Registration failed",
            feedback: error.response?.data?.feedback,
          };
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout", { refreshToken: get().refreshToken });
        } catch (_) {}
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData) => set({ user: { ...get().user, ...userData } }),

      setFromOAuth: (accessToken, refreshToken, user) => {
        set({ accessToken, refreshToken, user, isAuthenticated: true });
      },
    }),
    {
      name: "authkit_session",
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
