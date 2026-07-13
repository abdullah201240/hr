import { create } from 'zustand';
import { apiClient } from '../lib/api';

export interface ChatMember {
  id: string;
  fullNameEnglish: string;
  email: string;
  employeePhotoUrl: string | null;
  role: string;
  lastReadAt: string;
  presence: 'online' | 'offline';
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isDeleted: boolean;
  senderName: string;
  senderPhotoUrl: string | null;
  isPending?: boolean;
  clientMessageId?: string;
}

export interface ChatRoom {
  id: string;
  name: string | null;
  displayName: string;
  displayPhotoUrl: string | null;
  type: 'direct' | 'channel';
  description: string;
  isPrivate: boolean;
  createdAt: string;
  unreadCount: number;
  members: ChatMember[];
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderName: string;
  } | null;
}

interface ChatState {
  rooms: ChatRoom[];
  messages: Record<string, ChatMessage[]>; // Key: roomId, Value: message logs
  typingStatus: Record<string, Record<string, { senderName: string; timestamp: number }>>; // Key: roomId -> employeeId
  activeRoomId: string | null;
  isWsConnected: boolean;
  isLoadingRooms: boolean;
  isLoadingMessages: boolean;

  setWsConnected: (connected: boolean) => void;
  setActiveRoomId: (roomId: string | null) => void;
  fetchRooms: () => Promise<void>;
  fetchMessages: (roomId: string, cursor?: string) => Promise<void>;
  addIncomingMessage: (message: ChatMessage) => void;
  addOptimisticMessage: (roomId: string, message: ChatMessage) => void;
  addIncomingMessageEdit: (message: ChatMessage) => void;
  addIncomingMessageDelete: (roomId: string, messageId: string, message: ChatMessage) => void;
  setTyping: (roomId: string, employeeId: string, senderName: string, isTyping: boolean) => void;
  updateMemberPresence: (employeeId: string, status: 'online' | 'offline') => void;
  updateMemberReadReceipt: (roomId: string, employeeId: string) => void;
  createChannel: (name: string, description: string, isPrivate: boolean) => Promise<ChatRoom>;
  getOrCreateDirectRoom: (recipientId: string) => Promise<ChatRoom>;
  addMemberToChannel: (roomId: string, employeeId: string) => Promise<void>;
  leaveOrRemoveFromChannel: (roomId: string, employeeId: string) => Promise<void>;
  addIncomingRoom: (room: ChatRoom) => void;
  removeIncomingRoom: (roomId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  messages: {},
  typingStatus: {},
  activeRoomId: typeof window !== 'undefined' ? localStorage.getItem('activeRoomId') : null,
  isWsConnected: false,
  isLoadingRooms: false,
  isLoadingMessages: false,

  setWsConnected: (connected) => set({ isWsConnected: connected }),

  setActiveRoomId: (roomId) => {
    set({ activeRoomId: roomId });
    if (typeof window !== 'undefined') {
      if (roomId) {
        localStorage.setItem('activeRoomId', roomId);
      } else {
        localStorage.removeItem('activeRoomId');
      }
    }
    if (roomId) {
      set((state) => ({
        rooms: state.rooms.map((room) =>
          room.id === roomId ? { ...room, unreadCount: 0 } : room
        ),
      }));
    }
  },

  fetchRooms: async () => {
    set({ isLoadingRooms: true });
    try {
      const rooms = await apiClient.get<ChatRoom[]>('chat/rooms');
      set({ rooms, isLoadingRooms: false });
    } catch {
      set({ isLoadingRooms: false });
    }
  },

  fetchMessages: async (roomId, cursor) => {
    set({ isLoadingMessages: true });
    try {
      const endpoint = cursor
        ? `chat/rooms/${roomId}/messages?cursor=${cursor}`
        : `chat/rooms/${roomId}/messages`;
      
      const newMessages = await apiClient.get<ChatMessage[]>(endpoint);
      
      set((state) => {
        const existingMessages = state.messages[roomId] || [];
        const merged = cursor
          ? [...newMessages, ...existingMessages]
          : newMessages;
        
        const map = new Map(merged.map((m) => [m.id, m]));
        const unique = Array.from(map.values()).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        return {
          messages: {
            ...state.messages,
            [roomId]: unique,
          },
          isLoadingMessages: false,
        };
      });
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  addIncomingMessage: (message) => {
    set((state) => {
      const roomId = message.roomId;
      const roomMessages = state.messages[roomId] || [];

      if (roomMessages.some((m) => m.id === message.id)) {
        return state;
      }

      // Filter out optimistic/pending messages matching clientMessageId
      const filtered = roomMessages.filter((m) => {
        if (message.clientMessageId && m.clientMessageId === message.clientMessageId) {
          return false;
        }
        return true;
      });

      const updatedMessages = [...filtered, message].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const isRoomActive = state.activeRoomId === roomId;
      const updatedRooms = state.rooms.map((room) => {
        if (room.id === roomId) {
          return {
            ...room,
            unreadCount: isRoomActive ? 0 : room.unreadCount + 1,
            lastMessage: {
              id: message.id,
              content: message.isDeleted ? 'This message was deleted.' : message.content,
              createdAt: message.createdAt,
              senderName: message.senderName,
            },
          };
        }
        return room;
      }).sort((a, b) => {
        const dateA = a.lastMessage?.createdAt || a.createdAt;
        const dateB = b.lastMessage?.createdAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      return {
        messages: {
          ...state.messages,
          [roomId]: updatedMessages,
        },
        rooms: updatedRooms,
      };
    });
  },

  addIncomingMessageEdit: (message) => {
    set((state) => {
      const roomId = message.roomId;
      const roomMessages = state.messages[roomId] || [];
      const updatedMessages = roomMessages.map((m) =>
        m.id === message.id ? message : m
      );

      const updatedRooms = state.rooms.map((room) => {
        if (room.id === roomId && room.lastMessage?.id === message.id) {
          return {
            ...room,
            lastMessage: {
              ...room.lastMessage,
              content: message.content,
            },
          };
        }
        return room;
      });

      return {
        messages: {
          ...state.messages,
          [roomId]: updatedMessages,
        },
        rooms: updatedRooms,
      };
    });
  },

  addIncomingMessageDelete: (roomId, messageId, message) => {
    set((state) => {
      const roomMessages = state.messages[roomId] || [];
      const updatedMessages = roomMessages.map((m) =>
        m.id === messageId ? message : m
      );

      const updatedRooms = state.rooms.map((room) => {
        if (room.id === roomId && room.lastMessage?.id === messageId) {
          return {
            ...room,
            lastMessage: {
              ...room.lastMessage,
              content: 'This message was deleted.',
            },
          };
        }
        return room;
      });

      return {
        messages: {
          ...state.messages,
          [roomId]: updatedMessages,
        },
        rooms: updatedRooms,
      };
    });
  },

  setTyping: (roomId, employeeId, senderName, isTyping) => {
    set((state) => {
      const roomTyping = { ...(state.typingStatus[roomId] || {}) };
      if (isTyping) {
        roomTyping[employeeId] = { senderName, timestamp: Date.now() };
      } else {
        delete roomTyping[employeeId];
      }
      return {
        typingStatus: {
          ...state.typingStatus,
          [roomId]: roomTyping,
        },
      };
    });
  },

  updateMemberPresence: (employeeId, status) => {
    set((state) => ({
      rooms: state.rooms.map((room) => ({
        ...room,
        members: room.members.map((m) =>
          m.id === employeeId ? { ...m, presence: status } : m
        ),
        displayName: room.type === 'direct' && room.members.find(m => m.id === employeeId)
          ? room.members.find(m => m.id === employeeId)!.fullNameEnglish
          : room.displayName,
      })),
    }));
  },

  updateMemberReadReceipt: (roomId, employeeId) => {
    set((state) => ({
      rooms: state.rooms.map((room) => {
        if (room.id === roomId) {
          return {
            ...room,
            members: room.members.map((m) =>
              m.id === employeeId ? { ...m, lastReadAt: new Date().toISOString() } : m
            ),
          };
        }
        return room;
      }),
    }));
  },

  createChannel: async (name, description, isPrivate) => {
    const room = await apiClient.post<ChatRoom>('chat/rooms/channel', {
      name,
      description,
      isPrivate,
    });
    const enrichedRoom: ChatRoom = {
      ...room,
      displayName: name,
      displayPhotoUrl: null,
      unreadCount: 0,
      members: room.members || [],
      lastMessage: null,
    };
    set((state) => ({
      rooms: [enrichedRoom, ...state.rooms],
    }));
    return enrichedRoom;
  },

  getOrCreateDirectRoom: async (recipientId) => {
    const room = await apiClient.post<ChatRoom>('chat/rooms/direct', { recipientId });
    get().addIncomingRoom(room);
    return room;
  },

  addMemberToChannel: async (roomId, employeeId) => {
    await apiClient.post(`chat/rooms/${roomId}/members`, { employeeId });
    await get().fetchRooms();
  },

  leaveOrRemoveFromChannel: async (roomId, employeeId) => {
    await apiClient.delete(`chat/rooms/${roomId}/members/${employeeId}`);
    await get().fetchRooms();
  },

  addIncomingRoom: (room) => {
    set((state) => {
      const exists = state.rooms.some((r) => r.id === room.id);
      let updatedRooms;
      if (exists) {
        // Merge/update the existing room in-place to avoid state conflicts
        updatedRooms = state.rooms.map((r) => r.id === room.id ? { ...r, ...room } : r);
      } else {
        // Prepend new room
        updatedRooms = [room, ...state.rooms];
      }

      // Re-sort the room list by last message date, or creation date
      updatedRooms.sort((a, b) => {
        const dateA = a.lastMessage?.createdAt || a.createdAt;
        const dateB = b.lastMessage?.createdAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      return { rooms: updatedRooms };
    });
  },

  removeIncomingRoom: (roomId) => {
    set((state) => {
      const nextActiveRoomId = state.activeRoomId === roomId ? null : state.activeRoomId;
      if (typeof window !== 'undefined') {
        if (nextActiveRoomId) {
          localStorage.setItem('activeRoomId', nextActiveRoomId);
        } else {
          localStorage.removeItem('activeRoomId');
        }
      }
      return {
        rooms: state.rooms.filter((r) => r.id !== roomId),
        activeRoomId: nextActiveRoomId,
      };
    });
  },

  addOptimisticMessage: (roomId, message) => {
    set((state) => {
      const roomMessages = state.messages[roomId] || [];
      return {
        messages: {
          ...state.messages,
          [roomId]: [...roomMessages, message],
        },
      };
    });
  },
}));
