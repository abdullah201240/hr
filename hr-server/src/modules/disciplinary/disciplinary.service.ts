import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, or, like, desc } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { disciplinaryCases } from '../../db/schema';
import { CreateDisciplinaryCaseDto, UpdateDisciplinaryCaseDto, DisciplinaryQueryDto } from './dto/disciplinary.dto';

@Injectable()
export class DisciplinaryService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
  ) {}

  async findAll(query: DisciplinaryQueryDto) {
    const { search, status } = query;
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push(eq(disciplinaryCases.status, status));
    }

    if (search) {
      conditions.push(
        or(
          like(disciplinaryCases.employeeName, `%${search}%`),
          like(disciplinaryCases.employeeEmail, `%${search}%`),
          like(disciplinaryCases.offenseType, `%${search}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return this.db
      .select()
      .from(disciplinaryCases)
      .where(whereClause)
      .orderBy(desc(disciplinaryCases.createdAt));
  }

  async create(dto: CreateDisciplinaryCaseDto) {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const caseId = `DSC-${randomNum}`;

    const status = dto.showCauseNotice && dto.showCauseNotice.trim()
      ? 'Show Cause Issued'
      : 'Under Investigation';

    const [created] = await this.db
      .insert(disciplinaryCases)
      .values({
        id: caseId,
        employeeName: dto.employeeName,
        employeeEmail: dto.employeeEmail,
        offenseType: dto.offenseType,
        dateReported: new Date().toISOString().split('T')[0],
        status,
        showCauseNotice: dto.showCauseNotice || '',
        employeeExplanation: '',
        finalAction: '',
      })
      .returning();

    return created;
  }

  async update(id: string, dto: UpdateDisciplinaryCaseDto) {
    const [updated] = await this.db
      .update(disciplinaryCases)
      .set({
        ...(dto.status && { status: dto.status }),
        ...(dto.employeeExplanation !== undefined && { employeeExplanation: dto.employeeExplanation }),
        ...(dto.finalAction !== undefined && { finalAction: dto.finalAction }),
      })
      .where(eq(disciplinaryCases.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Disciplinary case with ID "${id}" not found`);
    }

    return updated;
  }

  async delete(id: string) {
    const [deleted] = await this.db
      .delete(disciplinaryCases)
      .where(eq(disciplinaryCases.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`Disciplinary case with ID "${id}" not found`);
    }

    return { message: 'Disciplinary case revoked successfully' };
  }
}
