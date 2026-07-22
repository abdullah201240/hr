import { Injectable, Inject, OnModuleInit, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import {
  providentFundSettings,
  providentFundTransactions,
  providentFundWithdrawals,
  employees,
} from '../../db/schema';
import { UpdateProvidentFundSettingsDto } from './dto/provident-fund.dto';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';

@Injectable()
export class ProvidentFundService implements OnModuleInit {
  private readonly logger = new Logger(ProvidentFundService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
  ) {}

  async onModuleInit() {
    const settings = await this.db.select().from(providentFundSettings).limit(1);
    if (settings.length === 0) {
      await this.db.insert(providentFundSettings).values({
        minServiceMonths: 12,
        employeeContributionRate: 10,
        employerContributionRate: 10,
        contributionFrequency: 'monthly',
        calculationBasis: 'basic_salary',
        withdrawalRules: 'As per PF Trust Rules and Labour Law',
      });
    }
  }

  async find() {
    const cached = await this.cache.getByKey(CacheKeys.providentFundSettings);
    if (cached) return cached;

    const [settings] = await this.db.select().from(providentFundSettings).limit(1);
    
    if (settings) {
      await this.cache.setByKey(CacheKeys.providentFundSettings, settings);
    }
    
    return settings;
  }

  async update(dto: UpdateProvidentFundSettingsDto) {
    const settings = await this.find();
    if (!settings) {
      const [newSettings] = await this.db
        .insert(providentFundSettings)
        .values({
          minServiceMonths: dto.minServiceMonths ?? 12,
          employeeContributionRate: dto.employeeContributionRate ?? 10,
          employerContributionRate: dto.employerContributionRate ?? 10,
          contributionFrequency: dto.contributionFrequency ?? 'monthly',
          calculationBasis: dto.calculationBasis ?? 'basic_salary',
          withdrawalRules: dto.withdrawalRules ?? 'As per PF Trust Rules and Labour Law',
        })
        .returning();
      
      await this.invalidateCache();
      return newSettings;
    }

    const updateData: Record<string, any> = {};
    if (dto.minServiceMonths !== undefined) updateData.minServiceMonths = dto.minServiceMonths;
    if (dto.employeeContributionRate !== undefined) updateData.employeeContributionRate = dto.employeeContributionRate;
    if (dto.employerContributionRate !== undefined) updateData.employerContributionRate = dto.employerContributionRate;
    if (dto.contributionFrequency !== undefined) updateData.contributionFrequency = dto.contributionFrequency;
    if (dto.calculationBasis !== undefined) updateData.calculationBasis = dto.calculationBasis;
    if (dto.withdrawalRules !== undefined) updateData.withdrawalRules = dto.withdrawalRules;

    const [updated] = await this.db
      .update(providentFundSettings)
      .set(updateData)
      .returning();

    await this.invalidateCache();
    return updated;
  }

  // ─── Transactions Ledger ────────────────────────────────────────────────
  async getLedger(employeeId?: string) {
    const conditions = [];
    if (employeeId) {
      conditions.push(eq(providentFundTransactions.employeeId, employeeId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return this.db
      .select({
        id: providentFundTransactions.id,
        employeeId: providentFundTransactions.employeeId,
        fullName: employees.fullNameEnglish,
        employeeDisplayId: employees.employeeId,
        monthKey: providentFundTransactions.monthKey,
        employeeContribution: providentFundTransactions.employeeContribution,
        employerContribution: providentFundTransactions.employerContribution,
        type: providentFundTransactions.type,
        amount: providentFundTransactions.amount,
        description: providentFundTransactions.description,
        createdAt: providentFundTransactions.createdAt,
      })
      .from(providentFundTransactions)
      .innerJoin(employees, eq(providentFundTransactions.employeeId, employees.id))
      .where(whereClause)
      .orderBy(desc(providentFundTransactions.createdAt));
  }

  // ─── Withdrawal Requests ────────────────────────────────────────────────
  async getWithdrawals(employeeId?: string) {
    const conditions = [];
    if (employeeId) {
      conditions.push(eq(providentFundWithdrawals.employeeId, employeeId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const actionByEmployees = sql`action_by_employees`;

    return this.db
      .select({
        id: providentFundWithdrawals.id,
        employeeId: providentFundWithdrawals.employeeId,
        fullName: employees.fullNameEnglish,
        employeeDisplayId: employees.employeeId,
        amount: providentFundWithdrawals.amount,
        reason: providentFundWithdrawals.reason,
        status: providentFundWithdrawals.status,
        remarks: providentFundWithdrawals.remarks,
        actionById: providentFundWithdrawals.actionById,
        actionByName: sql<string>`(SELECT ${employees.fullNameEnglish} FROM ${employees} WHERE ${employees.id} = ${providentFundWithdrawals.actionById})`,
        actionAt: providentFundWithdrawals.actionAt,
        createdAt: providentFundWithdrawals.createdAt,
      })
      .from(providentFundWithdrawals)
      .innerJoin(employees, eq(providentFundWithdrawals.employeeId, employees.id))
      .where(whereClause)
      .orderBy(desc(providentFundWithdrawals.createdAt));
  }

  async createWithdrawalRequest(employeeId: string, amount: number, reason: string) {
    if (amount <= 0) {
      throw new BadRequestException('Withdrawal amount must be greater than zero.');
    }

    // Check balance
    const [balanceRow] = await this.db
      .select({ total: sql<number>`SUM(${providentFundTransactions.amount})` })
      .from(providentFundTransactions)
      .where(eq(providentFundTransactions.employeeId, employeeId));

    const netBalance = Number(balanceRow?.total) || 0;
    if (netBalance < amount) {
      throw new BadRequestException(`Insufficient balance. Your current PF balance is ${netBalance} BDT.`);
    }

    const [withdrawal] = await this.db
      .insert(providentFundWithdrawals)
      .values({
        employeeId,
        amount,
        reason,
        status: 'Pending',
      })
      .returning();

    return withdrawal;
  }

  async processWithdrawalRequest(
    withdrawalId: string,
    status: 'Approved' | 'Rejected',
    remarks: string,
    actionByUserId: string,
  ) {
    const [withdrawal] = await this.db
      .select()
      .from(providentFundWithdrawals)
      .where(eq(providentFundWithdrawals.id, withdrawalId))
      .limit(1);

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal request not found.');
    }

    if (withdrawal.status !== 'Pending') {
      throw new BadRequestException('This withdrawal request has already been processed.');
    }

    return this.db.transaction(async (tx) => {
      if (status === 'Approved') {
        // Recheck balance
        const [balanceRow] = await tx
          .select({ total: sql<number>`SUM(${providentFundTransactions.amount})` })
          .from(providentFundTransactions)
          .where(eq(providentFundTransactions.employeeId, withdrawal.employeeId));

        const netBalance = Number(balanceRow?.total) || 0;
        if (netBalance < withdrawal.amount) {
          throw new BadRequestException(`Cannot approve withdrawal: Insufficient balance (${netBalance} BDT).`);
        }

        // 1. Record negative ledger transaction
        await tx.insert(providentFundTransactions).values({
          employeeId: withdrawal.employeeId,
          monthKey: null,
          employeeContribution: 0,
          employerContribution: 0,
          type: 'withdrawal',
          amount: -withdrawal.amount,
          description: `Approved PF withdrawal: ${withdrawal.reason}`,
        });
      }

      // 2. Update withdrawal status
      const [updated] = await tx
        .update(providentFundWithdrawals)
        .set({
          status,
          remarks: remarks || '',
          actionById: actionByUserId,
          actionAt: new Date(),
        })
        .where(eq(providentFundWithdrawals.id, withdrawalId))
        .returning();

      return updated;
    });
  }

  // ─── Cache invalidation ──────────────────────────────────────────────────
  private async invalidateCache() {
    await this.cache.delByPattern(CacheKeys.providentFundSettings);
  }
}
