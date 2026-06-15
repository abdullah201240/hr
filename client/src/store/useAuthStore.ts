import { create } from "zustand";
import { apiClient } from "@/lib/api";

interface UserProfile {
  id: string;
  email: string;
  role: string; // admin | hr | employee
  fullNameEnglish: string;
  employeePhotoUrl: string | null;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem("access_token"),
  isAuthenticated: !!localStorage.getItem("access_token"),
  isLoading: true,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post<any>("auth/login", { email, password });
      
      if (res?.tokens?.accessToken) {
        localStorage.setItem("access_token", res.tokens.accessToken);
        localStorage.setItem("user", JSON.stringify(res.user));
        
        set({
          accessToken: res.tokens.accessToken,
          user: res.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error("Invalid server response format");
      }
    } catch (error) {
      get().logout();
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  fetchProfile: async () => {
    try {
      const profile = await apiClient.get<UserProfile>("auth/me");
      localStorage.setItem("user", JSON.stringify(profile));
      set({ user: profile, isAuthenticated: true });
    } catch {
      get().logout();
    }
  },

  initialize: async () => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");
    
    if (!token) {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      return;
    }

    // Prefill with stored user if available for fast UI load
    if (storedUser) {
      try {
        set({
          user: JSON.parse(storedUser),
          accessToken: token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        // ignore JSON parse error
      }
    }

    try {
      const profile = await apiClient.get<UserProfile>("auth/me");
      localStorage.setItem("user", JSON.stringify(profile));
      set({
        user: profile,
        accessToken: token,
        isAuthenticated: true,
      });
    } catch (error) {
      get().logout();
    } finally {
      set({ isLoading: false });
    }
  },
}));
