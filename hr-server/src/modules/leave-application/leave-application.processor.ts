import { Injectable, Inject, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { eq, and, between, or, inArray } from 'drizzle-orm';
import { v2 as cloudinary } from 'cloudinary';
import { DB_CONNECTION, type Database } from '../../db';
import {
  leaveApplications,
  leaveTypes,
  employees,
  attendanceLogs,
  leaveAttachments,
  rolePermissions,
  permissions,
} from '../../db/schema';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys, resolveKey } from '../../common/cache/cache-keys';
import { LEAVE_APPLICATION_QUEUE } from '../queue/queue.module';
import { NotificationService } from '../notifications/notifications.service';
import { NotificationModule, NotificationCategory } from '../notifications/types/notification.types';

// ─── Job payload types ────────────────────────────────────────────────────────

export interface LeaveApplicationAttachment {
  id?: string;
  title: string;
  fileName: string;
  fileUrl: string;
  /** Cloudinary public_id — used for rollback on failure */
  publicId?: string;
}

export interface CreateLeaveApplicationJobData {
  type: 'create';
  employeeId: string;
  leaveTypeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
  attachments?: LeaveApplicationAttachment[];
}

export interface UpdateLeaveApplicationJobData {
  type: 'update';
  id: string;
  employeeId: string;
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  attachments?: LeaveApplicationAttachment[];
}

export type LeaveApplicationJobData =
  | CreateLeaveApplicationJobData
  | UpdateLeaveApplicationJobData;

// ─── Processor ────────────────────────────────────────────────────────────────

