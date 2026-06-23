import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"

export function useSalaryAdjustments(filters?: {
  employeeId?: string
  targetMonthKey?: string
  appliedMonthKey?: string
  status?: string
}) {
  return useQuery({
    queryKey: ["salary-adjustments", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.employeeId) params.append("employeeId", filters.employeeId)
      if (filters?.targetMonthKey) params.append("targetMonthKey", filters.targetMonthKey)
      if (filters?.appliedMonthKey) params.append("appliedMonthKey", filters.appliedMonthKey)
      if (filters?.status) params.append("status", filters.status)

      return apiClient.get<any>(`/payroll/adjustments?${params.toString()}`)
    },
  })
}

export function usePendingAdjustmentsSummary(appliedMonthKey: string) {
  return useQuery({
    queryKey: ["pending-adjustments-summary", appliedMonthKey],
    queryFn: async () => {
      if (!appliedMonthKey) return null
      return apiClient.get<any>(`/payroll/adjustments/pending-summary?appliedMonthKey=${appliedMonthKey}`)
    },
    enabled: !!appliedMonthKey,
  })
}

export function useCreateSalaryAdjustment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      // If ID is present, it's an update
      if (data.id) {
        return apiClient.patch<any>(`/payroll/adjustments/${data.id}`, data)
      }
      return apiClient.post<any>("/payroll/adjustments", data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["salary-adjustments"] })
      queryClient.invalidateQueries({ queryKey: ["pending-adjustments-summary", variables.appliedMonthKey] })
      queryClient.invalidateQueries({ queryKey: ["payroll-cycle", variables.appliedMonthKey] })
    },
  })
}

export function useUpdateSalaryAdjustment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiClient.patch<any>(`/payroll/adjustments/${id}`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-adjustments"] })
      queryClient.invalidateQueries({ queryKey: ["pending-adjustments-summary"] })
    },
  })
}

export function useAllSalaryAdjustments() {
  return useQuery({
    queryKey: ["salary-adjustments-all"],
    queryFn: async () => {
      return apiClient.get<any>("/payroll/adjustments")
    },
  })
}

export function useDeleteSalaryAdjustment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (adjustmentId: string) => {
      return apiClient.delete<any>(`/payroll/adjustments/${adjustmentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-adjustments"] })
      queryClient.invalidateQueries({ queryKey: ["pending-adjustments-summary"] })
    },
  })
}

export function useApplyPendingAdjustments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (appliedMonthKey: string) => {
      return apiClient.post<any>("/payroll/adjustments/apply", { appliedMonthKey })
    },
    onSuccess: (_, appliedMonthKey) => {
      queryClient.invalidateQueries({ queryKey: ["salary-adjustments"] })
      queryClient.invalidateQueries({ queryKey: ["pending-adjustments-summary", appliedMonthKey] })
      queryClient.invalidateQueries({ queryKey: ["payroll-cycle", appliedMonthKey] })
    },
  })
}
