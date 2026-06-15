import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  AttendanceSettings,
  Holiday,
  UpdateAttendanceSettingsPayload,
  CreateHolidayPayload,
  UpdateHolidayPayload,
} from "@/types";

// ─── Settings (singleton) ────────────────────────────────────────────────

export function useAttendanceSettingsQuery() {
  return useQuery<AttendanceSettings>({
    queryKey: ["attendanceSettings"],
    queryFn: () =>
      apiClient.get<AttendanceSettings>("attendance-settings"),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useUpdateAttendanceSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation<AttendanceSettings, Error, UpdateAttendanceSettingsPayload>({
    mutationFn: (payload) =>
      apiClient.patch<AttendanceSettings>("attendance-settings", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendanceSettings"] });
    },
  });
}

// ─── Holidays ────────────────────────────────────────────────────────────

export function useHolidaysQuery() {
  return useQuery<Holiday[]>({
    queryKey: ["holidays"],
    queryFn: () => apiClient.get<Holiday[]>("attendance-settings/holidays"),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useCreateHolidayMutation() {
  const queryClient = useQueryClient();
  return useMutation<Holiday, Error, CreateHolidayPayload>({
    mutationFn: (payload) =>
      apiClient.post<Holiday>("attendance-settings/holidays", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
    },
  });
}

export function useUpdateHolidayMutation() {
  const queryClient = useQueryClient();
  return useMutation<Holiday, Error, { id: string; payload: UpdateHolidayPayload }>({
    mutationFn: ({ id, payload }) =>
      apiClient.patch<Holiday>(`attendance-settings/holidays/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
    },
  });
}

export function useDeleteHolidayMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) =>
      apiClient.delete<{ message: string }>(`attendance-settings/holidays/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
    },
  });
}
