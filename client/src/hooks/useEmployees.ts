import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  Employee,
  PaginatedResponse,
  EmployeeQuery,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  ChangeStatusPayload,
} from "@/types";

export function useEmployeesQuery(query: EmployeeQuery, options?: { enabled?: boolean }) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.departmentId) params.set("departmentId", query.departmentId);
  if (query.designationId) params.set("designationId", query.designationId);
  if (query.status) params.set("status", query.status);
  if (query.employeeType) params.set("employeeType", query.employeeType);
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortOrder) params.set("sortOrder", query.sortOrder);

  const queryString = params.toString();
  const endpoint = queryString ? `employees?${queryString}` : "employees";

  return useQuery<PaginatedResponse<Employee>>({
    queryKey: ["employees", queryString],
    queryFn: () => apiClient.get<PaginatedResponse<Employee>>(endpoint),
    enabled: options?.enabled ?? true,
  });
}

export function useEmployeeQuery(id: string) {
  return useQuery<Employee>({
    queryKey: ["employees", id],
    queryFn: () => apiClient.get<Employee>(`employees/${id}`),
    enabled: !!id && id !== "create",
  });
}

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ jobId: string; status: string }, Error, CreateEmployeePayload>({
    mutationFn: (payload) => {
      return apiClient.post<{ jobId: string; status: string }>("employees", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateEmployeeMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation<{ jobId: string; status: string }, Error, UpdateEmployeePayload>({
    mutationFn: (payload) => {
      return apiClient.patch<{ jobId: string; status: string }>(`employees/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employees", id] });
    },
  });
}

export function useDeleteEmployeeMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useChangeEmployeeStatusMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation<{ message: string; scheduled: boolean }, Error, ChangeStatusPayload>({
    mutationFn: (payload) => {
      return apiClient.patch<{ message: string; scheduled: boolean }>(`employees/${id}/status`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employees", id] });
    },
  });
}
