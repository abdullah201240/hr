import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, or, like, desc } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { disciplinaryCases, employees } from '../../db/schema';
import { CreateDisciplinaryCaseDto, UpdateDisciplinaryCaseDto, DisciplinaryQueryDto } from './dto/disciplinary.dto';
import { NotificationService } from '../notifications/notifications.service';
import { NotificationModule, NotificationCategory } from '../notifications/types/notification.types';

@Injectable()
export class DisciplinaryService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly notificationService: NotificationService,
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

    await this.triggerDisciplinaryNotification(
      created,
      'Disciplinary Case Issued',
      `A disciplinary case has been opened against you: ${created.offenseType}. Status: ${created.status}.`,
    );

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

    await this.triggerDisciplinaryNotification(
      updated,
      'Disciplinary Case Updated',
      `Disciplinary case status updated to: ${updated.status}.`,
    );

    return updated;
  }

  private async triggerDisciplinaryNotification(disCase: any, title: string, message: string) {
    try {
      const [emp] = await this.db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.email, disCase.employeeEmail))
        .limit(1);

      if (emp) {
        await this.notificationService.emit({
          recipientId: emp.id,
          module: NotificationModule.DISCIPLINARY,
          category: NotificationCategory.STATUS_CHANGE,
          title,
          message,
          actionUrl: '/disciplinary',
          entityType: 'disciplinary_case',
          entityId: disCase.id,
        });
      }
    } catch (err: any) {
      // Ignore
    }
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
