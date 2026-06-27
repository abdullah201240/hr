import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import {
  festivalBonusSettings,
  festivalBonusCycles,
  employeeFestivalBonuses,
  employees,
  employeeSalaries,
  salaryTemplateComponents,
} from '../../db/schema';
import { CreateFestivalBonusCycleDto } from './dto/create-cycle.dto';
import { UpdateFestivalBonusPayoutDto } from './dto/update-payout.dto';
import { DisburseFestivalBonusCycleDto } from './dto/disburse-cycle.dto';
import { UpdateFestivalBonusSettingsDto } from './dto/festival-bonus-settings.dto';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';

const SINGLETON_ID = 'default';

@Injectable()
export class FestivalBonusService {
  private readonly logger = new Logger(FestivalBonusService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
  ) {}

  // ─── Settings ──────────────────────────────────────────────────────────────

  async getSettings() {
    const cached = await this.cache.getByKey<typeof festivalBonusSettings.$inferSelect>(
      CacheKeys.festivalBonusSettings,
    );
    if (cached) return cached;

    let [settings] = await this.db
      .select()
      .from(festivalBonusSettings)
      .where(eq(festivalBonusSettings.id, SINGLETON_ID))
      .limit(1);

    if (!settings) {
      [settings] = await this.db
        .insert(festivalBonusSettings)
        .values({
          id: SINGLETON_ID,
          bonusesPerYear: 2,
          minServiceMonths: 6,
          amountFormula: 'one_month_basic',
          salaryComponent: 'basic',
          prorataFullServiceMonths: 12,
          tierRules: [],
          eligibleEmployeeTypes: ['Full-time'],
          allowSpecialApproval: true,
        })
        .returning();
      this.logger.log('Initialized default festival bonus settings');
    }

    await this.cache.setByKey(CacheKeys.festivalBonusSettings, settings);
    return settings;
  }

  async updateSettings(dto: UpdateFestivalBonusSettingsDto) {
    await this.getSettings();

    const [updated] = await this.db
      .update(festivalBonusSettings)
      .set({
        ...dto,
      })
      .where(eq(festivalBonusSettings.id, SINGLETON_ID))
      .returning();

    await this.cache.setByKey(CacheKeys.festivalBonusSettings, updated);
    this.logger.log('Updated festival bonus settings');
    return updated;
  }

  // ─── Bonus Cycles & Processing ──────────────────────────────────────────────

  async getCycles() {
    const cached = await this.cache.getByKey<any[]>(CacheKeys.festivalBonusCyclesList);
    if (cached) return cached;

    const list = await this.db
      .select()
      .from(festivalBonusCycles)
      .orderBy(desc(festivalBonusCycles.festivalDate));

    await this.cache.setByKey(CacheKeys.festivalBonusCyclesList, list);
    return list;
  }

  async getCycleById(id: string) {
    const cached = await this.cache.getByKey<{ cycle: any; payouts: any[] }>(
      CacheKeys.festivalBonusCycleDetails,
      id,
    );
    if (cached) return cached;

    const [cycle] = await this.db
      .select()
      .from(festivalBonusCycles)
      .where(eq(festivalBonusCycles.id, id))
      .limit(1);

    if (!cycle) {
      throw new NotFoundException(`Festival Bonus Cycle with ID "${id}" not found`);
    }

    // Join employee festival bonuses with employee details
    const payouts = await this.db
      .select({
        id: employeeFestivalBonuses.id,
        employeeId: employeeFestivalBonuses.employeeId,
        employeeName: employees.fullNameEnglish,
        employeeCode: employees.employeeId,
        employeeType: employees.employeeType,
        joinDate: employees.joinDate,
        basicSalary: employeeFestivalBonuses.basicSalary,
        grossSalary: employeeFestivalBonuses.grossSalary,
        serviceMonths: employeeFestivalBonuses.serviceMonths,
        calculatedAmount: employeeFestivalBonuses.calculatedAmount,
        overrideAmount: employeeFestivalBonuses.overrideAmount,
        finalAmount: employeeFestivalBonuses.finalAmount,
        isEligible: employeeFestivalBonuses.isEligible,
        eligibilityReason: employeeFestivalBonuses.eligibilityReason,
        specialApprovalGranted: employeeFestivalBonuses.specialApprovalGranted,
        status: employeeFestivalBonuses.status,
        paymentMethod: employeeFestivalBonuses.paymentMethod,
        paymentRef: employeeFestivalBonuses.paymentRef,
        paidAt: employeeFestivalBonuses.paidAt,
      })
      .from(employeeFestivalBonuses)
      .innerJoin(employees, eq(employeeFestivalBonuses.employeeId, employees.id))
      .where(eq(employeeFestivalBonuses.festivalBonusCycleId, id));

    const result = {
      cycle,
      payouts,
    };

    await this.cache.setByKey(CacheKeys.festivalBonusCycleDetails, result, id);
    return result;
  }

