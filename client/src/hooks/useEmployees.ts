import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  Employee,
  PaginatedResponse,
  EmployeeQuery,
  CreateEmployeePayload,
  UpdateEmployeePayload,
} from "@/types";

// Helper to poll BullMQ job status until completion or failure
async function pollEmployeeJob(jobId: string, queue: "create" | "update"): Promise<any> {
  const maxAttempts = 60; // 30 seconds max
  const delayMs = 500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await apiClient.get<{
      jobId: string;
      status: string;
      progress?: number;
      result?: any;
    }>(`employees/jobs/${jobId}?queue=${queue}`);

    if (status.status === "completed") {
      return status.result;
    }
    if (status.status === "failed") {
      throw new Error(`Background processing job failed: ${status.result || "Unknown error"}`);
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error("Timeout waiting for background employee processing job to complete");
}

export function useEmployeesQuery(query: EmployeeQuery) {
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
    queryKey: ["employees", query],
    queryFn: () => apiClient.get<PaginatedResponse<Employee>>(endpoint),
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
  return useMutation<Employee, Error, CreateEmployeePayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<{ jobId: string; status: string }>(
        "employees",
        payload
      );
      if (!response.jobId) {
        throw new Error("Failed to queue employee creation job");
      }
      // Poll the job status until completion
      const result = await pollEmployeeJob(response.jobId, "create");
      // Result contains { employeeId: string }
      return apiClient.get<Employee>(`employees/${result.employeeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateEmployeeMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Employee, Error, UpdateEmployeePayload>({
    mutationFn: async (payload) => {
      const response = await apiClient.patch<{ jobId: string; status: string }>(
        `employees/${id}`,
        payload
      );
      if (!response.jobId) {
        throw new Error("Failed to queue employee update job");
      }
      // Poll the job status until completion
      await pollEmployeeJob(response.jobId, "update");
      return apiClient.get<Employee>(`employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
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
