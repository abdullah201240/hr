import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useNotificationStore } from '../store/useNotificationStore';
import type { Notification, NotificationPreferences, NotificationListResponse } from '../types/notifications';
import { toast } from 'sonner';

export function useNotificationsInfiniteQuery(filters: {
  module?: string;
  category?: string;
  isRead?: string;
  isArchived?: string;
  priority?: string;
} = {}) {

  return useInfiniteQuery<NotificationListResponse>({
    queryKey: ['notifications-list', filters],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, any> = { ...filters };
      if (pageParam) {
        params.cursor = pageParam;
      }
      const response = await apiClient.get<NotificationListResponse>('notifications', { params });
      return response;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });
}

export function useUnreadCountQuery() {
  const { setUnreadCount } = useNotificationStore();
  
  return useQuery<{ unreadCount: number }>({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await apiClient.get<{ unreadCount: number }>('notifications/unread-count');
      setUnreadCount(response.unreadCount);
      return response;
    },
    refetchInterval: 60000, // Fallback poll every 60s
  });
}

export function useMarkAsReadMutation() {
  const queryClient = useQueryClient();
  const { markAsRead } = useNotificationStore();

  return useMutation<Notification, Error, string>({
    mutationFn: (id) => apiClient.patch<Notification>(`notifications/${id}/read`, {}),
    onSuccess: (_, id) => {
      markAsRead(id);
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

export function useMarkAllAsReadMutation() {
  const queryClient = useQueryClient();
  const { markAllAsRead } = useNotificationStore();

  return useMutation<{ success: boolean }, Error, void>({
    mutationFn: () => apiClient.post<{ success: boolean }>('notifications/mark-all-read', {}),
    onSuccess: () => {
      markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('All notifications marked as read');
    },
  });
}

export function useArchiveMutation() {
  const queryClient = useQueryClient();
  const { archiveNotification } = useNotificationStore();

  return useMutation<Notification, Error, string>({
    mutationFn: (id) => apiClient.patch<Notification>(`notifications/${id}/archive`, {}),
    onSuccess: (_, id) => {
      archiveNotification(id);
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

export function useArchiveAllReadMutation() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, void>({
    mutationFn: () => apiClient.post<{ success: boolean }>('notifications/archive-all-read', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('All read notifications archived');
    },
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();
  const { removeNotification } = useNotificationStore();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: boolean }>(`notifications/${id}`),
    onSuccess: (_, id) => {
      removeNotification(id);
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('Notification deleted');
    },
  });
}

export function usePreferencesQuery() {
  return useQuery<NotificationPreferences>({
    queryKey: ['notification-preferences'],
    queryFn: () => apiClient.get<NotificationPreferences>('notifications/preferences'),
  });
}

export function useUpdatePreferencesMutation() {
  const queryClient = useQueryClient();

  return useMutation<NotificationPreferences, Error, Partial<NotificationPreferences>>({
    mutationFn: (dto) => apiClient.patch<NotificationPreferences>('notifications/preferences', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Notification preferences updated');
    },
  });
}

export function useExecuteActionMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; response: any },
    Error,
    { notificationId: string; actionIndex: number }
  >({
    mutationFn: ({ notificationId, actionIndex }) =>
      apiClient.post(`notifications/${notificationId}/actions/${actionIndex}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      // Invalidate relevant business modules caches specifically
      queryClient.invalidateQueries({ queryKey: ['leave-applications'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