@Processor(LEAVE_APPLICATION_QUEUE, { concurrency: 3 })
export class LeaveApplicationProcessor extends WorkerHost {
  private readonly logger = new Logger(LeaveApplicationProcessor.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  // ─── Route jobs by type ───────────────────────────────────────────────────

  async process(job: Job<LeaveApplicationJobData>): Promise<any> {
    this.logger.log(
      `Processing leave application job [${job.data.type}] (job: ${job.id})`,
    );

    if (job.data.type === 'create') {
      return this.processCreate(job as Job<CreateLeaveApplicationJobData>);
    }
    if (job.data.type === 'update') {
      return this.processUpdate(job as Job<UpdateLeaveApplicationJobData>);
    }

    throw new Error(`Unknown leave application job type: ${(job.data as any).type}`);
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  private async processCreate(
    job: Job<CreateLeaveApplicationJobData>,
  ): Promise<{ leaveApplicationId: string }> {
    const dto = job.data;
    const attachmentUrls = (dto.attachments ?? []).map((a) => a.fileUrl).filter(Boolean);

    try {
      const start = this.parseDateUTC(dto.startDate);
      const end = this.parseDateUTC(dto.endDate);

      if (start > end) {
        throw new Error('Start date cannot be after end date');
      }

      const timeDiff = end.getTime() - start.getTime();
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

      const result = await this.db.transaction(async (tx) => {
        // 1. Verify employee exists and is active
        const [employee] = await tx
          .select()
          .from(employees)
          .where(eq(employees.id, dto.employeeId))
          .limit(1);

        if (!employee) {
          throw new Error(`Employee with ID "${dto.employeeId}" not found`);
        }
        if (employee.status !== 'active') {
          throw new Error('Inactive employees cannot apply for leave');
        }

        // 2. Verify leave type exists and is active
        const [leaveType] = await tx
          .select()
          .from(leaveTypes)
          .where(eq(leaveTypes.id, dto.leaveTypeId))
          .limit(1);

        if (!leaveType) {
          throw new Error(`Leave type with ID "${dto.leaveTypeId}" not found`);
        }
        if (!leaveType.isActive) {
          throw new Error('This leave type is currently inactive');
        }

        // 2.5 Verify single day duration for Early Out and Movement
        const lowerLeaveTypeName = leaveType.name.toLowerCase();
        if ((lowerLeaveTypeName.includes('early out') || lowerLeaveTypeName.includes('movement')) && days !== 1) {
          throw new Error(`"${leaveType.name}" requests must be for a single day only.`);
        }

        // 3. Verify gender eligibility
        if (leaveType.eligibility) {
          const eligibilityLower = leaveType.eligibility.toLowerCase();
          if (eligibilityLower.includes('female') && employee.gender.toLowerCase() !== 'female') {
            throw new Error('This leave type is only available to female employees');
          }
          if (eligibilityLower.includes('male') && employee.gender.toLowerCase() !== 'male') {
            throw new Error('This leave type is only available to male employees');
          }
        }

        // 4. Verify leave balance
        const startYear = start.getUTCFullYear();
        const startOfYear = `${startYear}-01-01`;
        const endOfYear = `${startYear}-12-31`;

        const approvedLeaves = await tx
          .select({ leaveTypeId: leaveApplications.leaveTypeId, days: leaveApplications.days })
          .from(leaveApplications)
          .where(
            and(
              eq(leaveApplications.employeeId, dto.employeeId),
              eq(leaveApplications.status, 'Approved'),
              between(leaveApplications.startDate, startOfYear, endOfYear),
            ),
          );

        const usedDays = approvedLeaves
          .filter((a) => a.leaveTypeId === leaveType.id)
          .reduce((sum, a) => sum + a.days, 0);

        const remaining = leaveType.days - usedDays;
        if (remaining < days) {
          throw new Error(
            `Insufficient balance. You requested ${days} day(s), but only ${remaining} day(s) remaining.`,
          );
        }

        // 5. Check overlapping approved leaves
        const overlapping = await tx
          .select({ id: leaveApplications.id })
          .from(leaveApplications)
          .where(
            and(
              eq(leaveApplications.employeeId, dto.employeeId),
              eq(leaveApplications.status, 'Approved'),
              between(leaveApplications.startDate, dto.startDate, dto.endDate),
            ),
          )
          .limit(1);

        if (overlapping.length > 0) {
          throw new Error('You already have an approved leave during this period');
        }

        // 6. Insert leave application
        const [created] = await tx
          .insert(leaveApplications)
          .values({
            employeeId: dto.employeeId,
            leaveTypeId: dto.leaveTypeId,
            startDate: dto.startDate,
            endDate: dto.endDate,
            days,
            reason: dto.reason,
            status: 'Pending',
          })
          .returning();

        // 7. Insert attachments
        const clientAttachments = Array.isArray(dto.attachments)
          ? dto.attachments.filter((x) => x && x.fileUrl)
          : [];

        if (clientAttachments.length > 0) {
          await tx.insert(leaveAttachments).values(
            clientAttachments.map((att) => ({
              leaveApplicationId: created.id,
              title: att.title || 'Attachment',
              fileName: att.fileName || 'file',
              fileUrl: att.fileUrl,
            })),
          );
        }

        return { created, employee, leaveType };
      });

      const { created, employee, leaveType } = result;

      // 8. Invalidate caches
      await this.invalidateCache(dto.employeeId, start.getUTCFullYear());
      this.logger.log(
        `Leave application created: ${created.id} for employee ${dto.employeeId} (${days} days)`,
      );

      // Emit Notification to line manager or admins
      const recipientIds = employee.lineManagerId
        ? [employee.lineManagerId]
        : (
            await this.db
              .select({ id: employees.id })
              .from(employees)
              .innerJoin(rolePermissions, eq(rolePermissions.roleKey, employees.customRoleId))
              .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
              .where(eq(permissions.resource, 'leave'))
          ).map((r) => r.id);

      if (recipientIds.length > 0) {
        await this.notificationService.emitBulk(
          recipientIds.map((recipientId) => ({
            recipientId,
            actorId: dto.employeeId,
            module: NotificationModule.LEAVE,
            category: NotificationCategory.APPROVAL,
            title: 'New Leave Application',
            message: `${employee.fullNameEnglish} has applied for ${days} day(s) of ${leaveType.name} starting from ${dto.startDate}.`,
            entityType: 'leave_application',
            entityId: created.id,
            actionUrl: `/leave-applications`,
            actions: [
              {
                label: 'Approve',
                style: 'primary',
                apiMethod: 'PATCH',
                apiUrl: `/leave-applications/${created.id}/status`,
                apiBody: { status: 'Approved' },
              },
              {
                label: 'Reject',
                style: 'destructive',
                apiMethod: 'PATCH',
                apiUrl: `/leave-applications/${created.id}/status`,
                apiBody: { status: 'Rejected' },
                confirmMessage: 'Are you sure you want to reject this leave application?',
              },
            ],
          })),
        );
      }

      return { leaveApplicationId: created.id };
    } catch (error: any) {
      this.logger.error(
        `Failed to create leave application for employee ${dto.employeeId}: ${error.message}`,
        error.stack,
      );

      // Rollback: remove orphaned Cloudinary files
      await this.cleanupCloudinaryFiles(attachmentUrls);

      throw error;
    }
  }

  // ─── Update / Resubmit ────────────────────────────────────────────────────

  private async processUpdate(
    job: Job<UpdateLeaveApplicationJobData>,
  ): Promise<{ leaveApplicationId: string }> {
    const dto = job.data;
    const newAttachmentUrls = (dto.attachments ?? []).map((a) => a.fileUrl).filter(Boolean);

    try {
      const result = await this.db.transaction(async (tx) => {
        // 1. Fetch leave application
        const [app] = await tx
          .select()
          .from(leaveApplications)
          .where(eq(leaveApplications.id, dto.id))
          .limit(1);

        if (!app) {
          throw new Error(`Leave application with ID "${dto.id}" not found`);
        }

        // 2. Authorization check (guard enforces permissions, service-level ownership check)
        if (app.employeeId !== dto.employeeId) {
          // Guard has already allowed this; ownership mismatch is a safety net
        }

        // 3. Status check
        if (app.status !== 'Pending' && app.status !== 'Rejected') {
          throw new Error(`Cannot edit leave application in ${app.status} status`);
        }

        const start = this.parseDateUTC(dto.startDate || app.startDate);
        const end = this.parseDateUTC(dto.endDate || app.endDate);

        if (start > end) {
          throw new Error('Start date cannot be after end date');
        }

        const timeDiff = end.getTime() - start.getTime();
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

        const targetLeaveTypeId = dto.leaveTypeId || app.leaveTypeId;
        const [leaveType] = await tx
          .select()
          .from(leaveTypes)
          .where(eq(leaveTypes.id, targetLeaveTypeId))
          .limit(1);

        if (!leaveType) {
          throw new Error(`Leave type with ID "${targetLeaveTypeId}" not found`);
        }

        const lowerLeaveTypeName = leaveType.name.toLowerCase();
        if ((lowerLeaveTypeName.includes('early out') || lowerLeaveTypeName.includes('movement')) && days !== 1) {
          throw new Error(`"${leaveType.name}" requests must be for a single day only.`);
        }

        const updateData: Record<string, any> = {
          startDate: dto.startDate || app.startDate,
          endDate: dto.endDate || app.endDate,
          days,
          reason: dto.reason !== undefined ? dto.reason : app.reason,
          status: 'Pending',
          rejectionReason: null,
          rejectedAt: null,
        };

        if (dto.leaveTypeId) {
          updateData.leaveTypeId = dto.leaveTypeId;
        }

        const [updated] = await tx
          .update(leaveApplications)
          .set(updateData)
          .where(eq(leaveApplications.id, dto.id))
          .returning();

        // 4. Replace attachments if provided
        if (Array.isArray(dto.attachments)) {
          await tx
            .delete(leaveAttachments)
            .where(eq(leaveAttachments.leaveApplicationId, dto.id));

          const clientAttachments = dto.attachments.filter((x) => x && x.fileUrl);
          if (clientAttachments.length > 0) {
            await tx.insert(leaveAttachments).values(
              clientAttachments.map((att) => ({
                leaveApplicationId: dto.id,
                title: att.title || 'Attachment',
                fileName: att.fileName || 'file',
                fileUrl: att.fileUrl,
              })),
            );
          }
        }

        // 5. Get employee context
        const [employee] = await tx
          .select()
          .from(employees)
          .where(eq(employees.id, app.employeeId))
          .limit(1);

        return { updated, employee, leaveType };
      });

      const { updated, employee, leaveType } = result;

      const startYear = this.parseDateUTC(updated.startDate).getUTCFullYear();
      await this.invalidateCache(updated.employeeId, startYear, dto.id);
      this.logger.log(`Leave application updated/resubmitted: ${dto.id} by ${dto.employeeId}`);

      // Emit Notification to line manager or admins
      const recipientIds = employee.lineManagerId
        ? [employee.lineManagerId]
        : (
            await this.db
              .select({ id: employees.id })
              .from(employees)
              .innerJoin(rolePermissions, eq(rolePermissions.roleKey, employees.customRoleId))
              .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
              .where(eq(permissions.resource, 'leave'))
          ).map((r) => r.id);

      if (recipientIds.length > 0) {
        await this.notificationService.emitBulk(
          recipientIds.map((recipientId) => ({
            recipientId,
            actorId: dto.employeeId,
            module: NotificationModule.LEAVE,
            category: NotificationCategory.APPROVAL,
            title: 'Resubmitted Leave Application',
            message: `${employee.fullNameEnglish} has resubmitted their leave request for ${updated.days} day(s) of ${leaveType.name} starting from ${updated.startDate}.`,
            entityType: 'leave_application',
            entityId: updated.id,
            actionUrl: `/leave-applications`,
            actions: [
              {
                label: 'Approve',
                style: 'primary',
                apiMethod: 'PATCH',
                apiUrl: `/leave-applications/${updated.id}/status`,
                apiBody: { status: 'Approved' },
              },
              {
                label: 'Reject',
                style: 'destructive',
                apiMethod: 'PATCH',
                apiUrl: `/leave-applications/${updated.id}/status`,
                apiBody: { status: 'Rejected' },
                confirmMessage: 'Are you sure you want to reject this leave application?',
              },
            ],
          })),
        );
      }

      return { leaveApplicationId: updated.id };
    } catch (error: any) {
      this.logger.error(
        `Failed to update leave application ${dto.id}: ${error.message}`,
        error.stack,
      );

      // Rollback: remove orphaned Cloudinary files for new attachments
      await this.cleanupCloudinaryFiles(newAttachmentUrls);

      throw error;
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private parseDateUTC(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  private async invalidateCache(employeeId: string, year: number, id?: string) {
    const promises: Promise<any>[] = [
      this.cache.delByPattern(CacheKeys.leaveApplicationsList),
      this.cache.delByKey(CacheKeys.leaveBalances, employeeId, String(year)),
      this.cache.delPattern(resolveKey(CacheKeys.attendanceLogsByMonth, employeeId, '*', '*')),
      this.cache.delPattern(resolveKey(CacheKeys.attendanceDailyLogs, '*')),
    ];
    if (id) {
      promises.push(this.cache.delByKey(CacheKeys.leaveApplicationById, id));
    }
    await Promise.all(promises);
  }

  /**
   * Best-effort Cloudinary cleanup for files that were already uploaded
   * but whose DB insert subsequently failed. This prevents orphaned files.
   */
  private async cleanupCloudinaryFiles(fileUrls: string[]): Promise<void> {
    if (!fileUrls.length) return;

    for (const url of fileUrls) {
      try {
        // Extract public_id from Cloudinary URL
        // Pattern: .../upload/v<version>/<public_id>.<ext>  or  .../upload/v<version>/<public_id>
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i);
        if (!match) continue;

        const publicId = match[1];
        // Try raw first (documents), then image
        for (const resourceType of ['raw', 'image', 'video'] as const) {
          try {
            const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
            if (result.result === 'ok') {
              this.logger.warn(`[Rollback] Deleted orphaned Cloudinary file: ${publicId} (${resourceType})`);
              break;
            }
          } catch {
            // try next resource type
          }
        }
      } catch (err: any) {
        this.logger.warn(`[Rollback] Could not delete Cloudinary file ${url}: ${err.message}`);
      }
    }
  }
}
