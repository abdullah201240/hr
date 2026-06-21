import type { Notification } from '@/types/notifications';
import { NotificationItem } from './notification-item';
import { Skeleton } from '@/components/ui/skeleton';
import { Inbox } from 'lucide-react';

interface NotificationListProps {
  notifications: Notification[];
  isLoading?: boolean;
  onItemClick?: () => void;
}

function groupNotificationsByDate(notifs: Notification[]) {
  const groups: { Today: Notification[]; Yesterday: Notification[]; Older: Notification[] } = {
    Today: [],
    Yesterday: [],
    Older: [],
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  notifs.forEach((n) => {
    const d = new Date(n.createdAt);
    d.setHours(0, 0, 0, 0);

    if (d.getTime() === today.getTime()) {
      groups.Today.push(n);
    } else if (d.getTime() === yesterday.getTime()) {
      groups.Yesterday.push(n);
    } else {
      groups.Older.push(n);
    }
  });

  return groups;
}

export function NotificationList({ notifications, isLoading = false, onItemClick }: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border border-border/40 rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-grow flex flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/4 mt-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center mb-3">
          <Inbox className="h-6 w-6 text-muted-foreground/60" />
        </div>
        <h3 className="text-sm font-medium text-foreground">All caught up!</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
          You have no unread notifications or tasks in your inbox.
        </p>
      </div>
    );
  }

  const groups = groupNotificationsByDate(notifications);

  return (
    <div className="flex flex-col">
      {Object.entries(groups).map(([label, items]) => {
        if (items.length === 0) return null;

        return (
          <div key={label} className="flex flex-col">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2 bg-muted/20 border-b border-border/20 sticky top-0 backdrop-blur-sm z-10">
              {label}
            </div>
            <div className="flex flex-col">
              {items.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onItemClick={onItemClick}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
