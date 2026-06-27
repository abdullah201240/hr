import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { assets, assetHistory, employees } from '../../db/schema';
import { CreateAssetDto, AllocateAssetDto, UpdateAssetConditionDto } from './dto/assets.dto';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  constructor(@Inject(DB_CONNECTION) private readonly db: Database) {}

  async createAsset(dto: CreateAssetDto) {
    // Check if asset tag already exists
    const [existingTag] = await this.db
      .select()
      .from(assets)
      .where(eq(assets.assetTag, dto.assetTag))
      .limit(1);

    if (existingTag) {
      throw new BadRequestException(`Asset Tag ${dto.assetTag} already exists`);
    }

    // Check if serial number already exists
    const [existingSerial] = await this.db
      .select()
      .from(assets)
      .where(eq(assets.serialNumber, dto.serialNumber))
      .limit(1);

    if (existingSerial) {
      throw new BadRequestException(`Serial Number ${dto.serialNumber} already exists`);
    }

    const [newAsset] = await this.db
      .insert(assets)
      .values({
        assetTag: dto.assetTag,
        name: dto.name,
        serialNumber: dto.serialNumber,
        category: dto.category,
        model: dto.model || null,
        purchaseDate: dto.purchaseDate || null,
        cost: dto.cost !== undefined ? Number(dto.cost) : 0,
        condition: 'New',
        status: 'Available',
        remarks: dto.remarks || null,
      })
      .returning();

    return newAsset;
  }

  async getAssets(employeeId?: string, status?: string, category?: string) {
    const conditions = [];
    if (employeeId) {
      conditions.push(eq(assets.assignedToId, employeeId));
    }
    if (status) {
      conditions.push(eq(assets.status, status));
    }
    if (category) {
      conditions.push(eq(assets.category, category));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return this.db
      .select({
        id: assets.id,
        assetTag: assets.assetTag,
        name: assets.name,
        serialNumber: assets.serialNumber,
        category: assets.category,
        model: assets.model,
        purchaseDate: assets.purchaseDate,
        cost: assets.cost,
        condition: assets.condition,
        status: assets.status,
        assignedToId: assets.assignedToId,
        assignedToName: employees.fullNameEnglish,
        assignedToDisplayId: employees.employeeId,
        assignedAt: assets.assignedAt,
        returnDueDate: assets.returnDueDate,
        remarks: assets.remarks,
        createdAt: assets.createdAt,
      })
      .from(assets)
      .leftJoin(employees, eq(assets.assignedToId, employees.id))
      .where(whereClause)
      .orderBy(desc(assets.createdAt));
  }

  async getAssetDetails(id: string) {
    const [assetRecord] = await this.db
      .select({
        id: assets.id,
        assetTag: assets.assetTag,
        name: assets.name,
        serialNumber: assets.serialNumber,
        category: assets.category,
        model: assets.model,
        purchaseDate: assets.purchaseDate,
        cost: assets.cost,
        condition: assets.condition,
        status: assets.status,
        assignedToId: assets.assignedToId,
        assignedToName: employees.fullNameEnglish,
        assignedToDisplayId: employees.employeeId,
        assignedAt: assets.assignedAt,
        returnDueDate: assets.returnDueDate,
        remarks: assets.remarks,
      })
      .from(assets)
      .leftJoin(employees, eq(assets.assignedToId, employees.id))
      .where(eq(assets.id, id))
      .limit(1);

    if (!assetRecord) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    const historyLogs = await this.db
      .select({
        id: assetHistory.id,
        action: assetHistory.action,
        employeeName: employees.fullNameEnglish,
        employeeDisplayId: employees.employeeId,
        actionByName: sql<string>`(SELECT ${employees.fullNameEnglish} FROM ${employees} WHERE ${employees.id} = ${assetHistory.actionById})`,
        notes: assetHistory.notes,
        createdAt: assetHistory.createdAt,
      })
      .from(assetHistory)
      .leftJoin(employees, eq(assetHistory.employeeId, employees.id))
      .where(eq(assetHistory.assetId, id))
      .orderBy(desc(assetHistory.createdAt));

    return {
      ...assetRecord,
      history: historyLogs,
    };
  }

  async allocateAsset(id: string, dto: AllocateAssetDto, actionById: string) {
    const [assetRecord] = await this.db.select().from(assets).where(eq(assets.id, id)).limit(1);
    if (!assetRecord) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    if (assetRecord.status !== 'Available') {
      throw new BadRequestException(`Asset is currently ${assetRecord.status.toLowerCase()} and cannot be allocated`);
    }

    if (assetRecord.condition === 'Lost') {
      throw new BadRequestException('Cannot allocate a lost device');
    }

    // Verify employee exists
    const [emp] = await this.db.select().from(employees).where(eq(employees.id, dto.assignedToId)).limit(1);
    if (!emp) {
      throw new NotFoundException(`Employee with ID ${dto.assignedToId} not found`);
    }

    const [updated] = await this.db
      .update(assets)
      .set({
        assignedToId: dto.assignedToId,
        status: 'Assigned',
        assignedAt: new Date(),
        returnDueDate: dto.returnDueDate ? new Date(dto.returnDueDate) : null,
      })
      .where(eq(assets.id, id))
      .returning();

    await this.db.insert(assetHistory).values({
      assetId: id,
      action: 'Allocation',
      employeeId: dto.assignedToId,
      actionById,
      notes: dto.notes || 'Asset allocated to employee',
    });

    return updated;
  }

  async returnAsset(id: string, notes: string, actionById: string) {
    const [assetRecord] = await this.db.select().from(assets).where(eq(assets.id, id)).limit(1);
    if (!assetRecord) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    if (assetRecord.status !== 'Assigned') {
      throw new BadRequestException(`Asset status is currently ${assetRecord.status} (must be Assigned to return)`);
    }

    const previousAssignedToId = assetRecord.assignedToId;

    const [updated] = await this.db
      .update(assets)
      .set({
        assignedToId: null,
        status: 'Available',
        assignedAt: null,
        returnDueDate: null,
      })
      .where(eq(assets.id, id))
      .returning();

    await this.db.insert(assetHistory).values({
      assetId: id,
      action: 'Return',
      employeeId: previousAssignedToId,
      actionById,
      notes: notes || 'Asset returned to inventory',
    });

    return updated;
  }

  async updateCondition(id: string, dto: UpdateAssetConditionDto, actionById: string) {
    const [assetRecord] = await this.db.select().from(assets).where(eq(assets.id, id)).limit(1);
    if (!assetRecord) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    let finalStatus = assetRecord.status;
    let finalAssignedToId = assetRecord.assignedToId;

    if (dto.condition === 'Lost') {
      finalStatus = 'Retired';
      finalAssignedToId = null;
    } else if (dto.condition === 'Damaged' && assetRecord.status === 'Available') {
      finalStatus = 'Under Maintenance';
    }

    const [updated] = await this.db
      .update(assets)
      .set({
        condition: dto.condition,
        status: finalStatus,
        assignedToId: finalAssignedToId,
        assignedAt: finalAssignedToId ? assetRecord.assignedAt : null,
        returnDueDate: finalAssignedToId ? assetRecord.returnDueDate : null,
      })
      .where(eq(assets.id, id))
      .returning();

    await this.db.insert(assetHistory).values({
      assetId: id,
      action: 'Condition Update',
      employeeId: assetRecord.assignedToId,
      actionById,
      notes: `Condition updated to ${dto.condition}. ${dto.notes || ''}`,
    });

    return updated;
  }
}
