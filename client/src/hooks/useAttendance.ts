import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface AttendanceRecord {
  day: number;
  dateStr: string;
  dayName: string;
  status: "present" | "late" | "absent" | "leave" | "holiday" | "weekend" | "upcoming";
  checkIn: string | null;
  checkOut: string | null;
  hours: number | null;
  breakHours: number;
  location: "Office" | "Remote" | null;
  ipAddress: string | null;
  device: string | null;
  notes?: string;
  correctionStatus?: "none" | "pending" | "approved" | "rejected";
  proposedCheckIn?: string;
  proposedCheckOut?: string;
  correctionReason?: string;
}

export function useMyAttendanceQuery(year: number, month: number) {
  return useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "my-logs", year, month],
    queryFn: () =>
      apiClient.get<AttendanceRecord[]>(`attendance/my-logs?year=${year}&month=${month}`),
    staleTime: 60 * 1000, // 1 min stale time
  });
}

export function useCheckInMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { location: string; ipAddress?: string; device?: string; notes?: string }>({
    mutationFn: (payload) => apiClient.post("attendance/check-in", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useCheckOutMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { notes?: string }>({
    mutationFn: (payload) => apiClient.post("attendance/check-out", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useSubmitCorrectionMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { date: string; proposedCheckIn: string; proposedCheckOut: string; correctionReason: string }>({
    mutationFn: (payload) => apiClient.post("attendance/correction", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

// ─── Admin/HR hooks ─────────────────────────────────────────────────────────

export function useDailyAttendanceQuery(dateStr: string) {
  return useQuery<any[]>({
    queryKey: ["attendance", "daily", dateStr],
    queryFn: () => apiClient.get<any[]>(`attendance/daily?date=${dateStr}`),
    staleTime: 30 * 1000,
  });
}

export function useApproveCorrectionMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: (id) => apiClient.post(`attendance/correction/approve/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useRejectCorrectionMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: (id) => apiClient.post(`attendance/correction/reject/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function usePendingCorrectionsQuery() {
  return useQuery<any[]>({
    queryKey: ["attendance", "pending-corrections"],
    queryFn: () => apiClient.get<any[]>("attendance/corrections/pending"),
    staleTime: 30 * 1000,
  });
}

export function useOverrideAttendanceMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    any,
    Error,
    {
      employeeId: string;
      date: string;
      status: string;
      checkIn?: string;
      checkOut?: string;
      notes?: string;
    }
  >({
    mutationFn: (payload) => apiClient.post("attendance/admin/override", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

