import React from 'react';
import type { Notification } from '@/types/notifications';
import { NotificationIcon } from './notification-icon';
import { useMarkAsReadMutation, useArchiveMutation, useDeleteNotificationMutation, useExecuteActionMutation } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Trash2, Archive, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router';
import Swal from 'sweetalert2';

interface NotificationItemProps {
  notification: Notification;
  onItemClick?: () => void;
}

export function formatNotificationRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffMins) < 1) return 'Just now';
  if (Math.abs(diffMins) < 60) return rtf.format(diffMins, 'minute');
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, 'day');
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function NotificationItem({ notification, onItemClick }: NotificationItemProps) {
  const navigate = useNavigate();
  const markAsReadMutation = useMarkAsReadMutation();
  const archiveMutation = useArchiveMutation();
  const deleteMutation = useDeleteNotificationMutation();
  const executeActionMutation = useExecuteActionMutation();

  const handleItemClick = () => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    if (onItemClick) {
      onItemClick();
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    archiveMutation.mutate(notification.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    Swal.fire({
      title: 'Delete Notification?',
      text: 'Are you sure you want to delete this notification?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      buttonsStyling: false,
      customClass: {
        confirmButton: 'swal2-confirm swal2-styled bg-destructive hover:bg-destructive/90 text-white font-semibold rounded-md px-4 py-2 mr-2 text-xs',
        cancelButton: 'swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2 text-xs'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(notification.id);
      }
    });
  };

  const handleExecuteAction = async (e: React.MouseEvent, actionIndex: number, label: string, confirmMsg?: string) => {
    e.stopPropagation();
    if (confirmMsg) {
      const result = await Swal.fire({
        title: 'Confirm Action',
        text: confirmMsg,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel',
        buttonsStyling: false,
        customClass: {
          confirmButton: 'swal2-confirm swal2-styled bg-primary hover:bg-primary/90 text-white font-semibold rounded-md px-4 py-2 mr-2 text-xs',
          cancelButton: 'swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2 text-xs'
        }
      });
      if (!result.isConfirmed) {
        return;
      }
    }

    try {
      await executeActionMutation.mutateAsync({
        notificationId: notification.id,
        actionIndex,
      });
      toast.success(`Action "${label}" executed successfully`);
    } catch (err: any) {
      toast.error(err.message || `Failed to execute action "${label}"`);
    }
  };

  const actionTaken = notification.metadata?.actionTaken;
  const isExecuting = executeActionMutation.isPending && executeActionMutation.variables?.notificationId === notification.id;

  return (
    <div
      onClick={handleItemClick}
      className={cn(
        "group relative flex items-start gap-4 p-4 border-b border-border/40 hover:bg-muted/30 transition-all duration-200 cursor-pointer rounded-lg mx-2 my-1",
        !notification.isRead && "bg-muted/10 border-l-2 border-l-primary"
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        <NotificationIcon module={notification.module} className="h-5 w-5" />
      </div>

      <div className="flex-grow flex flex-col gap-1 pr-14">
        <div className="flex items-center gap-2">
          <h4 className={cn("text-sm font-medium text-foreground leading-tight", !notification.isRead && "font-semibold")}>
            {notification.title}
          </h4>
          {!notification.isRead && (
            <span className="h-2 w-2 rounded-full bg-primary" />
          )}
          {notification.priority === 'urgent' && (
            <Badge variant="destructive" className="h-4 px-1 text-[10px] uppercase font-bold animate-pulse">
              Urgent
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {notification.message}
        </p>

        {/* Quick Actions Panel */}
        {notification.actions && notification.actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
            {actionTaken ? (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
                <Check className="h-3 w-3 text-emerald-500 font-bold" />
                <span>Action Taken: <strong className="text-foreground">{actionTaken}</strong></span>
              </div>
            ) : (
              notification.actions.map((act, idx) => (
                <Button
                  key={idx}
                  disabled={isExecuting}
                  size="xs"
                  variant={act.style === 'primary' ? 'default' : act.style === 'destructive' ? 'destructive' : 'secondary'}
                  onClick={(e) => handleExecuteAction(e, idx, act.label, act.confirmMessage)}
                  className="text-xs py-1 h-7"
                >
                  {isExecuting && executeActionMutation.variables?.actionIndex === idx ? (
                    <>
                      <Spinner className="mr-1.5 h-3 w-3" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{act.label}</span>
                  )}
                </Button>
              ))
            )}
          </div>
        )}

        <span className="text-[10px] text-muted-foreground mt-1">
          {formatNotificationRelativeTime(notification.createdAt)}
        </span>
      </div>

      {/* Hover action buttons */}
      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-background/80 backdrop-blur-sm p-1 rounded-md border border-border/40 shadow-sm">
        {!notification.isArchived && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleArchive}
            title="Archive"
          >
            <Archive className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
