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
  const { setUnreadCount, isWsConnected } = useNotificationStore();
  
  return useQuery<{ unreadCount: number }>({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await apiClient.get<{ unreadCount: number }>('notifications/unread-count');
      setUnreadCount(response.unreadCount);
      return response;
    },
    refetchInterval: isWsConnected ? false : 60000, // Only poll when WebSocket is disconnected!
  });
}
 
export function useMarkAsReadMutation() {
  const queryClient = useQueryClient();
  const { markAsRead, setUnreadCount } = useNotificationStore();
 
  return useMutation<Notification, Error, string>({
    mutationFn: (id) => apiClient.patch<Notification>(`notifications/${id}/read`, {}),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications-list'] });
      await queryClient.cancelQueries({ queryKey: ['notifications-unread-count'] });
 
      const previousListQueries = queryClient.getQueriesData<any>({ queryKey: ['notifications-list'] });
      const previousUnreadCount = queryClient.getQueryData<{ unreadCount: number }>(['notifications-unread-count']);
      const previousStoreUnreadCount = useNotificationStore.getState().unreadCount;
 
      queryClient.setQueriesData<any>(
        { queryKey: ['notifications-list'] },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((n: any) =>
                n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
              ),
            })),
          };
        }
      );
 
      queryClient.setQueryData<{ unreadCount: number }>(['notifications-unread-count'], (old: any) => {
        if (!old) return old;
        return { unreadCount: Math.max(0, old.unreadCount - 1) };
      });
 
      markAsRead(id);
 
      return { previousListQueries, previousUnreadCount, previousStoreUnreadCount };
    },
    onError: (_err, _id, context: any) => {
      if (context?.previousListQueries) {
        context.previousListQueries.forEach(([queryKey, value]: any) => {
          queryClient.setQueryData(queryKey, value);
        });
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(['notifications-unread-count'], context.previousUnreadCount);
      }
      if (context?.previousStoreUnreadCount !== undefined) {
        setUnreadCount(context.previousStoreUnreadCount);
      }
      toast.error('Failed to mark notification as read');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}
 
export function useMarkAllAsReadMutation() {
  const queryClient = useQueryClient();
  const { markAllAsRead, setUnreadCount } = useNotificationStore();
 
  return useMutation<{ success: boolean }, Error, void>({
    mutationFn: () => apiClient.post<{ success: boolean }>('notifications/mark-all-read', {}),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications-list'] });
      await queryClient.cancelQueries({ queryKey: ['notifications-unread-count'] });
 
      const previousListQueries = queryClient.getQueriesData<any>({ queryKey: ['notifications-list'] });
      const previousUnreadCount = queryClient.getQueryData<{ unreadCount: number }>(['notifications-unread-count']);
      const previousStoreUnreadCount = useNotificationStore.getState().unreadCount;
 
      queryClient.setQueriesData<any>(
        { queryKey: ['notifications-list'] },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((n: any) => ({
                ...n,
                isRead: true,
                readAt: new Date().toISOString(),
              })),
            })),
          };
        }
      );
 
      queryClient.setQueryData<{ unreadCount: number }>(['notifications-unread-count'], { unreadCount: 0 });
 
      markAllAsRead();
 
      return { previousListQueries, previousUnreadCount, previousStoreUnreadCount };
    },
    onError: (_err, _1, context: any) => {
      if (context?.previousListQueries) {
        context.previousListQueries.forEach(([queryKey, value]: any) => {
          queryClient.setQueryData(queryKey, value);
        });
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(['notifications-unread-count'], context.previousUnreadCount);
      }
      if (context?.previousStoreUnreadCount !== undefined) {
        setUnreadCount(context.previousStoreUnreadCount);
      }
      toast.error('Failed to mark all as read');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}
 
export function useArchiveMutation() {
  const queryClient = useQueryClient();
  const { archiveNotification, setUnreadCount } = useNotificationStore();
 
  return useMutation<Notification, Error, string>({
    mutationFn: (id) => apiClient.patch<Notification>(`notifications/${id}/archive`, {}),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications-list'] });
      await queryClient.cancelQueries({ queryKey: ['notifications-unread-count'] });
 
      const previousListQueries = queryClient.getQueriesData<any>({ queryKey: ['notifications-list'] });
      const previousUnreadCount = queryClient.getQueryData<{ unreadCount: number }>(['notifications-unread-count']);
      const previousStoreUnreadCount = useNotificationStore.getState().unreadCount;
 
      let isUnread = false;
 
      queryClient.setQueriesData<any>(
        { queryKey: ['notifications-list'] },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => {
              const updatedData = page.data.map((n: any) => {
                if (n.id === id) {
                  isUnread = !n.isRead;
                  return { ...n, isArchived: true };
                }
                return n;
              });
              return {
                ...page,
                data: updatedData,
              };
            }),
          };
        }
      );
 
      if (isUnread) {
        queryClient.setQueryData<{ unreadCount: number }>(['notifications-unread-count'], (old: any) => {
          if (!old) return old;
          return { unreadCount: Math.max(0, old.unreadCount - 1) };
        });
      }
 
      archiveNotification(id);
 
      return { previousListQueries, previousUnreadCount, previousStoreUnreadCount };
    },
    onError: (_err, _id, context: any) => {
      if (context?.previousListQueries) {
        context.previousListQueries.forEach(([queryKey, value]: any) => {
          queryClient.setQueryData(queryKey, value);
        });
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(['notifications-unread-count'], context.previousUnreadCount);
      }
      if (context?.previousStoreUnreadCount !== undefined) {
        setUnreadCount(context.previousStoreUnreadCount);
      }
      toast.error('Failed to archive notification');
    },
    onSettled: () => {
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
  const { removeNotification, setUnreadCount } = useNotificationStore();
 
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (id) => apiClient.delete<{ success: boolean }>(`notifications/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications-list'] });
      await queryClient.cancelQueries({ queryKey: ['notifications-unread-count'] });
 
      const previousListQueries = queryClient.getQueriesData<any>({ queryKey: ['notifications-list'] });
      const previousUnreadCount = queryClient.getQueryData<{ unreadCount: number }>(['notifications-unread-count']);
      const previousStoreUnreadCount = useNotificationStore.getState().unreadCount;
 
      let isUnread = false;
 
      queryClient.setQueriesData<any>(
        { queryKey: ['notifications-list'] },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => {
              const updatedData = page.data.filter((n: any) => {
                if (n.id === id) {
                  isUnread = !n.isRead && !n.isArchived;
                  return false;
                }
                return true;
              });
              return {
                ...page,
                data: updatedData,
              };
            }),
          };
        }
      );
 
      if (isUnread) {
        queryClient.setQueryData<{ unreadCount: number }>(['notifications-unread-count'], (old: any) => {
          if (!old) return old;
          return { unreadCount: Math.max(0, old.unreadCount - 1) };
        });
      }
 
      removeNotification(id);
 
      return { previousListQueries, previousUnreadCount, previousStoreUnreadCount };
    },
    onError: (_err, _id, context: any) => {
      if (context?.previousListQueries) {
        context.previousListQueries.forEach(([queryKey, value]: any) => {
          queryClient.setQueryData(queryKey, value);
        });
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(['notifications-unread-count'], context.previousUnreadCount);
      }
      if (context?.previousStoreUnreadCount !== undefined) {
        setUnreadCount(context.previousStoreUnreadCount);
      }
      toast.error('Failed to delete notification');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
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
