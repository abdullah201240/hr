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
import {
  regulationPolicies,
  regulationRequests,
  employees,
  rolePermissions,
  permissions,
} from '../../db/schema';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys, resolveKey } from '../../common/cache/cache-keys';
import {
  CreatePolicyDto,
  UpdatePolicyDto,
  CreateRequestDto,
  UpdateRequestStatusDto,
  RegulationQueryDto,
} from './dto/regulations.dto';
import { NotificationService } from '../notifications/notifications.service';
import {
  NotificationModule,
  NotificationCategory,
} from '../notifications/types/notification.types';

const creator = alias(employees, 'creator');
const updater = alias(employees, 'updater');
const requestCreator = alias(employees, 'request_creator');
const requestUpdater = alias(employees, 'request_updater');
const firstApprover = alias(employees, 'first_approver');
const finalApprover = alias(employees, 'final_approver');
const applicant = alias(employees, 'applicant');

@Injectable()
export class RegulationsService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
    private readonly notificationService: NotificationService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // POLICIES SERVICE METHODS
  // ───────────────────────────────────────────────────────────────────────────

  async findAllPolicies() {
    const cached = await this.cache.getByKey<any>(CacheKeys.regulationPolicies, 'all');
    if (cached) return cached;

    const list = await this.db
      .select({
        id: regulationPolicies.id,
        title: regulationPolicies.title,
        category: regulationPolicies.category,
        description: regulationPolicies.description,
        isActive: regulationPolicies.isActive,
        requiresApproval: regulationPolicies.requiresApproval,
        allowEmployeeRequests: regulationPolicies.allowEmployeeRequests,
        metadata: regulationPolicies.metadata,
        createdAt: regulationPolicies.createdAt,
        updatedAt: regulationPolicies.updatedAt,
        createdById: regulationPolicies.createdById,
        updatedById: regulationPolicies.updatedById,
        createdBy: creator.fullNameEnglish,
        updatedBy: updater.fullNameEnglish,
      })
      .from(regulationPolicies)
      .leftJoin(creator, eq(regulationPolicies.createdById, creator.id))
      .leftJoin(updater, eq(regulationPolicies.updatedById, updater.id))
      .orderBy(desc(regulationPolicies.createdAt));

    await this.cache.setByKey(CacheKeys.regulationPolicies, list, 'all');
    return list;
  }

  async findOnePolicy(id: string) {
    const cached = await this.cache.getByKey<any>(CacheKeys.regulationPolicyById, id);
    if (cached) return cached;

    const [policy] = await this.db
      .select({
        id: regulationPolicies.id,
        title: regulationPolicies.title,
        category: regulationPolicies.category,
        description: regulationPolicies.description,
        isActive: regulationPolicies.isActive,
        requiresApproval: regulationPolicies.requiresApproval,
        allowEmployeeRequests: regulationPolicies.allowEmployeeRequests,
        metadata: regulationPolicies.metadata,
        createdAt: regulationPolicies.createdAt,
        updatedAt: regulationPolicies.updatedAt,
        createdById: regulationPolicies.createdById,
        updatedById: regulationPolicies.updatedById,
        createdBy: creator.fullNameEnglish,
        updatedBy: updater.fullNameEnglish,
      })
      .from(regulationPolicies)
      .leftJoin(creator, eq(regulationPolicies.createdById, creator.id))
      .leftJoin(updater, eq(regulationPolicies.updatedById, updater.id))
      .where(eq(regulationPolicies.id, id))
      .limit(1);

    if (!policy) {
      throw new NotFoundException(`Regulation policy with ID "${id}" not found`);
    }

    await this.cache.setByKey(CacheKeys.regulationPolicyById, policy, id);
    return policy;
  }

  async createPolicy(createdById: string, dto: CreatePolicyDto) {
    const [inserted] = await this.db
      .insert(regulationPolicies)
      .values({
        title: dto.title,
        category: dto.category,
        description: dto.description,
        isActive: dto.isActive ?? true,
        requiresApproval: dto.requiresApproval ?? true,
        allowEmployeeRequests: dto.allowEmployeeRequests ?? true,
        metadata: dto.metadata || null,
        createdById,
        updatedById: createdById,
      })
      .returning();

    await this.invalidatePoliciesCache();
    return this.findOnePolicy(inserted.id);
  }

  async updatePolicy(id: string, updatedById: string, dto: UpdatePolicyDto) {
    const [policy] = await this.db
      .select()
      .from(regulationPolicies)
      .where(eq(regulationPolicies.id, id))
      .limit(1);

    if (!policy) {
      throw new NotFoundException(`Regulation policy with ID "${id}" not found`);
    }

    await this.db
      .update(regulationPolicies)
      .set({
        ...dto,
        updatedById,
        updatedAt: new Date(),
      })
      .where(eq(regulationPolicies.id, id));

    await this.invalidatePoliciesCache(id);
    return this.findOnePolicy(id);
  }

  async deletePolicy(id: string) {
    const [policy] = await this.db
      .select()
      .from(regulationPolicies)
      .where(eq(regulationPolicies.id, id))
      .limit(1);

    if (!policy) {
      throw new NotFoundException(`Regulation policy with ID "${id}" not found`);
    }

    // Verify if there are any requests made against this policy
    const [hasRequests] = await this.db
      .select({ id: regulationRequests.id })
      .from(regulationRequests)
      .where(eq(regulationRequests.policyId, id))
      .limit(1);

    if (hasRequests) {
      throw new BadRequestException('Cannot delete policy because employee requests have been submitted against it.');
    }

    await this.db.delete(regulationPolicies).where(eq(regulationPolicies.id, id));
    await this.invalidatePoliciesCache(id);
    return { success: true, message: `Regulation policy "${policy.title}" has been deleted.` };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REQUESTS SERVICE METHODS
  // ───────────────────────────────────────────────────────────────────────────

  async findAllRequests(query: RegulationQueryDto, requestingUser: any) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      employeeId,
      policyId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const cacheKeyParts = `${page}:${limit}:${search ?? ''}:${status ?? ''}:${employeeId ?? ''}:${policyId ?? ''}:${sortBy}:${sortOrder}:${requestingUser.id}`;
    const cached = await this.cache.getByKey<any>(CacheKeys.regulationRequestsList, cacheKeyParts);
    if (cached) return cached;

    const offset = (page - 1) * limit;

    // Permissions filtering
    const conditions = [];
    const userPerms = requestingUser.permissions || new Set<string>();

    if (userPerms.has('regulations:view_all') || !requestingUser.customRoleId) {
      // HR/Admin can see all, apply optional filter
      if (employeeId) {
        conditions.push(eq(regulationRequests.employeeId, employeeId));
      }
    } else if (userPerms.has('regulations:view_team')) {
      // Line Manager view
      if (employeeId) {
        // Can only filter within their team, or view own
        if (employeeId === requestingUser.id) {
          conditions.push(eq(regulationRequests.employeeId, employeeId));
        } else {
          conditions.push(
            and(
              eq(regulationRequests.employeeId, employeeId),
              eq(applicant.lineManagerId, requestingUser.id)
            )
          );
        }
      } else {
        // Show team requests + own requests
        conditions.push(
          or(
            eq(regulationRequests.employeeId, requestingUser.id),
            eq(applicant.lineManagerId, requestingUser.id)
          )
        );
      }
    } else {
      // Standard employee can only see their own
      conditions.push(eq(regulationRequests.employeeId, requestingUser.id));
    }

    if (status) {
      conditions.push(eq(regulationRequests.status, status));
    }
    if (policyId) {
      conditions.push(eq(regulationRequests.policyId, policyId));
    }

    const finalWhere = conditions.length > 0 ? and(...conditions) : undefined;

    const orderColumn =
      sortBy === 'status'
        ? regulationRequests.status
        : sortBy === 'title'
          ? regulationRequests.title
          : regulationRequests.createdAt;

    const orderFn = sortOrder === 'asc' ? asc : desc;

    const rawList = await this.db
      .select({
        id: regulationRequests.id,
        policyId: regulationRequests.policyId,
        policyTitle: regulationPolicies.title,
        policyCategory: regulationPolicies.category,
        employeeId: regulationRequests.employeeId,
        employeeName: applicant.fullNameEnglish,
        employeeEmail: applicant.email,
        employeeIdCode: applicant.employeeId,
        title: regulationRequests.title,
        reason: regulationRequests.reason,
        status: regulationRequests.status,
        requestDate: regulationRequests.requestDate,
        effectiveFrom: regulationRequests.effectiveFrom,
        effectiveTo: regulationRequests.effectiveTo,
        metadata: regulationRequests.metadata,
        firstApprovedById: regulationRequests.firstApprovedById,
        firstApprovedByName: firstApprover.fullNameEnglish,
        firstApprovedAt: regulationRequests.firstApprovedAt,
        finalApprovedById: regulationRequests.finalApprovedById,
        finalApprovedByName: finalApprover.fullNameEnglish,
        finalApprovedAt: regulationRequests.finalApprovedAt,
        rejectionReason: regulationRequests.rejectionReason,
        createdAt: regulationRequests.createdAt,
        updatedAt: regulationRequests.updatedAt,
      })
      .from(regulationRequests)
      .innerJoin(regulationPolicies, eq(regulationRequests.policyId, regulationPolicies.id))
      .innerJoin(applicant, eq(regulationRequests.employeeId, applicant.id))
      .leftJoin(firstApprover, eq(regulationRequests.firstApprovedById, firstApprover.id))
      .leftJoin(finalApprover, eq(regulationRequests.finalApprovedById, finalApprover.id))
      .where(finalWhere)
      .orderBy(orderFn(orderColumn));

    let processed = rawList;
    if (search) {
      const q = search.toLowerCase();
      processed = rawList.filter(
        (r) =>
          r.employeeName.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.policyTitle.toLowerCase().includes(q)
      );
    }

    const total = processed.length;
    const paginated = processed.slice(offset, offset + limit);

    const result = {
      data: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cache.setByKey(CacheKeys.regulationRequestsList, result, cacheKeyParts);
    return result;
  }

  async findOneRequest(id: string, requestingUser?: any) {
    const cached = await this.cache.getByKey<any>(CacheKeys.regulationRequestById, id);
    let request = cached;

    if (!request) {
      const [record] = await this.db
        .select({
          id: regulationRequests.id,
          policyId: regulationRequests.policyId,
          policyTitle: regulationPolicies.title,
          policyCategory: regulationPolicies.category,
          policyRequiresApproval: regulationPolicies.requiresApproval,
          employeeId: regulationRequests.employeeId,
          employeeName: applicant.fullNameEnglish,
          employeeEmail: applicant.email,
          employeeIdCode: applicant.employeeId,
          employeeLineManagerId: applicant.lineManagerId,
          title: regulationRequests.title,
          reason: regulationRequests.reason,
          status: regulationRequests.status,
          requestDate: regulationRequests.requestDate,
          effectiveFrom: regulationRequests.effectiveFrom,
          effectiveTo: regulationRequests.effectiveTo,
          metadata: regulationRequests.metadata,
          firstApprovedById: regulationRequests.firstApprovedById,
          firstApprovedByName: firstApprover.fullNameEnglish,
          firstApprovedAt: regulationRequests.firstApprovedAt,
          finalApprovedById: regulationRequests.finalApprovedById,
          finalApprovedByName: finalApprover.fullNameEnglish,
          finalApprovedAt: regulationRequests.finalApprovedAt,
          rejectionReason: regulationRequests.rejectionReason,
          createdAt: regulationRequests.createdAt,
          updatedAt: regulationRequests.updatedAt,
        })
        .from(regulationRequests)
        .innerJoin(regulationPolicies, eq(regulationRequests.policyId, regulationPolicies.id))
        .innerJoin(applicant, eq(regulationRequests.employeeId, applicant.id))
        .leftJoin(firstApprover, eq(regulationRequests.firstApprovedById, firstApprover.id))
        .leftJoin(finalApprover, eq(regulationRequests.finalApprovedById, finalApprover.id))
        .where(eq(regulationRequests.id, id))
        .limit(1);

      if (!record) {
        throw new NotFoundException(`Regulation request with ID "${id}" not found`);
      }

      request = record;
      await this.cache.setByKey(CacheKeys.regulationRequestById, request, id);
    }

    if (requestingUser) {
      const { id: userId } = requestingUser;
      const userPerms = requestingUser.permissions || new Set<string>();

      const isOwner = request.employeeId === userId;
      const isLineManager = request.employeeLineManagerId === userId;
      const hasViewAll = userPerms.has('regulations:view_all') || !requestingUser.customRoleId;
      const hasViewTeam = userPerms.has('regulations:view_team');

      if (!isOwner && !hasViewAll && !(hasViewTeam && isLineManager)) {
        throw new ForbiddenException('Access denied to view this regulation request.');
      }
    }

    return request;
  }

  async createRequest(employeeId: string, dto: CreateRequestDto) {
    const policy = await this.findOnePolicy(dto.policyId);

    if (!policy.isActive) {
      throw new BadRequestException('Cannot submit a request against an inactive policy.');
    }

    if (!policy.allowEmployeeRequests) {
      throw new BadRequestException('This policy does not allow employee submissions.');
    }

    const initialStatus = policy.requiresApproval ? 'Pending' : 'Approved';

    const [inserted] = await this.db
      .insert(regulationRequests)
      .values({
        policyId: dto.policyId,
        employeeId,
        title: dto.title,
        reason: dto.reason,
        status: initialStatus,
        effectiveFrom: dto.effectiveFrom || null,
        effectiveTo: dto.effectiveTo || null,
        metadata: dto.metadata || null,
        createdById: employeeId,
        updatedById: employeeId,
      })
      .returning();

    await this.invalidateRequestsCache();
    const result = await this.findOneRequest(inserted.id);

    // Notifications dispatch if approval is required
    if (policy.requiresApproval) {
      await this.triggerRequestSubmissionNotification(employeeId, result);
    }

    return result;
  }

  async updateRequestStatus(id: string, requestingUser: any, dto: UpdateRequestStatusDto) {
    const userId = requestingUser.id;
    const request = await this.findOneRequest(id);

    const [applicantUser] = await this.db
      .select({
        id: employees.id,
        lineManagerId: employees.lineManagerId,
      })
      .from(employees)
      .where(eq(employees.id, request.employeeId))
      .limit(1);

    if (!applicantUser) {
      throw new NotFoundException('Applicant employee record not found.');
    }

    const isLineManager = applicantUser.lineManagerId === userId;
    const hasApprovePerm = requestingUser.permissions?.has('regulations:approve') || !requestingUser.customRoleId;

    const updateData: Record<string, any> = {
      updatedById: userId,
      updatedAt: new Date(),
    };

    if (dto.status === 'Approved') {
      if (request.status === 'Pending') {
        if (applicantUser.lineManagerId) {
          // Requires 2-step. Line Manager approves 1st step.
          if (!isLineManager) {
            throw new ForbiddenException('Only the Line Manager can perform the 1st step of approval.');
          }
          updateData.status = 'Pending_2nd';
          updateData.firstApprovedById = userId;
          updateData.firstApprovedAt = new Date();
        } else {
          // If applicant has no line manager, single step approval to Approved by Admin/HR
          if (!hasApprovePerm) {
            throw new ForbiddenException('Only users with regulations:approve permission can approve this request.');
          }
          updateData.status = 'Approved';
          updateData.finalApprovedById = userId;
          updateData.finalApprovedAt = new Date();
        }
      } else if (request.status === 'Pending_2nd') {
        // Step 2 final approval by Admin/HR
        if (!hasApprovePerm) {
          throw new ForbiddenException('Only users with regulations:approve permission can perform the final step of approval.');
        }
        updateData.status = 'Approved';
        updateData.finalApprovedById = userId;
        updateData.finalApprovedAt = new Date();
      } else {
        throw new BadRequestException(`Cannot approve a request with status "${request.status}".`);
      }
    } else if (dto.status === 'Rejected') {
      if (request.status === 'Pending') {
        if (!isLineManager && !hasApprovePerm) {
          throw new ForbiddenException('You do not have permission to reject this request.');
        }
      } else if (request.status === 'Pending_2nd') {
        if (!hasApprovePerm) {
          throw new ForbiddenException('Only users with regulations:approve permission can reject this request.');
        }
      } else {
        throw new BadRequestException(`Cannot reject a request with status "${request.status}".`);
      }
      updateData.status = 'Rejected';
      updateData.rejectionReason = dto.rejectionReason || 'No reason provided';
    }

    await this.db
      .update(regulationRequests)
      .set(updateData)
      .where(eq(regulationRequests.id, id));

    await this.invalidateRequestsCache(id);
    const result = await this.findOneRequest(id);

    // Notifications routing
    await this.triggerRequestStatusChangeNotifications(requestingUser, request, result, updateData.status);

    return result;
  }

  async delete(id: string, requestingUser: any) {
    const request = await this.findOneRequest(id);

    if (request.employeeId !== requestingUser.id) {
      throw new ForbiddenException('You can only cancel your own regulation requests.');
    }

    if (request.status !== 'Pending') {
      throw new BadRequestException('Only pending requests can be cancelled.');
    }

    await this.db.delete(regulationRequests).where(eq(regulationRequests.id, id));
    await this.invalidateRequestsCache(id);
    return { success: true, message: 'Regulation request has been cancelled.' };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CACHE & NOTIFICATION HELPER METHODS
  // ───────────────────────────────────────────────────────────────────────────

  private async invalidatePoliciesCache(id?: string) {
    const promises: Promise<void>[] = [
      this.cache.delByPattern(CacheKeys.regulationPolicies),
    ];
    if (id) {
      promises.push(this.cache.delByKey(CacheKeys.regulationPolicyById, id));
    }
    await Promise.all(promises);
  }

  private async invalidateRequestsCache(id?: string) {
    const promises: Promise<void>[] = [
      this.cache.delByPattern(CacheKeys.regulationRequestsList),
    ];
    if (id) {
      promises.push(this.cache.delByKey(CacheKeys.regulationRequestById, id));
    }
    await Promise.all(promises);
  }

  private async triggerRequestSubmissionNotification(employeeId: string, request: any) {
    try {
      const [employee] = await this.db
        .select()
        .from(employees)
        .where(eq(employees.id, employeeId))
        .limit(1);

      if (!employee) return;

      const recipientId = employee.lineManagerId;
      if (recipientId) {
        // Send notification to Line Manager
        await this.notificationService.emit({
          recipientId,
          actorId: employeeId,
          module: NotificationModule.REGULATIONS,
          category: NotificationCategory.APPROVAL,
          title: 'Regulation Request Awaiting Approval',
          message: `${employee.fullNameEnglish} submitted a request: "${request.title}" under policy "${request.policyTitle}".`,
          entityType: 'regulation_request',
          entityId: request.id,
          actionUrl: '/regulations',
          actions: [
            {
              label: 'Approve',
              style: 'primary',
              apiMethod: 'PATCH',
              apiUrl: `/regulations/requests/${request.id}/status`,
              apiBody: { status: 'Approved' },
            },
            {
              label: 'Reject',
              style: 'destructive',
              apiMethod: 'PATCH',
              apiUrl: `/regulations/requests/${request.id}/status`,
              apiBody: { status: 'Rejected' },
              confirmMessage: 'Are you sure you want to reject this request?',
            },
          ],
        });
      } else {
        // No line manager, notify standard approvers directly
        await this.notifyFinalApprovers(employeeId, request);
      }
    } catch (err) {
      // Don't fail parent operation
    }
  }

  private async notifyFinalApprovers(actorId: string, request: any) {
    try {
      const adminApprovers = await this.db
        .select({ id: employees.id })
        .from(employees)
        .innerJoin(rolePermissions, eq(rolePermissions.roleKey, employees.customRoleId))
        .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
        .where(
          and(
            eq(permissions.resource, 'regulations'),
            eq(permissions.action, 'approve')
          )
        );

      const recipientIds = adminApprovers.map((r) => r.id);
      if (recipientIds.length > 0) {
        await this.notificationService.emitBulk(
          recipientIds.map((recipientId) => ({
            recipientId,
            actorId,
            module: NotificationModule.REGULATIONS,
            category: NotificationCategory.APPROVAL,
            title: 'Regulation Request Awaiting Final Approval',
            message: `A request: "${request.title}" under "${request.policyTitle}" is awaiting final approval.`,
            entityType: 'regulation_request',
            entityId: request.id,
            actionUrl: `/regulations`,
            actions: [
              {
                label: 'Approve',
                style: 'primary',
                apiMethod: 'PATCH',
                apiUrl: `/regulations/requests/${request.id}/status`,
                apiBody: { status: 'Approved' },
              },
              {
                label: 'Reject',
                style: 'destructive',
                apiMethod: 'PATCH',
                apiUrl: `/regulations/requests/${request.id}/status`,
                apiBody: { status: 'Rejected' },
                confirmMessage: 'Are you sure you want to reject this request?',
              },
            ],
          }))
        );
      }
    } catch (err) {
      // Don't fail parent operation
    }
  }

  private async triggerRequestStatusChangeNotifications(
    actor: any,
    oldRequest: any,
    newRequest: any,
    newStatus: string,
  ) {
    try {
      // 1. Notify employee of decision
      let messageText = `Your request "${newRequest.title}" has been `;
      let category = NotificationCategory.STATUS_CHANGE;

      if (newRequest.status === 'Pending_2nd') {
        messageText += 'approved by your Line Manager and is now awaiting final HR/Admin approval.';
        category = NotificationCategory.APPROVAL;
      } else if (newRequest.status === 'Approved') {
        messageText += 'approved.';
        category = NotificationCategory.APPROVAL;
      } else if (newRequest.status === 'Rejected') {
        messageText += `rejected. Reason: ${newRequest.rejectionReason || 'None provided'}`;
        category = NotificationCategory.REJECTION;
      }

      await this.notificationService.emit({
        recipientId: oldRequest.employeeId,
        actorId: actor.id,
        module: NotificationModule.REGULATIONS,
        category,
        title: `Regulation Request ${newRequest.status === 'Pending_2nd' ? 'Line Manager Approved' : newRequest.status}`,
        message: messageText,
        entityType: 'regulation_request',
        entityId: newRequest.id,
        actionUrl: '/regulations',
      });

      // 2. If LM Approved (Pending_2nd), notify Final Approvers
      if (newRequest.status === 'Pending_2nd') {
        await this.notifyFinalApprovers(actor.id, newRequest);
      }
    } catch (err) {
      // Don't fail parent operation
    }
  }
}
