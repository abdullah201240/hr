import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, or, like, desc } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { separationRecords } from '../../db/schema';
import { CreateSeparationDto, UpdateSeparationDto, SeparationQueryDto } from './dto/separation.dto';

@Injectable()
export class SeparationService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
  ) {}

  async findAll(query: SeparationQueryDto) {
    const { search, status } = query;
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push(eq(separationRecords.status, status));
    }

    if (search) {
      conditions.push(
        or(
          like(separationRecords.employeeName, `%${search}%`),
          like(separationRecords.employeeEmail, `%${search}%`),
          like(separationRecords.department, `%${search}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return this.db
      .select()
      .from(separationRecords)
      .where(whereClause)
      .orderBy(desc(separationRecords.createdAt));
  }

  async create(dto: CreateSeparationDto) {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const sepId = `SEP-${randomNum}`;

    const [created] = await this.db
      .insert(separationRecords)
      .values({
        id: sepId,
        employeeName: dto.employeeName,
        employeeEmail: dto.employeeEmail,
        department: dto.department,
        lastWorkingDay: dto.lastWorkingDay,
        reason: dto.reason || 'Resignation',
        status: 'Notice Period',
        clearanceIt: false,
        clearanceFinance: false,
        clearanceHr: false,
        clearanceManager: false,
        assetLaptop: false,
        assetAccessCard: false,
        assetKeys: false,
        assetOther: false,
        handoverCompleted: false,
      })
      .returning();

    return created;
  }

  async update(id: string, dto: UpdateSeparationDto) {
    const [existing] = await this.db
      .select()
      .from(separationRecords)
      .where(eq(separationRecords.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(`Separation record with ID "${id}" not found`);
    }

    const clearanceIt = dto.clearanceIt !== undefined ? dto.clearanceIt : existing.clearanceIt;
    const clearanceFinance = dto.clearanceFinance !== undefined ? dto.clearanceFinance : existing.clearanceFinance;
    const clearanceHr = dto.clearanceHr !== undefined ? dto.clearanceHr : existing.clearanceHr;
    const clearanceManager = dto.clearanceManager !== undefined ? dto.clearanceManager : existing.clearanceManager;

    const allCleared = clearanceIt && clearanceFinance && clearanceHr && clearanceManager;
    let status = dto.status || existing.status;
    if (status !== 'Notice Period') {
      status = allCleared ? 'Cleared' : 'Clearance';
    }

    const [updated] = await this.db
      .update(separationRecords)
      .set({
        status,
        clearanceIt,
        clearanceFinance,
        clearanceHr,
        clearanceManager,
        ...(dto.assetLaptop !== undefined && { assetLaptop: dto.assetLaptop }),
        ...(dto.assetAccessCard !== undefined && { assetAccessCard: dto.assetAccessCard }),
        ...(dto.assetKeys !== undefined && { assetKeys: dto.assetKeys }),
        ...(dto.assetOther !== undefined && { assetOther: dto.assetOther }),
        ...(dto.handoverCompleted !== undefined && { handoverCompleted: dto.handoverCompleted }),
      })
      .where(eq(separationRecords.id, id))
      .returning();

    return updated;
  }

  async delete(id: string) {
    const [deleted] = await this.db
      .delete(separationRecords)
      .where(eq(separationRecords.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`Separation record with ID "${id}" not found`);
    }

    return { message: 'Separation record deleted successfully' };
  }
}
