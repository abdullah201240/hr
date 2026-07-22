import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  Claim,
  ClaimQuery,
  CreateClaimPayload,
  UpdateClaimStatusPayload,
  PaginatedResponse,
} from "@/types";

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useClaimsQuery(query: ClaimQuery) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.claimType) params.set("claimType", query.claimType);
  if (query.employeeId) params.set("employeeId", query.employeeId);
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortOrder) params.set("sortOrder", query.sortOrder);

  const queryString = params.toString();
  const endpoint = queryString ? `claims?${queryString}` : "claims";

  return useQuery<PaginatedResponse<Claim>>({
    queryKey: ["claims", query],
    queryFn: () => apiClient.get<PaginatedResponse<Claim>>(endpoint),
  });
}

export function useClaimById(id: string) {
  return useQuery<Claim>({
    queryKey: ["claims", id],
    queryFn: () => apiClient.get<Claim>(`claims/${id}`),
    enabled: !!id,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateClaimMutation() {
  const queryClient = useQueryClient();
  return useMutation<Claim, Error, CreateClaimPayload>({
    mutationFn: (payload) => apiClient.post<Claim>("claims", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
  });
}

export function useUpdateClaimStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation<Claim, Error, { id: string; payload: UpdateClaimStatusPayload }>({
    mutationFn: ({ id, payload }) =>
      apiClient.patch<Claim>(`claims/${id}/status`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
  });
}

export function useDeleteClaimMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`claims/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
  });
}
