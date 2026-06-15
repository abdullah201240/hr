import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  LeaveType,
  PaginatedResponse,
  LeaveTypeQuery,
  CreateLeaveTypePayload,
  UpdateLeaveTypePayload,
} from "@/types";

export function useLeaveTypesQuery(query: LeaveTypeQuery) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.isActive !== undefined) params.set("isActive", String(query.isActive));

  const queryString = params.toString();
  const endpoint = queryString ? `leave-types?${queryString}` : "leave-types";

  return useQuery<PaginatedResponse<LeaveType>>({
    queryKey: ["leaveTypes", query],
    queryFn: () => apiClient.get<PaginatedResponse<LeaveType>>(endpoint),
  });
}

export function useLeaveTypeOptionsQuery() {
  return useQuery<LeaveType[]>({
    queryKey: ["leaveTypes", "options"],
    queryFn: () => apiClient.get<LeaveType[]>("leave-types/options"),
  });
}

export function useLeaveTypeQuery(id: string) {
  return useQuery<LeaveType>({
    queryKey: ["leaveTypes", id],
    queryFn: () => apiClient.get<LeaveType>(`leave-types/${id}`),
    enabled: !!id,
  });
}

export function useCreateLeaveTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation<LeaveType, Error, CreateLeaveTypePayload>({
    mutationFn: (payload) => apiClient.post<LeaveType>("leave-types", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveTypes"] });
    },
  });
}

export function useUpdateLeaveTypeMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation<LeaveType, Error, UpdateLeaveTypePayload>({
    mutationFn: (payload) => apiClient.patch<LeaveType>(`leave-types/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveTypes"] });
    },
  });
}

export function useDeleteLeaveTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`leave-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveTypes"] });
    },
  });
}
