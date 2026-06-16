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

const getInitialUser = (): UserProfile | null => {
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getInitialUser(),
  accessToken: localStorage.getItem("access_token"),
  isAuthenticated: !!localStorage.getItem("access_token"),
  isLoading: !!localStorage.getItem("access_token") && !localStorage.getItem("user"),

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post<{ tokens: { accessToken: string }; user: UserProfile }>("auth/login", { email, password });
      
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
    const storedUserStr = localStorage.getItem("user");
    
    if (!token) {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      return;
    }

    let parsedUser = null;
    if (storedUserStr) {
      try {
        parsedUser = JSON.parse(storedUserStr);
      } catch {
        // ignore JSON parse error
      }
    }

    const currentUser = get().user || parsedUser;

    // Prefill state and immediately unblock UI if user details are present
    if (token && currentUser) {
      set({
        user: currentUser,
        accessToken: token,
        isAuthenticated: true,
        isLoading: false,
      });
    }

    try {
      const profile = await apiClient.get<UserProfile>("auth/me");
      localStorage.setItem("user", JSON.stringify(profile));
      set({
        user: profile,
        accessToken: token,
        isAuthenticated: true,
        isLoading: false,
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
