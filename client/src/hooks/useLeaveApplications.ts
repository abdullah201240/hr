import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  LeaveApplication,
  LeaveBalance,
  CreateLeaveApplicationPayload,
  UpdateLeaveApplicationStatusPayload,
  LeaveApplicationQuery,
  PaginatedResponse,
} from "@/types";

// ─── Job polling helper ───────────────────────────────────────────────────────

interface JobStatusResponse {
  jobId: string;
  state: "queued" | "active" | "completed" | "failed" | "not_found" | "waiting" | "delayed";
  result?: { leaveApplicationId: string };
  error?: string;
  progress?: number;
}

/**
 * Polls the job status endpoint until the job is completed or failed.
 * Max wait: 30 seconds (30 × 1s intervals).
 */
async function waitForLeaveJob(jobId: string): Promise<JobStatusResponse> {
  const MAX_POLLS = 30;
  const INTERVAL_MS = 1000;

  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
    const status = await apiClient.get<JobStatusResponse>(
      `leave-applications/jobs/${jobId}/status`
    );

    if (status.state === "completed") return status;
    if (status.state === "failed") return status;
    if (status.state === "not_found") return status;
  }

  // Timeout — treat as unknown failure
  return {
    jobId,
    state: "failed",
    error: "Processing timed out. Please refresh and check your leave applications.",
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useLeaveApplicationsQuery(query: LeaveApplicationQuery) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.employeeId) params.set("employeeId", query.employeeId);
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortOrder) params.set("sortOrder", query.sortOrder);

  const queryString = params.toString();
  const endpoint = queryString ? `leave-applications?${queryString}` : "leave-applications";

  return useQuery<PaginatedResponse<LeaveApplication>>({
    queryKey: ["leaveApplications", query],
    queryFn: () => apiClient.get<PaginatedResponse<LeaveApplication>>(endpoint),
  });
}

export function useLeaveBalancesQuery(year?: number) {
  const endpoint = year
    ? `leave-applications/balances?year=${year}`
    : "leave-applications/balances";
  return useQuery<LeaveBalance[]>({
    queryKey: ["leaveBalances", "my", year],
    queryFn: () => apiClient.get<LeaveBalance[]>(endpoint),
  });
}

export function useEmployeeLeaveBalancesQuery(employeeId: string, year?: number) {
  const endpoint = year
    ? `leave-applications/balances/${employeeId}?year=${year}`
    : `leave-applications/balances/${employeeId}`;
  return useQuery<LeaveBalance[]>({
    queryKey: ["leaveBalances", employeeId, year],
    queryFn: () => apiClient.get<LeaveBalance[]>(endpoint),
    enabled: !!employeeId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useApplyLeaveMutation() {
  const queryClient = useQueryClient();

  return useMutation<JobStatusResponse, Error, CreateLeaveApplicationPayload>({
    mutationFn: async (payload) => {
      // 1. Enqueue the job — returns { jobId, status, message }
      const enqueued = await apiClient.post<{ jobId: string; status: string; message: string }>(
        "leave-applications",
        payload
      );

      // 2. Poll until done
      const finalStatus = await waitForLeaveJob(enqueued.jobId);

      if (finalStatus.state === "failed") {
        throw new Error(finalStatus.error ?? "Leave application failed. Please try again.");
      }
      if (finalStatus.state === "not_found") {
        throw new Error("Job not found. The server may have restarted. Please try again.");
      }

      return finalStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveApplications"] });
      queryClient.invalidateQueries({ queryKey: ["leaveBalances"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useUpdateLeaveMutation() {
  const queryClient = useQueryClient();

  return useMutation<JobStatusResponse, Error, { id: string; payload: CreateLeaveApplicationPayload }>({
    mutationFn: async ({ id, payload }) => {
      // 1. Enqueue the update job
      const enqueued = await apiClient.patch<{ jobId: string; status: string; message: string }>(
        `leave-applications/${id}`,
        payload
      );

      // 2. Poll until done
      const finalStatus = await waitForLeaveJob(enqueued.jobId);

      if (finalStatus.state === "failed") {
        throw new Error(finalStatus.error ?? "Leave application update failed. Please try again.");
      }
      if (finalStatus.state === "not_found") {
        throw new Error("Job not found. The server may have restarted. Please try again.");
      }

      return finalStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveApplications"] });
      queryClient.invalidateQueries({ queryKey: ["leaveBalances"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useApproveLeaveMutation() {
  const queryClient = useQueryClient();
  return useMutation<LeaveApplication, Error, { id: string; payload: UpdateLeaveApplicationStatusPayload }>({
    mutationFn: ({ id, payload }) =>
      apiClient.patch<LeaveApplication>(`leave-applications/${id}/status`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveApplications"] });
      queryClient.invalidateQueries({ queryKey: ["leaveBalances"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useRejectLeaveMutation() {
  const queryClient = useQueryClient();
  return useMutation<LeaveApplication, Error, { id: string; payload: UpdateLeaveApplicationStatusPayload }>({
    mutationFn: ({ id, payload }) =>
      apiClient.patch<LeaveApplication>(`leave-applications/${id}/status`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveApplications"] });
      queryClient.invalidateQueries({ queryKey: ["leaveBalances"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useCancelLeaveMutation() {
  const queryClient = useQueryClient();
  return useMutation<LeaveApplication, Error, string>({
    mutationFn: (id) => apiClient.post<LeaveApplication>(`leave-applications/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveApplications"] });
      queryClient.invalidateQueries({ queryKey: ["leaveBalances"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}