  async createCycle(dto: CreateFestivalBonusCycleDto) {
    const settings = await this.getSettings();
    const festDate = new Date(dto.festivalDate);

    // 1. Create the Cycle in Draft status
    const [cycle] = await this.db
      .insert(festivalBonusCycles)
      .values({
        name: dto.name,
        festivalDate: festDate,
        status: 'Draft',
        totalAmount: 0,
        totalEmployees: 0,
      })
      .returning();

    // 2. Process payouts for all active employees
    await this.calculatePayoutsForCycle(cycle.id, festDate, settings);

    // 3. Recalculate summary stats for the cycle
    const result = await this.refreshCycleSummary(cycle.id);
    await this.cache.delByKey(CacheKeys.festivalBonusCyclesList);
    return result;
  }

  async recalculateCycle(id: string) {
    const [cycle] = await this.db
      .select()
      .from(festivalBonusCycles)
      .where(eq(festivalBonusCycles.id, id))
      .limit(1);

    if (!cycle) {
      throw new NotFoundException(`Festival Bonus Cycle with ID "${id}" not found`);
    }

    if (cycle.status !== 'Draft') {
      throw new BadRequestException('Only cycles in Draft status can be recalculated');
    }

    const settings = await this.getSettings();

    // Remove existing payouts
    await this.db
      .delete(employeeFestivalBonuses)
      .where(eq(employeeFestivalBonuses.festivalBonusCycleId, id));

    // Calculate payouts again
    await this.calculatePayoutsForCycle(id, new Date(cycle.festivalDate), settings);

    // Refresh cycle stats
    return this.refreshCycleSummary(id);
  }

  async updatePayout(payoutId: string, dto: UpdateFestivalBonusPayoutDto) {
    const [payout] = await this.db
      .select()
      .from(employeeFestivalBonuses)
      .where(eq(employeeFestivalBonuses.id, payoutId))
      .limit(1);

    if (!payout) {
      throw new NotFoundException(`Employee payout record with ID "${payoutId}" not found`);
    }

    const [cycle] = await this.db
      .select()
      .from(festivalBonusCycles)
      .where(eq(festivalBonusCycles.id, payout.festivalBonusCycleId))
      .limit(1);

    if (cycle.status !== 'Draft') {
      throw new BadRequestException('Adjustments can only be made in Draft cycles');
    }

    const updates: Partial<typeof employeeFestivalBonuses.$inferInsert> = {};

    if (dto.specialApprovalGranted !== undefined) {
      updates.specialApprovalGranted = dto.specialApprovalGranted;
      if (dto.specialApprovalGranted) {
        updates.isEligible = true;
        updates.eligibilityReason = 'Approved by special allowance';
      } else {
        // Revert to rule-based eligibility
        const settings = await this.getSettings();
        const [emp] = await this.db
          .select({ employeeType: employees.employeeType })
          .from(employees)
          .where(eq(employees.id, payout.employeeId))
          .limit(1);

        const typeEligible = settings.eligibleEmployeeTypes.includes(emp?.employeeType || '');
        const tenureEligible = payout.serviceMonths >= settings.minServiceMonths;

        updates.isEligible = typeEligible && tenureEligible;
        updates.eligibilityReason = updates.isEligible
          ? 'Meets eligibility requirements'
          : `Ineligible: Type eligible = ${typeEligible}, Tenure = ${payout.serviceMonths} mo (min ${settings.minServiceMonths})`;
      }
    }

    if (dto.overrideAmount !== undefined) {
      updates.overrideAmount = dto.overrideAmount;
      updates.finalAmount = dto.overrideAmount;
    } else if (dto.overrideAmount === null) {
      updates.overrideAmount = null;
      updates.finalAmount = payout.calculatedAmount;
    }

    await this.db
      .update(employeeFestivalBonuses)
      .set(updates)
      .where(eq(employeeFestivalBonuses.id, payoutId));

    // Update cycle summary stats
    await this.refreshCycleSummary(payout.festivalBonusCycleId);

    return this.getCycleById(payout.festivalBonusCycleId);
  }

