import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Hash, 
  MessageSquare, 
  Send, 
  Plus, 
  Search, 
  Wifi, 
  WifiOff, 
  UserPlus,
  LogOut,
  ChevronRight,
  Info,
  PlusCircle,
  MessageCircle,
  Pencil,
  Trash2,
  X,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Phone,
  Video,
  ArrowUpRight,
  ArrowDownLeft,
  PhoneOff,
  RefreshCw
} from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import type { ChatMessage } from '../../store/useChatStore';
import { sendWSMessage } from '../../hooks/useWebSocket';
import { useAuthStore } from '../../store/useAuthStore';
import { useCallStore } from '../../store/useCallStore';
import { apiClient } from '../../lib/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface SimplifiedEmployee {
  id: string;
  fullNameEnglish: string;
  email: string;
  employeePhotoUrl: string | null;
}

export default function ChatPage() {
  const { 
    rooms, 
    messages, 
    typingStatus, 
    activeRoomId, 
    isWsConnected, 
    setActiveRoomId, 
    fetchRooms, 
    fetchMessages, 
    createChannel, 
    getOrCreateDirectRoom,
    addMemberToChannel,
    leaveOrRemoveFromChannel,
    addOptimisticMessage
  } = useChatStore();

  const { callLogs, fetchCallLogs } = useCallStore();

  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'chats' | 'calls'>('chats');
  const [inputVal, setInputVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showDMModal, setShowDMModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // Message edit state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  
  // AlertDialog delete and loading states
  const [messageToDeleteId, setMessageToDeleteId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Channel creation state
  const [channelName, setChannelName] = useState('');
  const [channelDesc, setChannelDesc] = useState('');
  const [channelPrivate, setChannelPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  // DM creation state
  const [employeesList, setEmployeesList] = useState<SimplifiedEmployee[]>([]);
  const [dmSearchText, setDmSearchText] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Invite member state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSearchText, setInviteSearchText] = useState('');

  // Refs for auto-scroll and typing debounces
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    fetchRooms();
    fetchEmployees();
    fetchCallLogs();
  }, [fetchRooms, fetchCallLogs]);

  // Fetch messages when active room changes
  useEffect(() => {
    if (activeRoomId) {
      fetchMessages(activeRoomId);
      // Send read receipt notification
      sendWSMessage('readReceipt', { roomId: activeRoomId });
      // Reset edit mode on room switch
      setEditingMessageId(null);
      setInputVal('');
    }
  }, [activeRoomId]);

  // Scroll to bottom on new messages
  const roomMessages = useMemo(() => {
    return activeRoomId ? messages[activeRoomId] || [] : [];
  }, [activeRoomId, messages]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [roomMessages]);

  const activeRoom = useMemo(() => {
    return rooms.find((r) => r.id === activeRoomId) || null;
  }, [rooms, activeRoomId]);

  async function fetchEmployees() {
    setLoadingEmployees(true);
    try {
      const list = await apiClient.get<SimplifiedEmployee[]>('employees/options');
      setEmployeesList(list);
    } catch {
      toast.error('Failed to load employee list');
    } finally {
      setLoadingEmployees(false);
    }
  }

  // Handle message send or edit save
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || !activeRoomId) return;

    if (editingMessageId) {
      // Edit mode
      const success = sendWSMessage('editMessage', {
        messageId: editingMessageId,
        content: inputVal.trim(),
      });
      if (success) {
        setEditingMessageId(null);
        setInputVal('');
      } else {
        toast.error('Failed to edit. WebSocket disconnected.');
      }
    } else {
      // Create mode
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      if (user) {
        addOptimisticMessage(activeRoomId, {
          id: tempId,
          roomId: activeRoomId,
          senderId: user.id,
          content: inputVal.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isEdited: false,
          isDeleted: false,
          senderName: user.fullNameEnglish,
          senderPhotoUrl: user.employeePhotoUrl || null,
          isPending: true,
          clientMessageId: tempId,
        });
      }

      const success = sendWSMessage('sendMessage', {
        roomId: activeRoomId,
        content: inputVal.trim(),
        clientMessageId: tempId,
      });
      if (success) {
        setInputVal('');
        handleStopTyping();
      } else {
        toast.error('Failed to send. Reconnecting to WebSocket...');
      }
    }
  };

  // Handle typing state broadcast
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputVal(e.target.value);
    if (!activeRoomId || editingMessageId) return; // Disable typing indicators on edits

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendWSMessage('typing', { roomId: activeRoomId, isTyping: true });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2500);
  };

  // Up-Arrow / Escape hotkey overrides
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'ArrowUp' && !inputVal.trim() && activeRoomId) {
      // Select the last message sent by user in this room that isn't deleted
      const myMsgs = roomMessages.filter((m) => m.senderId === user?.id && !m.isDeleted);
      if (myMsgs.length > 0) {
        const lastMsg = myMsgs[myMsgs.length - 1];
        setEditingMessageId(lastMsg.id);
        setInputVal(lastMsg.content);
      }
    } else if (e.key === 'Escape') {
      if (editingMessageId) {
        setEditingMessageId(null);
        setInputVal('');
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleStopTyping = () => {
    if (isTypingRef.current && activeRoomId) {
      isTypingRef.current = false;
      sendWSMessage('typing', { roomId: activeRoomId, isTyping: false });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  // Delete handler
  const handleDeleteMessage = (msgId: string) => {
    setMessageToDeleteId(msgId);
  };

  const confirmDeleteMessage = () => {
    if (messageToDeleteId) {
      const success = sendWSMessage('deleteMessage', { messageId: messageToDeleteId });
      if (!success) {
        toast.error('Failed to delete. WebSocket disconnected.');
      }
      setMessageToDeleteId(null);
    }
  };

  // Load older messages pagination
  const handleLoadMoreMessages = async () => {
    if (!activeRoomId || roomMessages.length === 0 || loadingMore) return;
    setLoadingMore(true);
    try {
      const oldestMsg = roomMessages[0];
      await fetchMessages(activeRoomId, oldestMsg.id);
    } catch {
      toast.error('Failed to load older messages');
    } finally {
      setLoadingMore(false);
    }
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: Record<string, ChatMessage[]> = {};
    roomMessages.forEach((msg) => {
      const dateStr = new Date(msg.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(msg);
    });
    return groups;
  }, [roomMessages]);

  const getGroupLabel = (dateStr: string) => {
    const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return dateStr;
  };

  // Channel room creation handler
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;
    setCreating(true);
    try {
      const channel = await createChannel(channelName, channelDesc, channelPrivate);
      setActiveRoomId(channel.id);
      setShowChannelModal(false);
      setChannelName('');
      setChannelDesc('');
      setChannelPrivate(false);
      toast.success(`Channel #${channel.name} created!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create channel');
    } finally {
      setCreating(false);
    }
  };

  // DM start handler
  const handleStartDM = async (employee: SimplifiedEmployee) => {
    try {
      const room = await getOrCreateDirectRoom(employee.id);
      setActiveRoomId(room.id);
      setShowDMModal(false);
      setDmSearchText('');
    } catch {
      toast.error('Failed to start chat session');
    }
  };

  // Add member to current channel
  const handleAddMember = async (employee: SimplifiedEmployee) => {
    if (!activeRoomId) return;
    try {
      await addMemberToChannel(activeRoomId, employee.id);
      toast.success(`${employee.fullNameEnglish} added to room`);
      setShowInviteModal(false);
      setInviteSearchText('');
    } catch {
      toast.error('Failed to add teammate');
    }
  };

  // Leave channel
  const handleLeaveChannel = async () => {
    if (!activeRoomId || !user) return;
    try {
      await leaveOrRemoveFromChannel(activeRoomId, user.id);
      setActiveRoomId(null);
      setShowInfoModal(false);
      toast.success('You have left the channel');
    } catch {
      toast.error('Failed to leave channel');
    }
  };

  // Filter lists based on input queries
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) =>
      room.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rooms, searchQuery]);

  const filteredEmployeesForDM = useMemo(() => {
    return employeesList.filter((emp) =>
      emp.fullNameEnglish.toLowerCase().includes(dmSearchText.toLowerCase()) &&
      emp.id !== user?.id
    );
  }, [employeesList, dmSearchText, user]);

  const filteredEmployeesForInvite = useMemo(() => {
    if (!activeRoom) return [];
    const existingMemberIds = activeRoom.members.map((m) => m.id);
    return employeesList.filter((emp) =>
      emp.fullNameEnglish.toLowerCase().includes(inviteSearchText.toLowerCase()) &&
      !existingMemberIds.includes(emp.id)
    );
  }, [employeesList, inviteSearchText, activeRoom]);

  const activeTypers = useMemo(() => {
    if (!activeRoomId || !typingStatus[activeRoomId]) return [];
    const now = Date.now();
    return Object.values(typingStatus[activeRoomId])
      .filter((typer) => now - typer.timestamp < 3500)
      .map((typer) => typer.senderName);
  }, [activeRoomId, typingStatus]);

  const handleCallFromLog = async (roomId: string, peer: any, type: 'audio' | 'video') => {
    if (!peer) return;
    await useCallStore.getState().initiateCall(
      roomId,
      {
        id: peer.id,
        name: peer.fullNameEnglish,
        photoUrl: peer.employeePhotoUrl || null,
      },
      type
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-card">
      <style>{`
        .whatsapp-bg {
          background-color: #efeae2;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23e5ddd5' fill-opacity='0.4'%3E%3Cpath fill-rule='evenodd' d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zM11 63c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 0c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zM34 38c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 25c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm34 0c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM22 25c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm44 0c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z'/%3E%3C/g%3E%3C/svg%3E");
        }
        .dark .whatsapp-bg {
          background-color: #0b141a;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%231f2c34' fill-opacity='0.15'%3E%3Cpath fill-rule='evenodd' d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zM11 63c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 0c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zM34 38c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 25c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm34 0c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM22 25c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm44 0c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z'/%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
      
      {/* ─── SIDEBAR: Rooms & Statuses ─── */}
      <div className={`w-full md:w-64 flex-col border-r border-border/30 bg-sidebar/5 flex-shrink-0 ${activeRoomId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* WhatsApp Header: User Profile banner */}
        <div className="p-3 bg-secondary/35 dark:bg-[#202c33] border-b border-border/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-8.5 w-8.5 border border-border/10">
              <AvatarImage src={user?.employeePhotoUrl || undefined} />
              <AvatarFallback className="text-xs font-bold bg-emerald-500/10 text-emerald-600">
                {user?.fullNameEnglish?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h4 className="text-[11px] font-bold text-foreground truncate">{user?.fullNameEnglish}</h4>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5 text-muted-foreground/80">
            <Button
              onClick={() => setShowDMModal(true)}
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full"
              title="New DM"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setShowChannelModal(true)}
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full"
              title="New Channel"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-3 border-b border-border/20 flex flex-col gap-2 bg-card/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Sync Status</span>
            <div className="flex items-center gap-1.5">
              {isWsConnected ? (
                <>
                  <Wifi className="h-3 w-3 text-emerald-500 animate-pulse" />
                  <span className="text-[9px] text-emerald-600 font-semibold">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-amber-500 animate-pulse" />
                  <span className="text-[9px] text-amber-600 font-semibold">Syncing...</span>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 bg-muted/50 p-0.5 rounded-lg">
            <button
              onClick={() => setActiveTab('chats')}
              className={`py-1 text-[11px] font-semibold rounded-md transition-all ${
                activeTab === 'chats'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => {
                setActiveTab('calls');
                fetchCallLogs();
              }}
              className={`py-1 text-[11px] font-semibold rounded-md transition-all ${
                activeTab === 'calls'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Calls
            </button>
          </div>

          {activeTab === 'chats' && (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chat rooms..." 
                className="h-8 pl-7 bg-background/50 text-xs shadow-none border-border/40 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 px-2 py-3">
          {activeTab === 'chats' ? (
            <div className="space-y-4">
              
              {/* Channels */}
              <div>
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wide">Channels</span>
                  <Button 
                    onClick={() => setShowChannelModal(true)}
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 hover:bg-muted text-muted-foreground hover:text-foreground rounded"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="space-y-0.5">
                  {filteredRooms.filter(r => r.type === 'channel').map((room) => {
                    const isActive = room.id === activeRoomId;
                    return (
                      <button
                        key={room.id}
                        onClick={() => setActiveRoomId(room.id)}
                        className={`group flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-all ${
                          isActive 
                            ? 'bg-primary/10 text-primary' 
                            : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                        }`}
                      >
                        <Hash className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="truncate flex-1">{room.displayName}</span>
                        {room.unreadCount > 0 && (
                          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                            {room.unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direct Messages */}
              <div>
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wide">Direct Messages</span>
                  <Button 
                    onClick={() => setShowDMModal(true)}
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 hover:bg-muted text-muted-foreground hover:text-foreground rounded"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="space-y-0.5">
                  {filteredRooms.filter(r => r.type === 'direct').map((room) => {
                    const isActive = room.id === activeRoomId;
                    const otherUser = room.members.find(m => m.id !== user?.id) || room.members[0];
                    const isOnline = otherUser?.presence === 'online';

                    return (
                      <button
                        key={room.id}
                        onClick={() => setActiveRoomId(room.id)}
                        className={`group flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-all ${
                          isActive 
                            ? 'bg-primary/10 text-primary' 
                            : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                        }`}
                      >
                        <div className="relative">
                          <Avatar className="h-5 w-5 border border-border/20">
                            <AvatarImage src={room.displayPhotoUrl || undefined} />
                            <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">
                              {room.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className={`absolute bottom-[-1px] right-[-1px] h-2 w-2 rounded-full border border-background ${
                            isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                          }`} />
                        </div>
                        <span className="truncate flex-1">{room.displayName}</span>
                        {room.unreadCount > 0 && (
                          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                            {room.unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-3">
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wide">Call History</span>
                <Button 
                  onClick={() => fetchCallLogs()}
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 hover:bg-muted text-muted-foreground hover:text-foreground rounded"
                  title="Refresh"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>

              {callLogs.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No call history
                </div>
              ) : (
                <div className="space-y-1">
                  {callLogs.map((log: any) => {
                    const isOutgoing = log.callerId === user?.id;
                    const peer = isOutgoing ? log.callee : log.caller;
                    const dateStr = new Date(log.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div 
                        key={log.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-sidebar-accent/30 transition-all border border-transparent hover:border-border/10"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="h-9 w-9 border border-border/10">
                            <AvatarImage src={peer?.employeePhotoUrl || undefined} />
                            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                              {peer?.fullNameEnglish?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-foreground truncate">{peer?.fullNameEnglish}</h4>
                            <div className="flex items-center gap-1 mt-0.5">
                              {log.status === 'missed' ? (
                                <PhoneOff className="h-3 w-3 text-red-500" />
                              ) : isOutgoing ? (
                                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <ArrowDownLeft className="h-3 w-3 text-blue-500" />
                              )}
                              <span className="text-[10px] text-muted-foreground truncate">{dateStr}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-muted-foreground mr-1">
                            {log.status === 'completed' 
                              ? `${Math.floor(log.duration / 60)}m ${log.duration % 60}s`
                              : log.status === 'rejected'
                                ? 'Declined'
                                : log.status === 'missed'
                                  ? 'Missed'
                                  : 'Cancelled'}
                          </span>
                          
                          <Button
                            onClick={() => handleCallFromLog(log.roomId, peer, log.type)}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
                            title="Call back"
                          >
                            {log.type === 'video' ? <Video className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ─── CHAT VIEWPORT ─── */}
      <div className={`flex-1 flex-col bg-background ${activeRoomId ? 'flex' : 'hidden md:flex'}`}>
        {activeRoom ? (
          <>
            <div className="flex h-16 items-center justify-between border-b border-border/20 px-6 bg-card/45 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                {/* Back button for mobile */}
                <Button 
                  onClick={() => setActiveRoomId(null)} 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden -ml-2 mr-1 h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground rounded"
                >
                  <ArrowLeft className="h-4.5 w-4.5" />
                </Button>
                {activeRoom.type === 'channel' ? (
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
                    <Hash className="h-4.5 w-4.5" />
                  </div>
                ) : (
                  <div className="relative">
                    <Avatar className="h-8 w-8 border border-border/20">
                      <AvatarImage src={activeRoom.displayPhotoUrl || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                        {activeRoom.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {activeRoom.members.find(m => m.id !== user?.id)?.presence === 'online' && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
                    )}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {activeRoom.displayName}
                  </h3>
                  <p className="text-[10px] text-muted-foreground truncate max-w-sm">
                    {activeRoom.type === 'channel' 
                      ? (activeRoom.description || 'No description set')
                      : 'Direct Message'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {activeRoom.type === 'direct' && (() => {
                  const otherMember = activeRoom.members.find(m => m.id !== user?.id) || activeRoom.members[0];
                  if (!otherMember) return null;
                  return (
                    <>
                      <Button
                        onClick={() => useCallStore.getState().initiateCall(
                          activeRoom.id,
                          {
                            id: otherMember.id,
                            name: otherMember.fullNameEnglish,
                            photoUrl: otherMember.employeePhotoUrl || null,
                          },
                          'audio'
                        )}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg"
                        title="Voice Call"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => useCallStore.getState().initiateCall(
                          activeRoom.id,
                          {
                            id: otherMember.id,
                            name: otherMember.fullNameEnglish,
                            photoUrl: otherMember.employeePhotoUrl || null,
                          },
                          'video'
                        )}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg"
                        title="Video Call"
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                    </>
                  );
                })()}

                <Button 
                  onClick={() => setShowInfoModal(true)}
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages Feed Grouped by Dates */}
            <div 
              ref={chatContainerRef}
              className="flex-1 p-6 overflow-y-auto space-y-6 scroll-smooth whatsapp-bg"
              style={{ scrollbarWidth: 'thin' }}
            >
              {roomMessages.length >= 50 && (
                <div className="flex justify-center pb-2">
                  <Button
                    onClick={handleLoadMoreMessages}
                    variant="ghost"
                    size="xs"
                    disabled={loadingMore}
                    className="text-[10px] text-[#54656f] dark:text-[#8696a0] hover:text-foreground h-7 flex items-center gap-1.5 bg-white/70 dark:bg-[#182229]/70 px-3 rounded-full shadow-sm"
                  >
                    {loadingMore ? (
                      <div className="h-3 w-3 animate-spin rounded-full border border-muted-foreground border-t-transparent" />
                    ) : null}
                    <span>{loadingMore ? 'Loading older messages...' : 'Load older messages'}</span>
                  </Button>
                </div>
              )}
              {roomMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground bg-white/60 dark:bg-[#182229]/60 rounded-2xl max-w-sm mx-auto shadow-sm p-6 border border-border/10">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-3">
                    <MessageCircle className="h-6 w-6 animate-pulse" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">Start of message logs</p>
                  <p className="text-[10px] text-muted-foreground/75 mt-0.5">Messages are end-to-end encrypted. Keep it professional.</p>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([dateStr, messagesList]) => (
                  <div key={dateStr} className="space-y-4">
                    
                    {/* Date Separator Divider */}
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 border-t border-transparent" />
                      <span className="text-[10px] font-normal text-[#54656f] dark:text-[#8696a0] bg-white dark:bg-[#182229] px-3 py-1 rounded-lg shadow-sm">
                        {getGroupLabel(dateStr)}
                      </span>
                      <div className="flex-1 border-t border-transparent" />
                    </div>

                    {/* Messages List */}
                    {messagesList.map((msg: ChatMessage) => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div 
                          key={msg.id} 
                          className={`group/message relative flex items-start gap-3 px-1 py-0.5 rounded-xl transition-all ${
                            isMe ? 'flex-row-reverse' : ''
                          }`}
                        >
                          {/* Message bubble wrapper */}
                          <div className={`flex flex-col max-w-[70%] relative ${isMe ? 'items-end' : 'items-start'}`}>
                            
                            {/* Bubble itself */}
                            <div className={`relative rounded-2xl px-3 py-1.5 text-xs shadow-sm leading-relaxed max-w-full ${
                              msg.isDeleted
                                ? 'bg-muted/30 text-muted-foreground/40 border border-border/10 italic rounded-tr-none'
                                : isMe 
                                  ? 'bg-[#d9fdd3] text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef] rounded-tr-none' 
                                  : 'bg-white text-[#111b21] dark:bg-[#202c33] dark:text-[#e9edef] rounded-tl-none border border-[#e2e8f0]/30 dark:border-transparent'
                            }`}>
                              {/* Sender Name in Group Channels */}
                              {activeRoom.type === 'channel' && !isMe && !msg.isDeleted && (
                                <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
                                  {msg.senderName}
                                </span>
                              )}
                              
                              {/* Content */}
                              <span className="whitespace-pre-wrap break-words pr-12 block">{msg.content}</span>
                              
                              {/* Time and checkmarks in bottom right */}
                              <span className="absolute bottom-1 right-2.5 text-[9px] text-[#667781] dark:text-[#8696a0] flex items-center gap-0.5 select-none">
                                <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                {isMe && !msg.isDeleted && (
                                  <span className="inline-flex ml-0.5">
                                    {msg.isPending ? (
                                      <Clock className="h-3 w-3 text-muted-foreground/40 animate-pulse" />
                                    ) : (() => {
                                      if (!activeRoom) return <Check className="h-3 w-3 text-[#8696a0]" />;
                                      const otherMembers = activeRoom.members.filter((m) => m.id !== user?.id);
                                      if (otherMembers.length === 0) return <Check className="h-3 w-3 text-[#8696a0]" />;
                                      
                                      const anyRead = otherMembers.some(
                                        (m) => m.lastReadAt && new Date(m.lastReadAt).getTime() >= new Date(msg.createdAt).getTime()
                                      );
                                      
                                      if (anyRead) {
                                        return <CheckCheck className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />;
                                      }
                                      return <CheckCheck className="h-3.5 w-3.5 text-[#8696a0]" />;
                                    })()}
                                  </span>
                                )}
                              </span>
                              
                              {/* Bubble tails */}
                              {isMe ? (
                                <svg className={`absolute top-0 -right-[5px] h-[10px] w-[8px] fill-current ${
                                  msg.isDeleted ? 'text-muted/30' : 'text-[#d9fdd3] dark:text-[#005c4b]'
                                }`} viewBox="0 0 8 10">
                                  <path d="M 0,0 C 4,0 8,2 8,10 L 8,0 Z" />
                                </svg>
                              ) : (
                                <svg className={`absolute top-0 -left-[5px] h-[10px] w-[8px] fill-current ${
                                  msg.isDeleted ? 'text-muted/30' : 'text-white dark:text-[#202c33]'
                                }`} viewBox="0 0 8 10">
                                  <path d="M 8,0 C 4,0 0,2 0,10 L 0,0 Z" />
                                </svg>
                              )}
                            </div>
                          </div>

                          {/* Message edit/delete hover controls */}
                          {isMe && !msg.isDeleted && (
                            <div className={`absolute top-1.5 flex items-center gap-0.5 bg-background border border-border/40 rounded-lg p-0.5 shadow-sm opacity-100 md:opacity-0 md:group-hover/message:opacity-100 transition-opacity ${
                              isMe ? 'left-4' : 'right-4'
                            }`}>
                              <Button
                                onClick={() => {
                                  setEditingMessageId(msg.id);
                                  setInputVal(msg.content);
                                }}
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground rounded"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteMessage(msg.id)}
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:bg-destructive/10 rounded"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Typing indicators */}
            {activeTypers.length > 0 && (
              <div className="px-6 py-1 text-[10px] text-muted-foreground flex items-center gap-1 bg-background/50 border-t border-t-border/5">
                <span className="font-semibold">{activeTypers.join(', ')}</span> 
                <span>{activeTypers.length === 1 ? 'is' : 'are'} typing...</span>
              </div>
            )}

            {/* Message edit banner */}
            {editingMessageId && (
              <div className="px-6 py-1.5 text-[10px] text-primary flex items-center justify-between bg-primary/5 border-t border-t-primary/20">
                <span className="font-medium">Editing message (Press Esc to cancel)</span>
                <Button 
                  onClick={() => {
                    setEditingMessageId(null);
                    setInputVal('');
                  }}
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 hover:bg-primary/10 text-primary rounded"
                >
                  <X className="h-2.5 w-2.5" />
                </Button>
              </div>
            )}

            {/* Input field (WhatsApp Style capsule) */}
            <div className="px-4 py-2.5 bg-secondary/35 dark:bg-[#202c33] border-t border-border/10 flex items-center gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-full hover:bg-muted/50 text-[#8696a0] hover:text-foreground flex-shrink-0"
                title="Attachments"
              >
                <PlusCircle className="h-5.5 w-5.5" />
              </Button>
              
              <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-3">
                <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-full px-4 py-2 shadow-sm border border-border/10 dark:border-transparent flex items-center">
                  <textarea 
                    value={inputVal}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder={
                      editingMessageId
                        ? 'Edit message content...'
                        : 'Type a message'
                    }
                    className="w-full resize-none bg-transparent py-0.5 text-xs outline-none border-none placeholder-[#8696a0] focus:ring-0 focus:outline-none text-[#111b21] dark:text-[#e9edef] max-h-24 leading-normal"
                    style={{ height: '20px', scrollbarWidth: 'none' }}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-9 w-9 rounded-full bg-[#00a884] hover:bg-[#008f72] text-white shadow-md flex-shrink-0 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  title="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-secondary/15 dark:bg-[#222e35] relative">
            {/* Clean greeting intro panel */}
            <div className="max-w-md flex flex-col items-center">
              <div className="h-20 w-20 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 flex items-center justify-center text-emerald-600 mb-6">
                <MessageSquare className="h-10 w-10 animate-pulse" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">Chat</h2>
              <p className="text-xs text-muted-foreground/80 leading-relaxed">
                Send and receive messages with your teammates. Click any channel or DM to start a secure communication session.
              </p>
              <div className="mt-8 border-t border-border/20 pt-4 w-full text-center">
                <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                  <svg className="h-3.5 w-3.5 fill-current text-muted-foreground" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                  End-to-end encrypted call & messaging
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL: Create Group Channel ─── */}
      <Dialog open={showChannelModal} onOpenChange={setShowChannelModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Create a Channel</DialogTitle>
            <DialogDescription className="text-xs">
              Channels are where your team communicates. They’re best organized around a topic or department.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateChannel} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Channel Name</label>
              <Input 
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="e.g. engineering" 
                required 
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Description (Optional)</label>
              <Input 
                value={channelDesc}
                onChange={(e) => setChannelDesc(e.target.value)}
                placeholder="What is this channel about?" 
                className="h-9 text-xs"
              />
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/20">
              <div>
                <p className="text-xs font-semibold">Make Private</p>
                <p className="text-[10px] text-muted-foreground">When a channel is private, it can only be viewed or joined by invitation.</p>
              </div>
              <input 
                type="checkbox" 
                checked={channelPrivate}
                onChange={(e) => setChannelPrivate(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowChannelModal(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: Start Direct Message ─── */}
      <Dialog open={showDMModal} onOpenChange={setShowDMModal}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-base font-bold">Start a Conversation</DialogTitle>
          </DialogHeader>
          
          <div className="px-4 py-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
              <Input 
                value={dmSearchText}
                onChange={(e) => setDmSearchText(e.target.value)}
                placeholder="Type a teammate's name..." 
                className="h-9 pl-8 text-xs bg-background/50 shadow-none border-border/40 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          <ScrollArea className="h-60 mt-2 px-1 border-t border-border/25">
            <div className="p-2 space-y-0.5">
              {loadingEmployees ? (
                <div className="text-center py-6 text-xs text-muted-foreground">Loading employee index...</div>
              ) : filteredEmployeesForDM.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">No matching employees found</div>
              ) : (
                filteredEmployeesForDM.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => handleStartDM(emp)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-muted/70 transition-all"
                  >
                    <Avatar className="h-8 w-8 border border-border/20">
                      <AvatarImage src={emp.employeePhotoUrl || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {emp.fullNameEnglish.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{emp.fullNameEnglish}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{emp.email}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: Room Information Sheet ─── */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Details</DialogTitle>
          </DialogHeader>
          
          {activeRoom && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border/20">
                  <AvatarImage src={activeRoom.displayPhotoUrl || undefined} />
                  <AvatarFallback className="text-base font-bold bg-primary/10 text-primary">
                    {activeRoom.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{activeRoom.displayName}</h4>
                  <p className="text-xs text-muted-foreground">{activeRoom.type === 'channel' ? 'Channel Room' : 'Direct Conversation'}</p>
                </div>
              </div>

              {activeRoom.type === 'channel' && activeRoom.description && (
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/20 text-xs">
                  <span className="font-bold block mb-0.5">Description</span>
                  <span className="text-muted-foreground">{activeRoom.description}</span>
                </div>
              )}

              {/* Members List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-border/20 pb-1.5">
                  <span className="text-xs font-bold text-muted-foreground">Members ({activeRoom.members.length})</span>
                  {activeRoom.type === 'channel' && (
                    <Button 
                      onClick={() => setShowInviteModal(true)}
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] gap-1 hover:bg-muted text-primary"
                    >
                      <UserPlus className="h-3 w-3" />
                      <span>Add Teammate</span>
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-44 pr-2">
                  <div className="space-y-2">
                    {activeRoom.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 border border-border/20">
                            <AvatarImage src={member.employeePhotoUrl || undefined} />
                            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                              {member.fullNameEnglish.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="text-xs font-semibold block leading-tight">{member.fullNameEnglish}</span>
                            <span className="text-[9px] text-muted-foreground capitalize">{member.role}</span>
                          </div>
                        </div>
                        <span className={`h-2 w-2 rounded-full border border-background ${
                          member.presence === 'online' ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                        }`} />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Danger Actions (Leave channel) */}
              {activeRoom.type === 'channel' && (
                <div className="pt-2">
                  <Button 
                    onClick={handleLeaveChannel}
                    variant="destructive" 
                    size="sm" 
                    className="w-full text-xs gap-1 shadow-none"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Leave Channel</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: Invite Member Selection ─── */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-base font-bold">Add Teammate</DialogTitle>
          </DialogHeader>

          <div className="px-4 py-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
              <Input 
                value={inviteSearchText}
                onChange={(e) => setInviteSearchText(e.target.value)}
                placeholder="Search teammates..." 
                className="h-9 pl-8 text-xs bg-background/50 shadow-none border-border/40 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          <ScrollArea className="h-60 mt-2 px-1 border-t border-border/25">
            <div className="p-2 space-y-0.5">
              {filteredEmployeesForInvite.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">All eligible active employees are already members</div>
              ) : (
                filteredEmployeesForInvite.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => handleAddMember(emp)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-muted/70 transition-all"
                  >
                    <Avatar className="h-8 w-8 border border-border/20">
                      <AvatarImage src={emp.employeePhotoUrl || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {emp.fullNameEnglish.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{emp.fullNameEnglish}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{emp.email}</p>
                    </div>
                    <PlusCircle className="h-4 w-4 text-primary/60 hover:text-primary" />
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Delete Confirmation */}
      <AlertDialog open={!!messageToDeleteId} onOpenChange={(open) => !open && setMessageToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the message from the conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMessage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
