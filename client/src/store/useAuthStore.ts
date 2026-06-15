import { create } from "zustand";
import { apiClient } from "@/lib/api";

interface UserProfile {
  id: string;
  employeeId: string;
  email: string;
  personalEmail?: string | null;
  fullNameEnglish: string;
  phone?: string;
  gender?: string;
  role: string; // admin | hr | employee
  departmentId?: string;
  designationId?: string;
  employeeType?: string;
  employeePhotoUrl: string | null;
  joinDate?: string;
  status?: string;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  currentAddress?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactNumber?: string | null;
  lineManagerId?: string | null;
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
      const res = await apiClient.post<{ tokens: { accessToken: string; refreshToken?: string }; user: UserProfile }>("auth/login", { email, password });
      
      if (res?.tokens?.accessToken) {
        localStorage.setItem("access_token", res.tokens.accessToken);
        if (res.tokens.refreshToken) {
          localStorage.setItem("refresh_token", res.tokens.refreshToken);
        }
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
    localStorage.removeItem("refresh_token");
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
    } catch (error: unknown) {
      const err = error as { status?: number };
      console.warn("Auth background validation failed:", error);
      // Only logout on explicit 401 Unauthorized errors (e.g. expired tokens).
      // Keep cached session for other errors (network timeouts, offline, server 500s).
      if (err?.status === 401) {
        get().logout();
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