  async approveCycle(id: string) {
    const [cycle] = await this.db
      .select()
      .from(festivalBonusCycles)
      .where(eq(festivalBonusCycles.id, id))
      .limit(1);

    if (!cycle) {
      throw new NotFoundException(`Festival Cycle not found`);
    }

    if (cycle.status !== 'Draft') {
      throw new BadRequestException('Only Draft cycles can be approved');
    }

    const [updated] = await this.db
      .update(festivalBonusCycles)
      .set({ status: 'Approved', updatedAt: new Date() })
      .where(eq(festivalBonusCycles.id, id))
      .returning();

    await this.cache.delByKey(CacheKeys.festivalBonusCycleDetails, id);
    await this.cache.delByKey(CacheKeys.festivalBonusCyclesList);
    return updated;
  }

  async disburseCycle(id: string, dto: DisburseFestivalBonusCycleDto) {
    const [cycle] = await this.db
      .select()
      .from(festivalBonusCycles)
      .where(eq(festivalBonusCycles.id, id))
      .limit(1);

    if (!cycle) {
      throw new NotFoundException(`Festival Cycle not found`);
    }

    if (cycle.status !== 'Approved') {
      throw new BadRequestException('Only Approved cycles can be disbursed');
    }

    const payDate = new Date(dto.disbursementDate);

    // Update individual payouts
    await this.db
      .update(employeeFestivalBonuses)
      .set({
        status: 'Paid',
        paymentMethod: dto.paymentMethod,
        paymentRef: dto.paymentRef,
        paidAt: payDate,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(employeeFestivalBonuses.festivalBonusCycleId, id),
          eq(employeeFestivalBonuses.isEligible, true),
        ),
      );

    // Mark cycle as Disbursed
    const [updated] = await this.db
      .update(festivalBonusCycles)
      .set({
        status: 'Disbursed',
        updatedAt: new Date(),
      })
      .where(eq(festivalBonusCycles.id, id))
      .returning();

    await this.cache.delByKey(CacheKeys.festivalBonusCycleDetails, id);
    await this.cache.delByKey(CacheKeys.festivalBonusCyclesList);
    return updated;
  }

  async deleteCycle(id: string) {
    const [cycle] = await this.db
      .select()
      .from(festivalBonusCycles)
      .where(eq(festivalBonusCycles.id, id))
      .limit(1);

    if (!cycle) {
      throw new NotFoundException(`Festival Cycle not found`);
    }

    if (cycle.status !== 'Draft') {
      throw new BadRequestException('Only Draft cycles can be deleted');
    }

    await this.db.delete(festivalBonusCycles).where(eq(festivalBonusCycles.id, id));
    await this.cache.delByKey(CacheKeys.festivalBonusCycleDetails, id);
    await this.cache.delByKey(CacheKeys.festivalBonusCyclesList);
    return { success: true };
  }

  // ─── Calculation Helpers ──────────────────────────────────────────────────

