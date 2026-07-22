import { create } from 'zustand';
import type { Notification } from '../types/notifications';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isWsConnected: boolean;
  isOnline: boolean;
  isLoading: boolean;
 
  setWsConnected: (connected: boolean) => void;
  setOnline: (online: boolean) => void;
  setLoading: (loading: boolean) => void;
  setUnreadCount: (count: number) => void;
  setNotifications: (list: Notification[]) => void;
  
  // Merge missed notifications from reconnect sync
  mergeNotifications: (list: Notification[]) => void;

  addNotification: (n: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  archiveNotification: (id: string) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isWsConnected: false,
  isOnline: typeof window !== 'undefined' ? window.navigator.onLine : true,
  isLoading: false,
 
  setWsConnected: (connected) => set({ isWsConnected: connected }),
  setOnline: (online) => set({ isOnline: online }),
  setLoading: (loading) => set({ isLoading: loading }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  
  setNotifications: (list) => set({ notifications: list }),

  mergeNotifications: (list) =>
    set((state) => {
      const existingIds = new Set(state.notifications.map((n) => n.id));
      const filteredMissed = list.filter((n) => !existingIds.has(n.id));
      
      // Combine lists and sort by createdAt DESC
      const combined = [...filteredMissed, ...state.notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Recalculate unread count
      const unread = combined.filter((n) => !n.isRead && !n.isArchived).length;

      return {
        notifications: combined,
        unreadCount: unread,
      };
    }),

  addNotification: (n) =>
    set((state) => {
      // Avoid duplicate adds
      if (state.notifications.some((existing) => existing.id === n.id)) {
        return state;
      }
      const updatedList = [n, ...state.notifications];
      return {
        notifications: updatedList,
        unreadCount: n.isRead ? state.unreadCount : state.unreadCount + 1,
      };
    }),

  markAsRead: (id) =>
    set((state) => {
      let unreadDiff = 0;
      const list = state.notifications.map((n) => {
        if (n.id === id && !n.isRead) {
          unreadDiff = -1;
          return { ...n, isRead: true, readAt: new Date().toISOString() };
        }
        return n;
      });
      return {
        notifications: list,
        unreadCount: Math.max(0, state.unreadCount + unreadDiff),
      };
    }),

  markAllAsRead: () =>
    set((state) => {
      const list = state.notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: new Date().toISOString(),
      }));
      return {
        notifications: list,
        unreadCount: 0,
      };
    }),

  archiveNotification: (id) =>
    set((state) => {
      let unreadDiff = 0;
      const list = state.notifications.map((n) => {
        if (n.id === id) {
          if (!n.isRead) {
            unreadDiff = -1;
          }
          return { ...n, isArchived: true };
        }
        return n;
      });
      // Filters out archived items from the active list
      const filtered = list.filter((n) => !n.isArchived);
      return {
        notifications: filtered,
        unreadCount: Math.max(0, state.unreadCount + unreadDiff),
      };
    }),

  removeNotification: (id) =>
    set((state) => {
      const target = state.notifications.find((n) => n.id === id);
      const isUnread = target ? !target.isRead && !target.isArchived : false;
      const list = state.notifications.filter((n) => n.id !== id);
      return {
        notifications: list,
        unreadCount: isUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    }),
}));
