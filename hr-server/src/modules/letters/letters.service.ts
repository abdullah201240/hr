import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { issuedLetters, employees, departments, designations } from '../../db/schema';
import { CreateLetterDto, UpdateLetterStatusDto, LetterQueryDto } from './dto/letters.dto';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';

@Injectable()
export class LettersService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
  ) {}

  async create(dto: CreateLetterDto, createdBy: string = 'HR Admin') {
    if (dto.employeeId) {
      // 1. Verify employee exists
      const [emp] = await this.db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.id, dto.employeeId))
        .limit(1);

      if (!emp) {
        throw new NotFoundException(`Employee with ID "${dto.employeeId}" not found`);
      }
    }

    const [created] = await this.db
      .insert(issuedLetters)
      .values({
        type: dto.type,
        employeeId: dto.employeeId || null,
        employeeName: dto.employeeName || null,
        employeeEmail: dto.employeeEmail || null,
        subject: dto.subject,
        issueDate: dto.issueDate,
        effectiveDate: dto.effectiveDate,
        status: dto.status || 'Draft',
        body: dto.body,
        fields: dto.fields || {},
        createdBy,
      })
      .returning();

    await this.invalidateCache();
    return this.findOne(created.id);
  }

  async findAll(query: LetterQueryDto) {
    const { page = 1, limit = 20, search, type, status } = query;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (type && type !== 'all') {
      conditions.push(eq(issuedLetters.type, type));
    }
    if (status && status !== 'all') {
      conditions.push(eq(issuedLetters.status, status));
    }
    if (search) {
      conditions.push(
        or(
          like(employees.fullNameEnglish, `%${search}%`),
          like(issuedLetters.employeeName, `%${search}%`),
          like(issuedLetters.subject, `%${search}%`),
          like(issuedLetters.id, `%${search}%`),
        ),
      );
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await this.db
      .select({
        id: issuedLetters.id,
        type: issuedLetters.type,
        employeeId: issuedLetters.employeeId,
        employeeIdCode: employees.employeeId,
        employeeName: sql<string | null>`COALESCE(${employees.fullNameEnglish}, ${issuedLetters.employeeName})`,
        employeeDepartment: departments.name,
        employeeDesignation: designations.name,
        subject: issuedLetters.subject,
        issueDate: issuedLetters.issueDate,
        effectiveDate: issuedLetters.effectiveDate,
        status: issuedLetters.status,
        body: issuedLetters.body,
        fields: issuedLetters.fields,
        createdBy: issuedLetters.createdBy,
        createdAt: issuedLetters.createdAt,
      })
      .from(issuedLetters)
      .leftJoin(employees, eq(issuedLetters.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(whereCondition)
      .orderBy(desc(issuedLetters.createdAt));

    const total = results.length;
    const data = results.slice(offset, offset + limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const [letter] = await this.db
      .select({
        id: issuedLetters.id,
        type: issuedLetters.type,
        employeeId: issuedLetters.employeeId,
        employeeIdCode: employees.employeeId,
        employeeName: sql<string | null>`COALESCE(${employees.fullNameEnglish}, ${issuedLetters.employeeName})`,
        employeeDepartment: departments.name,
        employeeDesignation: designations.name,
        subject: issuedLetters.subject,
        issueDate: issuedLetters.issueDate,
        effectiveDate: issuedLetters.effectiveDate,
        status: issuedLetters.status,
        body: issuedLetters.body,
        fields: issuedLetters.fields,
        createdBy: issuedLetters.createdBy,
        createdAt: issuedLetters.createdAt,
      })
      .from(issuedLetters)
      .leftJoin(employees, eq(issuedLetters.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(eq(issuedLetters.id, id))
      .limit(1);

    if (!letter) {
      throw new NotFoundException(`HR Letter with ID "${id}" not found`);
    }

    return letter;
  }

  async updateStatus(id: string, dto: UpdateLetterStatusDto) {
    const [existing] = await this.db
      .select()
      .from(issuedLetters)
      .where(eq(issuedLetters.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`HR Letter with ID "${id}" not found`);
    }

    const [updated] = await this.db
      .update(issuedLetters)
      .set({ status: dto.status })
      .where(eq(issuedLetters.id, id))
      .returning();

    await this.invalidateCache();
    return this.findOne(updated.id);
  }

  async delete(id: string) {
    const [existing] = await this.db
      .select()
      .from(issuedLetters)
      .where(eq(issuedLetters.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`HR Letter with ID "${id}" not found`);
    }

    await this.db.delete(issuedLetters).where(eq(issuedLetters.id, id));
    await this.invalidateCache();
    return { message: `HR Letter "${id}" has been deleted` };
  }

  private async invalidateCache() {
    await this.cache.delByPattern(CacheKeys.lettersList);
  }
}
