import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface KPI {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  targetMetric: string;
  weight: number;
  score?: number;
  createdAt: string;
  updatedAt: string;
}

export function useAllKpisQuery() {
  return useQuery<Record<string, KPI[]>>({
    queryKey: ["performance", "all"],
    queryFn: () => apiClient.get<Record<string, KPI[]>>("performance"),
  });
}

export function useEmployeeKpisQuery(employeeId: string) {
  return useQuery<KPI[]>({
    queryKey: ["performance", "employee", employeeId],
    queryFn: () => apiClient.get<KPI[]>(`performance/employee/${employeeId}`),
    enabled: !!employeeId,
  });
}

export function useCreateKpiMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    KPI,
    Error,
    {
      employeeId: string;
      title: string;
      description: string;
      targetMetric: string;
      weight: number;
    }
  >({
    mutationFn: (payload) => apiClient.post<KPI>("performance/kpi", payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["performance", "employee", variables.employeeId] });
    },
  });
}

export function useDeleteKpiMutation(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`performance/kpi/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance", "employee", employeeId] });
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
