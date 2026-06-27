import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  FestivalBonusSettings,
  UpdateFestivalBonusSettingsPayload,
  FestivalBonusCycle,
  FestivalBonusPayout,
} from "@/types";

export function useFestivalBonusSettingsQuery() {
  return useQuery<FestivalBonusSettings>({
    queryKey: ["festivalBonusSettings"],
    queryFn: () => apiClient.get<FestivalBonusSettings>("festival-bonus/settings"),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useUpdateFestivalBonusSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation<FestivalBonusSettings, Error, UpdateFestivalBonusSettingsPayload>({
    mutationFn: (payload) =>
      apiClient.patch<FestivalBonusSettings>("festival-bonus/settings", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["festivalBonusSettings"] });
    },
  });
}

export function useFestivalCyclesQuery() {
  return useQuery<FestivalBonusCycle[]>({
    queryKey: ["festivalCycles"],
    queryFn: () => apiClient.get<FestivalBonusCycle[]>("festival-bonus/cycles"),
  });
}

export function useFestivalCycleDetailsQuery(id: string) {
  return useQuery<{ cycle: FestivalBonusCycle; payouts: FestivalBonusPayout[] }>({
    queryKey: ["festivalCycleDetails", id],
    queryFn: () =>
      apiClient.get<{ cycle: FestivalBonusCycle; payouts: FestivalBonusPayout[] }>(
        `festival-bonus/cycles/${id}`,
      ),
    enabled: !!id,
  });
}

export function useCreateFestivalCycleMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ cycle: FestivalBonusCycle }, Error, { name: string; festivalDate: string }>({
    mutationFn: (payload) => apiClient.post("festival-bonus/cycles", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["festivalCycles"] });
    },
  });
}

export function useRecalculateFestivalCycleMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ cycle: FestivalBonusCycle; payouts: FestivalBonusPayout[] }, Error, string>({
    mutationFn: (id) => apiClient.post(`festival-bonus/cycles/${id}/recalculate`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["festivalCycles"] });
      queryClient.invalidateQueries({ queryKey: ["festivalCycleDetails", id] });
    },
  });
}

export function useUpdateFestivalPayoutMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    { cycle: FestivalBonusCycle; payouts: FestivalBonusPayout[] },
    Error,
    { payoutId: string; overrideAmount?: number | null; specialApprovalGranted?: boolean }
  >({
    mutationFn: ({ payoutId, ...payload }) =>
      apiClient.patch(`festival-bonus/payouts/${payoutId}`, payload),
    onSuccess: (data) => {
      const cycleId = data.cycle.id;
      queryClient.invalidateQueries({ queryKey: ["festivalCycles"] });
      queryClient.invalidateQueries({ queryKey: ["festivalCycleDetails", cycleId] });
    },
  });
}

export function useApproveFestivalCycleMutation() {
  const queryClient = useQueryClient();
  return useMutation<FestivalBonusCycle, Error, string>({
    mutationFn: (id) => apiClient.post(`festival-bonus/cycles/${id}/approve`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["festivalCycles"] });
      queryClient.invalidateQueries({ queryKey: ["festivalCycleDetails", id] });
    },
  });
}

export function useDisburseFestivalCycleMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    FestivalBonusCycle,
    Error,
    { id: string; paymentMethod: string; paymentRef: string; disbursementDate: string }
  >({
    mutationFn: ({ id, ...payload }) =>
      apiClient.post(`festival-bonus/cycles/${id}/disburse`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["festivalCycles"] });
      queryClient.invalidateQueries({ queryKey: ["festivalCycleDetails", variables.id] });
    },
  });
}

export function useDeleteFestivalCycleMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => apiClient.delete(`festival-bonus/cycles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["festivalCycles"] });
    },
  });
}

export function useSubmitFestivalCycleForApprovalMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ cycle: FestivalBonusCycle; payouts: FestivalBonusPayout[] }, Error, string>({
    mutationFn: (id) => apiClient.post(`festival-bonus/cycles/${id}/submit-for-approval`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["festivalCycles"] });
      queryClient.invalidateQueries({ queryKey: ["festivalCycleDetails", id] });
    },
  });
}

export function useApproveFestivalPayoutLmMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ cycle: FestivalBonusCycle; payouts: FestivalBonusPayout[] }, Error, { payoutId: string; cycleId: string }>({
    mutationFn: ({ payoutId }) => apiClient.post(`festival-bonus/payouts/${payoutId}/approve-lm`),
    onSuccess: (_, { cycleId }) => {
      queryClient.invalidateQueries({ queryKey: ["festivalCycles"] });
      queryClient.invalidateQueries({ queryKey: ["festivalCycleDetails", cycleId] });
    },
  });
}

export function useRejectFestivalPayoutLmMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ cycle: FestivalBonusCycle; payouts: FestivalBonusPayout[] }, Error, { payoutId: string; cycleId: string; comment: string }>({
    mutationFn: ({ payoutId, comment }) => apiClient.post(`festival-bonus/payouts/${payoutId}/reject-lm`, { comment }),
    onSuccess: (_, { cycleId }) => {
      queryClient.invalidateQueries({ queryKey: ["festivalCycles"] });
      queryClient.invalidateQueries({ queryKey: ["festivalCycleDetails", cycleId] });
    },
  });
}

export function useBulkApproveFestivalLmMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ cycle: FestivalBonusCycle; payouts: FestivalBonusPayout[] }, Error, string>({
    mutationFn: (id) => apiClient.post(`festival-bonus/cycles/${id}/bulk-approve-lm`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["festivalCycles"] });
      queryClient.invalidateQueries({ queryKey: ["festivalCycleDetails", id] });
    },
  });
}

export function useApproveFestivalPayoutMdMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ cycle: FestivalBonusCycle; payouts: FestivalBonusPayout[] }, Error, { payoutId: string; cycleId: string }>({
    mutationFn: ({ payoutId }) => apiClient.post(`festival-bonus/payouts/${payoutId}/approve-md`),
    onSuccess: (_, { cycleId }) => {
      queryClient.invalidateQueries({ queryKey: ["festivalCycles"] });
      queryClient.invalidateQueries({ queryKey: ["festivalCycleDetails", cycleId] });
    },
  });
}

export function useRejectFestivalPayoutMdMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ cycle: FestivalBonusCycle; payouts: FestivalBonusPayout[] }, Error, { payoutId: string; cycleId: string; comment: string }>({
    mutationFn: ({ payoutId, comment }) => apiClient.post(`festival-bonus/payouts/${payoutId}/reject-md`, { comment }),
    onSuccess: (_, { cycleId }) => {
      queryClient.invalidateQueries({ queryKey: ["festivalCycles"] });
      queryClient.invalidateQueries({ queryKey: ["festivalCycleDetails", cycleId] });
    },
  });
}

export function useBulkApproveFestivalMdMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ cycle: FestivalBonusCycle; payouts: FestivalBonusPayout[] }, Error, string>({
    mutationFn: (id) => apiClient.post(`festival-bonus/cycles/${id}/bulk-approve-md`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["festivalCycles"] });
      queryClient.invalidateQueries({ queryKey: ["festivalCycleDetails", id] });
    },
  });
}
