import React, { useEffect, useMemo, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useNotificationStore } from '@/store/useNotificationStore';
import { cn } from '@/lib/utils';
import { useUnreadCountQuery, useMarkAllAsReadMutation, useNotificationsInfiniteQuery } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationList } from './notification-list';

export function NotificationBell() {
  const navigate = useNavigate();
  
  // 1. Unread count query (polls on fallback)
  useUnreadCountQuery();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isWsConnected = useNotificationStore((state) => state.isWsConnected);
  const isOnline = useNotificationStore((state) => state.isOnline);
  const markAllAsReadMutation = useMarkAllAsReadMutation();

  // 2. Fetch the latest active unread notifications for preview (first page, limit 5)
  const { data: infiniteData, isLoading, refetch } = useNotificationsInfiniteQuery({
    isRead: 'false',
    isArchived: 'false',
  });

  const previewNotifications = useMemo(() => {
    if (!infiniteData) return [];
    return infiniteData.pages.flatMap((page) => page.data).slice(0, 5);
  }, [infiniteData]);

  // Debounced refetch: avoid rapid network calls when multiple WS events arrive
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      refetch();
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [unreadCount, refetch]);

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsReadMutation.mutate();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-destructive animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96 shadow-lg border-border/50 text-xs p-0 overflow-hidden">
        <DropdownMenuLabel className="flex items-center justify-between p-3.5 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-sm">Notifications</span>
            <div className="flex items-center gap-1" title={isOnline ? (isWsConnected ? 'Connected (Live Updates Active)' : 'Connecting...') : 'Offline (No internet connection)'}>
              <span className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors duration-300",
                isOnline ? (isWsConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse") : "bg-destructive"
              )} />
              <span className="text-[10px] text-muted-foreground font-normal tracking-wide">
                {isOnline ? (isWsConnected ? 'live' : 'reconnecting...') : 'offline'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-none font-bold">
                {unreadCount} unread
              </Badge>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                className="h-6 px-2 text-[10px] text-primary hover:text-primary hover:bg-primary/5 gap-1 font-normal cursor-pointer"
              >
                <Check className="h-3 w-3" />
                <span>Mark all read</span>
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        
        <div className="max-h-80 overflow-y-auto">
          <NotificationList
            notifications={previewNotifications}
            isLoading={isLoading}
          />
        </div>

        <DropdownMenuSeparator className="m-0" />
        <div className="p-2 bg-muted/10 text-center">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => navigate('/notifications')}
            className="w-full text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
          >
            View all in Inbox
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
