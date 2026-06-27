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
    setOnline,
    addNotification,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    removeNotification,
    mergeNotifications,
  } = useNotificationStore();

  const disconnectRef = useRef(false);
  const lastMessageTime = useRef<number>(Date.now());
  const healthCheckIntervalId = useRef<ReturnType<typeof setInterval> | null>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const debounceTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerBatchedInvalidation = () => {
    if (debounceTimeoutId.current) {
      clearTimeout(debounceTimeoutId.current);
    }
    debounceTimeoutId.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      debounceTimeoutId.current = null;
    }, 300);
  };

  useEffect(() => {
    disconnectRef.current = false;

    const handleOnline = () => {
      setOnline(true);
      if (isAuthenticated && accessToken) {
        console.log('Network restored. Reconnecting notifications WebSocket immediately...');
        connect();
      }
    };

    const handleOffline = () => {
      setOnline(false);
      setWsConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial state setup
    setOnline(navigator.onLine);

    if (isAuthenticated && accessToken) {
      connect();
    } else {
      cleanupSocket();
    }

    return () => {
      disconnectRef.current = true;
      cleanupSocket();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (debounceTimeoutId.current) {
        clearTimeout(debounceTimeoutId.current);
      }
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
        lastMessageTime.current = Date.now();
        console.log('Notifications WebSocket successfully connected');

        // Setup health check ping-pong checker (every 10s)
        if (healthCheckIntervalId.current) clearInterval(healthCheckIntervalId.current);
        healthCheckIntervalId.current = setInterval(() => {
          // If no message from server for 40s (30s ping interval + 10s buffer), close & reconnect
          if (Date.now() - lastMessageTime.current > 40000) {
            console.warn('Notifications WebSocket health check failed (no messages for 40s). Reconnecting...');
            if (socketInstance) {
              socketInstance.close();
            }
          }
        }, 10000);
      };

      socket.onmessage = (event) => {
        lastMessageTime.current = Date.now();
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
        if (healthCheckIntervalId.current) {
          clearInterval(healthCheckIntervalId.current);
          healthCheckIntervalId.current = null;
        }

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
    // Exponential backoff capped at 30 seconds
    const baseDelay = Math.min(Math.pow(2, reconnectAttempts) * 1000, 30000);
    // Jitter to prevent thundering herd
    const jitter = Math.random() * 1000;
    const delay = baseDelay + jitter;

    console.log(`Notifications WebSocket disconnected. Retrying connection in ${Math.round(delay / 1000)}s (attempt ${reconnectAttempts})...`);

    reconnectTimeoutId = setTimeout(() => {
      connect();
    }, delay);
  }

  function cleanupSocket() {
    if (reconnectTimeoutId) {
      clearTimeout(reconnectTimeoutId);
      reconnectTimeoutId = null;
    }

    if (healthCheckIntervalId.current) {
      clearInterval(healthCheckIntervalId.current);
      healthCheckIntervalId.current = null;
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
        // Message Deduplication
        if (processedMessageIds.current.has(data.id)) {
          console.log(`Duplicate notification ignored: ${data.id}`);
          break;
        }
        processedMessageIds.current.add(data.id);
        if (processedMessageIds.current.size > 500) {
          const firstAdded = processedMessageIds.current.keys().next().value;
          if (firstAdded !== undefined) {
            processedMessageIds.current.delete(firstAdded);
          }
        }

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

        // Debounced batch query invalidation
        triggerBatchedInvalidation();

        // Real-time invalidation of festival bonus details and lists
        if (data.module === 'payroll') {
          queryClient.invalidateQueries({ queryKey: ["festivalCycles"] });
          queryClient.invalidateQueries({ queryKey: ["festivalCycleDetails"] });
        }
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
        
        // Invalidate targeted business module caches
        queryClient.invalidateQueries({ queryKey: ['leave-applications'] });
        queryClient.invalidateQueries({ queryKey: ['attendance'] });
        queryClient.invalidateQueries({ queryKey: ['claims'] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });

        // Debounced batch query invalidation
        triggerBatchedInvalidation();
        break;

      case 'reconnect_sync':
        if (data.notifications && data.notifications.length > 0) {
          // Deduplicate reconnect sync notifications
          const newNotifs = data.notifications.filter((n: any) => {
            if (processedMessageIds.current.has(n.id)) return false;
            processedMessageIds.current.add(n.id);
            return true;
          });

          if (newNotifs.length > 0) {
            mergeNotifications(newNotifs);
            toast.info(`You have ${newNotifs.length} new unread notifications`);
          }
        }
        triggerBatchedInvalidation();
        break;

      default:
        console.warn('Unhandled notifications WS event:', event);
    }
  }
}
