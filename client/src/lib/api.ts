import axios, { AxiosError } from "axios";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// Silent Refresh queue state variables
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach bearer token dynamically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Unwrap payload and trigger advanced enterprise notifications
axiosInstance.interceptors.response.use(
  (response) => {
    const payload = response.data;
    // Unwrap NestJS ResponseInterceptor success wrapper
    if (payload && typeof payload === "object" && "data" in payload) {
      return payload.data;
    }
    return payload;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    const errorData = error.response?.data as any;

    // 1. Auto-retry on 429 Too Many Requests (Rate Limit)
    const isRateLimit = status === 429 || (errorData && typeof errorData.message === "string" && errorData.message.includes("Rate limit exceeded"));

    if (isRateLimit) {
      const retryAfterHeader = error.response?.headers && error.response.headers["retry-after"];
      let delayMs = 2000;

      if (retryAfterHeader) {
        const parsed = parseInt(retryAfterHeader, 10);
        if (!isNaN(parsed)) {
          delayMs = parsed * 1000;
        }
      } else if (errorData && typeof errorData.message === "string") {
        const match = errorData.message.match(/retry in (\d+) seconds/i);
        if (match && match[1]) {
          delayMs = parseInt(match[1], 10) * 1000;
        }
      }

      toast.warning("Server Busy", {
        description: `Too many requests. Retrying your request automatically in ${Math.ceil(delayMs / 1000)}s...`,
        duration: delayMs,
      });

      // Wait out the rate limit window
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      // Re-issue the exact same config request
      if (error.config) {
        return axiosInstance(error.config);
      }
    }

    // 2. Handle 401 Session Expiration and Refresh Token
    if (status === 401 && error.config && !(error.config as any)._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            error.config!.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(error.config!);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      (error.config as any)._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        isRefreshing = true;

        try {
          // Call NestJS auth/refresh directly using raw axios to bypass global interceptors
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const payload = response.data;
          const tokens = payload && typeof payload === "object" && "data" in payload ? payload.data.tokens : payload.tokens;

          if (tokens?.accessToken) {
            localStorage.setItem("access_token", tokens.accessToken);
            if (tokens.refreshToken) {
              localStorage.setItem("refresh_token", tokens.refreshToken);
            }

            // Sync Zustand store
            import("@/store/useAuthStore").then((mod) => {
              mod.useAuthStore.setState({ accessToken: tokens.accessToken, isAuthenticated: true });
            });

            processQueue(null, tokens.accessToken);
            isRefreshing = false;

            error.config.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return axiosInstance(error.config);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;

          // Clear credentials and logout user on refresh failure
          const authStoreModule = await import("@/store/useAuthStore");
          authStoreModule.useAuthStore.getState().logout();
          toast.error("Session Expired", {
            description: "Your session has expired. Please sign in again.",
            duration: 4000,
          });
          return Promise.reject(error);
        }
      } else {
        const authStoreModule = await import("@/store/useAuthStore");
        authStoreModule.useAuthStore.getState().logout();
        toast.error("Session Expired", {
          description: "Your session has expired. Please sign in again.",
          duration: 4000,
        });
        return Promise.reject(error);
      }
    }

    // 3. Standardize error message extraction
    let errorMessage = "An unexpected error occurred. Please try again.";
    let errorDescription = "";

    if (errorData) {
      if (errorData.error && typeof errorData.error.message === "string") {
        errorMessage = errorData.error.message;
        if (Array.isArray(errorData.error.errors)) {
          errorDescription = errorData.error.errors.join(", ");
        }
      } else if (typeof errorData.message === "string") {
        errorMessage = errorData.message;
      } else if (Array.isArray(errorData.message)) {
        errorMessage = "Validation Error";
        errorDescription = errorData.message.join(", ");
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Trigger visual toast
    toast.error(errorMessage, {
      description: errorDescription || undefined,
      duration: 5000,
    });

    return Promise.reject(error);
  }
);

// Standardized client wrapper
export const apiClient = {
  get: <T>(endpoint: string, options?: any) =>
    axiosInstance.get<any, T>(endpoint.replace(/^\//, ""), options),

  post: <T>(endpoint: string, body?: any, options?: any) =>
    axiosInstance.post<any, T>(endpoint.replace(/^\//, ""), body, options),

  patch: <T>(endpoint: string, body?: any, options?: any) =>
    axiosInstance.patch<any, T>(endpoint.replace(/^\//, ""), body, options),

  delete: <T>(endpoint: string, options?: any) =>
    axiosInstance.delete<any, T>(endpoint.replace(/^\//, ""), options),
};
