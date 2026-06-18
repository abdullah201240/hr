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

export function useEmployeeSalariesQuery() {
  return useQuery<EmployeeSalary[]>({
    queryKey: ["employeeSalaries"],
    queryFn: () => apiClient.get<EmployeeSalary[]>("employee-salaries"),
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
