import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  SalaryTemplate,
  EmployeeSalary,
  SalarySummary,
  CreateSalaryTemplatePayload,
  UpdateSalaryTemplatePayload,
  AssignEmployeeSalaryPayload,
  UpdateEmployeeSalaryPayload,
} from "@/types";

// ─── Salary Templates ──────────────────────────────────────────────────────

export function useSalaryTemplatesQuery() {
  return useQuery<SalaryTemplate[]>({
    queryKey: ["salaryTemplates"],
    queryFn: () => apiClient.get<SalaryTemplate[]>("salary-templates"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSalaryTemplateQuery(id: string) {
  return useQuery<SalaryTemplate>({
    queryKey: ["salaryTemplates", id],
    queryFn: () => apiClient.get<SalaryTemplate>(`salary-templates/${id}`),
    enabled: !!id,
  });
}

export function useCreateSalaryTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation<SalaryTemplate, Error, CreateSalaryTemplatePayload>({
    mutationFn: (payload) =>
      apiClient.post<SalaryTemplate>("salary-templates", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaryTemplates"] });
    },
  });
}

export function useUpdateSalaryTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    SalaryTemplate,
    Error,
    { id: string; payload: UpdateSalaryTemplatePayload }
  >({
    mutationFn: ({ id, payload }) =>
      apiClient.patch<SalaryTemplate>(`salary-templates/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaryTemplates"] });
    },
  });
}

export function useDeleteSalaryTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) =>
      apiClient.delete<{ message: string }>(`salary-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaryTemplates"] });
    },
  });
}

// ─── Employee Salaries ──────────────────────────────────────────────────────

export interface EmployeeSalaryQuery {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  templateId?: string;
  status?: string;
}

export interface PaginatedEmployeeSalaries {
  data: EmployeeSalary[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useEmployeeSalariesQuery(params?: EmployeeSalaryQuery) {
  return useQuery<PaginatedEmployeeSalaries>({
    queryKey: ["employeeSalaries", params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== "") {
            searchParams.append(key, String(val));
          }
        });
      }
      return apiClient.get<PaginatedEmployeeSalaries>(`employee-salaries?${searchParams.toString()}`);
    },
  });
}

export function useEmployeeSalaryQuery(employeeId: string) {
  return useQuery<EmployeeSalary | null>({
    queryKey: ["employeeSalaries", employeeId],
    queryFn: () =>
      apiClient.get<EmployeeSalary | null>(
        `employee-salaries/${employeeId}`
      ),
    enabled: !!employeeId,
  });
}

export function useEmployeeSalaryHistoryQuery(employeeId: string) {
  return useQuery<EmployeeSalary[]>({
    queryKey: ["employeeSalaries", employeeId, "history"],
    queryFn: () =>
      apiClient.get<EmployeeSalary[]>(`employee-salaries/${employeeId}/history`),
    enabled: !!employeeId,
  });
}

export function useBulkSalaryRevisionMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    { jobId: string; status: string },
    Error,
    { departmentId?: string; templateId?: string; percentageIncrease: number; effectiveDate: string; notes?: string }
  >({
    mutationFn: (payload) =>
      apiClient.post<{ jobId: string; status: string }>("employee-salaries/bulk-revision", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeSalaries"] });
      queryClient.invalidateQueries({ queryKey: ["salarySummary"] });
    },
  });
}

export function useAssignEmployeeSalaryMutation() {
  const queryClient = useQueryClient();
  return useMutation<EmployeeSalary, Error, AssignEmployeeSalaryPayload>({
    mutationFn: (payload) =>
      apiClient.post<EmployeeSalary>("employee-salaries", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeSalaries"] });
      queryClient.invalidateQueries({ queryKey: ["salarySummary"] });
    },
  });
}

export function useUpdateEmployeeSalaryMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    EmployeeSalary,
    Error,
    { id: string; payload: UpdateEmployeeSalaryPayload }
  >({
    mutationFn: ({ id, payload }) =>
      apiClient.patch<EmployeeSalary>(`employee-salaries/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeSalaries"] });
      queryClient.invalidateQueries({ queryKey: ["salarySummary"] });
    },
  });
}

// ─── Salary Summary ─────────────────────────────────────────────────────────

export function useSalarySummaryQuery() {
  return useQuery<SalarySummary>({
    queryKey: ["salarySummary"],
    queryFn: () => apiClient.get<SalarySummary>("employee-salaries/summary"),
    staleTime: 2 * 60 * 1000,
  });
}
