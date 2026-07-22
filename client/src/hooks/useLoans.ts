import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface LoanPayment {
  id: string;
  loanId: string;
  payslipId: string | null;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  remarks: string | null;
  createdAt: string;
}

export interface Loan {
  id: string;
  employeeId: string;
  fullName: string;
  employeeDisplayId: string;
  amount: number;
  reason: string;
  termMonths: number;
  monthlyInstallment: number;
  remainingBalance: number;
  status: "Pending" | "Approved" | "Disbursed" | "Rejected" | "Repaid";
  remarks: string | null;
  approvedAt: string | null;
  disbursedAt: string | null;
  createdAt: string;
  payments?: LoanPayment[];
}

export function useLoansQuery(employeeId?: string) {
  return useQuery<Loan[]>({
    queryKey: ["loans", employeeId],
    queryFn: () => {
      const endpoint = employeeId && employeeId !== "all"
        ? `loans?employeeId=${employeeId}`
        : "loans";
      return apiClient.get<Loan[]>(endpoint);
    },
  });
}

export function useLoanDetailsQuery(loanId: string) {
  return useQuery<Loan>({
    queryKey: ["loanDetails", loanId],
    queryFn: () => apiClient.get<Loan>(`loans/${loanId}`),
    enabled: !!loanId,
  });
}

export function useApplyLoanMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    Loan,
    Error,
    { amount: number; termMonths: number; reason: string }
  >({
    mutationFn: (payload) => apiClient.post<Loan>("loans", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
  });
}

export function useProcessLoanMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    Loan,
    Error,
    { id: string; status: "Approved" | "Rejected"; remarks: string }
  >({
    mutationFn: ({ id, ...payload }) =>
      apiClient.post<Loan>(`loans/${id}/process`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loanDetails", variables.id] });
    },
  });
}

export function useDisburseLoanMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    Loan,
    Error,
    { id: string }
  >({
    mutationFn: ({ id }) =>
      apiClient.post<Loan>(`loans/${id}/disburse`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loanDetails", variables.id] });
    },
  });
}

export function useRecordLoanPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    { payment: LoanPayment; remainingBalance: number; status: string },
    Error,
    { loanId: string; amount: number; paymentMethod: string; remarks?: string }
  >({
    mutationFn: ({ loanId, ...payload }) =>
      apiClient.post<{ payment: LoanPayment; remainingBalance: number; status: string }>(
        `loans/${loanId}/payments`,
        payload
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loanDetails", variables.loanId] });
      queryClient.invalidateQueries({ queryKey: ["pfBalances"] }); // invalidate other payroll caches just in case
    },
  });
}
