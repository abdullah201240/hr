import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  Department,
  PaginatedResponse,
  DepartmentQuery,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from "@/types";

export function useDepartmentsQuery(query: DepartmentQuery) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.isActive !== undefined) params.set("isActive", String(query.isActive));

  const queryString = params.toString();
  const endpoint = queryString ? `departments?${queryString}` : "departments";

  return useQuery<PaginatedResponse<Department>>({
    queryKey: ["departments", query],
    queryFn: () => apiClient.get<PaginatedResponse<Department>>(endpoint),
  });
}

export function useDepartmentOptionsQuery() {
  return useQuery<Array<{ id: string; name: string; code: string }>>({
    queryKey: ["departments", "options"],
    queryFn: () => apiClient.get<Array<{ id: string; name: string; code: string }>>("departments/options"),
  });
}

export function useDepartmentQuery(id: string) {
  return useQuery<Department>({
    queryKey: ["departments", id],
    queryFn: () => apiClient.get<Department>(`departments/${id}`),
    enabled: !!id,
  });
}

export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation<Department, Error, CreateDepartmentPayload>({
    mutationFn: (payload) => apiClient.post<Department>("departments", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useUpdateDepartmentMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Department, Error, UpdateDepartmentPayload>({
    mutationFn: (payload) => apiClient.patch<Department>(`departments/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useDeleteDepartmentMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}
