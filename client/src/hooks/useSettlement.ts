import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface FinalSettlement {
  id: string;
  separationRecordId: string;
  employeeEmail: string;
  separationType: string;
  serviceYears: number;
  payableDays: number;
  encashableAlDays: number;

  // Additional transient fields
  basicSalary?: number;
  grossSalary?: number;

  // Earnings
  salaryPayable: number;
  separationBenefit: number;
  leaveEncashment: number;
  employeePfBalance: number;
  employerPfBalance: number;
  pfInterest: number;
  medicalReimbursement: number;
  wellnessAllowance: number;
  otherReimbursements: number;

  // Deductions
  salaryAdvanceRecovery: number;
  loanRecovery: number;
  noticePayRecovery: number;
  assetRecovery: number;
  taxAdjustment: number;
  otherCompanyDues: number;

  // Net
  netSettlementAmount: number;
  status: "Draft" | "Approved" | "Paid";
  paymentDetails: string;
}

export interface CalculateSettlementPayload {
  separationType: string;
  payableDays: number;
  encashableAlDays: number;
  pfInterest?: number;
  medicalReimbursement?: number;
  wellnessAllowance?: number;
  otherReimbursements?: number;
  salaryAdvanceRecovery?: number;
  loanRecovery?: number;
  noticePayRecovery?: number;
  assetRecovery?: number;
  taxAdjustment?: number;
  otherCompanyDues?: number;
}

export function useSettlementQuery(separationId: string, enabled = true) {
  return useQuery<FinalSettlement>({
    queryKey: ["settlement", separationId],
    queryFn: () => apiClient.get<FinalSettlement>(`separation/${separationId}/settlement`),
    enabled: !!separationId && enabled,
  });
}

export function useSaveSettlementMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    FinalSettlement,
    Error,
    { separationId: string; payload: CalculateSettlementPayload }
  >({
    mutationFn: ({ separationId, payload }) =>
      apiClient.post<FinalSettlement>(`separation/${separationId}/settlement`, payload),
    onSuccess: (_, { separationId }) => {
      queryClient.invalidateQueries({ queryKey: ["settlement", separationId] });
      queryClient.invalidateQueries({ queryKey: ["separation"] });
    },
  });
}

export function useUpdateSettlementStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    FinalSettlement,
    Error,
    { separationId: string; status: string; paymentDetails?: string }
  >({
    mutationFn: ({ separationId, status, paymentDetails }) =>
      apiClient.patch<FinalSettlement>(`separation/${separationId}/settlement/status`, {
        status,
        paymentDetails,
      }),
    onSuccess: (_, { separationId }) => {
      queryClient.invalidateQueries({ queryKey: ["settlement", separationId] });
      queryClient.invalidateQueries({ queryKey: ["separation"] });
    },
  });
}
