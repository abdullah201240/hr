import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  Designation,
  PaginatedResponse,
  DesignationQuery,
  CreateDesignationPayload,
  UpdateDesignationPayload,
} from "@/types";

export function useDesignationsQuery(query: DesignationQuery) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.isActive !== undefined) params.set("isActive", String(query.isActive));

  const queryString = params.toString();
  const endpoint = queryString ? `designations?${queryString}` : "designations";

  return useQuery<PaginatedResponse<Designation>>({
    queryKey: ["designations", query],
    queryFn: () => apiClient.get<PaginatedResponse<Designation>>(endpoint),
  });
}

export function useDesignationOptionsQuery() {
  return useQuery<Array<{ id: string; name: string; code: string }>>({
    queryKey: ["designations", "options"],
    queryFn: () => apiClient.get<Array<{ id: string; name: string; code: string }>>("designations/options"),
  });
}

export function useDesignationQuery(id: string) {
  return useQuery<Designation>({
    queryKey: ["designations", id],
    queryFn: () => apiClient.get<Designation>(`designations/${id}`),
    enabled: !!id,
  });
}

export function useCreateDesignationMutation() {
  const queryClient = useQueryClient();
  return useMutation<Designation, Error, CreateDesignationPayload>({
    mutationFn: (payload) => apiClient.post<Designation>("designations", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations"] });
    },
  });
}

export function useUpdateDesignationMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Designation, Error, UpdateDesignationPayload>({
    mutationFn: (payload) => apiClient.patch<Designation>(`designations/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations"] });
    },
  });
}

export function useDeleteDesignationMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`designations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations"] });
    },
  });
}
