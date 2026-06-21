export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationModule {
  LEAVE = 'leave',
  ATTENDANCE = 'attendance',
  TASKS = 'tasks',
  PAYROLL = 'payroll',
  CLAIMS = 'claims',
  RECRUITMENT = 'recruitment',
  ANNOUNCEMENTS = 'announcements',
  PERFORMANCE = 'performance',
  DISCIPLINARY = 'disciplinary',
  SEPARATION = 'separation',
}

export enum NotificationCategory {
  APPROVAL = 'approval',
  REJECTION = 'rejection',
  ASSIGNMENT = 'assignment',
  MENTION = 'mention',
  REMINDER = 'reminder',
  STATUS_CHANGE = 'status_change',
  COMMENT = 'comment',
  SYSTEM = 'system',
  BROADCAST = 'broadcast',
}

export interface NotificationAction {
  label: string;
  style: 'primary' | 'secondary' | 'destructive';
  apiMethod: 'POST' | 'PATCH' | 'DELETE';
  apiUrl: string;
  apiBody?: Record<string, any>;
  confirmMessage?: string;
}
