export interface Notification {
  id: string;
  createdAt: string;
  updatedAt: string;
  recipientId: string;
  actorId: string | null;
  module: NotificationModule;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  actionUrl: string | null;
  actions: NotificationAction[] | null;
  isRead: boolean;
  readAt: string | null;
  isArchived: boolean;
  expiresAt: string | null;
  metadata: Record<string, any> | null;
}

export interface NotificationAction {
  label: string;
  style: 'primary' | 'secondary' | 'destructive';
  apiMethod: 'POST' | 'PATCH' | 'DELETE';
  apiUrl: string;
  apiBody?: Record<string, any>;
  confirmMessage?: string;
}

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationModule =
  | 'leave'
  | 'attendance'
  | 'tasks'
  | 'payroll'
  | 'claims'
  | 'recruitment'
  | 'announcements'
  | 'performance'
  | 'disciplinary'
  | 'separation';

export type NotificationCategory =
  | 'approval'
  | 'rejection'
  | 'assignment'
  | 'mention'
  | 'reminder'
  | 'status_change'
  | 'comment'
  | 'system'
  | 'broadcast';

export interface NotificationPreferences {
  employeeId: string;
  disabledModules: NotificationModule[];
  disabledCategories: NotificationCategory[];
  emailEnabled: boolean;
  pushEnabled: boolean;
  quietHoursStart: string | null; // "22:00"
  quietHoursEnd: string | null;   // "07:00"
  digestFrequency: 'realtime' | 'hourly' | 'daily';
}

export interface NotificationListResponse {
  data: Notification[];
  nextCursor: string | null;
  unreadCount: number;
}
