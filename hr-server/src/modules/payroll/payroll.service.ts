import { Injectable, Inject, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { eq, and, sql, asc, not, inArray } from 'drizzle-orm';
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
  departments,
  designations,
} from '../../db/schema';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';
import { DisburseDto, UpdatePayslipBonusDto } from './dto/payroll.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationService } from '../notifications/notifications.service';
import { NotificationModule, NotificationCategory } from '../notifications/types/notification.types';

@Injectable()
export class PayrollService implements OnModuleInit {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly cache: CacheService,
    @InjectQueue('payroll') private readonly payrollQueue: Queue,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    try {
      await this.payrollQueue.add(
        'auto-generate-monthly-payroll',
        {},
        {
          repeat: {
            pattern: '0 0 1 * *',
          },
          jobId: 'auto-generate-payroll-repeatable',
        },
      );
      this.logger.log('Scheduled Repeatable Cron job for auto-generating monthly payroll.');
    } catch (err: any) {
      this.logger.error(`Failed to register repeatable job: ${err.message}`);
    }
  }

  // Get processing status of a payroll cycle
  async getCycleStatus(monthKey: string) {
    const [cycle] = await this.db
      .select({
        id: payrollCycles.id,
        monthKey: payrollCycles.monthKey,
        status: payrollCycles.status,
        isProcessing: payrollCycles.isProcessing,
      })
      .from(payrollCycles)
      .where(eq(payrollCycles.monthKey, monthKey))
      .limit(1);

    if (!cycle) {
      return { isProcessing: false, status: 'Draft' };
    }
    return cycle;
  }

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
          isProcessing: true,
        })
        .returning();
      cycle = newCycle;

      // Generate payroll synchronously to avoid BullMQ/Redis queue issues
      try {
        await this.processGeneratePayroll(cycle.id, monthKey);
        const [updatedCycle] = await this.db
          .select()
          .from(payrollCycles)
          .where(eq(payrollCycles.id, cycle.id))
          .limit(1);
        if (updatedCycle) {
          cycle = updatedCycle;
        }
      } catch (err: any) {
        this.logger.error(`Failed to generate payroll synchronously: ${err.message}`, err.stack);
        await this.db
          .update(payrollCycles)
          .set({ isProcessing: false })
          .where(eq(payrollCycles.id, cycle.id));
        cycle.isProcessing = false;
      }
    }

    const payslips = await this.getPayslipsForCycle(cycle.id);
    return {
      ...cycle,
      payslips,
    };
  }

  // Helper: Centralized Salary Calculations
  calculateSalaryBreakdown(
    basic: number,
    pfApplicable: boolean,
    pfRate: number,
    components: any[]
  ) {
    let hra = 0;
    let transport = 0;
    let medical = 0;
    let tax = 0;
    let pf = 0;
    const allowances: Record<string, number> = {};
    const deductions: Record<string, number> = {};

    if (components.length === 0) {
      // Fallback calculations
      hra = Math.round(basic * 0.20);
      transport = Math.round(basic * 0.10);
      medical = Math.round(basic * 0.05);
      tax = Math.round(basic * 0.12);
      pf = pfApplicable ? Math.round(basic * (pfRate / 100)) : 0;

      allowances['HRA'] = hra;
      allowances['Transport'] = transport;
      allowances['Medical'] = medical;
      deductions['Tax'] = tax;
      if (pf > 0) {
        deductions['Provident Fund'] = pf;
      }
    } else {
      let hasPfInTemplate = false;

      for (const comp of components) {
        const compVal = comp.calculationType === 'percentage'
          ? Math.round(basic * (comp.value / 100))
          : Math.round(comp.value);
        
        const nameLower = comp.name.toLowerCase();
        if (comp.type === 'earning') {
          if (nameLower.includes('hra') || nameLower.includes('house rent')) {
            hra += compVal;
            allowances['HRA'] = (allowances['HRA'] || 0) + compVal;
          } else if (nameLower.includes('transport') || nameLower.includes('conveyance') || nameLower.includes('travel')) {
            transport += compVal;
            allowances['Transport'] = (allowances['Transport'] || 0) + compVal;
          } else if (nameLower.includes('medical')) {
            medical += compVal;
            allowances['Medical'] = (allowances['Medical'] || 0) + compVal;
          } else {
            allowances[comp.name] = (allowances[comp.name] || 0) + compVal;
          }
        } else if (comp.type === 'deduction') {
          if (nameLower.includes('tax') || nameLower.includes('vat')) {
            tax += compVal;
            deductions['Tax'] = (deductions['Tax'] || 0) + compVal;
          } else if (nameLower.includes('pf') || nameLower.includes('provident')) {
            if (pfApplicable) {
              pf += compVal;
              deductions['Provident Fund'] = (deductions['Provident Fund'] || 0) + compVal;
            }
            hasPfInTemplate = true;
          } else {
            deductions[comp.name] = (deductions[comp.name] || 0) + compVal;
          }
        }
      }

      // Add dynamic PF if applicable and template does not specify one
      if (pfApplicable && !hasPfInTemplate) {
        pf = Math.round(basic * (pfRate / 100));
        deductions['Provident Fund'] = pf;
      }
    }

    return {
      hra,
      transport,
      medical,
      tax,
      pf,
      allowances,
      deductions,
    };
  }

  // Background payroll generation processor helper
  async processGeneratePayroll(cycleId: string, monthKey: string) {
    try {
      const activeEmployees = await this.db
        .select()
        .from(employees)
        .where(eq(employees.status, 'active'));

      const [pfSettings] = await this.db.select().from(providentFundSettings).limit(1);
      const pfRate = pfSettings?.employeeContributionRate ?? 10;
      const fRules = await this.db.select().from(festivalBonusRules).orderBy(asc(festivalBonusRules.minServiceMonths));

      for (const emp of activeEmployees) {
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

        if (!salAssignment) {
          this.logger.warn(
            `Salary assignment is missing for active employee ${emp.fullNameEnglish} (${emp.employeeId}). Skipping from payroll generation.`
          );
          continue;
        }

        const basic = salAssignment.basicSalary;
        const pfApplicable = salAssignment.pfApplicable;
        const festivalBonusApplicable = salAssignment.festivalBonusApplicable;

        let components: any[] = [];
        if (salAssignment.templateId) {
          components = await this.db
            .select()
            .from(salaryTemplateComponents)
            .where(eq(salaryTemplateComponents.templateId, salAssignment.templateId))
            .orderBy(asc(salaryTemplateComponents.sortOrder));
        }

        const calc = this.calculateSalaryBreakdown(basic, pfApplicable, pfRate, components);

        // Festival Bonus
        let festivalBonus = 0;
        if (festivalBonusApplicable && emp.joinDate) {
          const tenureMonths = this.calculateServiceMonths(emp.joinDate, monthKey);
          const matchingRule = fRules.find(
            (r) => tenureMonths >= r.minServiceMonths && tenureMonths <= r.maxServiceMonths,
          );
          if (matchingRule) {
            festivalBonus = Math.round(basic * (matchingRule.bonusPercentage / 100));
          }
        }

        const netPay = basic + calc.hra + calc.transport + calc.medical + festivalBonus - (calc.tax + calc.pf);

        await this.db.insert(employeePayslips).values({
          payrollCycleId: cycleId,
          employeeId: emp.id,
          basicSalary: basic,
          allowanceHra: calc.hra,
          allowanceTransport: calc.transport,
          allowanceMedical: calc.medical,
          deductionTax: calc.tax,
          deductionPf: calc.pf,
          allowances: calc.allowances,
          deductions: calc.deductions,
          bonusAmount: 0,
          bonusDescription: '',
          festivalBonusAmount: festivalBonus,
          netPay,
          paymentStatus: 'Unpaid',
        });
      }
    } catch (err: any) {
      this.logger.error(`Error processing generate payroll: ${err.message}`, err.stack);
      throw err;
    } finally {
      await this.db
        .update(payrollCycles)
        .set({ isProcessing: false })
        .where(eq(payrollCycles.id, cycleId));
      await this.invalidateCache(monthKey);
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
        allowances: employeePayslips.allowances,
        deductions: employeePayslips.deductions,
        name: employees.fullNameEnglish,
        email: employees.email,
        department: employees.departmentId,
        departmentName: departments.name,
        employeeDisplayId: employees.employeeId,
        joinDate: employees.joinDate,
        designationName: designations.name,
      })
      .from(employeePayslips)
      .innerJoin(employees, eq(employeePayslips.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
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

    if (cycle.status !== 'Draft') {
      throw new BadRequestException(`Only draft cycles can be processed`);
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

    if (cycle.status !== 'Processed') {
      throw new BadRequestException(`Only processed cycles can be distributed`);
    }

    await this.db
      .update(payrollCycles)
      .set({ status: 'Distributed' })
      .where(eq(payrollCycles.id, cycle.id));

    // Run email distribution synchronously to avoid BullMQ/Redis dependencies
    try {
      await this.processEmailDistribution(cycle.id, monthKey);
    } catch (err: any) {
      this.logger.error(`Failed to distribute emails synchronously: ${err.message}`, err.stack);
    }

    // Trigger Notification
    await this.triggerPayrollDistributionNotifications(cycle.id, monthKey);

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

    if (cycle.status !== 'Processed' && cycle.status !== 'Distributed') {
      throw new BadRequestException(`Payroll cycle must be processed before disbursement`);
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

    // Trigger Notification
    await this.triggerPayrollDisbursementNotifications(payslips, dto);

    await this.invalidateCache(dto.monthKey);
    return this.getOrCreateCycle(dto.monthKey);
  }

  private async triggerPayrollDistributionNotifications(cycleId: string, monthKey: string) {
    try {
      const payslips = await this.db
        .select({
          employeeId: employeePayslips.employeeId,
          netPay: employeePayslips.netPay,
        })
        .from(employeePayslips)
        .where(eq(employeePayslips.payrollCycleId, cycleId));

      await this.notificationService.emitBulk(
        payslips.map((slip) => ({
          recipientId: slip.employeeId,
          module: NotificationModule.PAYROLL,
          category: NotificationCategory.SYSTEM,
          title: 'Payslip Published',
          message: `Your payslip for ${monthKey} has been published. Net Pay: ${slip.netPay} BDT.`,
          actionUrl: '/payroll',
          entityType: 'payroll_cycle',
          entityId: cycleId,
        })),
      );
    } catch (err: any) {
      this.logger.error(`Failed to trigger payroll distribution notifications: ${err.message}`);
    }
  }

  private async triggerPayrollDisbursementNotifications(payslips: any[], dto: DisburseDto) {
    try {
      await this.notificationService.emitBulk(
        payslips.map((slip) => ({
          recipientId: slip.employeeId,
          module: NotificationModule.PAYROLL,
          category: NotificationCategory.SYSTEM,
          title: 'Salary Disbursed',
          message: `Your salary for ${dto.monthKey} has been disbursed via ${dto.paymentMethod}. Net Pay: ${slip.netPay} BDT.`,
          actionUrl: '/payroll',
          entityType: 'disbursement',
        })),
      );
    } catch (err: any) {
      this.logger.error(`Failed to trigger payroll disbursement notifications: ${err.message}`);
    }
  }

  // Sync / Recalculate Draft Cycle
  async syncDraftCycle(monthKey: string) {
    let [cycle] = await this.db
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

    // Mark as processing
    await this.db
      .update(payrollCycles)
      .set({ isProcessing: true })
      .where(eq(payrollCycles.id, cycle.id));

    // Run synchronously to avoid BullMQ/Redis setup dependencies
    try {
      await this.processSyncPayroll(cycle.id, monthKey);
      const [updatedCycle] = await this.db
        .select()
        .from(payrollCycles)
        .where(eq(payrollCycles.id, cycle.id))
        .limit(1);
      if (updatedCycle) {
        cycle = updatedCycle;
      }
    } catch (err: any) {
      this.logger.error(`Failed to sync payroll synchronously: ${err.message}`, err.stack);
      await this.db
        .update(payrollCycles)
        .set({ isProcessing: false })
        .where(eq(payrollCycles.id, cycle.id));
      cycle.isProcessing = false;
    }

    const payslips = await this.getPayslipsForCycle(cycle.id);
    return {
      ...cycle,
      payslips,
    };
  }

  // Background payroll sync processor helper
  async processSyncPayroll(cycleId: string, monthKey: string) {
    try {
      const activeEmployees = await this.db
        .select()
        .from(employees)
        .where(eq(employees.status, 'active'));

      const activeEmployeeIds = activeEmployees.map((e) => e.id);

      if (activeEmployeeIds.length > 0) {
        await this.db
          .delete(employeePayslips)
          .where(
            and(
              eq(employeePayslips.payrollCycleId, cycleId),
              not(inArray(employeePayslips.employeeId, activeEmployeeIds)),
            ),
          );
      } else {
        await this.db
          .delete(employeePayslips)
          .where(eq(employeePayslips.payrollCycleId, cycleId));
      }

      const [pfSettings] = await this.db.select().from(providentFundSettings).limit(1);
      const pfRate = pfSettings?.employeeContributionRate ?? 10;
      const fRules = await this.db.select().from(festivalBonusRules).orderBy(asc(festivalBonusRules.minServiceMonths));

      for (const emp of activeEmployees) {
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

        if (!salAssignment) {
          this.logger.warn(
            `Salary assignment is missing for active employee ${emp.fullNameEnglish} (${emp.employeeId}). Skipping from payroll sync.`
          );
          continue;
        }

        const basic = salAssignment.basicSalary;
        const pfApplicable = salAssignment.pfApplicable;
        const festivalBonusApplicable = salAssignment.festivalBonusApplicable;

        let components: any[] = [];
        if (salAssignment.templateId) {
          components = await this.db
            .select()
            .from(salaryTemplateComponents)
            .where(eq(salaryTemplateComponents.templateId, salAssignment.templateId))
            .orderBy(asc(salaryTemplateComponents.sortOrder));
        }

        const calc = this.calculateSalaryBreakdown(basic, pfApplicable, pfRate, components);

        // Festival Bonus
        let festivalBonus = 0;
        if (festivalBonusApplicable && emp.joinDate) {
          const tenureMonths = this.calculateServiceMonths(emp.joinDate, monthKey);
          const matchingRule = fRules.find(
            (r) => tenureMonths >= r.minServiceMonths && tenureMonths <= r.maxServiceMonths,
          );
          if (matchingRule) {
            festivalBonus = Math.round(basic * (matchingRule.bonusPercentage / 100));
          }
        }

        const [existingPayslip] = await this.db
          .select()
          .from(employeePayslips)
          .where(
            and(
              eq(employeePayslips.payrollCycleId, cycleId),
              eq(employeePayslips.employeeId, emp.id),
            ),
          )
          .limit(1);

        if (existingPayslip) {
          const netPay = basic + calc.hra + calc.transport + calc.medical + festivalBonus + existingPayslip.bonusAmount - (calc.tax + calc.pf);

          await this.db
            .update(employeePayslips)
            .set({
              basicSalary: basic,
              allowanceHra: calc.hra,
              allowanceTransport: calc.transport,
              allowanceMedical: calc.medical,
              deductionTax: calc.tax,
              deductionPf: calc.pf,
              allowances: calc.allowances,
              deductions: calc.deductions,
              festivalBonusAmount: festivalBonus,
              netPay,
            })
            .where(eq(employeePayslips.id, existingPayslip.id));
        } else {
          const netPay = basic + calc.hra + calc.transport + calc.medical + festivalBonus - (calc.tax + calc.pf);

          await this.db.insert(employeePayslips).values({
            payrollCycleId: cycleId,
            employeeId: emp.id,
            basicSalary: basic,
            allowanceHra: calc.hra,
            allowanceTransport: calc.transport,
            allowanceMedical: calc.medical,
            deductionTax: calc.tax,
            deductionPf: calc.pf,
            allowances: calc.allowances,
            deductions: calc.deductions,
            bonusAmount: 0,
            bonusDescription: '',
            festivalBonusAmount: festivalBonus,
            netPay,
            paymentStatus: 'Unpaid',
          });
        }
      }
    } catch (err: any) {
      this.logger.error(`Error processing sync payroll: ${err.message}`, err.stack);
      throw err;
    } finally {
      await this.db
        .update(payrollCycles)
        .set({ isProcessing: false })
        .where(eq(payrollCycles.id, cycleId));
      await this.invalidateCache(monthKey);
    }
  }

  // Fetch all disbursements
  async getDisbursements() {
    const cached = await this.cache.getByKey(CacheKeys.payrollDisbursements);
    if (cached) return cached;

    const list = await this.db.select().from(disbursements).orderBy(sql`${disbursements.disbursementDate} DESC`);
    await this.cache.setByKey(CacheKeys.payrollDisbursements, list);
    return list;
  }

  // Get accumulated PF balances based on Paid payslips
  async getPfBalances() {
    return this.db
      .select({
        employeeId: employeePayslips.employeeId,
        totalPf: sql<number>`COALESCE(SUM(${employeePayslips.deductionPf}), 0)`,
        monthsContributed: sql<number>`COUNT(DISTINCT ${employeePayslips.payrollCycleId})`,
      })
      .from(employeePayslips)
      .where(eq(employeePayslips.paymentStatus, 'Paid'))
      .groupBy(employeePayslips.employeeId);
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

  async processEmailDistribution(cycleId: string, monthKey: string) {
    const payslips = await this.db
      .select({
        id: employeePayslips.id,
        email: employees.email,
        name: employees.fullNameEnglish,
        netPay: employeePayslips.netPay,
      })
      .from(employeePayslips)
      .innerJoin(employees, eq(employeePayslips.employeeId, employees.id))
      .where(eq(employeePayslips.payrollCycleId, cycleId));

    this.logger.log(`Starting email distribution simulation for ${payslips.length} employees for cycle ${monthKey}`);
    for (const slip of payslips) {
      // Simulate sending email
      this.logger.log(
        `[Email Simulation] Sent payslip for ${monthKey} to ${slip.name} (${slip.email}) - Net Pay: $${slip.netPay}`
      );
    }
    this.logger.log(`Email distribution simulation completed for cycle ${monthKey}`);
    return { distributedCount: payslips.length };
  }

  // Invalidate cache helpers
  private async invalidateCache(monthKey: string) {
    await this.cache.delByKey(CacheKeys.payrollDisbursements);
  }
}
