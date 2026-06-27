import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  ProvidentFundSettings,
  UpdateProvidentFundSettingsPayload,
} from "@/types";

export interface ProvidentFundTransaction {
  id: string;
  employeeId: string;
  fullName: string;
  employeeDisplayId: string;
  monthKey: string | null;
  employeeContribution: number;
  employerContribution: number;
  type: "contribution" | "withdrawal" | "interest" | "adjustment";
  amount: number;
  description: string;
  createdAt: string;
}

export interface ProvidentFundWithdrawal {
  id: string;
  employeeId: string;
  fullName: string;
  employeeDisplayId: string;
  amount: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  remarks: string;
  actionById: string | null;
  actionByName: string | null;
  actionAt: string | null;
  createdAt: string;
}

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

export function usePfLedgerQuery(employeeId?: string) {
  return useQuery<ProvidentFundTransaction[]>({
    queryKey: ["pfLedger", employeeId],
    queryFn: () => {
      const endpoint = employeeId && employeeId !== "all" 
        ? `provident-fund/ledger?employeeId=${employeeId}`
        : "provident-fund/ledger";
      return apiClient.get<ProvidentFundTransaction[]>(endpoint);
    },
  });
}

export function usePfWithdrawalsQuery(employeeId?: string) {
  return useQuery<ProvidentFundWithdrawal[]>({
    queryKey: ["pfWithdrawals", employeeId],
    queryFn: () => {
      const endpoint = employeeId && employeeId !== "all"
        ? `provident-fund/withdrawals?employeeId=${employeeId}`
        : "provident-fund/withdrawals";
      return apiClient.get<ProvidentFundWithdrawal[]>(endpoint);
    },
  });
}

export function useApplyPfWithdrawalMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    ProvidentFundWithdrawal,
    Error,
    { amount: number; reason: string }
  >({
    mutationFn: (payload) =>
      apiClient.post<ProvidentFundWithdrawal>("provident-fund/withdrawals", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pfWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["pfLedger"] });
      queryClient.invalidateQueries({ queryKey: ["pfBalances"] });
    },
  });
}

export function useProcessPfWithdrawalMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    ProvidentFundWithdrawal,
    Error,
    { id: string; status: "Approved" | "Rejected"; remarks: string }
  >({
    mutationFn: ({ id, ...payload }) =>
      apiClient.post<ProvidentFundWithdrawal>(`provident-fund/withdrawals/${id}/process`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pfWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["pfLedger"] });
      queryClient.invalidateQueries({ queryKey: ["pfBalances"] });
    },
  });
}
