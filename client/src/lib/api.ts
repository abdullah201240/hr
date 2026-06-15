const API_BASE_URL = "http://localhost:3000/api";

class HttpError extends Error {
  status: number;
  info: any;

  constructor(message: string, status: number, info?: any) {
    super(message);
    this.status = status;
    this.info = info;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("access_token");
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}/${endpoint.replace(/^\//, "")}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let info: any;
    try {
      info = await response.json();
    } catch {
      info = null;
    }

    if (response.status === 401) {
      import("@/store/useAuthStore").then((mod) => {
        mod.useAuthStore.getState().logout();
      });
    }

    const message = info?.message || `HTTP error! Status: ${response.status}`;
    throw new HttpError(message, response.status, info);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const payload = await response.json();
  // Unwrap NestJS ResponseInterceptor success wrapper
  return (payload && typeof payload === "object" && "data" in payload ? payload.data : payload) as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
