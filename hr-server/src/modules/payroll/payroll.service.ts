import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, sql, asc } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import {
  payrollCycles,
  employeePayslips,
  disbursements,
  employees,
  employeeSalaries,
  festivalBonusRules,
  providentFundSettings,
  salaryTemplateComponents,
} from '../../db/schema';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';
import { DisburseDto, UpdatePayslipBonusDto } from './dto/payroll.dto';

@Injectable()
export class PayrollService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
  ) {}

  // Get or Create Draft Payroll Cycle
  async getOrCreateCycle(monthKey: string) {
    // 1. Try to find existing cycle
    let [cycle] = await this.db
      .select()
      .from(payrollCycles)
      .where(eq(payrollCycles.monthKey, monthKey))
      .limit(1);

    if (!cycle) {
      // Create new draft cycle
      const [newCycle] = await this.db
        .insert(payrollCycles)
        .values({
          monthKey,
          status: 'Draft',
        })
        .returning();
      cycle = newCycle;

      // Generate draft payslips for all active employees
      await this.generateDraftPayslips(cycle.id, monthKey);
    }

    // Return the cycle with its payslips and joined employee details
    const payslips = await this.getPayslipsForCycle(cycle.id);
    return {
      ...cycle,
      payslips,
    };
  }

  // Generate Draft Payslips
  private async generateDraftPayslips(cycleId: string, monthKey: string) {
    // 1. Get active employees
    const activeEmployees = await this.db
      .select()
      .from(employees)
      .where(eq(employees.status, 'active'));

    // 2. Fetch PF settings
    const [pfSettings] = await this.db.select().from(providentFundSettings).limit(1);
    const pfRate = pfSettings?.employeeContributionRate ?? 10;

    // 3. Fetch Festival Bonus rules
    const fRules = await this.db.select().from(festivalBonusRules).orderBy(asc(festivalBonusRules.minServiceMonths));

    for (const emp of activeEmployees) {
      // Fetch active salary assignment
      const [salAssignment] = await this.db
        .select()
        .from(employeeSalaries)
        .where(
          and(
            eq(employeeSalaries.employeeId, emp.id),
            eq(employeeSalaries.status, 'active'),
          ),
        )
        .orderBy(sql`${employeeSalaries.effectiveDate} DESC`)
        .limit(1);

      // Falls back to role-based salary if no active template/custom salary assigned
      const basic = salAssignment?.basicSalary ?? this.getDefaultSalary(emp.role);

      // Calculations
      let hra = 0;
      let transport = 0;
      let medical = 0;
      let tax = 0;

      const pfApplicable = salAssignment ? salAssignment.pfApplicable : true;
      let pf = 0;

      if (salAssignment?.templateId) {
        const components = await this.db
          .select()
          .from(salaryTemplateComponents)
          .where(eq(salaryTemplateComponents.templateId, salAssignment.templateId));
        
        for (const comp of components) {
          const compVal = comp.calculationType === 'percentage'
            ? Math.round(basic * (comp.value / 100))
            : Math.round(comp.value);
          
          const nameLower = comp.name.toLowerCase();
          if (comp.type === 'earning') {
            if (nameLower.includes('hra') || nameLower.includes('house rent')) {
              hra += compVal;
            } else if (nameLower.includes('transport') || nameLower.includes('conveyance') || nameLower.includes('travel')) {
              transport += compVal;
            } else if (nameLower.includes('medical')) {
              medical += compVal;
            } else {
              medical += compVal;
            }
          } else if (comp.type === 'deduction') {
            if (nameLower.includes('tax') || nameLower.includes('vat')) {
              tax += compVal;
            } else if (nameLower.includes('pf') || nameLower.includes('provident')) {
              if (pfApplicable) pf += compVal;
            } else {
              tax += compVal;
            }
          }
        }
      } else {
        // Fallbacks
        hra = Math.round(basic * 0.20);
        transport = Math.round(basic * 0.10);
        medical = Math.round(basic * 0.05);
        tax = Math.round(basic * 0.12);
        pf = pfApplicable ? Math.round(basic * (pfRate / 100)) : 0;
      }

      // Festival Bonus
      let festivalBonus = 0;
      const festivalBonusApplicable = salAssignment ? salAssignment.festivalBonusApplicable : true;
      if (festivalBonusApplicable && emp.joinDate) {
        const tenureMonths = this.calculateServiceMonths(emp.joinDate, monthKey);
        const matchingRule = fRules.find(
          (r) => tenureMonths >= r.minServiceMonths && tenureMonths <= r.maxServiceMonths,
        );
        if (matchingRule) {
          festivalBonus = Math.round(basic * (matchingRule.bonusPercentage / 100));
        }
      }

      const netPay = basic + hra + transport + medical + festivalBonus - (tax + pf);

      await this.db.insert(employeePayslips).values({
        payrollCycleId: cycleId,
        employeeId: emp.id,
        basicSalary: basic,
        allowanceHra: hra,
        allowanceTransport: transport,
        allowanceMedical: medical,
        deductionTax: tax,
        deductionPf: pf,
        bonusAmount: 0,
        bonusDescription: '',
        festivalBonusAmount: festivalBonus,
        netPay,
        paymentStatus: 'Unpaid',
      });
    }
  }

  // Get all payslips with employee details joined
  private async getPayslipsForCycle(cycleId: string) {
    return this.db
      .select({
        id: employeePayslips.id,
        employeeId: employeePayslips.employeeId,
        basicSalary: employeePayslips.basicSalary,
        allowanceHra: employeePayslips.allowanceHra,
        allowanceTransport: employeePayslips.allowanceTransport,
        allowanceMedical: employeePayslips.allowanceMedical,
        deductionTax: employeePayslips.deductionTax,
        deductionPf: employeePayslips.deductionPf,
        bonusAmount: employeePayslips.bonusAmount,
        bonusDescription: employeePayslips.bonusDescription,
        festivalBonusAmount: employeePayslips.festivalBonusAmount,
        netPay: employeePayslips.netPay,
        paymentStatus: employeePayslips.paymentStatus,
        paymentMethod: employeePayslips.paymentMethod,
        paymentDate: employeePayslips.paymentDate,
        paymentReference: employeePayslips.paymentReference,
        name: employees.fullNameEnglish,
        email: employees.email,
        role: employees.role,
        department: employees.departmentId, // Joining raw ID or name can be mapped frontend
        joinDate: employees.joinDate,
      })
      .from(employeePayslips)
      .innerJoin(employees, eq(employeePayslips.employeeId, employees.id))
      .where(eq(employeePayslips.payrollCycleId, cycleId));
  }

  // Update a specific payslip's bonus
  async updatePayslipBonus(monthKey: string, payslipId: string, dto: UpdatePayslipBonusDto) {
    const [payslip] = await this.db
      .select()
      .from(employeePayslips)
      .where(eq(employeePayslips.id, payslipId))
      .limit(1);

    if (!payslip) {
      throw new NotFoundException(`Payslip not found`);
    }

    const basic = payslip.basicSalary;
    const hra = payslip.allowanceHra;
    const transport = payslip.allowanceTransport;
    const medical = payslip.allowanceMedical;
    const tax = payslip.deductionTax;
    const pf = payslip.deductionPf;
    const festivalBonus = payslip.festivalBonusAmount;
    const newBonus = dto.bonusAmount;

    const netPay = basic + hra + transport + medical + festivalBonus + newBonus - (tax + pf);

    await this.db
      .update(employeePayslips)
      .set({
        bonusAmount: newBonus,
        bonusDescription: dto.bonusDescription || '',
        netPay,
      })
      .where(eq(employeePayslips.id, payslipId));

    await this.invalidateCache(monthKey);
    return this.getOrCreateCycle(monthKey);
  }

  // Lock and finalize payroll cycle
  async processCycle(monthKey: string) {
    const [cycle] = await this.db
      .select()
      .from(payrollCycles)
      .where(eq(payrollCycles.monthKey, monthKey))
      .limit(1);

    if (!cycle) {
      throw new NotFoundException(`Payroll cycle not found`);
    }

    await this.db
      .update(payrollCycles)
      .set({ status: 'Processed' })
      .where(eq(payrollCycles.id, cycle.id));

    await this.invalidateCache(monthKey);
    return this.getOrCreateCycle(monthKey);
  }

  // Distribute payslips
  async distributeCycle(monthKey: string) {
    const [cycle] = await this.db
      .select()
      .from(payrollCycles)
      .where(eq(payrollCycles.monthKey, monthKey))
      .limit(1);

    if (!cycle) {
      throw new NotFoundException(`Payroll cycle not found`);
    }

    await this.db
      .update(payrollCycles)
      .set({ status: 'Distributed' })
      .where(eq(payrollCycles.id, cycle.id));

    await this.invalidateCache(monthKey);
    return this.getOrCreateCycle(monthKey);
  }

  // Record Disbursement
  async recordDisbursement(dto: DisburseDto) {
    const [cycle] = await this.db
      .select()
      .from(payrollCycles)
      .where(eq(payrollCycles.monthKey, dto.monthKey))
      .limit(1);

    if (!cycle) {
      throw new NotFoundException(`Payroll cycle for ${dto.monthKey} not found`);
    }

    const payslips = await this.db
      .select()
      .from(employeePayslips)
      .where(eq(employeePayslips.payrollCycleId, cycle.id));

    let totalDisbursed = 0;
    const employeeCount = payslips.length;

    await this.db.transaction(async (tx) => {
      for (const slip of payslips) {
        totalDisbursed += slip.netPay;
        await tx
          .update(employeePayslips)
          .set({
            paymentStatus: 'Paid',
            paymentMethod: dto.paymentMethod,
            paymentDate: dto.disbursementDate,
            paymentReference: dto.referenceId,
          })
          .where(eq(employeePayslips.id, slip.id));
      }

      await tx.insert(disbursements).values({
        monthKey: dto.monthKey,
        disbursementDate: dto.disbursementDate,
        paymentMethod: dto.paymentMethod,
        referenceId: dto.referenceId,
        totalDisbursed,
        employeeCount,
      });

      await tx
        .update(payrollCycles)
        .set({ status: 'Distributed' })
        .where(eq(payrollCycles.id, cycle.id));
    });

    await this.invalidateCache(dto.monthKey);
    return this.getOrCreateCycle(dto.monthKey);
  }

  // Sync / Recalculate Draft Cycle
  async syncDraftCycle(monthKey: string) {
    const [cycle] = await this.db
      .select()
      .from(payrollCycles)
      .where(eq(payrollCycles.monthKey, monthKey))
      .limit(1);

    if (!cycle) {
      throw new NotFoundException(`Payroll cycle not found`);
    }

    if (cycle.status !== 'Draft') {
      throw new BadRequestException(`Only draft cycles can be synchronized`);
    }

    // 1. Get active employees
    const activeEmployees = await this.db
      .select()
      .from(employees)
      .where(eq(employees.status, 'active'));

    const activeEmployeeIds = activeEmployees.map((e) => e.id);

    // 2. Remove payslips for employees who are no longer active
    if (activeEmployeeIds.length > 0) {
      await this.db
        .delete(employeePayslips)
        .where(
          and(
            eq(employeePayslips.payrollCycleId, cycle.id),
            sql`${employeePayslips.employeeId} NOT IN (${sql.raw(
              activeEmployeeIds.map((id) => `'${id}'`).join(','),
            )})`,
          ),
        );
    } else {
      await this.db
        .delete(employeePayslips)
        .where(eq(employeePayslips.payrollCycleId, cycle.id));
    }

    // 3. Fetch PF settings and Festival Bonus rules
    const [pfSettings] = await this.db.select().from(providentFundSettings).limit(1);
    const pfRate = pfSettings?.employeeContributionRate ?? 10;
    const fRules = await this.db.select().from(festivalBonusRules).orderBy(asc(festivalBonusRules.minServiceMonths));

    for (const emp of activeEmployees) {
      // Fetch active salary assignment
      const [salAssignment] = await this.db
        .select()
        .from(employeeSalaries)
        .where(
          and(
            eq(employeeSalaries.employeeId, emp.id),
            eq(employeeSalaries.status, 'active'),
          ),
        )
        .orderBy(sql`${employeeSalaries.effectiveDate} DESC`)
        .limit(1);

      const basic = salAssignment?.basicSalary ?? this.getDefaultSalary(emp.role);

      // Calculations
      let hra = 0;
      let transport = 0;
      let medical = 0;
      let tax = 0;
      const pfApplicable = salAssignment ? salAssignment.pfApplicable : true;
      let pf = 0;

      if (salAssignment?.templateId) {
        const components = await this.db
          .select()
          .from(salaryTemplateComponents)
          .where(eq(salaryTemplateComponents.templateId, salAssignment.templateId));
        
        for (const comp of components) {
          const compVal = comp.calculationType === 'percentage'
            ? Math.round(basic * (comp.value / 100))
            : Math.round(comp.value);
          
          const nameLower = comp.name.toLowerCase();
          if (comp.type === 'earning') {
            if (nameLower.includes('hra') || nameLower.includes('house rent')) {
              hra += compVal;
            } else if (nameLower.includes('transport') || nameLower.includes('conveyance') || nameLower.includes('travel')) {
              transport += compVal;
            } else if (nameLower.includes('medical')) {
              medical += compVal;
            } else {
              medical += compVal;
            }
          } else if (comp.type === 'deduction') {
            if (nameLower.includes('tax') || nameLower.includes('vat')) {
              tax += compVal;
            } else if (nameLower.includes('pf') || nameLower.includes('provident')) {
              if (pfApplicable) pf += compVal;
            } else {
              tax += compVal;
            }
          }
        }
      } else {
        hra = Math.round(basic * 0.20);
        transport = Math.round(basic * 0.10);
        medical = Math.round(basic * 0.05);
        tax = Math.round(basic * 0.12);
        pf = pfApplicable ? Math.round(basic * (pfRate / 100)) : 0;
      }

      // Festival Bonus
      let festivalBonus = 0;
      const festivalBonusApplicable = salAssignment ? salAssignment.festivalBonusApplicable : true;
      if (festivalBonusApplicable && emp.joinDate) {
        const tenureMonths = this.calculateServiceMonths(emp.joinDate, monthKey);
        const matchingRule = fRules.find(
          (r) => tenureMonths >= r.minServiceMonths && tenureMonths <= r.maxServiceMonths,
        );
        if (matchingRule) {
          festivalBonus = Math.round(basic * (matchingRule.bonusPercentage / 100));
        }
      }

      // Check if payslip already exists for this employee in this cycle
      const [existingPayslip] = await this.db
        .select()
        .from(employeePayslips)
        .where(
          and(
            eq(employeePayslips.payrollCycleId, cycle.id),
            eq(employeePayslips.employeeId, emp.id),
          ),
        )
        .limit(1);

      if (existingPayslip) {
        // Keep custom manual bonus amount if it was already set
        const netPay = basic + hra + transport + medical + festivalBonus + existingPayslip.bonusAmount - (tax + pf);

        await this.db
          .update(employeePayslips)
          .set({
            basicSalary: basic,
            allowanceHra: hra,
            allowanceTransport: transport,
            allowanceMedical: medical,
            deductionTax: tax,
            deductionPf: pf,
            festivalBonusAmount: festivalBonus,
            netPay,
          })
          .where(eq(employeePayslips.id, existingPayslip.id));
      } else {
        const netPay = basic + hra + transport + medical + festivalBonus - (tax + pf);

        await this.db.insert(employeePayslips).values({
          payrollCycleId: cycle.id,
          employeeId: emp.id,
          basicSalary: basic,
          allowanceHra: hra,
          allowanceTransport: transport,
          allowanceMedical: medical,
          deductionTax: tax,
          deductionPf: pf,
          bonusAmount: 0,
          bonusDescription: '',
          festivalBonusAmount: festivalBonus,
          netPay,
          paymentStatus: 'Unpaid',
        });
      }
    }

    await this.invalidateCache(monthKey);
    return this.getOrCreateCycle(monthKey);
  }

  // Fetch all disbursements
  async getDisbursements() {
    const cached = await this.cache.getByKey(CacheKeys.payrollDisbursements);
    if (cached) return cached;

    const list = await this.db.select().from(disbursements).orderBy(sql`${disbursements.disbursementDate} DESC`);
    await this.cache.setByKey(CacheKeys.payrollDisbursements, list);
    return list;
  }

  // Helper: Default Salary based on designation / role
  private getDefaultSalary(role: string): number {
    switch (role) {
      case 'Senior Engineer': return 65000;
      case 'Product Manager': return 62000;
      case 'HR Specialist': return 58000;
      case 'Finance Analyst': return 65000;
      case 'Marketing Lead': return 58000;
      case 'Sales Rep': return 55000;
      default: return 50000;
    }
  }

  // Helper: Calculate tenure months between joinDate (YYYY-MM-DD) and monthKey (YYYY-MM)
  private calculateServiceMonths(joinDateStr: string, monthKeyStr: string): number {
    const [joinYear, joinMonth] = joinDateStr.split('-').map(Number);
    const [targetYear, targetMonth] = monthKeyStr.split('-').map(Number);

    const diffYears = targetYear - joinYear;
    const diffMonths = targetMonth - joinMonth;

    return Math.max(0, diffYears * 12 + diffMonths);
  }

  // Invalidate cache helpers
  private async invalidateCache(monthKey: string) {
    await this.cache.delByKey(CacheKeys.payrollDisbursements);
  }
}
