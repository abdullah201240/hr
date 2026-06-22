import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, asc, desc, and, sql, inArray, count, or, like } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import {
  salaryTemplates,
  salaryTemplateComponents,
  employeeSalaries,
  employees,
  departments,
  designations,
} from '../../db/schema';
import {
  CreateSalaryTemplateDto,
  UpdateSalaryTemplateDto,
  AssignEmployeeSalaryDto,
  UpdateEmployeeSalaryDto,
  EmployeeSalaryQueryDto,
  BulkSalaryRevisionDto,
} from './dto/salary.dto';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class SalaryService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
    @InjectQueue('payroll') private readonly payrollQueue: Queue,
  ) {}

  // ─── Salary Templates ──────────────────────────────────────────────────────

  async findAllTemplates() {
    const cached = await this.cache.getByKey(CacheKeys.salaryTemplates);
    if (cached) return cached;

    const templates = await this.db
      .select()
      .from(salaryTemplates)
      .orderBy(desc(salaryTemplates.createdAt));

    if (templates.length === 0) {
      await this.cache.setByKey(CacheKeys.salaryTemplates, []);
      return [];
    }

    const templateIds = templates.map((t) => t.id);
    const allComponents = await this.db
      .select()
      .from(salaryTemplateComponents)
      .where(inArray(salaryTemplateComponents.templateId, templateIds))
      .orderBy(asc(salaryTemplateComponents.sortOrder));

    const componentsByTemplate = allComponents.reduce((acc, comp) => {
      if (!acc[comp.templateId]) acc[comp.templateId] = [];
      acc[comp.templateId].push(comp);
      return acc;
    }, {} as Record<string, typeof allComponents>);

    const result = templates.map((template) => ({
      ...template,
      components: componentsByTemplate[template.id] || [],
    }));

    await this.cache.setByKey(CacheKeys.salaryTemplates, result);
    return result;
  }

  async findOneTemplate(id: string) {
    const cached = await this.cache.getByKey(CacheKeys.salaryTemplateById, id);
    if (cached) return cached;

    const [template] = await this.db
      .select()
      .from(salaryTemplates)
      .where(eq(salaryTemplates.id, id))
      .limit(1);

    if (!template) {
      throw new NotFoundException(`Salary template with ID "${id}" not found`);
    }

    const components = await this.db
      .select()
      .from(salaryTemplateComponents)
      .where(eq(salaryTemplateComponents.templateId, id))
      .orderBy(asc(salaryTemplateComponents.sortOrder));

    const result = { ...template, components };
    await this.cache.setByKey(CacheKeys.salaryTemplateById, result, id);
    return result;
  }

  async createTemplate(dto: CreateSalaryTemplateDto) {
    const createdId = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(salaryTemplates)
        .values({
          name: dto.name,
          description: dto.description || '',
        })
        .returning();

      // Insert components if provided
      if (dto.components && dto.components.length > 0) {
        await tx.insert(salaryTemplateComponents).values(
          dto.components.map((comp, idx) => ({
            templateId: created.id,
            name: comp.name,
            type: comp.type,
            calculationType: comp.calculationType,
            value: comp.value,
            isTaxable: comp.isTaxable ?? false,
            sortOrder: comp.sortOrder ?? idx,
          })),
        );
      }
      return created.id;
    });

    await this.invalidateTemplateCache();
    return this.findOneTemplate(createdId);
  }

  async updateTemplate(id: string, dto: UpdateSalaryTemplateDto) {
    await this.findOneTemplate(id);

    await this.db.transaction(async (tx) => {
      const updateData: Record<string, any> = {};
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

      if (Object.keys(updateData).length > 0) {
        await tx
          .update(salaryTemplates)
          .set(updateData)
          .where(eq(salaryTemplates.id, id));
      }

      // Replace components if provided
      if (dto.components !== undefined) {
        // Delete existing components
        await tx
          .delete(salaryTemplateComponents)
          .where(eq(salaryTemplateComponents.templateId, id));

        // Insert new components
        if (dto.components.length > 0) {
          await tx.insert(salaryTemplateComponents).values(
            dto.components.map((comp, idx) => ({
              templateId: id,
              name: comp.name!,
              type: comp.type!,
              calculationType: comp.calculationType!,
              value: comp.value!,
              isTaxable: comp.isTaxable ?? false,
              sortOrder: comp.sortOrder ?? idx,
            })),
          );
        }
      }
    });

    await this.invalidateTemplateCache(id);
    return this.findOneTemplate(id);
  }

  async deleteTemplate(id: string) {
    const template = await this.findOneTemplate(id);

    const activeSalaries = await this.db
      .select({ id: employeeSalaries.id })
      .from(employeeSalaries)
      .where(
        and(
          eq(employeeSalaries.templateId, id),
          eq(employeeSalaries.status, 'active'),
        ),
      )
      .limit(1);

    if (activeSalaries.length > 0) {
      throw new BadRequestException(
        `Cannot delete template "${(template as any).name}" because it is currently assigned to active employees.`,
      );
    }

    await this.db.delete(salaryTemplates).where(eq(salaryTemplates.id, id));
    await this.invalidateTemplateCache(id);
    return {
      message: `Salary template "${(template as any).name}" has been deleted`,
    };
  }

  // ─── Employee Salaries ─────────────────────────────────────────────────────

  async findAllEmployeeSalaries(query?: EmployeeSalaryQueryDto) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const search = query?.search;
    const departmentId = query?.departmentId;
    const templateId = query?.templateId;
    const status = query?.status ?? 'active';

    const cacheKeyParts = `${page}:${limit}:${search ?? ''}:${departmentId ?? ''}:${templateId ?? ''}:${status}`;
    const cached = await this.cache.getByKey<any>(
      CacheKeys.employeeSalaryList,
      cacheKeyParts,
    );
    if (cached) return cached;

    const conditions = [];
    if (status) conditions.push(eq(employeeSalaries.status, status));
    if (departmentId) conditions.push(eq(employees.departmentId, departmentId));
    if (templateId) conditions.push(eq(employeeSalaries.templateId, templateId));
    if (search) {
      conditions.push(
        or(
          like(employees.fullNameEnglish, `%${search}%`),
          like(employees.email, `%${search}%`),
          like(employees.employeeId, `%${search}%`),
        ),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [[totalRow], data] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(employeeSalaries)
        .innerJoin(employees, eq(employeeSalaries.employeeId, employees.id))
        .where(where),
      this.db
        .select({
          id: employeeSalaries.id,
          employeeId: employeeSalaries.employeeId,
          templateId: employeeSalaries.templateId,
          basicSalary: employeeSalaries.basicSalary,
          effectiveDate: employeeSalaries.effectiveDate,
          pfApplicable: employeeSalaries.pfApplicable,
          status: employeeSalaries.status,
          notes: employeeSalaries.notes,
          createdAt: employeeSalaries.createdAt,
          updatedAt: employeeSalaries.updatedAt,
          // Employee join fields
          employeeEmployeeId: employees.employeeId,
          employeeName: employees.fullNameEnglish,
          employeeEmail: employees.email,
          employeePhone: employees.phone,
          employeeStatus: employees.status,
          employeePhotoUrl: employees.employeePhotoUrl,
          joinDate: employees.joinDate,
          // Department and designation join
          departmentName: departments.name,
          designationName: designations.name,
          // Template name
          templateName: salaryTemplates.name,
        })
        .from(employeeSalaries)
        .innerJoin(employees, eq(employeeSalaries.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(designations, eq(employees.designationId, designations.id))
        .leftJoin(
          salaryTemplates,
          eq(employeeSalaries.templateId, salaryTemplates.id),
        )
        .where(where)
        .orderBy(desc(employeeSalaries.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = totalRow?.count ?? 0;
    const result = {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cache.setByKey(CacheKeys.employeeSalaryList, result, cacheKeyParts);
    return result;
  }

  async findEmployeeSalary(employeeId: string) {
    const cached = await this.cache.getByKey(
      CacheKeys.employeeSalaryById,
      employeeId,
    );
    if (cached) return cached;

    const result = await this.db
      .select({
        id: employeeSalaries.id,
        employeeId: employeeSalaries.employeeId,
        templateId: employeeSalaries.templateId,
        basicSalary: employeeSalaries.basicSalary,
        effectiveDate: employeeSalaries.effectiveDate,
        pfApplicable: employeeSalaries.pfApplicable,
        status: employeeSalaries.status,
        notes: employeeSalaries.notes,
        createdAt: employeeSalaries.createdAt,
        updatedAt: employeeSalaries.updatedAt,
        templateName: salaryTemplates.name,
      })
      .from(employeeSalaries)
      .leftJoin(
        salaryTemplates,
        eq(employeeSalaries.templateId, salaryTemplates.id),
      )
      .where(
        and(
          eq(employeeSalaries.employeeId, employeeId),
          eq(employeeSalaries.status, 'active'),
        ),
      )
      .orderBy(desc(employeeSalaries.effectiveDate))
      .limit(1);

    const record = result[0] || null;
    if (record) {
      await this.cache.setByKey(
        CacheKeys.employeeSalaryById,
        record,
        employeeId,
      );
    }
    return record;
  }

  async assignSalary(dto: AssignEmployeeSalaryDto) {
    // Verify employee exists
    const [emp] = await this.db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.id, dto.employeeId))
      .limit(1);

    if (!emp) {
      throw new NotFoundException(
        `Employee with ID "${dto.employeeId}" not found`,
      );
    }

    // Supersede any existing active salary for this employee
    await this.db
      .update(employeeSalaries)
      .set({ status: 'superseded' })
      .where(
        and(
          eq(employeeSalaries.employeeId, dto.employeeId),
          eq(employeeSalaries.status, 'active'),
        ),
      );

    // Create new active salary record
    const [created] = await this.db
      .insert(employeeSalaries)
      .values({
        employeeId: dto.employeeId,
        templateId: dto.templateId || null,
        basicSalary: dto.basicSalary,
        effectiveDate: dto.effectiveDate,
        pfApplicable: dto.pfApplicable ?? true,
        status: 'active',
        notes: dto.notes || '',
      })
      .returning();

    await this.invalidateSalaryCache(dto.employeeId);
    return created;
  }

  async updateSalary(id: string, dto: UpdateEmployeeSalaryDto) {
    const [existing] = await this.db
      .select()
      .from(employeeSalaries)
      .where(eq(employeeSalaries.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(
        `Employee salary record with ID "${id}" not found`,
      );
    }

    const updateData: Record<string, any> = {};
    if (dto.templateId !== undefined)
      updateData.templateId = dto.templateId || null;
    if (dto.basicSalary !== undefined) updateData.basicSalary = dto.basicSalary;
    if (dto.effectiveDate !== undefined)
      updateData.effectiveDate = dto.effectiveDate;
    if (dto.pfApplicable !== undefined)
      updateData.pfApplicable = dto.pfApplicable;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const [updated] = await this.db
      .update(employeeSalaries)
      .set(updateData)
      .where(eq(employeeSalaries.id, id))
      .returning();

    await this.invalidateSalaryCache(existing.employeeId);
    return updated;
  }

  // ─── Salary Summary / Stats ────────────────────────────────────────────────

  async getSalarySummary() {
    const [stats] = await this.db
      .select({
        totalBudget: sql<number>`COALESCE(SUM(${employeeSalaries.basicSalary}), 0)`,
        assignedCount: sql<number>`COUNT(*)`,
        avgSalary: sql<number>`COALESCE(AVG(${employeeSalaries.basicSalary}), 0)`,
        pfCount: sql<number>`COUNT(*) FILTER (WHERE ${employeeSalaries.pfApplicable} = true)`,
      })
      .from(employeeSalaries)
      .where(eq(employeeSalaries.status, 'active'));

    const [empCount] = await this.db
      .select({
        total: sql<number>`COUNT(*)`,
      })
      .from(employees)
      .where(eq(employees.status, 'active'));

    return {
      totalBudget: Number(stats?.totalBudget || 0),
      assignedCount: Number(stats?.assignedCount || 0),
      totalEmployees: Number(empCount?.total || 0),
      avgSalary: Math.round(Number(stats?.avgSalary || 0)),
      pfContributors: Number(stats?.pfCount || 0),
    };
  }

  // ─── Cache Invalidation ────────────────────────────────────────────────────

  private async invalidateTemplateCache(id?: string) {
    const promises: Promise<void>[] = [
      this.cache.delByPattern(CacheKeys.salaryTemplates),
    ];
    if (id) {
      promises.push(this.cache.delByKey(CacheKeys.salaryTemplateById, id));
    }
    // Also invalidate salary list since template names are joined
    promises.push(this.cache.delByPattern(CacheKeys.employeeSalaryList));
    await Promise.all(promises);
  }

  private async invalidateSalaryCache(employeeId?: string) {
    const promises: Promise<void>[] = [
      this.cache.delByPattern(CacheKeys.employeeSalaryList),
    ];
    if (employeeId) {
      promises.push(
        this.cache.delByKey(CacheKeys.employeeSalaryById, employeeId),
      );
    }
    await Promise.all(promises);
  }

  async getSalaryHistory(employeeId: string) {
    return this.db
      .select({
        id: employeeSalaries.id,
        basicSalary: employeeSalaries.basicSalary,
        effectiveDate: employeeSalaries.effectiveDate,
        pfApplicable: employeeSalaries.pfApplicable,
        status: employeeSalaries.status,
        notes: employeeSalaries.notes,
        createdAt: employeeSalaries.createdAt,
        templateName: salaryTemplates.name,
      })
      .from(employeeSalaries)
      .leftJoin(salaryTemplates, eq(employeeSalaries.templateId, salaryTemplates.id))
      .where(eq(employeeSalaries.employeeId, employeeId))
      .orderBy(desc(employeeSalaries.effectiveDate), desc(employeeSalaries.createdAt));
  }

  async bulkRevision(dto: BulkSalaryRevisionDto) {
    const job = await this.payrollQueue.add('bulk-revision', dto, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
    return { jobId: job.id, status: 'queued' };
  }

  async processBulkRevision(dto: BulkSalaryRevisionDto) {
    const conditions = [eq(employeeSalaries.status, 'active')];
    if (dto.departmentId) {
      conditions.push(eq(employees.departmentId, dto.departmentId));
    }
    if (dto.templateId) {
      conditions.push(eq(employeeSalaries.templateId, dto.templateId));
    }

    const activeSalaries = await this.db
      .select({
        id: employeeSalaries.id,
        employeeId: employeeSalaries.employeeId,
        templateId: employeeSalaries.templateId,
        basicSalary: employeeSalaries.basicSalary,
        pfApplicable: employeeSalaries.pfApplicable,
      })
      .from(employeeSalaries)
      .innerJoin(employees, eq(employeeSalaries.employeeId, employees.id))
      .where(and(...conditions));

    if (activeSalaries.length === 0) {
      return { count: 0 };
    }

    await this.db.transaction(async (tx) => {
      for (const sal of activeSalaries) {
        const newBasic = Math.round(sal.basicSalary * (1 + (dto.percentageIncrease || 0) / 100));
        
        // Supersede existing active salary assignment
        await tx
          .update(employeeSalaries)
          .set({ status: 'superseded' })
          .where(eq(employeeSalaries.id, sal.id));

        // Create new active salary assignment
        await tx.insert(employeeSalaries).values({
          employeeId: sal.employeeId,
          templateId: sal.templateId,
          basicSalary: newBasic,
          effectiveDate: dto.effectiveDate,
          pfApplicable: sal.pfApplicable,
          status: 'active',
          notes: dto.notes || `Bulk revision (${dto.percentageIncrease}% raise)`,
        });
      }
    });

    // Invalidate caches
    const employeeIds = activeSalaries.map((s) => s.employeeId);
    await this.invalidateSalaryCache();
    for (const empId of employeeIds) {
      await this.cache.delByKey(CacheKeys.employeeSalaryById, empId);
    }

    return { count: activeSalaries.length };
  }
}
