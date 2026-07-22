import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, desc, asc, inArray, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { DB_CONNECTION, type Database } from '../../db';
import { claims, claimAttachments, employees, rolePermissions, permissions, attendanceSettings } from '../../db/schema';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';
import type {
  CreateClaimDto,
  UpdateClaimStatusDto,
  ClaimQueryDto,
} from './dto/claims.dto';
import { NotificationService } from '../notifications/notifications.service';
import { NotificationModule, NotificationCategory } from '../notifications/types/notification.types';

const approver = alias(employees, 'approver');
const firstApprover = alias(employees, 'first_approver');

@Injectable()
export class ClaimsService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
    private readonly notificationService: NotificationService,
  ) {}

  // ─── Find All (paginated, filtered) ────────────────────────────────────────

  async findAll(query: ClaimQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      claimType,
      employeeId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const cacheKeyParts = `${page}:${limit}:${search ?? ''}:${status ?? ''}:${claimType ?? ''}:${employeeId ?? ''}:${sortBy}:${sortOrder}`;
    const cached = await this.cache.getByKey<any>(CacheKeys.claimsList, cacheKeyParts);
    if (cached) return cached;

    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];
    if (status) conditions.push(eq(claims.status, status));
    if (claimType) conditions.push(eq(claims.claimType, claimType));
    if (employeeId) conditions.push(eq(claims.employeeId, employeeId));

    const finalWhere = conditions.length > 0 ? and(...conditions) : undefined;

    // Order
    const orderColumn =
      sortBy === 'amount'
        ? claims.amount
        : sortBy === 'status'
          ? claims.status
          : claims.createdAt;

    const orderFn = sortOrder === 'asc' ? asc : desc;

    const rawList = await this.db
      .select({
        id: claims.id,
        employeeId: claims.employeeId,
        claimType: claims.claimType,
        amount: claims.amount,
        status: claims.status,
        description: claims.description,
        approvedAmount: claims.approvedAmount,
        details: claims.details,
        approvedById: claims.approvedById,
        approvedAt: claims.approvedAt,
        firstApprovedById: claims.firstApprovedById,
        firstApprovedAt: claims.firstApprovedAt,
        rejectedAt: claims.rejectedAt,
        rejectionReason: claims.rejectionReason,
        settledAt: claims.settledAt,
        createdAt: claims.createdAt,
        updatedAt: claims.updatedAt,
        employeeName: employees.fullNameEnglish,
        employeeEmail: employees.email,
        employeeIdCode: employees.employeeId,
        employeeLineManagerId: employees.lineManagerId,
        approvedByName: approver.fullNameEnglish,
        firstApprovedByName: firstApprover.fullNameEnglish,
      })
      .from(claims)
      .innerJoin(employees, eq(claims.employeeId, employees.id))
      .leftJoin(approver, eq(claims.approvedById, approver.id))
      .leftJoin(firstApprover, eq(claims.firstApprovedById, firstApprover.id))
      .where(finalWhere)
      .orderBy(orderFn(orderColumn));

    // Apply search filter in-memory (employee name / description)
    let processed = rawList;
    if (search) {
      const q = search.toLowerCase();
      processed = rawList.filter(
        (r) =>
          r.employeeName.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.employeeIdCode.toLowerCase().includes(q),
      );
    }

    const total = processed.length;
    const paginated = processed.slice(offset, offset + limit);

    // Fetch attachments for paginated records
    const ids = paginated.map((r) => r.id);
    const allAttachments =
      ids.length > 0
        ? await this.db
            .select({
              id: claimAttachments.id,
              claimId: claimAttachments.claimId,
              title: claimAttachments.title,
              fileName: claimAttachments.fileName,
              fileUrl: claimAttachments.fileUrl,
            })
            .from(claimAttachments)
            .where(inArray(claimAttachments.claimId, ids))
        : [];

    const attachmentsMap = new Map<string, any[]>();
    for (const att of allAttachments) {
      const list = attachmentsMap.get(att.claimId) || [];
      list.push({
        id: att.id,
        title: att.title,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
      });
      attachmentsMap.set(att.claimId, list);
    }

    const paginatedWithAttachments = paginated.map((item) => ({
      ...item,
      attachments: attachmentsMap.get(item.id) || [],
    }));

    const result = {
      data: paginatedWithAttachments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cache.setByKey(CacheKeys.claimsList, result, cacheKeyParts);
    return result;
  }

  // ─── Find One ──────────────────────────────────────────────────────────────

  async findOne(id: string, requestingUser?: any) {
    const cached = await this.cache.getByKey<any>(CacheKeys.claimById, id);
    let claimResult = cached;

    if (!claimResult) {
      const [claim] = await this.db
        .select({
          id: claims.id,
          employeeId: claims.employeeId,
          claimType: claims.claimType,
          amount: claims.amount,
          status: claims.status,
          description: claims.description,
          approvedAmount: claims.approvedAmount,
          details: claims.details,
          approvedById: claims.approvedById,
          approvedAt: claims.approvedAt,
          firstApprovedById: claims.firstApprovedById,
          firstApprovedAt: claims.firstApprovedAt,
          rejectedAt: claims.rejectedAt,
          rejectionReason: claims.rejectionReason,
          settledAt: claims.settledAt,
          createdAt: claims.createdAt,
          updatedAt: claims.updatedAt,
          employeeName: employees.fullNameEnglish,
          employeeEmail: employees.email,
          employeeIdCode: employees.employeeId,
          employeeDepartmentId: employees.departmentId,
          employeeLineManagerId: employees.lineManagerId,
          approvedByName: approver.fullNameEnglish,
          firstApprovedByName: firstApprover.fullNameEnglish,
        })
        .from(claims)
        .innerJoin(employees, eq(claims.employeeId, employees.id))
        .leftJoin(approver, eq(claims.approvedById, approver.id))
        .leftJoin(firstApprover, eq(claims.firstApprovedById, firstApprover.id))
        .where(eq(claims.id, id))
        .limit(1);

      if (!claim) {
        throw new NotFoundException(`Claim with ID "${id}" not found`);
      }

      // Fetch attachments
      const attachments = await this.db
        .select({
          id: claimAttachments.id,
          title: claimAttachments.title,
          fileName: claimAttachments.fileName,
          fileUrl: claimAttachments.fileUrl,
        })
        .from(claimAttachments)
        .where(eq(claimAttachments.claimId, id));

      claimResult = { ...claim, attachments };
      await this.cache.setByKey(CacheKeys.claimById, claimResult, id);
    }

    if (requestingUser) {
      const { id: userId } = requestingUser;
      // Ownership guard handles broader access control via permissions
      // Service-level check: users without view_all can only see own claims
      if (claimResult.employeeId !== userId && !requestingUser.customRoleId) {
        throw new ForbiddenException('You can only access your own claims');
      }
    }

    return claimResult;
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  async create(employeeId: string, dto: CreateClaimDto) {
    const [created] = await this.db
      .insert(claims)
      .values({
        employeeId,
        claimType: dto.claimType,
        amount: String(dto.amount),
        description: dto.description || '',
        details: dto.details || null,
      })
      .returning();

    // Insert attachments if provided
    if (dto.attachments && dto.attachments.length > 0) {
      await this.db.insert(claimAttachments).values(
        dto.attachments.map((att) => ({
          claimId: created.id,
          title: att.title,
          fileName: att.fileName,
          fileUrl: att.fileUrl,
        })),
      );
    }

    await this.invalidateCache();
    const result = await this.findOne(created.id);

    // Trigger Notification
    await this.triggerClaimSubmissionNotification(employeeId, result);

    return result;
  }

  // ─── Update Status (Approve / Reject / Settle) ─────────────────────────────

  async updateStatus(id: string, requestingUser: any, dto: UpdateClaimStatusDto) {
    const approvedById = requestingUser.id;
    const [claim] = await this.db
      .select({
        id: claims.id,
        status: claims.status,
        employeeId: claims.employeeId,
        claimType: claims.claimType,
        amount: claims.amount,
      })
      .from(claims)
      .where(eq(claims.id, id))
      .limit(1);

    if (!claim) {
      throw new NotFoundException(`Claim with ID "${id}" not found`);
    }

    const [applicant] = await this.db
      .select({
        id: employees.id,
        lineManagerId: employees.lineManagerId,
      })
      .from(employees)
      .where(eq(employees.id, claim.employeeId))
      .limit(1);

    if (!applicant) {
      throw new NotFoundException(`Applicant employee not found`);
    }

    let [settings] = await this.db
      .select()
      .from(attendanceSettings)
      .where(eq(attendanceSettings.id, 'default'))
      .limit(1);
    const threshold = settings?.twoStepClaimThresholdAmount ? Number(settings.twoStepClaimThresholdAmount) : 1000.00;

    const isLineManager = applicant.lineManagerId === approvedById;
    const hasApprovePerm = requestingUser.permissions?.has('claims:approve') || !requestingUser.customRoleId;

    // Validate status transitions
    if (dto.status === 'Settled' && claim.status !== 'Approved') {
      throw new BadRequestException('Only approved claims can be settled');
    }

    const updateData: Record<string, any> = {};

    if (dto.status === 'Approved') {
      if (claim.status === 'Pending') {
        const needsTwoStep = Number(claim.amount) >= threshold && applicant.lineManagerId;

        if (needsTwoStep) {
          // First step approval by Line Manager
          if (!isLineManager) {
            throw new ForbiddenException('Only the Line Manager can perform the first step of approval');
          }
          updateData.status = 'Pending_2nd';
          updateData.firstApprovedById = approvedById;
          updateData.firstApprovedAt = new Date();
        } else {
          // Single step approval (either line manager or claims:approve)
          if (!isLineManager && !hasApprovePerm) {
            throw new ForbiddenException('You do not have permission to approve this claim request');
          }
          updateData.status = 'Approved';
          updateData.approvedById = approvedById;
          updateData.approvedAt = new Date();
          if (dto.approvedAmount !== undefined) {
            updateData.approvedAmount = String(dto.approvedAmount);
          }
        }
      } else if (claim.status === 'Pending_2nd') {
        // Second step approval
        if (!hasApprovePerm) {
          throw new ForbiddenException('Only users with claims:approve permission can perform the second step of approval');
        }
        updateData.status = 'Approved';
        updateData.approvedById = approvedById;
        updateData.approvedAt = new Date();
        if (dto.approvedAmount !== undefined) {
          updateData.approvedAmount = String(dto.approvedAmount);
        }
      } else {
        throw new BadRequestException(`Cannot approve a claim with status "${claim.status}"`);
      }
    } else if (dto.status === 'Rejected') {
      // Rejecting a claim request
      if (claim.status === 'Pending') {
        if (!isLineManager && !hasApprovePerm) {
          throw new ForbiddenException('You do not have permission to reject this claim request');
        }
      } else if (claim.status === 'Pending_2nd') {
        if (!hasApprovePerm) {
          throw new ForbiddenException('Only users with claims:approve permission can reject this claim request');
        }
      } else {
        throw new BadRequestException(`Cannot reject a claim with status "${claim.status}"`);
      }
      updateData.status = 'Rejected';
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = dto.rejectionReason || 'No reason provided';
    } else if (dto.status === 'Settled') {
      if (claim.status !== 'Approved') {
        throw new BadRequestException('Only approved claims can be settled');
      }
      updateData.status = 'Settled';
      updateData.settledAt = new Date();
    }

    const [updated] = await this.db
      .update(claims)
      .set(updateData)
      .where(eq(claims.id, id))
      .returning();

    await this.invalidateCache(id);
    const result = await this.findOne(id);

    // Trigger Notification
    let notificationMessage = `Your ${claim.claimType} claim of ${claim.amount} BDT has been `;
    if (updateData.status === 'Pending_2nd') {
      notificationMessage += `approved by your Line Manager and is now awaiting final HR/Admin approval.`;
    } else {
      notificationMessage += `${dto.status.toLowerCase()}.${
        dto.status === 'Rejected' && dto.rejectionReason ? ` Reason: ${dto.rejectionReason}` : ''
      }`;
    }

    await this.notificationService.emit({
      recipientId: claim.employeeId,
      actorId: approvedById,
      module: NotificationModule.CLAIMS,
      category: updateData.status === 'Pending_2nd' ? NotificationCategory.APPROVAL : dto.status === 'Approved' ? NotificationCategory.APPROVAL : dto.status === 'Rejected' ? NotificationCategory.REJECTION : NotificationCategory.STATUS_CHANGE,
      title: updateData.status === 'Pending_2nd' ? 'Claim Line Manager Approved' : `Claim ${dto.status}`,
      message: notificationMessage,
      entityType: 'claim',
      entityId: claim.id,
      actionUrl: '/claims',
    });

    // If it was line-manager approved (Pending_2nd), notify standard claims approvers
    if (updateData.status === 'Pending_2nd') {
      try {
        const adminApprovers = await this.db
          .select({ id: employees.id })
          .from(employees)
          .innerJoin(rolePermissions, eq(rolePermissions.roleKey, employees.customRoleId))
          .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
          .where(and(eq(permissions.resource, 'claims'), eq(permissions.action, 'approve')));

        const recipientIds = adminApprovers.map((r) => r.id);
        if (recipientIds.length > 0) {
          await this.notificationService.emitBulk(
            recipientIds.map((recipientId) => ({
              recipientId,
              actorId: approvedById,
              module: NotificationModule.CLAIMS,
              category: NotificationCategory.APPROVAL,
              title: 'Claim Awaiting 2nd Approval',
              message: `A ${claim.claimType} claim of ${claim.amount} BDT has been approved by the Line Manager and awaits your final approval.`,
              entityType: 'claim',
              entityId: claim.id,
              actionUrl: `/claims`,
              actions: [
                {
                  label: 'Approve',
                  style: 'primary',
                  apiMethod: 'PATCH',
                  apiUrl: `/claims/${claim.id}/status`,
                  apiBody: { status: 'Approved' },
                },
                {
                  label: 'Reject',
                  style: 'destructive',
                  apiMethod: 'PATCH',
                  apiUrl: `/claims/${claim.id}/status`,
                  apiBody: { status: 'Rejected' },
                  confirmMessage: 'Are you sure you want to reject this claim?',
                },
              ],
            }))
          );
        }
      } catch (e) {
        // don't fail operation
      }
    }

    return result;
  }

  private async triggerClaimSubmissionNotification(employeeId: string, claim: any) {
    try {
      const [employee] = await this.db
        .select()
        .from(employees)
        .where(eq(employees.id, employeeId))
        .limit(1);

      if (!employee) return;

      const recipientIds = employee.lineManagerId
        ? [employee.lineManagerId]
        : (
            await this.db
              .select({ id: employees.id })
              .from(employees)
              .innerJoin(rolePermissions, eq(rolePermissions.roleKey, employees.customRoleId))
              .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
              .where(and(eq(permissions.resource, 'claims'), eq(permissions.action, 'approve')))
          ).map((r) => r.id);

      if (recipientIds.length > 0) {
        await this.notificationService.emitBulk(
          recipientIds.map((recipientId) => ({
            recipientId,
            actorId: employeeId,
            module: NotificationModule.CLAIMS,
            category: NotificationCategory.APPROVAL,
            title: 'New Claim Submission',
            message: `${employee.fullNameEnglish} has submitted a new ${claim.claimType} claim of ${claim.amount} BDT.`,
            entityType: 'claim',
            entityId: claim.id,
            actionUrl: `/claims`,
            actions: [
              {
                label: 'Approve',
                style: 'primary',
                apiMethod: 'PATCH',
                apiUrl: `/claims/${claim.id}/status`,
                apiBody: { status: 'Approved' },
              },
              {
                label: 'Reject',
                style: 'destructive',
                apiMethod: 'PATCH',
                apiUrl: `/claims/${claim.id}/status`,
                apiBody: { status: 'Rejected' },
                confirmMessage: 'Are you sure you want to reject this claim?',
              },
            ],
          })),
        );
      }
    } catch (err: any) {
      // Don't fail the operation if notification fails
    }
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  async delete(id: string, requestingUser?: any) {
    const [claim] = await this.db
      .select({
        id: claims.id,
        status: claims.status,
        employeeId: claims.employeeId,
        employeeDepartmentId: employees.departmentId,
      })
      .from(claims)
      .innerJoin(employees, eq(claims.employeeId, employees.id))
      .where(eq(claims.id, id))
      .limit(1);

    if (!claim) {
      throw new NotFoundException(`Claim with ID "${id}" not found`);
    }

    if (requestingUser) {
      const { id: userId } = requestingUser;
      // Ownership guard handles broader access control via permissions
      if (claim.employeeId !== userId && !requestingUser.customRoleId) {
        throw new ForbiddenException('You can only delete your own claims');
      }
    }

    if (claim.status !== 'Pending') {
      throw new BadRequestException('Only pending claims can be deleted');
    }

    await this.db.delete(claims).where(eq(claims.id, id));
    await this.invalidateCache(id);
    return { message: `Claim "${id}" has been deleted` };
  }

  // ─── Cache invalidation ────────────────────────────────────────────────────

  private async invalidateCache(id?: string) {
    const promises: Promise<void>[] = [
      this.cache.delByPattern(CacheKeys.claimsList),
    ];
    if (id) {
      promises.push(this.cache.delByKey(CacheKeys.claimById, id));
    }
    await Promise.all(promises);
  }
}
