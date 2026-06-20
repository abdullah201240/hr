import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface SeparationRecord {
  id: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  lastWorkingDay: string;
  reason: string;
  status: "Notice Period" | "Clearance" | "Cleared";
  clearanceIt: boolean;
  clearanceFinance: boolean;
  clearanceHr: boolean;
  clearanceManager: boolean;
  assetLaptop: boolean;
  assetAccessCard: boolean;
  assetKeys: boolean;
  assetOther: boolean;
  handoverCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SeparationQuery {
  search?: string;
  status?: string;
}

export function useSeparationRecordsQuery(query: SeparationQuery) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);

  const queryString = params.toString();
  const endpoint = queryString ? `separation?${queryString}` : "separation";

  return useQuery<SeparationRecord[]>({
    queryKey: ["separation", queryString],
    queryFn: () => apiClient.get<SeparationRecord[]>(endpoint),
  });
}

export function useCreateSeparationMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    SeparationRecord,
    Error,
    {
      employeeName: string;
      employeeEmail: string;
      department: string;
      lastWorkingDay: string;
      reason?: string;
    }
  >({
    mutationFn: (payload) => apiClient.post<SeparationRecord>("separation", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["separation"] });
    },
  });
}

export function useUpdateSeparationMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    SeparationRecord,
    Error,
    {
      id: string;
      status?: string;
      clearanceIt?: boolean;
      clearanceFinance?: boolean;
      clearanceHr?: boolean;
      clearanceManager?: boolean;
      assetLaptop?: boolean;
      assetAccessCard?: boolean;
      assetKeys?: boolean;
      assetOther?: boolean;
      handoverCompleted?: boolean;
    }
  >({
    mutationFn: ({ id, ...payload }) =>
      apiClient.patch<SeparationRecord>(`separation/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["separation"] });
    },
  });
}

export function useDeleteSeparationMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`separation/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["separation"] });
    },
  });
}
