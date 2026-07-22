import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface RegulationPolicy {
  id: string;
  title: string;
  category: string;
  description: string;
  isActive: boolean;
  requiresApproval: boolean;
  allowEmployeeRequests: boolean;
  metadata?: Record<string, any> | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegulationRequest {
  id: string;
  policyId: string;
  policyTitle: string;
  policyCategory: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeIdCode: string;
  title: string;
  reason: string;
  status: 'Pending' | 'Pending_2nd' | 'Approved' | 'Rejected' | 'Cancelled';
  requestDate: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  metadata?: Record<string, any> | null;
  firstApprovedById?: string | null;
  firstApprovedByName?: string | null;
  firstApprovedAt?: string | null;
  finalApprovedById?: string | null;
  finalApprovedByName?: string | null;
  finalApprovedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegulationQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  employeeId?: string;
  policyId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedRequestsResponse {
  data: RegulationRequest[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Policies Hooks ──────────────────────────────────────────────────────────

export function useRegulationPoliciesQuery() {
  return useQuery<RegulationPolicy[]>({
    queryKey: ["regulationPolicies"],
    queryFn: () => apiClient.get<RegulationPolicy[]>("regulations/policies"),
  });
}

export function useCreatePolicyMutation() {
  const queryClient = useQueryClient();
  return useMutation<RegulationPolicy, Error, Partial<RegulationPolicy>>({
    mutationFn: (payload) => apiClient.post<RegulationPolicy>("regulations/policies", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regulationPolicies"] });
    },
  });
}

export function useUpdatePolicyMutation() {
  const queryClient = useQueryClient();
  return useMutation<RegulationPolicy, Error, { id: string; payload: Partial<RegulationPolicy> }>({
    mutationFn: ({ id, payload }) =>
      apiClient.patch<RegulationPolicy>(`regulations/policies/${id}`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["regulationPolicies"] });
      queryClient.invalidateQueries({ queryKey: ["regulationPolicy", variables.id] });
    },
  });
}

export function useDeletePolicyMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: boolean; message: string }>(`regulations/policies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regulationPolicies"] });
    },
  });
}

// ─── Requests Hooks ──────────────────────────────────────────────────────────

export function useRegulationRequestsQuery(filters: RegulationQueryFilters = {}) {
  return useQuery<PaginatedRequestsResponse>({
    queryKey: ["regulationRequests", filters],
    queryFn: () => apiClient.get<PaginatedRequestsResponse>("regulations/requests", { params: filters }),
  });
}

export function useCreateRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation<RegulationRequest, Error, Partial<RegulationRequest>>({
    mutationFn: (payload) => apiClient.post<RegulationRequest>("regulations/requests", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regulationRequests"] });
    },
  });
}

export function useUpdateRequestStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    RegulationRequest,
    Error,
    { id: string; payload: { status: 'Approved' | 'Rejected'; rejectionReason?: string } }
  >({
    mutationFn: ({ id, payload }) =>
      apiClient.patch<RegulationRequest>(`regulations/requests/${id}/status`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["regulationRequests"] });
      queryClient.invalidateQueries({ queryKey: ["regulationRequest", variables.id] });
    },
  });
}

export function useCancelRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: boolean; message: string }>(`regulations/requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regulationRequests"] });
    },
  });
}
