import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { eq, and, or, like, desc, sql, inArray } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import {
  taskProjects,
  tasks,
  taskChecklists,
  taskComments,
  taskActivities,
  taskMilestones,
  taskDependencies,
  taskAttachments,
  timeEntries,
  taskNotifications,
} from '../../db/schema/tasks';
import { employees } from '../../db/schema/employee';
import {
  CreateProjectDto,
  UpdateProjectDto,
  CreateTaskDto,
  UpdateTaskDto,
  TaskQueryDto,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
  CreateCommentDto,
  UpdateCommentDto,
  CreateMilestoneDto,
  UpdateMilestoneDto,
  CreateDependencyDto,
  CreateTimeEntryDto,
  CreateAttachmentDto,
} from './dto/tasks.dto';
import { RealtimeGateway } from './realtime.gateway';
import { TASK_RECURRENCE_QUEUE } from '../queue/queue.module';

@Injectable()
export class TasksService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly realtimeGateway: RealtimeGateway,
    @InjectQueue(TASK_RECURRENCE_QUEUE) private readonly taskRecurrenceQueue: Queue,
  ) {}

  private broadcastMutation(action: string, id?: string) {
    this.realtimeGateway.broadcast('tasks_mutated', { action, id });
  }

  // ─── Project Endpoints ───────────────────────────────────────────────────────

  private async triggerWebhook(projectId: string | null, message: string) {
    if (!projectId) return;
    try {
      const [project] = await this.db
        .select({ slackWebhookUrl: taskProjects.slackWebhookUrl })
        .from(taskProjects)
        .where(eq(taskProjects.id, projectId))
        .limit(1);

      if (project?.slackWebhookUrl) {
        // Run outbound request in background asynchronously
        fetch(project.slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `[HR Task Manager] ${message}` }),
        }).catch(err => {
          console.error('Webhook execution failed:', err);
        });
      }
    } catch (e) {
      console.error('Failed to trigger webhook:', e);
    }
  }

  async createProject(dto: CreateProjectDto) {
    const [project] = await this.db
      .insert(taskProjects)
      .values({
        name: dto.name,
        description: dto.description || '',
        status: dto.status || 'Active',
        departmentId: dto.departmentId || null,
        ownerId: dto.ownerId || null,
        archived: dto.archived || false,
        members: dto.members || '',
        slackWebhookUrl: dto.slackWebhookUrl || null,
      })
      .returning();
    this.broadcastMutation('project_created', project.id);
    return project;
  }

  async findAllProjects(departmentId?: string) {
    let conditions = [];
    if (departmentId) {
      conditions.push(eq(taskProjects.departmentId, departmentId));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const projectsList = await this.db
      .select({
        id: taskProjects.id,
        name: taskProjects.name,
        description: taskProjects.description,
        status: taskProjects.status,
        departmentId: taskProjects.departmentId,
        ownerId: taskProjects.ownerId,
        archived: taskProjects.archived,
        members: taskProjects.members,
        slackWebhookUrl: taskProjects.slackWebhookUrl,
        createdAt: taskProjects.createdAt,
        updatedAt: taskProjects.updatedAt,
      })
      .from(taskProjects)
      .where(whereClause)
      .orderBy(desc(taskProjects.createdAt));

    const projectIds = projectsList.map(p => p.id);
    if (projectIds.length === 0) {
      return [];
    }

    // 1. Fetch task statuses for all projects in a single query
    const allProjectTasks = await this.db
      .select({
        projectId: tasks.projectId,
        status: tasks.status,
      })
      .from(tasks)
      .where(inArray(tasks.projectId, projectIds));

    // 2. Group them in memory
    const projectTasksMap = new Map<string, { total: number; completed: number }>();
    for (const task of allProjectTasks) {
      if (!task.projectId) continue;
      const entry = projectTasksMap.get(task.projectId) || { total: 0, completed: 0 };
      entry.total++;
      if (task.status === 'Done') {
        entry.completed++;
      }
      projectTasksMap.set(task.projectId, entry);
    }

    // 3. Map back to projects
    const results = projectsList.map(proj => {
      const stats = projectTasksMap.get(proj.id) || { total: 0, completed: 0 };
      return {
        ...proj,
        totalTasks: stats.total,
        completedTasks: stats.completed,
      };
    });

    return results;
  }

  async findOneProject(id: string) {
    const [project] = await this.db
      .select()
      .from(taskProjects)
      .where(eq(taskProjects.id, id))
      .limit(1);

    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }
    return project;
  }

  async updateProject(id: string, dto: UpdateProjectDto) {
    const [project] = await this.db
      .update(taskProjects)
      .set({
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
        ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
        ...(dto.archived !== undefined && { archived: dto.archived }),
        ...(dto.members !== undefined && { members: dto.members }),
        ...(dto.slackWebhookUrl !== undefined && { slackWebhookUrl: dto.slackWebhookUrl }),
      })
      .where(eq(taskProjects.id, id))
      .returning();

    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }
    this.broadcastMutation('project_updated', project.id);
    return project;
  }

  async deleteProject(id: string) {
    // 1. Find all tasks for this project
    const projectTasks = await this.db
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.projectId, id));

    // 2. Cascade delete each task
    for (const t of projectTasks) {
      await this.deleteTask(t.id);
    }

    // 3. Delete milestones
    await this.db
      .delete(taskMilestones)
      .where(eq(taskMilestones.projectId, id));

    // 4. Delete project
    const [deleted] = await this.db
      .delete(taskProjects)
      .where(eq(taskProjects.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }
    this.broadcastMutation('project_deleted', id);
    return { message: 'Project deleted successfully' };
  }

  // ─── Tasks Service Methods ───────────────────────────────────────────────────

  async createTask(dto: CreateTaskDto, reporterId?: string) {
    const [task] = await this.db
      .insert(tasks)
      .values({
        projectId: dto.projectId || null,
        title: dto.title,
        description: dto.description || '',
        status: dto.status || 'Todo',
        priority: dto.priority || 'Medium',
        dueDate: dto.dueDate ? dto.dueDate.split('T')[0] : null,
        assigneeId: dto.assigneeId || null,
        reporterId: reporterId || dto.reporterId || null,
        estimatedHours: dto.estimatedHours || 0,
        actualHours: dto.actualHours || 0,
        tags: dto.tags || '',
        timerStartedAt: dto.timerStartedAt || null,
        timerElapsedSeconds: dto.timerElapsedSeconds || 0,
        milestoneId: dto.milestoneId || null,
        recurrencePattern: dto.recurrencePattern || 'none',
        recurrenceInterval: dto.recurrenceInterval || 1,
        nextRecurrenceDate: dto.nextRecurrenceDate ? dto.nextRecurrenceDate.split('T')[0] : null,
        watchers: dto.watchers || '',
      })
      .returning();

    // Log creation activity
    await this.db
      .insert(taskActivities)
      .values({
        taskId: task.id,
        userId: reporterId || null,
        action: 'created',
        details: 'Task created',
      });

    // Webhook Trigger
    await this.triggerWebhook(task.projectId, `New task created: "${task.title}" (Priority: ${task.priority})`);

    this.broadcastMutation('task_created', task.id);
    return task;
  }

  async findAllTasks(query: TaskQueryDto) {
    const { search, projectId, assigneeId, status, priority } = query;
    const conditions = [];

    if (projectId) {
      conditions.push(eq(tasks.projectId, projectId));
    }
    if (assigneeId) {
      conditions.push(eq(tasks.assigneeId, assigneeId));
    }
    if (status && status !== 'all') {
      conditions.push(eq(tasks.status, status));
    }
    if (priority && priority !== 'all') {
      conditions.push(eq(tasks.priority, priority));
    }

    if (search) {
      conditions.push(
        or(
          like(tasks.title, `%${search}%`),
          like(tasks.description, `%${search}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch tasks joined with assignee name and details
    const rawTasks = await this.db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        assigneeId: tasks.assigneeId,
        reporterId: tasks.reporterId,
        estimatedHours: tasks.estimatedHours,
        actualHours: tasks.actualHours,
        tags: tasks.tags,
        timerStartedAt: tasks.timerStartedAt,
        timerElapsedSeconds: tasks.timerElapsedSeconds,
        milestoneId: tasks.milestoneId,
        recurrencePattern: tasks.recurrencePattern,
        recurrenceInterval: tasks.recurrenceInterval,
        nextRecurrenceDate: tasks.nextRecurrenceDate,
        progress: tasks.progress,
        workStatus: tasks.workStatus,
        approvalStatus: tasks.approvalStatus,
        reviewRating: tasks.reviewRating,
        reviewFeedback: tasks.reviewFeedback,
        watchers: tasks.watchers,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        assigneeName: employees.fullNameEnglish,
        assigneePhotoUrl: employees.employeePhotoUrl,
        projectName: taskProjects.name,
      })
      .from(tasks)
      .leftJoin(employees, eq(tasks.assigneeId, employees.id))
      .leftJoin(taskProjects, eq(tasks.projectId, taskProjects.id))
      .where(whereClause)
      .orderBy(desc(tasks.createdAt));

    const taskIds = rawTasks.map(t => t.id);
    if (taskIds.length === 0) {
      return [];
    }

    // 1. Fetch checklists for all task IDs in a single query
    const allChecklists = await this.db
      .select({
        taskId: taskChecklists.taskId,
        isCompleted: taskChecklists.isCompleted,
      })
      .from(taskChecklists)
      .where(inArray(taskChecklists.taskId, taskIds));

    // 2. Fetch comments count for all task IDs in a single query
    const allComments = await this.db
      .select({
        taskId: taskComments.taskId,
      })
      .from(taskComments)
      .where(inArray(taskComments.taskId, taskIds));

    // 3. Fetch dependencies for all task IDs in a single query
    const allDeps = await this.db
      .select({
        id: taskDependencies.id,
        taskId: taskDependencies.taskId,
        dependsOnTaskId: taskDependencies.dependsOnTaskId,
        dependencyType: taskDependencies.dependencyType,
        dependsOnTaskTitle: tasks.title,
        dependsOnTaskStatus: tasks.status,
      })
      .from(taskDependencies)
      .innerJoin(tasks, eq(taskDependencies.dependsOnTaskId, tasks.id))
      .where(inArray(taskDependencies.taskId, taskIds));

    // 4. Group them in memory
    const checklistMap = new Map<string, { total: number; completed: number }>();
    for (const item of allChecklists) {
      const entry = checklistMap.get(item.taskId) || { total: 0, completed: 0 };
      entry.total++;
      if (item.isCompleted) {
        entry.completed++;
      }
      checklistMap.set(item.taskId, entry);
    }

    const commentsMap = new Map<string, number>();
    for (const comment of allComments) {
      commentsMap.set(comment.taskId, (commentsMap.get(comment.taskId) || 0) + 1);
    }

    const depsMap = new Map<string, any[]>();
    for (const dep of allDeps) {
      const entry = depsMap.get(dep.taskId) || [];
      entry.push({
        id: dep.id,
        dependsOnTaskId: dep.dependsOnTaskId,
        dependencyType: dep.dependencyType,
        dependsOnTaskTitle: dep.dependsOnTaskTitle,
        dependsOnTaskStatus: dep.dependsOnTaskStatus,
      });
      depsMap.set(dep.taskId, entry);
    }

    // 5. Map them back to tasks
    const results = rawTasks.map(t => {
      const cl = checklistMap.get(t.id) || { total: 0, completed: 0 };
      const commentCount = commentsMap.get(t.id) || 0;
      const taskDeps = depsMap.get(t.id) || [];
      return {
        ...t,
        subtasksTotal: cl.total,
        subtasksCompleted: cl.completed,
        commentsCount: commentCount,
        dependencies: taskDeps,
      };
    });

    return results;
  }

  async findOneTask(id: string) {
    const [task] = await this.db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        assigneeId: tasks.assigneeId,
        reporterId: tasks.reporterId,
        estimatedHours: tasks.estimatedHours,
        actualHours: tasks.actualHours,
        tags: tasks.tags,
        timerStartedAt: tasks.timerStartedAt,
        timerElapsedSeconds: tasks.timerElapsedSeconds,
        milestoneId: tasks.milestoneId,
        recurrencePattern: tasks.recurrencePattern,
        recurrenceInterval: tasks.recurrenceInterval,
        nextRecurrenceDate: tasks.nextRecurrenceDate,
        progress: tasks.progress,
        workStatus: tasks.workStatus,
        approvalStatus: tasks.approvalStatus,
        reviewRating: tasks.reviewRating,
        reviewFeedback: tasks.reviewFeedback,
        watchers: tasks.watchers,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        assigneeName: employees.fullNameEnglish,
        assigneePhotoUrl: employees.employeePhotoUrl,
        projectName: taskProjects.name,
      })
      .from(tasks)
      .leftJoin(employees, eq(tasks.assigneeId, employees.id))
      .leftJoin(taskProjects, eq(tasks.projectId, taskProjects.id))
      .where(eq(tasks.id, id))
      .limit(1);

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    // Load comments
    const comments = await this.db
      .select({
        id: taskComments.id,
        content: taskComments.content,
        createdAt: taskComments.createdAt,
        userId: taskComments.userId,
        isPinned: taskComments.isPinned,
        category: taskComments.category,
        reactions: taskComments.reactions,
        userName: employees.fullNameEnglish,
        userPhotoUrl: employees.employeePhotoUrl,
      })
      .from(taskComments)
      .leftJoin(employees, eq(taskComments.userId, employees.id))
      .where(eq(taskComments.taskId, id))
      .orderBy(desc(taskComments.createdAt));

    // Load activities
    const activities = await this.db
      .select({
        id: taskActivities.id,
        action: taskActivities.action,
        details: taskActivities.details,
        createdAt: taskActivities.createdAt,
        userId: taskActivities.userId,
        userName: employees.fullNameEnglish,
      })
      .from(taskActivities)
      .leftJoin(employees, eq(taskActivities.userId, employees.id))
      .where(eq(taskActivities.taskId, id))
      .orderBy(desc(taskActivities.createdAt));

    // Load checklists
    const checklist = await this.db
      .select()
      .from(taskChecklists)
      .where(eq(taskChecklists.taskId, id))
      .orderBy(taskChecklists.createdAt);

    // Load dependencies
    const dependencies = await this.db
      .select({
        id: taskDependencies.id,
        dependsOnTaskId: taskDependencies.dependsOnTaskId,
        dependencyType: taskDependencies.dependencyType,
        dependsOnTaskTitle: tasks.title,
        dependsOnTaskStatus: tasks.status,
      })
      .from(taskDependencies)
      .innerJoin(tasks, eq(taskDependencies.dependsOnTaskId, tasks.id))
      .where(eq(taskDependencies.taskId, id));

    // Load attachments
    const attachments = await this.db
      .select({
        id: taskAttachments.id,
        fileName: taskAttachments.fileName,
        fileUrl: taskAttachments.fileUrl,
        fileSize: taskAttachments.fileSize,
        uploadedById: taskAttachments.uploadedById,
        uploadedByName: employees.fullNameEnglish,
      })
      .from(taskAttachments)
      .leftJoin(employees, eq(taskAttachments.uploadedById, employees.id))
      .where(eq(taskAttachments.taskId, id));

    // Load time entries
    const timeLogs = await this.db
      .select({
        id: timeEntries.id,
        employeeId: timeEntries.employeeId,
        employeeName: employees.fullNameEnglish,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        durationSeconds: timeEntries.durationSeconds,
        description: timeEntries.description,
      })
      .from(timeEntries)
      .leftJoin(employees, eq(timeEntries.employeeId, employees.id))
      .where(eq(timeEntries.taskId, id))
      .orderBy(desc(timeEntries.startTime));

    return {
      ...task,
      comments,
      activities,
      checklist,
      dependencies,
      attachments,
      timeEntries: timeLogs,
    };
  }

  async updateTask(id: string, dto: UpdateTaskDto, userId: string) {
    const [existing] = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    const [updated] = await this.db
      .update(tasks)
      .set({
        ...(dto.projectId !== undefined && { projectId: dto.projectId }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate ? dto.dueDate.split('T')[0] : null }),
        ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
        ...(dto.reporterId !== undefined && { reporterId: dto.reporterId }),
        ...(dto.estimatedHours !== undefined && { estimatedHours: dto.estimatedHours }),
        ...(dto.actualHours !== undefined && { actualHours: dto.actualHours }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.timerStartedAt !== undefined && { timerStartedAt: dto.timerStartedAt }),
        ...(dto.timerElapsedSeconds !== undefined && { timerElapsedSeconds: dto.timerElapsedSeconds }),
        ...(dto.milestoneId !== undefined && { milestoneId: dto.milestoneId }),
        ...(dto.recurrencePattern !== undefined && { recurrencePattern: dto.recurrencePattern }),
        ...(dto.recurrenceInterval !== undefined && { recurrenceInterval: dto.recurrenceInterval }),
        ...(dto.nextRecurrenceDate !== undefined && { nextRecurrenceDate: dto.nextRecurrenceDate ? dto.nextRecurrenceDate.split('T')[0] : null }),
        ...(dto.progress !== undefined && { progress: dto.progress }),
        ...(dto.workStatus !== undefined && { workStatus: dto.workStatus }),
        ...(dto.approvalStatus !== undefined && { approvalStatus: dto.approvalStatus }),
        ...(dto.reviewRating !== undefined && { reviewRating: dto.reviewRating }),
        ...(dto.reviewFeedback !== undefined && { reviewFeedback: dto.reviewFeedback }),
        ...(dto.watchers !== undefined && { watchers: dto.watchers }),
      })
      .where(eq(tasks.id, id))
      .returning();

    // Log activities for specific updates
    if (dto.status && dto.status !== existing.status) {
      await this.db
        .insert(taskActivities)
        .values({
          taskId: id,
          userId,
          action: 'status_change',
          details: `Status updated from ${existing.status} to ${dto.status}`,
        });

      // Webhook alert for status changes
      await this.triggerWebhook(
        updated.projectId,
        `Task "${updated.title}" status changed to: *${dto.status}*`,
      );

      // Create notification for assignee
      if (updated.assigneeId && updated.assigneeId !== userId) {
        await this.createNotification(
          updated.assigneeId,
          'Task Status Updated',
          `Your assigned task "${updated.title}" is now "${dto.status}".`,
        );
      }

      // If status changed to Done and task is a recurring task, clone it for next occurrence asynchronously via BullMQ
      if (dto.status === 'Done' && updated.recurrencePattern && updated.recurrencePattern !== 'none') {
        try {
          await this.taskRecurrenceQueue.add(
            'process-recurrence',
            { taskId: id, userId },
            { removeOnComplete: true, removeOnFail: true }
          );
        } catch (e) {
          console.error('Failed to queue recurring task clone:', e);
        }
      }
    }

    if (dto.assigneeId !== undefined && dto.assigneeId !== existing.assigneeId) {
      let details = 'Task reassigned';
      if (dto.assigneeId) {
        const [emp] = await this.db
          .select({ name: employees.fullNameEnglish })
          .from(employees)
          .where(eq(employees.id, dto.assigneeId))
          .limit(1);
        if (emp) details = `Assigned task to ${emp.name}`;
      } else {
        details = 'Unassigned the task';
      }
      await this.db
        .insert(taskActivities)
        .values({
          taskId: id,
          userId,
          action: 'assignee_change',
          details,
        });

      // Webhook Alert
      await this.triggerWebhook(updated.projectId, `Task "${updated.title}" reassigned: ${details}`);

      // Notification
      if (dto.assigneeId) {
        await this.createNotification(
          dto.assigneeId,
          'Task Assigned to You',
          `You have been assigned to: "${updated.title}"`,
        );
      }
    }

    if (dto.priority && dto.priority !== existing.priority) {
      await this.db
        .insert(taskActivities)
        .values({
          taskId: id,
          userId,
          action: 'priority_change',
          details: `Priority changed from ${existing.priority} to ${dto.priority}`,
        });
    }

    this.broadcastMutation('task_updated', id);
    return updated;
  }

  async handleRecurrenceClone(taskId: string, userId: string) {
    const [taskRecord] = await this.db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!taskRecord || taskRecord.recurrencePattern === 'none') {
      return { status: 'skipped', reason: 'task_not_found_or_not_recurring' };
    }

    const nextDate = new Date(taskRecord.nextRecurrenceDate || new Date());
    const interval = taskRecord.recurrenceInterval || 1;

    if (taskRecord.recurrencePattern === 'daily') {
      nextDate.setDate(nextDate.getDate() + interval);
    } else if (taskRecord.recurrencePattern === 'weekly') {
      nextDate.setDate(nextDate.getDate() + interval * 7);
    } else if (taskRecord.recurrencePattern === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + interval);
    }

    const nextDateStr = nextDate.toISOString().split('T')[0];

    // Auto-create next task clone (with status 'Todo')
    const [clonedTask] = await this.db.insert(tasks).values({
      projectId: taskRecord.projectId,
      title: taskRecord.title,
      description: taskRecord.description,
      status: 'Todo',
      priority: taskRecord.priority,
      dueDate: taskRecord.nextRecurrenceDate, // Due date is the current recurrence date
      assigneeId: taskRecord.assigneeId,
      reporterId: taskRecord.reporterId,
      estimatedHours: taskRecord.estimatedHours,
      actualHours: 0,
      tags: taskRecord.tags,
      watchers: taskRecord.watchers,
      recurrencePattern: taskRecord.recurrencePattern,
      recurrenceInterval: taskRecord.recurrenceInterval,
      nextRecurrenceDate: nextDateStr,
      progress: 0,
      workStatus: 'Idle',
      approvalStatus: 'Pending',
    }).returning();

    // Log creation activity for the cloned task
    await this.db.insert(taskActivities).values({
      taskId: clonedTask.id,
      userId: null,
      action: 'created',
      details: 'Automatically created recurring task instance via BullMQ',
    });

    // Disable recurrence on the current completed task
    await this.db.update(tasks).set({
      recurrencePattern: 'none',
    }).where(eq(tasks.id, taskId));

    this.broadcastMutation('task_created', clonedTask.id);
    this.broadcastMutation('task_updated', taskId);

    return { status: 'success', clonedTaskId: clonedTask.id };
  }

  async deleteTask(id: string) {
    // 1. Delete checklists
    await this.db.delete(taskChecklists).where(eq(taskChecklists.taskId, id));
    // 2. Delete comments
    await this.db.delete(taskComments).where(eq(taskComments.taskId, id));
    // 3. Delete activities
    await this.db.delete(taskActivities).where(eq(taskActivities.taskId, id));
    // 4. Delete dependencies
    await this.db.delete(taskDependencies).where(
      or(
        eq(taskDependencies.taskId, id),
        eq(taskDependencies.dependsOnTaskId, id)
      )
    );
    // 5. Delete attachments
    await this.db.delete(taskAttachments).where(eq(taskAttachments.taskId, id));
    // 6. Delete time entries
    await this.db.delete(timeEntries).where(eq(timeEntries.taskId, id));
    // 7. Delete task
    const [deleted] = await this.db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    this.broadcastMutation('task_deleted', id);
    return { message: 'Task deleted successfully' };
  }

  // ─── Checklist Items Methods ─────────────────────────────────────────────────

  async addChecklistItem(taskId: string, dto: CreateChecklistItemDto) {
    const [item] = await this.db
      .insert(taskChecklists)
      .values({
        taskId,
        title: dto.title,
        isCompleted: false,
      })
      .returning();
    this.broadcastMutation('task_updated', taskId);
    return item;
  }

  async updateChecklistItem(itemId: string, dto: UpdateChecklistItemDto) {
    const [item] = await this.db
      .update(taskChecklists)
      .set({
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.isCompleted !== undefined && { isCompleted: dto.isCompleted }),
      })
      .where(eq(taskChecklists.id, itemId))
      .returning();

    if (!item) {
      throw new NotFoundException(`Checklist item with ID "${itemId}" not found`);
    }
    this.broadcastMutation('task_updated', item.taskId);
    return item;
  }

  async deleteChecklistItem(itemId: string) {
    const [deleted] = await this.db
      .delete(taskChecklists)
      .where(eq(taskChecklists.id, itemId))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`Checklist item with ID "${itemId}" not found`);
    }
    this.broadcastMutation('task_updated', deleted.taskId);
    return { message: 'Checklist item removed successfully' };
  }

  // ─── Comments Service Methods ───────────────────────────────────────────────

  async addComment(taskId: string, userId: string, dto: CreateCommentDto) {
    const [comment] = await this.db
      .insert(taskComments)
      .values({
        taskId,
        userId,
        content: dto.content,
        category: dto.category || 'general',
        reactions: '{}',
      })
      .returning();

    await this.db
      .insert(taskActivities)
      .values({
        taskId,
        userId,
        action: 'comment',
        details: 'Added a comment',
      });

    // Notify task assignee if someone else comments
    const [task] = await this.db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (task && task.assigneeId && task.assigneeId !== userId) {
      const [commenter] = await this.db
        .select({ name: employees.fullNameEnglish })
        .from(employees)
        .where(eq(employees.id, userId))
        .limit(1);
      const commenterName = commenter?.name || 'A team member';
      await this.createNotification(
        task.assigneeId,
        'New Comment on Task',
        `${commenterName} commented on your assigned task "${task.title}": "${dto.content.substring(0, 45)}..."`,
      );
    }

    // Parse @mentions
    const allEmps = await this.db.select({ id: employees.id, name: employees.fullNameEnglish }).from(employees);
    for (const emp of allEmps) {
      const mentionTag = `@${emp.name}`;
      if (dto.content.includes(mentionTag) && emp.id !== userId) {
        await this.createNotification(
          emp.id,
          'Mentioned in Task Comment',
          `You were mentioned in a comment on task: "${task?.title || 'Task'}"`,
        );
      }
    }

    this.broadcastMutation('task_updated', taskId);
    return comment;
  }

  async deleteComment(commentId: string, userId: string) {
    const [deleted] = await this.db
      .delete(taskComments)
      .where(and(eq(taskComments.id, commentId), eq(taskComments.userId, userId)))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`Comment with ID "${commentId}" not found or unauthorized to delete`);
    }
    this.broadcastMutation('task_updated', deleted.taskId);
    return { message: 'Comment deleted successfully' };
  }

  async updateComment(commentId: string, userId: string, dto: UpdateCommentDto) {
    // For reactions, anyone can update reactions (add/toggle reactions)
    // For pinning, anyone can pin (collaborative task settings)
    // For editing content, only the author can edit
    const [existing] = await this.db
      .select()
      .from(taskComments)
      .where(eq(taskComments.id, commentId))
      .limit(1);
    if (!existing) {
      throw new NotFoundException('Comment not found');
    }

    if (dto.content !== undefined && existing.userId !== userId) {
      throw new NotFoundException('Unauthorized to edit this comment');
    }

    const [updated] = await this.db
      .update(taskComments)
      .set({
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.isPinned !== undefined && { isPinned: dto.isPinned }),
        ...(dto.reactions !== undefined && { reactions: dto.reactions }),
      })
      .where(eq(taskComments.id, commentId))
      .returning();

    this.broadcastMutation('task_updated', updated.taskId);
    return updated;
  }

  async findProjectActivities(projectId: string) {
    return this.db
      .select({
        id: taskActivities.id,
        action: taskActivities.action,
        details: taskActivities.details,
        createdAt: taskActivities.createdAt,
        userId: taskActivities.userId,
        userName: employees.fullNameEnglish,
        userPhotoUrl: employees.employeePhotoUrl,
        taskTitle: tasks.title,
        taskId: tasks.id,
      })
      .from(taskActivities)
      .innerJoin(tasks, eq(taskActivities.taskId, tasks.id))
      .leftJoin(employees, eq(taskActivities.userId, employees.id))
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(taskActivities.createdAt));
  }

  // ─── Milestones CRUD ────────────────────────────────────────────────────────

  async createMilestone(dto: CreateMilestoneDto) {
    const [milestone] = await this.db
      .insert(taskMilestones)
      .values({
        projectId: dto.projectId,
        name: dto.name,
        dueDate: dto.dueDate ? dto.dueDate.split('T')[0] : null,
        status: dto.status || 'Open',
      })
      .returning();
    this.broadcastMutation('project_updated', milestone.projectId);
    return milestone;
  }

  async findMilestones(projectId: string) {
    return this.db
      .select()
      .from(taskMilestones)
      .where(eq(taskMilestones.projectId, projectId))
      .orderBy(taskMilestones.dueDate);
  }

  async updateMilestone(id: string, dto: UpdateMilestoneDto) {
    const [updated] = await this.db
      .update(taskMilestones)
      .set({
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate ? dto.dueDate.split('T')[0] : null }),
        ...(dto.status !== undefined && { status: dto.status }),
      })
      .where(eq(taskMilestones.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Milestone not found');
    this.broadcastMutation('project_updated', updated.projectId);
    return updated;
  }

  async deleteMilestone(id: string) {
    const [deleted] = await this.db.delete(taskMilestones).where(eq(taskMilestones.id, id)).returning();
    if (!deleted) throw new NotFoundException('Milestone not found');
    this.broadcastMutation('project_updated', deleted.projectId);
    return { message: 'Milestone deleted successfully' };
  }

  // ─── Dependencies CRUD ──────────────────────────────────────────────────────

  async addDependency(taskId: string, dto: CreateDependencyDto) {
    const [dep] = await this.db
      .insert(taskDependencies)
      .values({
        taskId,
        dependsOnTaskId: dto.dependsOnTaskId,
        dependencyType: dto.dependencyType || 'blocked_by',
      })
      .returning();
    this.broadcastMutation('task_updated', taskId);
    return dep;
  }

  async deleteDependency(id: string) {
    const [deleted] = await this.db.delete(taskDependencies).where(eq(taskDependencies.id, id)).returning();
    if (!deleted) throw new NotFoundException('Dependency not found');
    this.broadcastMutation('task_updated', deleted.taskId);
    return { message: 'Dependency removed' };
  }

  // ─── Time Entries CRUD ──────────────────────────────────────────────────────

  async addTimeEntry(taskId: string, dto: CreateTimeEntryDto) {
    const [entry] = await this.db
      .insert(timeEntries)
      .values({
        taskId,
        employeeId: dto.employeeId,
        startTime: new Date(dto.startTime),
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        durationSeconds: dto.durationSeconds || 0,
        description: dto.description || '',
      })
      .returning();

    // Aggregates durationSeconds to tasks actualHours
    const [task] = await this.db.select({ actualHours: tasks.actualHours }).from(tasks).where(eq(tasks.id, taskId)).limit(1);
    const addedHours = Math.round((dto.durationSeconds || 0) / 3600);
    await this.db
      .update(tasks)
      .set({ actualHours: (task?.actualHours || 0) + addedHours })
      .where(eq(tasks.id, taskId));

    this.broadcastMutation('task_updated', taskId);
    return entry;
  }

  async deleteTimeEntry(id: string) {
    const [deleted] = await this.db.delete(timeEntries).where(eq(timeEntries.id, id)).returning();
    if (!deleted) throw new NotFoundException('Time entry not found');
    this.broadcastMutation('task_updated', deleted.taskId);
    return { message: 'Time entry deleted' };
  }

  // ─── Attachments CRUD ───────────────────────────────────────────────────────

  async addAttachment(taskId: string, dto: CreateAttachmentDto, uploadedById: string) {
    const [file] = await this.db
      .insert(taskAttachments)
      .values({
        taskId,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize || 0,
        uploadedById,
      })
      .returning();
    this.broadcastMutation('task_updated', taskId);
    return file;
  }

  async deleteAttachment(id: string) {
    const [deleted] = await this.db.delete(taskAttachments).where(eq(taskAttachments.id, id)).returning();
    if (!deleted) throw new NotFoundException('Attachment not found');
    this.broadcastMutation('task_updated', deleted.taskId);
    return { message: 'Attachment deleted' };
  }

  // ─── Notifications CRUD ─────────────────────────────────────────────────────

  async createNotification(employeeId: string, title: string, message: string) {
    const [notification] = await this.db
      .insert(taskNotifications)
      .values({
        employeeId,
        title,
        message,
        isRead: false,
      })
      .returning();
    return notification;
  }

  async findNotifications(employeeId: string) {
    return this.db
      .select()
      .from(taskNotifications)
      .where(eq(taskNotifications.employeeId, employeeId))
      .orderBy(desc(taskNotifications.createdAt));
  }

  async markNotificationRead(id: string) {
    const [updated] = await this.db
      .update(taskNotifications)
      .set({ isRead: true })
      .where(eq(taskNotifications.id, id))
      .returning();
    return updated;
  }
}
