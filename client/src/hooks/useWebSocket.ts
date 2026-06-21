import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';

let socketInstance: WebSocket | null = null;
let reconnectTimeoutId: any = null;
let reconnectAttempts = 0;

/**
 * Send an event over the global WebSocket channel
 */
export const sendWSMessage = (event: string, data: any) => {
  if (socketInstance && socketInstance.readyState === WebSocket.OPEN) {
    socketInstance.send(JSON.stringify({ event, data }));
    return true;
  }
  return false;
};

export function useWebSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const { 
    setWsConnected, 
    addIncomingMessage, 
    addIncomingMessageEdit,
    addIncomingMessageDelete,
    setTyping, 
    updateMemberPresence, 
    updateMemberReadReceipt,
    addIncomingRoom,
    removeIncomingRoom
  } = useChatStore();


  
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
    
    // Construct the WSS/WS connection URL dynamically
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    const wsBase = API_BASE_URL.replace(/^http/, 'ws').replace(/\/api$/, '');
    const wsUrl = `${wsBase}/chat?token=${accessToken}`;

    cleanupSocket();

    try {
      const socket = new WebSocket(wsUrl);
      socketInstance = socket;

      socket.onopen = () => {
        reconnectAttempts = 0;
        setWsConnected(true);
        console.log('WebSocket successfully connected');
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          handleIncomingEvent(payload);
        } catch (err) {
          console.error('Failed to parse incoming WS message frame:', err);
        }
      };

      socket.onclose = (event) => {
        setWsConnected(false);
        socketInstance = null;
        
        // Attempt automatic reconnection if not explicitly logged out or unmounted
        if (!disconnectRef.current && event.code !== 4001) {
          scheduleReconnection();
        }
      };

      socket.onerror = () => {
        socket.close();
      };

    } catch (err) {
      console.error('Failed to establish WebSocket link:', err);
      scheduleReconnection();
    }
  }

  function scheduleReconnection() {
    if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);

    reconnectAttempts++;
    // Exponential backoff capped at 30 seconds
    const delay = Math.min(Math.pow(1.5, reconnectAttempts) * 1000, 30000);
    
    console.log(`WebSocket disconnected. Retrying connection in ${Math.round(delay / 1000)}s...`);
    
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
      // Force shutdown event listener to avoid infinite reload triggers on close
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
        console.log('WebSocket server handshake completed successfully');
        break;
      
      case 'message':
        addIncomingMessage(data);
        break;

      case 'message_edit':
        addIncomingMessageEdit(data);
        break;

      case 'message_delete':
        addIncomingMessageDelete(data.roomId, data.messageId, data.message);
        break;

      case 'typing':

        setTyping(data.roomId, data.employeeId, data.senderName, data.isTyping);
        break;

      case 'presence':
        updateMemberPresence(data.employeeId, data.status);
        break;

      case 'readReceipt':
        updateMemberReadReceipt(data.roomId, data.employeeId);
        break;

      case 'room_created':
        addIncomingRoom(data);
        break;

      case 'room_deleted':
        removeIncomingRoom(data.roomId);
        break;

      case 'error':
        console.error('Server WebSocket Error Payload:', data.message);
        break;
      
      default:
        console.warn('Unhandled WebSocket payload format:', event);
    }
  }
}
