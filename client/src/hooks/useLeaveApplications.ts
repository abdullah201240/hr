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
  const endpoint = year ? `leave-applications/balances?year=${year}` : "leave-applications/balances";
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

export function useApplyLeaveMutation() {
  const queryClient = useQueryClient();
  return useMutation<LeaveApplication, Error, CreateLeaveApplicationPayload>({
    mutationFn: (payload) => apiClient.post<LeaveApplication>("leave-applications", payload),
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
    mutationFn: ({ id, payload }) => apiClient.patch<LeaveApplication>(`leave-applications/${id}/status`, payload),
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
    mutationFn: ({ id, payload }) => apiClient.patch<LeaveApplication>(`leave-applications/${id}/status`, payload),
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

export function useUpdateLeaveMutation() {
  const queryClient = useQueryClient();
  return useMutation<LeaveApplication, Error, { id: string; payload: CreateLeaveApplicationPayload }>({
    mutationFn: ({ id, payload }) => apiClient.patch<LeaveApplication>(`leave-applications/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveApplications"] });
      queryClient.invalidateQueries({ queryKey: ["leaveBalances"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}
