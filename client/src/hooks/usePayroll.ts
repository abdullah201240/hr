import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { Payslip, PayrollCycle, DisbursementRecord } from "@/types/salary";

export type { Payslip, PayrollCycle, DisbursementRecord };

export function usePfBalancesQuery() {
  return useQuery<Array<{ employeeId: string; totalPf: number; monthsContributed: number }>>({
    queryKey: ["pfBalances"],
    queryFn: () => apiClient.get<any>("payroll/pf-balances"),
  });
}

export function usePayrollCycleQuery(monthKey: string) {
  return useQuery<PayrollCycle>({
    queryKey: ["payrollCycle", monthKey],
    queryFn: () => apiClient.get<PayrollCycle>(`payroll/cycles/${monthKey}`),
    enabled: !!monthKey,
  });
}

export type PayslipAdjustmentPayload = {
  monthKey: string;
  payslipId: string;
  adjustments?: Array<{
    title: string;
    amount: number;
    type: "addition" | "deduction";
  }>;
  additionalAmount?: number;
  additionalDescription?: string;
  deductionReductionAmount?: number;
  extraDeductionAmount?: number;
  deductionDescription?: string;
};

export function useUpdatePayslipAdjustmentsMutation() {
  const queryClient = useQueryClient();
  return useMutation<PayrollCycle, Error, PayslipAdjustmentPayload>({
    mutationFn: ({ monthKey, payslipId, ...payload }) =>
      apiClient.post<PayrollCycle>(`payroll/cycles/${monthKey}/adjustments/${payslipId}`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payrollCycle", variables.monthKey] });
    },
  });
}

export function useProcessPayrollMutation() {
  const queryClient = useQueryClient();
  return useMutation<PayrollCycle, Error, string>({
    mutationFn: (monthKey) =>
      apiClient.post<PayrollCycle>(`payroll/cycles/${monthKey}/process`, {}),
    onSuccess: (_, monthKey) => {
      queryClient.invalidateQueries({ queryKey: ["payrollCycle", monthKey] });
      queryClient.invalidateQueries({ queryKey: ["pfBalances"] });
    },
  });
}

export function useUnlockPayrollMutation() {
  const queryClient = useQueryClient();
  return useMutation<PayrollCycle, Error, string>({
    mutationFn: (monthKey) =>
      apiClient.post<PayrollCycle>(`payroll/cycles/${monthKey}/unlock`, {}),
    onSuccess: (_, monthKey) => {
      queryClient.invalidateQueries({ queryKey: ["payrollCycle", monthKey] });
    },
  });
}

export function useSyncPayrollMutation() {
  const queryClient = useQueryClient();
  return useMutation<PayrollCycle, Error, string>({
    mutationFn: (monthKey) =>
      apiClient.post<PayrollCycle>(`payroll/cycles/${monthKey}/sync`, {}),
    onSuccess: (_, monthKey) => {
      queryClient.invalidateQueries({ queryKey: ["payrollCycle", monthKey] });
    },
  });
}

export function useDistributePayrollMutation() {
  const queryClient = useQueryClient();
  return useMutation<PayrollCycle, Error, string>({
    mutationFn: (monthKey) =>
      apiClient.post<PayrollCycle>(`payroll/cycles/${monthKey}/distribute`, {}),
    onSuccess: (_, monthKey) => {
      queryClient.invalidateQueries({ queryKey: ["payrollCycle", monthKey] });
      queryClient.invalidateQueries({ queryKey: ["pfBalances"] });
    },
  });
}

export function useDisburseMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    PayrollCycle,
    Error,
    { monthKey: string; paymentMethod: string; referenceId: string; disbursementDate: string }
  >({
    mutationFn: (payload) =>
      apiClient.post<PayrollCycle>("payroll/disburse", payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payrollCycle", variables.monthKey] });
      queryClient.invalidateQueries({ queryKey: ["disbursements"] });
      queryClient.invalidateQueries({ queryKey: ["pfBalances"] });
    },
  });
}

export function useDisbursementsQuery() {
  return useQuery<DisbursementRecord[]>({
    queryKey: ["disbursements"],
    queryFn: () => apiClient.get<DisbursementRecord[]>("payroll/disbursements"),
  });
}

export function useMyPayslipsQuery() {
  return useQuery<Payslip[]>({
    queryKey: ["my-payslips"],
    queryFn: () => apiClient.get<Payslip[]>("payroll/my-payslips"),
  });
}

