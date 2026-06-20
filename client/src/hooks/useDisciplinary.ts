import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface DisciplinaryCase {
  id: string;
  employeeName: string;
  employeeEmail: string;
  offenseType: string;
  dateReported: string;
  status: "Under Investigation" | "Show Cause Issued" | "Explanation Received" | "Inquiry Hearing" | "Action Taken";
  showCauseNotice: string;
  employeeExplanation: string;
  finalAction: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisciplinaryQuery {
  search?: string;
  status?: string;
}

export function useDisciplinaryCasesQuery(query: DisciplinaryQuery) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);

  const queryString = params.toString();
  const endpoint = queryString ? `disciplinary?${queryString}` : "disciplinary";

  return useQuery<DisciplinaryCase[]>({
    queryKey: ["disciplinary", queryString],
    queryFn: () => apiClient.get<DisciplinaryCase[]>(endpoint),
  });
}

export function useCreateDisciplinaryCaseMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    DisciplinaryCase,
    Error,
    {
      employeeName: string;
      employeeEmail: string;
      offenseType: string;
      showCauseNotice?: string;
    }
  >({
    mutationFn: (payload) => apiClient.post<DisciplinaryCase>("disciplinary", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinary"] });
    },
  });
}

export function useUpdateDisciplinaryCaseMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    DisciplinaryCase,
    Error,
    {
      id: string;
      status?: string;
      employeeExplanation?: string;
      finalAction?: string;
    }
  >({
    mutationFn: ({ id, ...payload }) =>
      apiClient.patch<DisciplinaryCase>(`disciplinary/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinary"] });
    },
  });
}

export function useDeleteDisciplinaryCaseMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ message: string }>(`disciplinary/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinary"] });
    },
  });
}
