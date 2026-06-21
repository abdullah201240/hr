import { Injectable, Inject, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import {
  employees,
  employeeSpouses,
  employeeChildren,
  employeeNominees,
  employeeBankDetails,
  employeeDocuments,
  rolePermissions,
  permissions,
} from '../../db/schema';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';
import {
  EMPLOYEE_CREATE_QUEUE,
  EMPLOYEE_UPDATE_QUEUE,
  EMPLOYEE_STATUS_QUEUE,
} from '../queue/queue.module';
import type { CreateEmployeeDto } from './dto/create-employee.dto';
import type { UpdateEmployeeDto } from './dto/update-employee.dto';

// ─── Create Processor ───────────────────────────────────────────────────────

@Processor(EMPLOYEE_CREATE_QUEUE, { concurrency: 5 })
export class EmployeeCreateProcessor extends WorkerHost {
  private readonly logger = new Logger(EmployeeCreateProcessor.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
  ) {
    super();
  }

  async process(job: Job<CreateEmployeeDto>): Promise<{ employeeId: string }> {
    const dto = job.data;
    this.logger.log(
      `Processing employee creation: ${dto.employeeId} (job: ${job.id})`,
    );

    try {
      // 1. Hash password
      const passwordHash = await bcrypt.hash(dto.password, 12);

      // 2. Insert all data in a single transaction
      const result = await this.db.transaction(async (tx) => {
        // Resolve base role from custom role permissions to maintain proper client layouts
        let resolvedRole: 'admin' | 'hr' | 'manager' | 'employee' = 'employee';
        if (dto.customRoleId) {
          const list = await tx
            .select({
              resource: permissions.resource,
              action: permissions.action,
            })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(eq(rolePermissions.roleKey, dto.customRoleId));

          const perms = new Set(list.map(p => `${p.resource}:${p.action}`));

          if (perms.has('settings:update') || perms.has('settings:read') || perms.has('audit_logs:read')) {
            resolvedRole = 'admin';
          } else if (perms.has('employees:create') || perms.has('payroll:process') || perms.has('payroll:create')) {
            resolvedRole = 'hr';
          } else if (perms.has('leave:approve') || perms.has('claims:approve') || Array.from(perms).some(p => p.endsWith(':view_team'))) {
            resolvedRole = 'manager';
          }
        }

        // Insert employee
        const [employee] = await tx
          .insert(employees)
          .values({
            employeeId: dto.employeeId,
            email: dto.email,
            personalEmail: dto.personalEmail || '',
            passwordHash,
            fullNameEnglish: dto.fullNameEnglish,
            fullNameBangla: dto.fullNameBangla || '',
            phone: dto.phone,
            personalMobileNumber: dto.personalMobileNumber || '',
            religion: dto.religion,
            gender: dto.gender,
            dateOfBirth: dto.dateOfBirth,
            bloodGroup: dto.bloodGroup || 'Not Specified',
            maritalStatus: dto.maritalStatus || 'Single',
            employeePhotoUrl: dto.employeePhotoUrl || null,
            nidNumber: dto.nidNumber,
            nidPdfUrl: dto.nidPdfUrl || null,
            tinNumber: dto.tinNumber || '',
            fatherNameEnglish: dto.fatherNameEnglish || '',
            fatherNameBangla: dto.fatherNameBangla || '',
            motherNameEnglish: dto.motherNameEnglish || '',
            motherNameBangla: dto.motherNameBangla || '',
            currentAddress: dto.currentAddress || '',
            permanentAddress: dto.permanentAddress || '',
            emergencyContactName: dto.emergencyContactName || '',
            emergencyContactRelation: dto.emergencyContactRelation || '',
            emergencyContactNumber: dto.emergencyContactNumber || '',
            designationId: dto.designationId,
            departmentId: dto.departmentId,
            employeeType: dto.employeeType,
            joinDate: dto.joinDate,
            lineManagerId: dto.lineManagerId || null,
            customRoleId: dto.customRoleId || null,
            role: resolvedRole,
            status: 'active',
          })
          .returning({ id: employees.id });

        const employeeId = employee.id;

        // Insert spouses
        if (dto.spouses?.length) {
          await tx.insert(employeeSpouses).values(
            dto.spouses.map((s) => ({
              employeeId,
              name: s.name || '',
              nid: s.nid || '',
              phone: s.phone || '',
              occupation: s.occupation || '',
              marriageDate: s.marriageDate || null,
            })),
          );
        }

        // Insert children
        if (dto.children?.length) {
          await tx.insert(employeeChildren).values(
            dto.children.map((c) => ({
              employeeId,
              name: c.name || '',
              dateOfBirth: c.dateOfBirth || null,
              gender: c.gender || 'Not Specified',
            })),
          );
        }

        // Insert nominees
        if (dto.nominees?.length) {
          await tx.insert(employeeNominees).values(
            dto.nominees.map((n) => ({
              employeeId,
              name: n.name || '',
              relation: n.relation || '',
              nidNumber: n.nidNumber || '',
              nidPdfUrl: n.nidPdfUrl || null,
              photoUrl: n.photoUrl || null,
            })),
          );
        }

        // Insert bank details
        if (dto.bankDetails) {
          await tx.insert(employeeBankDetails).values({
            employeeId,
            bankName: dto.bankDetails.bankName || '',
            branch: dto.bankDetails.branch || '',
            accountNumber: dto.bankDetails.accountNumber || '',
            accountType: dto.bankDetails.accountType || '',
            routingNumber: dto.bankDetails.routingNumber || '',
            swiftCode: dto.bankDetails.swiftCode || '',
            ibanNumber: dto.bankDetails.ibanNumber || '',
            bankStatementPdfUrl: dto.bankDetails.bankStatementPdfUrl || null,
          });
        }

        // Insert documents
        if (dto.documents?.length) {
          await tx.insert(employeeDocuments).values(
            dto.documents.map((d) => ({
              employeeId,
              title: d.title,
              description: d.description || '',
              fileUrl: d.fileUrl,
            })),
          );
        }

        return { id: employeeId };
      });

      // 3. Invalidate employee list cache
      await this.cache.delByPattern(CacheKeys.employeeList);
      await this.cache.delByPattern(CacheKeys.employeeById);
      await this.cache.delByKey(CacheKeys.employeeOptions);

      this.logger.log(`Employee created successfully: ${dto.employeeId}`);
      return { employeeId: result.id };
    } catch (error: any) {
      this.logger.error(
        `Failed to create employee ${dto.employeeId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

// ─── Update Processor ───────────────────────────────────────────────────────

@Processor(EMPLOYEE_UPDATE_QUEUE, { concurrency: 5 })
export class EmployeeUpdateProcessor extends WorkerHost {
  private readonly logger = new Logger(EmployeeUpdateProcessor.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
  ) {
    super();
  }

  async process(
    job: Job<UpdateEmployeeDto & { id: string }>,
  ): Promise<{ employeeId: string }> {
    const { id, ...dto } = job.data;
    this.logger.log(`Processing employee update: ${id} (job: ${job.id})`);

    try {
      const result = await this.db.transaction(async (tx) => {
        // Build update set from provided fields
        const updateData: Record<string, any> = {};

        const directFields = [
          'employeeId',
          'email',
          'personalEmail',
          'fullNameEnglish',
          'fullNameBangla',
          'phone',
          'personalMobileNumber',
          'religion',
          'gender',
          'dateOfBirth',
          'bloodGroup',
          'maritalStatus',
          'employeePhotoUrl',
          'nidNumber',
          'nidPdfUrl',
          'tinNumber',
          'fatherNameEnglish',
          'fatherNameBangla',
          'motherNameEnglish',
          'motherNameBangla',
          'currentAddress',
          'permanentAddress',
          'emergencyContactName',
          'emergencyContactRelation',
          'emergencyContactNumber',
          'designationId',
          'departmentId',
          'employeeType',
          'joinDate',
          'lineManagerId',
          'customRoleId',
        ] as const;

        for (const field of directFields) {
          if (dto[field] !== undefined) {
            updateData[field] = dto[field];
          }
        }

        // Dynamically resolve base role based on custom role's permissions
        if (dto.customRoleId !== undefined) {
          if (dto.customRoleId) {
            const list = await tx
              .select({
                resource: permissions.resource,
                action: permissions.action,
              })
              .from(rolePermissions)
              .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
              .where(eq(rolePermissions.roleKey, dto.customRoleId));

            const perms = new Set(list.map(p => `${p.resource}:${p.action}`));

            let resolvedRole: 'admin' | 'hr' | 'manager' | 'employee' = 'employee';
            if (perms.has('settings:update') || perms.has('settings:read') || perms.has('audit_logs:read')) {
              resolvedRole = 'admin';
            } else if (perms.has('employees:create') || perms.has('payroll:process') || perms.has('payroll:create')) {
              resolvedRole = 'hr';
            } else if (perms.has('leave:approve') || perms.has('claims:approve') || Array.from(perms).some(p => p.endsWith(':view_team'))) {
              resolvedRole = 'manager';
            }
            updateData.role = resolvedRole;
          } else {
            updateData.role = 'employee';
          }
        }

        // Update employee
        await tx.update(employees).set(updateData).where(eq(employees.id, id));

        // Replace spouses (delete + re-insert)
        if (dto.spouses !== undefined) {
          await tx
            .delete(employeeSpouses)
            .where(eq(employeeSpouses.employeeId, id));
          if (dto.spouses.length > 0) {
            await tx.insert(employeeSpouses).values(
              dto.spouses.map((s) => ({
                employeeId: id,
                name: s.name || '',
                nid: s.nid || '',
                phone: s.phone || '',
                occupation: s.occupation || '',
                marriageDate: s.marriageDate || null,
              })),
            );
          }
        }

        // Replace children
        if (dto.children !== undefined) {
          await tx
            .delete(employeeChildren)
            .where(eq(employeeChildren.employeeId, id));
          if (dto.children.length > 0) {
            await tx.insert(employeeChildren).values(
              dto.children.map((c) => ({
                employeeId: id,
                name: c.name || '',
                dateOfBirth: c.dateOfBirth || null,
                gender: c.gender || 'Not Specified',
              })),
            );
          }
        }

        // Replace nominees
        if (dto.nominees !== undefined) {
          await tx
            .delete(employeeNominees)
            .where(eq(employeeNominees.employeeId, id));
          if (dto.nominees.length > 0) {
            await tx.insert(employeeNominees).values(
              dto.nominees.map((n) => ({
                employeeId: id,
                name: n.name || '',
                relation: n.relation || '',
                nidNumber: n.nidNumber || '',
                nidPdfUrl: n.nidPdfUrl || null,
                photoUrl: n.photoUrl || null,
              })),
            );
          }
        }

        // Upsert bank details
        if (dto.bankDetails !== undefined) {
          await tx
            .delete(employeeBankDetails)
            .where(eq(employeeBankDetails.employeeId, id));
          await tx.insert(employeeBankDetails).values({
            employeeId: id,
            bankName: dto.bankDetails.bankName || '',
            branch: dto.bankDetails.branch || '',
            accountNumber: dto.bankDetails.accountNumber || '',
            accountType: dto.bankDetails.accountType || '',
            routingNumber: dto.bankDetails.routingNumber || '',
            swiftCode: dto.bankDetails.swiftCode || '',
            ibanNumber: dto.bankDetails.ibanNumber || '',
            bankStatementPdfUrl: dto.bankDetails.bankStatementPdfUrl || null,
          });
        }

        // Replace documents
        if (dto.documents !== undefined) {
          await tx
            .delete(employeeDocuments)
            .where(eq(employeeDocuments.employeeId, id));
          if (dto.documents.length > 0) {
            await tx.insert(employeeDocuments).values(
              dto.documents.map((d) => ({
                employeeId: id,
                title: d.title,
                description: d.description || '',
                fileUrl: d.fileUrl,
              })),
            );
          }
        }

        return { id };
      });

      // Invalidate caches
      await this.cache.delByKey(CacheKeys.employeeById, id);
      await this.cache.delByKey(CacheKeys.jwtValidate, id);
      await this.cache.delByPattern(CacheKeys.employeeList);
      await this.cache.delByKey(CacheKeys.employeeOptions);

      this.logger.log(`Employee updated successfully: ${id}`);
      return { employeeId: result.id };
    } catch (error: any) {
      this.logger.error(
        `Failed to update employee ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

// ─── Status Change Processor (delayed deactivation) ─────────────────────────

@Processor(EMPLOYEE_STATUS_QUEUE, { concurrency: 3 })
export class EmployeeStatusProcessor extends WorkerHost {
  private readonly logger = new Logger(EmployeeStatusProcessor.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
  ) {
    super();
  }

  async process(
    job: Job<{ id: string; status: string }>,
  ): Promise<{ employeeId: string; status: string }> {
    const { id, status } = job.data;
    this.logger.log(
      `Processing scheduled status change for employee ${id} → ${status} (job: ${job.id})`,
    );

    try {
      // Verify employee still exists and hasn't been terminated/reactivated manually
      const [employee] = await this.db
        .select({ id: employees.id, status: employees.status })
        .from(employees)
        .where(eq(employees.id, id))
        .limit(1);

      if (!employee) {
        this.logger.warn(`Employee ${id} not found — skipping status change`);
        return { employeeId: id, status: 'not-found' };
      }

      // If already inactive or terminated, skip
      if (employee.status === 'inactive' || employee.status === 'terminated') {
        this.logger.log(
          `Employee ${id} is already "${employee.status}" — skipping scheduled deactivation`,
        );
        return { employeeId: id, status: employee.status };
      }

      // Apply the status change
      await this.db
        .update(employees)
        .set({ status, inactiveDate: null })
        .where(eq(employees.id, id));

      // Invalidate caches
      await this.cache.delByKey(CacheKeys.employeeById, id);
      await this.cache.delByKey(CacheKeys.jwtValidate, id);
      await this.cache.delByPattern(CacheKeys.employeeList);
      await this.cache.delByKey(CacheKeys.employeeOptions);

      this.logger.log(`Employee ${id} status changed to "${status}" successfully`);
      return { employeeId: id, status };
    } catch (error: any) {
      this.logger.error(
        `Failed to change status for employee ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
