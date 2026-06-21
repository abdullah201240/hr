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
import { claims, claimAttachments, employees, rolePermissions, permissions } from '../../db/schema';
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
        rejectedAt: claims.rejectedAt,
        rejectionReason: claims.rejectionReason,
        settledAt: claims.settledAt,
        createdAt: claims.createdAt,
        updatedAt: claims.updatedAt,
        employeeName: employees.fullNameEnglish,
        employeeEmail: employees.email,
        employeeIdCode: employees.employeeId,
        approvedByName: approver.fullNameEnglish,
      })
      .from(claims)
      .innerJoin(employees, eq(claims.employeeId, employees.id))
      .leftJoin(approver, eq(claims.approvedById, approver.id))
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
          rejectedAt: claims.rejectedAt,
          rejectionReason: claims.rejectionReason,
          settledAt: claims.settledAt,
          createdAt: claims.createdAt,
          updatedAt: claims.updatedAt,
          employeeName: employees.fullNameEnglish,
          employeeEmail: employees.email,
          employeeIdCode: employees.employeeId,
          employeeDepartmentId: employees.departmentId,
          approvedByName: approver.fullNameEnglish,
        })
        .from(claims)
        .innerJoin(employees, eq(claims.employeeId, employees.id))
        .leftJoin(approver, eq(claims.approvedById, approver.id))
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

  async updateStatus(id: string, approvedById: string, dto: UpdateClaimStatusDto) {
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

    // Validate status transitions
    if (dto.status === 'Settled' && claim.status !== 'Approved') {
      throw new BadRequestException('Only approved claims can be settled');
    }
    if (
      (dto.status === 'Approved' || dto.status === 'Rejected') &&
      claim.status !== 'Pending'
    ) {
      throw new BadRequestException(
        `Cannot ${dto.status.toLowerCase()} a claim with status "${claim.status}"`,
      );
    }

    const updateData: Record<string, any> = {
      status: dto.status,
      approvedById,
    };

    if (dto.status === 'Approved') {
      updateData.approvedAt = new Date();
      if (dto.approvedAmount !== undefined) {
        updateData.approvedAmount = String(dto.approvedAmount);
      }
    } else if (dto.status === 'Rejected') {
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = dto.rejectionReason || null;
    } else if (dto.status === 'Settled') {
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
    await this.notificationService.emit({
      recipientId: claim.employeeId,
      actorId: approvedById,
      module: NotificationModule.CLAIMS,
      category: dto.status === 'Approved' ? NotificationCategory.APPROVAL : dto.status === 'Rejected' ? NotificationCategory.REJECTION : NotificationCategory.STATUS_CHANGE,
      title: `Claim ${dto.status}`,
      message: `Your ${claim.claimType} claim of ${claim.amount} BDT has been ${dto.status.toLowerCase()}.${
        dto.status === 'Rejected' && dto.rejectionReason ? ` Reason: ${dto.rejectionReason}` : ''
      }`,
      entityType: 'claim',
      entityId: claim.id,
      actionUrl: '/claims',
    });

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
              .where(eq(permissions.resource, 'claims'))
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