  private async calculatePayoutsForCycle(
    cycleId: string,
    festivalDate: Date,
    settings: any,
  ) {
    // 1. Get all active employees
    const activeEmployees = await this.db
      .select()
      .from(employees)
      .where(eq(employees.status, 'active'));

    // 2. Fetch all active employee salaries in bulk
    const activeSalaries = await this.db
      .select()
      .from(employeeSalaries)
      .where(eq(employeeSalaries.status, 'active'));

    const salariesMap = new Map<string, typeof employeeSalaries.$inferSelect>();
    for (const sal of activeSalaries) {
      salariesMap.set(sal.employeeId, sal);
    }

    // 3. Fetch all salary template components in bulk
    const allComponents = await this.db
      .select()
      .from(salaryTemplateComponents);

    const componentsMap = new Map<string, (typeof salaryTemplateComponents.$inferSelect)[]>();
    for (const comp of allComponents) {
      const list = componentsMap.get(comp.templateId) || [];
      list.push(comp);
      componentsMap.set(comp.templateId, list);
    }

    // 4. Batch insert array for efficiency
    const payoutsToInsert: any[] = [];

    for (const emp of activeEmployees) {
      const salaryRecord = salariesMap.get(emp.id);
      const basicSalary = salaryRecord ? salaryRecord.basicSalary : 0;

      // 5. Resolve allowances for gross salary calculation
      let hra = Math.round(basicSalary * 0.20);
      let transport = Math.round(basicSalary * 0.10);
      let medical = Math.round(basicSalary * 0.05);

      if (salaryRecord?.templateId) {
        const components = componentsMap.get(salaryRecord.templateId) || [];
        
        let tempHra = 0;
        let tempTransport = 0;
        let tempMedical = 0;
        let hasCustom = false;

        for (const comp of components) {
          const compVal = comp.calculationType === 'percentage'
            ? Math.round(basicSalary * (comp.value / 100))
            : Math.round(comp.value);
          
          const nameLower = comp.name.toLowerCase();
          if (comp.type === 'earning') {
            hasCustom = true;
            if (nameLower.includes('hra') || nameLower.includes('house rent')) {
              tempHra += compVal;
            } else if (nameLower.includes('transport') || nameLower.includes('conveyance') || nameLower.includes('travel')) {
              tempTransport += compVal;
            } else {
              tempMedical += compVal;
            }
          }
        }
        if (hasCustom) {
          hra = tempHra;
          transport = tempTransport;
          medical = tempMedical;
        }
      }

      const grossSalary = basicSalary + hra + transport + medical;

      // 6. Calculate tenure in months
      const joinDate = new Date(emp.joinDate);
      const diffTime = festivalDate.getTime() - joinDate.getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const serviceMonths = Number((diffDays / 30.437).toFixed(2)); // Average days in month

      // 7. Determine rules eligibility
      const typeEligible = settings.eligibleEmployeeTypes.includes(emp.employeeType);
      const tenureEligible = serviceMonths >= settings.minServiceMonths;

      const isEligible = typeEligible && tenureEligible;
      const eligibilityReason = isEligible
        ? 'Meets eligibility requirements'
        : `Ineligible: Type eligible = ${typeEligible}, Tenure = ${serviceMonths} mo (min ${settings.minServiceMonths})`;

      // 8. Calculate bonus amount based on settings formula
      let calculatedAmount = 0;
      if (isEligible) {
        const baseSalary = settings.salaryComponent === 'gross' ? grossSalary : basicSalary;

        if (settings.amountFormula === 'one_month_basic') {
          calculatedAmount = basicSalary;
        } else if (settings.amountFormula === 'pro_rata_service_months') {
          calculatedAmount = Math.round(basicSalary * (Math.min(12, serviceMonths) / 12));
        } else if (settings.amountFormula === 'earned_festival_bonus') {
          calculatedAmount = Math.round(basicSalary * serviceMonths);
        } else if (settings.amountFormula === 'prorated_service') {
          const fullMonths = settings.prorataFullServiceMonths || 12;
          calculatedAmount = Math.round((baseSalary / fullMonths) * Math.min(serviceMonths, fullMonths));
        } else if (settings.amountFormula === 'tiered_ranges') {
          const rules = settings.tierRules || [];
          const matchingRule = rules.find((rule: any) => {
            const minOk = serviceMonths >= rule.minMonths;
            const maxOk = rule.maxMonths === null || rule.maxMonths === undefined || serviceMonths < rule.maxMonths;
            return minOk && maxOk;
          });
          if (matchingRule) {
            calculatedAmount = Math.round(baseSalary * (matchingRule.percentage / 100));
          } else {
            calculatedAmount = 0;
          }
        }
      }

      payoutsToInsert.push({
        festivalBonusCycleId: cycleId,
        employeeId: emp.id,
        basicSalary,
        grossSalary,
        serviceMonths,
        calculatedAmount,
        finalAmount: calculatedAmount,
        isEligible,
        eligibilityReason,
        specialApprovalGranted: false,
        status: 'Calculated',
      });
    }

    // 9. Batch insert all payouts at once
    if (payoutsToInsert.length > 0) {
      await this.db
        .insert(employeeFestivalBonuses)
        .values(payoutsToInsert);
    }
  }

  private async refreshCycleSummary(cycleId: string) {
    const payouts = await this.db
      .select()
      .from(employeeFestivalBonuses)
      .where(eq(employeeFestivalBonuses.festivalBonusCycleId, cycleId));

    const eligiblePayouts = payouts.filter((p) => p.isEligible);
    const totalAmount = eligiblePayouts.reduce((acc, curr) => acc + curr.finalAmount, 0);
    const totalEmployees = eligiblePayouts.length;

    await this.db
      .update(festivalBonusCycles)
      .set({
        totalAmount,
        totalEmployees,
        updatedAt: new Date(),
      })
      .where(eq(festivalBonusCycles.id, cycleId));

    await this.cache.delByKey(CacheKeys.festivalBonusCycleDetails, cycleId);
    await this.cache.delByKey(CacheKeys.festivalBonusCyclesList);

    return this.getCycleById(cycleId);
  }
}
