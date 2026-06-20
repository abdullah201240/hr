import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface Payslip {
  id: string;
  employeeId: string;
  basicSalary: number;
  allowanceHra: number;
  allowanceTransport: number;
  allowanceMedical: number;
  deductionTax: number;
  deductionPf: number;
  bonusAmount: number;
  bonusDescription: string;
  festivalBonusAmount: number;
  netPay: number;
  paymentStatus: "Unpaid" | "Paid";
  paymentMethod?: string;
  paymentDate?: string;
  paymentReference?: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  joinDate?: string;
}

export interface PayrollCycle {
  id: string;
  monthKey: string;
  status: "Draft" | "Processed" | "Distributed";
  payslips: Payslip[];
}

export interface DisbursementRecord {
  id: string;
  monthKey: string;
  disbursementDate: string;
  paymentMethod: string;
  referenceId: string;
  totalDisbursed: number;
  employeeCount: number;
}

export function usePayrollCycleQuery(monthKey: string) {
  return useQuery<PayrollCycle>({
    queryKey: ["payrollCycle", monthKey],
    queryFn: () => apiClient.get<PayrollCycle>(`payroll/cycles/${monthKey}`),
    enabled: !!monthKey,
  });
}

export function useUpdatePayslipBonusMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    PayrollCycle,
    Error,
    { monthKey: string; payslipId: string; bonusAmount: number; bonusDescription?: string }
  >({
    mutationFn: ({ monthKey, payslipId, bonusAmount, bonusDescription }) =>
      apiClient.post<PayrollCycle>(`payroll/cycles/${monthKey}/bonus/${payslipId}`, {
        bonusAmount,
        bonusDescription,
      }),
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
    },
  });
}

export function useDisbursementsQuery() {
  return useQuery<DisbursementRecord[]>({
    queryKey: ["disbursements"],
    queryFn: () => apiClient.get<DisbursementRecord[]>("payroll/disbursements"),
  });
}
