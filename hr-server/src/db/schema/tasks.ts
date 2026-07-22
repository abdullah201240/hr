import { pgTable, varchar, text, date, integer, real, uuid, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { baseTable } from './_base';
import { employees, departments } from './employee';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export const taskProjects = pgTable('task_projects', {
  ...baseTable,
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').default(''),
  status: varchar('status', { length: 50 }).default('Active').notNull(), // Active, Completed, Archived
  departmentId: uuid('department_id').references((): AnyPgColumn => departments.id, { onDelete: 'set null' }),
  ownerId: uuid('owner_id').references((): AnyPgColumn => employees.id, { onDelete: 'set null' }),
  archived: boolean('archived').default(false).notNull(),
  members: text('members').default(''), // Comma-separated employee UUIDs
  slackWebhookUrl: text('slack_webhook_url'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  deptIdx: index('task_projects_dept_idx').on(table.departmentId),
  ownerIdx: index('task_projects_owner_idx').on(table.ownerId),
}));

export const taskMilestones = pgTable('task_milestones', {
  ...baseTable,
  projectId: uuid('project_id').references((): AnyPgColumn => taskProjects.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  dueDate: date('due_date'),
  status: varchar('status', { length: 50 }).default('Open').notNull(), // Open, Achieved
}, (table) => ({
  projectIdx: index('task_milestones_project_idx').on(table.projectId),
}));

export const tasks = pgTable('tasks', {
  ...baseTable,
  projectId: uuid('project_id').references((): AnyPgColumn => taskProjects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').default(''),
  status: varchar('status', { length: 50 }).default('Todo').notNull(), // Backlog, Todo, In Progress, In Review, Done, Cancelled
  priority: varchar('priority', { length: 50 }).default('Medium').notNull(), // Low, Medium, High, Urgent
  dueDate: date('due_date'),
  assigneeId: uuid('assignee_id').references((): AnyPgColumn => employees.id, { onDelete: 'set null' }),
  reporterId: uuid('reporter_id').references((): AnyPgColumn => employees.id, { onDelete: 'set null' }),
  estimatedHours: real('estimated_hours').default(0),
  actualHours: real('actual_hours').default(0),
  tags: text('tags').default(''),
  timerStartedAt: varchar('timer_started_at', { length: 100 }),
  timerElapsedSeconds: integer('timer_elapsed_seconds').default(0),
  milestoneId: uuid('milestone_id').references((): AnyPgColumn => taskMilestones.id, { onDelete: 'set null' }),
  recurrencePattern: varchar('recurrence_pattern', { length: 50 }).default('none').notNull(), // none, daily, weekly, monthly
  recurrenceInterval: integer('recurrence_interval').default(1).notNull(),
  nextRecurrenceDate: date('next_recurrence_date'),
  progress: integer('progress').default(0).notNull(),
  workStatus: varchar('work_status', { length: 50 }).default('Idle').notNull(), // Idle, Active Working, Paused, Blocked
  approvalStatus: varchar('approval_status', { length: 50 }).default('Pending').notNull(), // Pending, Approved, Changes Requested
  reviewRating: integer('review_rating'),
  reviewFeedback: text('review_feedback'),
  watchers: text('watchers').default(''), // Comma-separated employee UUIDs
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  projectIdx: index('tasks_project_idx').on(table.projectId),
  assigneeIdx: index('tasks_assignee_idx').on(table.assigneeId),
  milestoneIdx: index('tasks_milestone_idx').on(table.milestoneId),
}));

export const taskChecklists = pgTable('task_checklists', {
  ...baseTable,
  taskId: uuid('task_id').references((): AnyPgColumn => tasks.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
}, (table) => ({
  taskIdx: index('task_checklists_task_idx').on(table.taskId),
}));

export const taskComments = pgTable('task_comments', {
  ...baseTable,
  taskId: uuid('task_id').references((): AnyPgColumn => tasks.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references((): AnyPgColumn => employees.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(),
  category: varchar('category', { length: 50 }).default('general').notNull(), // general, status, blocker, feedback
  reactions: text('reactions').default('').notNull(), // JSON string representing reactions
}, (table) => ({
  taskIdx: index('task_comments_task_idx').on(table.taskId),
  userIdx: index('task_comments_user_idx').on(table.userId),
}));

export const taskActivities = pgTable('task_activities', {
  ...baseTable,
  taskId: uuid('task_id').references((): AnyPgColumn => tasks.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references((): AnyPgColumn => employees.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(), // created, status_change, assignee_change, priority_change, comment, edit
  details: text('details').default(''),
}, (table) => ({
  taskIdx: index('task_activities_task_idx').on(table.taskId),
}));

export const taskDependencies = pgTable('task_dependencies', {
  ...baseTable,
  taskId: uuid('task_id').references((): AnyPgColumn => tasks.id, { onDelete: 'cascade' }).notNull(),
  dependsOnTaskId: uuid('depends_on_task_id').references((): AnyPgColumn => tasks.id, { onDelete: 'cascade' }).notNull(),
  dependencyType: varchar('dependency_type', { length: 50 }).default('blocked_by').notNull(), // blocked_by, blocking
}, (table) => ({
  taskIdx: index('task_dependencies_task_idx').on(table.taskId),
  dependsOnTaskIdx: index('task_dependencies_depends_on_idx').on(table.dependsOnTaskId),
}));

export const taskAttachments = pgTable('task_attachments', {
  ...baseTable,
  taskId: uuid('task_id').references((): AnyPgColumn => tasks.id, { onDelete: 'cascade' }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size').default(0).notNull(),
  uploadedById: uuid('uploaded_by_id').references((): AnyPgColumn => employees.id, { onDelete: 'set null' }),
}, (table) => ({
  taskIdx: index('task_attachments_task_idx').on(table.taskId),
}));

export const timeEntries = pgTable('time_entries', {
  ...baseTable,
  taskId: uuid('task_id').references((): AnyPgColumn => tasks.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references((): AnyPgColumn => employees.id, { onDelete: 'cascade' }).notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  durationSeconds: integer('duration_seconds').default(0).notNull(),
  description: text('description').default(''),
}, (table) => ({
  taskIdx: index('time_entries_task_idx').on(table.taskId),
  employeeIdx: index('time_entries_employee_idx').on(table.employeeId),
}));

