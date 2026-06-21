import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

let socketInstance: WebSocket | null = null;
let reconnectTimeoutId: any = null;
let reconnectAttempts = 0;

export function useNotificationSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const {
    setWsConnected,
    addNotification,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    removeNotification,
    mergeNotifications,
  } = useNotificationStore();

  const disconnectRef = useRef(false);

  useEffect(() => {
    disconnectRef.current = false;

    if (!isAuthenticated || !accessToken) {
      cleanupSocket();
      return;
    }

    connect();

    return () => {
      disconnectRef.current = true;
      cleanupSocket();
    };
  }, [accessToken, isAuthenticated]);

  function connect() {
    if (disconnectRef.current) return;

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    const urlObj = new URL(API_BASE_URL);
    const protocol = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = urlObj.host;
    const path = urlObj.pathname.endsWith('/api') ? urlObj.pathname.slice(0, -4) : urlObj.pathname;
    const wsUrl = `${protocol}//${host}${path}/notifications?token=${accessToken}`;

    cleanupSocket();

    try {
      const socket = new WebSocket(wsUrl);
      socketInstance = socket;

      socket.onopen = () => {
        reconnectAttempts = 0;
        setWsConnected(true);
        console.log('Notifications WebSocket successfully connected');
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          handleIncomingEvent(payload);
        } catch (err) {
          console.error('Failed to parse incoming Notifications WS message frame:', err);
        }
      };

      socket.onclose = (event) => {
        setWsConnected(false);
        socketInstance = null;

        if (!disconnectRef.current && event.code !== 4001) {
          scheduleReconnection();
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    } catch (err) {
      console.error('Failed to establish Notifications WebSocket link:', err);
      scheduleReconnection();
    }
  }

  function scheduleReconnection() {
    if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);

    reconnectAttempts++;
    const delay = Math.min(Math.pow(1.5, reconnectAttempts) * 1000, 30000);

    reconnectTimeoutId = setTimeout(() => {
      connect();
    }, delay);
  }

  function cleanupSocket() {
    if (reconnectTimeoutId) {
      clearTimeout(reconnectTimeoutId);
      reconnectTimeoutId = null;
    }

    if (socketInstance) {
      socketInstance.onclose = null;
      socketInstance.onerror = null;
      socketInstance.close();
      socketInstance = null;
    }

    setWsConnected(false);
  }

  function handleIncomingEvent(payload: { event: string; data: any }) {
    const { event, data } = payload;

    switch (event) {
      case 'connection_ack':
        break;

      case 'notification_new':
        addNotification(data);
        // Show real-time feedback toast
        toast(data.title, {
          description: data.message,
          action: data.actionUrl
            ? {
                label: 'View',
                onClick: () => {
                  navigate(data.actionUrl);
                },
              }
            : undefined,
        });
        // Invalidate queries to update lists
        queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        break;

      case 'notification_read':
        markAsRead(data.id);
        break;

      case 'notification_mark_all_read':
        markAllAsRead();
        break;

      case 'notification_archived':
        archiveNotification(data.id);
        break;

      case 'notification_deleted':
        removeNotification(data.id);
        break;

      case 'notification_action_result':
        if (data.success) {
          toast.success(`Action: ${data.actionTaken} completed successfully`);
        } else {
          toast.error(`Action failed: ${data.error || 'Unknown error'}`);
        }
        queryClient.invalidateQueries();
        break;

      case 'reconnect_sync':
        if (data.notifications && data.notifications.length > 0) {
          mergeNotifications(data.notifications);
          toast.info(`You have ${data.notifications.length} new unread notifications`);
        }
        queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        break;

      default:
        console.warn('Unhandled notifications WS event:', event);
    }
  }
}
