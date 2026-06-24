import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { FestivalBonusSettings, UpdateFestivalBonusSettingsPayload } from "@/types";

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
