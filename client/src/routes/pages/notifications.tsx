import { useState, useMemo } from 'react';
import { useNotificationsInfiniteQuery, useMarkAllAsReadMutation, useArchiveAllReadMutation } from '@/hooks/useNotifications';
import { NotificationList } from '@/components/notifications/notification-list';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCheck, Archive } from 'lucide-react';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('unread');

  const queryFilters = useMemo(() => {
    switch (filter) {
      case 'unread':
        return { isRead: 'false', isArchived: 'false' };
      case 'archived':
        return { isArchived: 'true' };
      default:
        return { isArchived: 'false' };
    }
  }, [filter]);

  // 1. Fetch notifications using cursor infinite query
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useNotificationsInfiniteQuery(queryFilters);

  // 2. Map infinite queries pages into single flat notifications list
  const notificationsList = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  const markAllAsReadMutation = useMarkAllAsReadMutation();
  const archiveAllReadMutation = useArchiveAllReadMutation();

  const handleMarkAllRead = async () => {
    await markAllAsReadMutation.mutateAsync();
    refetch();
  };

  const handleArchiveAllRead = async () => {
    await archiveAllReadMutation.mutateAsync();
    refetch();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 bg-background rounded-xl border border-border/30 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notifications Inbox</h2>
          <p className="text-sm text-muted-foreground">
            Manage your real-time system alerts, approvals, and announcements.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {filter === 'unread' && notificationsList.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllAsReadMutation.isPending}
              className="gap-2 h-9 text-xs border-border/50 cursor-pointer"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5 text-primary" />
              )}
              Mark all as read
            </Button>
          )}

          {filter === 'all' && notificationsList.some((n) => n.isRead) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchiveAllRead}
              disabled={archiveAllReadMutation.isPending}
              className="gap-2 h-9 text-xs border-border/50 cursor-pointer"
            >
              {archiveAllReadMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Archive className="h-3.5 w-3.5 text-amber-500" />
              )}
              Archive all read
            </Button>
          )}
        </div>
      </div>

      <Tabs
        value={filter}
        onValueChange={(val: any) => setFilter(val)}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3 max-w-xs shadow-none border border-border/40">
          <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
          <TabsTrigger value="all" className="text-xs">All Active</TabsTrigger>
          <TabsTrigger value="archived" className="text-xs">Archived</TabsTrigger>
        </TabsList>

        <div className="border border-border/40 rounded-xl overflow-hidden bg-card shadow-sm min-h-[300px]">
          <NotificationList
            notifications={notificationsList}
            isLoading={isLoading}
          />

          {hasNextPage && (
            <div className="p-4 text-center border-t border-border/20 bg-muted/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-xs gap-2 min-w-[120px] cursor-pointer"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Load More</span>
                )}
              </Button>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
