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
  ArrowLeft
} from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import type { ChatMessage } from '../../store/useChatStore';
import { sendWSMessage } from '../../hooks/useWebSocket';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../lib/api';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
    leaveOrRemoveFromChannel
  } = useChatStore();

  const { user } = useAuthStore();

  const [inputVal, setInputVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showDMModal, setShowDMModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // Message edit state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

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
  const messageEndRef = useRef<HTMLDivElement>(null);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    fetchRooms();
    fetchEmployees();
  }, []);

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
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      const success = sendWSMessage('sendMessage', {
        roomId: activeRoomId,
        content: inputVal.trim(),
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    if (confirm('Are you sure you want to delete this message?')) {
      const success = sendWSMessage('deleteMessage', { messageId: msgId });
      if (!success) {
        toast.error('Failed to delete. WebSocket disconnected.');
      }
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

  // Compute active typing indicators
  const activeTypers = useMemo(() => {
    if (!activeRoomId || !typingStatus[activeRoomId]) return [];
    const now = Date.now();
    return Object.values(typingStatus[activeRoomId])
      .filter((typer) => now - typer.timestamp < 3500)
      .map((typer) => typer.senderName);
  }, [activeRoomId, typingStatus]);

  return (
    <div className="flex h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] overflow-hidden rounded-xl border border-border/40 bg-card shadow-lg">
      
      {/* ─── SIDEBAR: Rooms & Statuses ─── */}
      <div className={`w-full md:w-64 flex-col border-r border-border/30 bg-sidebar/5 flex-shrink-0 ${activeRoomId ? 'hidden md:flex' : 'flex'}`}>
        
        <div className="p-3 border-b border-border/20 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Conversations</span>
            <div className="flex items-center gap-1.5">
              {isWsConnected ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-600 font-semibold">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                  <span className="text-[10px] text-amber-600 font-semibold">Syncing...</span>
                </>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat rooms..." 
              className="h-8 pl-7 bg-background/50 text-xs shadow-none border-border/40 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-2 py-3">
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
        </ScrollArea>
      </div>

      {/* ─── CHAT VIEWPORT ─── */}
      <div className={`flex-1 flex-col bg-background ${activeRoomId ? 'flex' : 'hidden md:flex'}`}>
        {activeRoom ? (
          <>
            <div className="flex h-14 items-center justify-between border-b border-border/30 px-4">
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
                  <Hash className="h-5 w-5 text-muted-foreground/60" />
                ) : (
                  <Avatar className="h-7 w-7 border border-border/20">
                    <AvatarImage src={activeRoom.displayPhotoUrl || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {activeRoom.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
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

              <div className="flex items-center gap-1">
                <Button 
                  onClick={() => setShowInfoModal(true)}
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground rounded"
                >
                  <Info className="h-4.5 w-4.5" />
                </Button>
              </div>
            </div>

            {/* Messages Feed Grouped by Dates */}
            <div className="flex-1 p-4 overflow-hidden relative">
              <ScrollArea className="h-full pr-3">
                <div className="space-y-6">
                  {roomMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                      <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-2 animate-bounce" />
                      <p className="text-xs font-semibold">Start of message logs</p>
                      <p className="text-[10px] text-muted-foreground/75">Be nice and keep it professional.</p>
                    </div>
                  ) : (
                    Object.entries(groupedMessages).map(([dateStr, messagesList]) => (
                      <div key={dateStr} className="space-y-4">
                        
                        {/* Date Separator Divider */}
                        <div className="flex items-center gap-3 py-2">
                          <div className="flex-1 border-t border-border/20" />
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-background px-2">
                            {getGroupLabel(dateStr)}
                          </span>
                          <div className="flex-1 border-t border-border/20" />
                        </div>

                        {/* Messages List */}
                        {messagesList.map((msg: ChatMessage) => {
                          const isMe = msg.senderId === user?.id;
                          return (
                            <div 
                              key={msg.id} 
                              className={`group/message relative flex items-start gap-2.5 px-2 py-1 rounded-lg hover:bg-muted/30 transition-all ${
                                isMe ? 'flex-row-reverse' : ''
                              }`}
                            >
                              
                              {/* Avatar */}
                              <Avatar className="h-8 w-8 border border-border/20 mt-0.5">
                                <AvatarImage src={msg.senderPhotoUrl || undefined} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {msg.senderName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>

                              {/* Message bubble */}
                              <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : ''}`}>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[11px] font-semibold text-foreground">{msg.senderName}</span>
                                  <span className="text-[9px] text-muted-foreground">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {msg.isEdited && !msg.isDeleted && (
                                    <span className="text-[8px] text-muted-foreground/80 italic">(edited)</span>
                                  )}
                                </div>
                                <div className={`rounded-xl px-3 py-2 text-xs shadow-sm leading-relaxed ${
                                  msg.isDeleted
                                    ? 'bg-muted/20 text-muted-foreground/50 border border-border/10 italic rounded-tr-none'
                                    : isMe 
                                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                      : 'bg-muted/70 text-foreground rounded-tl-none'
                                }`}>
                                  {msg.content}
                                </div>
                              </div>

                              {/* Message edit/delete hover controls */}
                              {isMe && !msg.isDeleted && (
                                <div className={`absolute top-2 flex items-center gap-0.5 bg-background border border-border/40 rounded-lg p-0.5 shadow-sm opacity-100 md:opacity-0 md:group-hover/message:opacity-100 transition-opacity ${
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
                  <div ref={messageEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Typing indicators */}
            {activeTypers.length > 0 && (
              <div className="px-4 py-1 text-[10px] text-muted-foreground flex items-center gap-1 bg-background/50 border-t border-t-border/10">
                <span className="font-semibold">{activeTypers.join(', ')}</span> 
                <span>{activeTypers.length === 1 ? 'is' : 'are'} typing...</span>
              </div>
            )}

            {/* Message edit banner */}
            {editingMessageId && (
              <div className="px-4 py-1 text-[10px] text-primary flex items-center justify-between bg-primary/5 border-t border-t-primary/20">
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

            {/* Input field */}
            <div className="p-3 bg-background border-t border-border/30">
              <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                <Input 
                  value={inputVal}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    editingMessageId
                      ? 'Edit message content...'
                      : `Message ${activeRoom.type === 'channel' ? '#' + activeRoom.displayName : activeRoom.displayName}...`
                  }
                  className="flex-1 h-9 bg-background/50 text-xs shadow-none border-border/40 focus-visible:ring-1 focus-visible:ring-primary"
                />
                <Button type="submit" size="sm" className="h-9 px-3 rounded shadow-none text-xs gap-1">
                  <span>{editingMessageId ? 'Save' : 'Send'}</span>
                  <Send className="h-3 w-3" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 text-muted-foreground/20 mb-3 animate-pulse" />
            <h2 className="text-sm font-semibold">Welcome to HR Internal Chat</h2>
            <p className="text-xs text-muted-foreground/80 mt-1 max-w-sm">
              Select a group channel or direct message member from the sidebar list to start communicating.
            </p>
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

    </div>
  );
}
