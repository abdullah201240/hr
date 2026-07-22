import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface KPI {
  id: string;
  employeeId: string;
  cycleId?: string;
  title: string;
  description: string;
  targetMetric: string;
  weight: number;
  score?: number;
  selfScore?: number;
  managerScore?: number;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppraisalCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "draft" | "active" | "completed";
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeAppraisal {
  id: string;
  employeeId: string;
  cycleId: string;
  status: "pending_self" | "pending_manager" | "completed";
  selfScore?: number;
  managerScore?: number;
  finalScore?: number;
  selfFeedback?: string;
  managerFeedback?: string;
  promotionRecommended: boolean;
  promotionReadiness: "ready_now" | "ready_1_2_years" | "not_eligible";
  recommendedDesignationId?: string;
  managerNotes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CycleAppraisalItem {
  employee: {
    id: string;
    fullNameEnglish: string;
    email: string;
    joinDate: string;
    designationId: string;
    designationName: string;
    grade?: string;
    employeeId: string;
  };
  appraisal: EmployeeAppraisal | null;
  recommendedDesignation: {
    id: string;
    name: string;
  } | null;
}

export function useAllKpisQuery() {
  return useQuery<Record<string, KPI[]>>({
    queryKey: ["performance", "all"],
    queryFn: () => apiClient.get<Record<string, KPI[]>>("performance"),
  });
}

export function useEmployeeKpisQuery(employeeId: string, cycleId?: string) {
  return useQuery<KPI[]>({
    queryKey: ["performance", "employee", employeeId, cycleId],
    queryFn: () => {
      const url = cycleId 
        ? `performance/employee/${employeeId}?cycleId=${cycleId}`
        : `performance/employee/${employeeId}`;
      return apiClient.get<KPI[]>(url);
    },
    enabled: !!employeeId,
  });
}

export function useCreateKpiMutation(cycleId?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    KPI,
    Error,
    {
      employeeId: string;
      cycleId?: string;
      title: string;
      description: string;
      targetMetric: string;
      weight: number;
    }
  >({
    mutationFn: (payload) => apiClient.post<KPI>("performance/kpi", payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["performance", "employee", variables.employeeId, cycleId || variables.cycleId] });
      queryClient.invalidateQueries({ queryKey: ["performance", "appraisal", variables.employeeId, cycleId || variables.cycleId] });
    },
  });
}

export function useDeleteKpiMutation(employeeId: string, cycleId?: string) {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`performance/kpi/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance", "employee", employeeId, cycleId] });
      queryClient.invalidateQueries({ queryKey: ["performance", "appraisal", employeeId, cycleId] });
    },
  });
}

export function useSaveKpiScoresMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    KPI[],
    Error,
    {
      employeeId: string;
      scores: { kpiId: string; score: number }[];
    }
  >({
    mutationFn: ({ employeeId, scores }) =>
      apiClient.patch<KPI[]>(`performance/employee/${employeeId}/scores`, { scores }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["performance", "employee", variables.employeeId] });
    },
  });
}

// --- Appraisal Cycles hooks ---

export function useAppraisalCyclesQuery() {
  return useQuery<AppraisalCycle[]>({
    queryKey: ["performance", "cycles"],
    queryFn: () => apiClient.get<AppraisalCycle[]>("performance/cycles"),
  });
}

export function useCreateCycleMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    AppraisalCycle,
    Error,
    {
      name: string;
      startDate: string;
      endDate: string;
      description?: string;
    }
  >({
    mutationFn: (payload) => apiClient.post<AppraisalCycle>("performance/cycles", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance", "cycles"] });
    },
  });
}

export function useUpdateCycleStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    AppraisalCycle,
    Error,
    {
      id: string;
      status: "draft" | "active" | "completed";
    }
  >({
    mutationFn: ({ id, status }) =>
      apiClient.patch<AppraisalCycle>(`performance/cycles/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance", "cycles"] });
    },
  });
}

// --- Appraisals hooks ---

export function useCycleAppraisalsQuery(cycleId: string) {
  return useQuery<CycleAppraisalItem[]>({
    queryKey: ["performance", "appraisals", "cycle", cycleId],
    queryFn: () => apiClient.get<CycleAppraisalItem[]>(`performance/appraisals/cycle/${cycleId}`),
    enabled: !!cycleId,
  });
}

export function useEmployeeAppraisalQuery(employeeId: string, cycleId: string) {
  return useQuery<{ appraisal: EmployeeAppraisal; kpis: KPI[] }>({
    queryKey: ["performance", "appraisal", employeeId, cycleId],
    queryFn: () => apiClient.get<{ appraisal: EmployeeAppraisal; kpis: KPI[] }>(`performance/appraisals/employee/${employeeId}/cycle/${cycleId}`),
    enabled: !!employeeId && !!cycleId,
  });
}

export function useSubmitSelfAppraisalMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    { appraisal: EmployeeAppraisal; kpis: KPI[] },
    Error,
    {
      appraisalId: string;
      employeeId: string;
      cycleId: string;
      scores: { kpiId: string; selfScore: number; comments?: string }[];
      selfFeedback?: string;
    }
  >({
    mutationFn: ({ appraisalId, scores, selfFeedback }) =>
      apiClient.post<{ appraisal: EmployeeAppraisal; kpis: KPI[] }>(`performance/appraisals/${appraisalId}/self`, { scores, selfFeedback }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["performance", "appraisal", variables.employeeId, variables.cycleId] });
      queryClient.invalidateQueries({ queryKey: ["performance", "appraisals", "cycle", variables.cycleId] });
    },
  });
}

export function useSubmitManagerAppraisalMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    { appraisal: EmployeeAppraisal; kpis: KPI[] },
    Error,
    {
      appraisalId: string;
      employeeId: string;
      cycleId: string;
      scores: { kpiId: string; managerScore: number; comments?: string }[];
      managerFeedback?: string;
      promotionRecommended?: boolean;
      promotionReadiness?: "ready_now" | "ready_1_2_years" | "not_eligible";
      recommendedDesignationId?: string;
      managerNotes?: string;
    }
  >({
    mutationFn: ({ appraisalId, scores, managerFeedback, promotionRecommended, promotionReadiness, recommendedDesignationId, managerNotes }) =>
      apiClient.post<{ appraisal: EmployeeAppraisal; kpis: KPI[] }>(`performance/appraisals/${appraisalId}/manager`, {
        scores,
        managerFeedback,
        promotionRecommended,
        promotionReadiness,
        recommendedDesignationId,
        managerNotes,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["performance", "appraisal", variables.employeeId, variables.cycleId] });
      queryClient.invalidateQueries({ queryKey: ["performance", "appraisals", "cycle", variables.cycleId] });
    },
  });
}
