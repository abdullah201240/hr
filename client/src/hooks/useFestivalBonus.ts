import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  FestivalBonusRule,
  CreateFestivalBonusRulePayload,
  UpdateFestivalBonusRulePayload,
} from "@/types";

export function useFestivalBonusRulesQuery() {
  return useQuery<FestivalBonusRule[]>({
    queryKey: ["festivalBonusRules"],
    queryFn: () => apiClient.get<FestivalBonusRule[]>("festival-bonus-rules"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFestivalBonusRuleMutation() {
  const queryClient = useQueryClient();
  return useMutation<FestivalBonusRule, Error, CreateFestivalBonusRulePayload>({
    mutationFn: (payload) =>
      apiClient.post<FestivalBonusRule>("festival-bonus-rules", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["festivalBonusRules"] });
    },
  });
}

export function useUpdateFestivalBonusRuleMutation() {
  const queryClient = useQueryClient();
  return useMutation<FestivalBonusRule, Error, { id: string; payload: UpdateFestivalBonusRulePayload }>({
    mutationFn: ({ id, payload }) =>
      apiClient.patch<FestivalBonusRule>(`festival-bonus-rules/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["festivalBonusRules"] });
    },
  });
}

export function useDeleteFestivalBonusRuleMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) =>
      apiClient.delete<{ message: string }>(`festival-bonus-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["festivalBonusRules"] });
    },
  });
}
