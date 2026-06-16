import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  ProvidentFundSettings,
  UpdateProvidentFundSettingsPayload,
} from "@/types";

export function useProvidentFundSettingsQuery() {
  return useQuery<ProvidentFundSettings>({
    queryKey: ["providentFundSettings"],
    queryFn: () => apiClient.get<ProvidentFundSettings>("provident-fund-settings"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProvidentFundSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation<ProvidentFundSettings, Error, UpdateProvidentFundSettingsPayload>({
    mutationFn: (payload) =>
      apiClient.patch<ProvidentFundSettings>("provident-fund-settings", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providentFundSettings"] });
    },
  });
}
