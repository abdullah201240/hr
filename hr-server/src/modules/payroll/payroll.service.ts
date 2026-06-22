import { Injectable, Inject, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { eq, and, sql, asc, not, inArray, between, lte, gte } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import {
  payrollCycles,
  employeePayslips,
  disbursements,
  employees,
  employeeSalaries,
  providentFundSettings,
  salaryTemplateComponents,
  departments,
  designations,
  attendanceSettings,
  attendanceLogs,
  holidays,
  leaveApplications,
  leaveTypes,
} from '../../db/schema';
import { CacheService } from '../../common/cache/cache.service';
import { CacheKeys } from '../../common/cache/cache-keys';
import { DisburseDto, UpdatePayslipAdjustmentsDto } from './dto/payroll.dto';
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

    let payslips = await this.getPayslipsForCycle(cycle.id);

    const hasLegacyAttendanceMetrics = payslips.some((p) => (p.totalWorkingDays ?? 0) === 0);

    // Self-healing: if cycle exists as Draft but has missing/legacy data, regenerate synchronously.
    if (cycle.status === 'Draft' && (payslips.length === 0 || hasLegacyAttendanceMetrics)) {
      this.logger.log(
        payslips.length === 0
          ? `Draft cycle ${monthKey} has 0 payslips. Triggering synchronous auto-generation.`
          : `Draft cycle ${monthKey} has payslips with missing attendance metrics. Triggering synchronous sync.`,
      );
      try {
        await this.db
          .update(payrollCycles)
          .set({ isProcessing: true })
          .where(eq(payrollCycles.id, cycle.id));
        
        if (payslips.length === 0) {
          await this.processGeneratePayroll(cycle.id, monthKey);
        } else {
          await this.processSyncPayroll(cycle.id, monthKey);
        }
        
        const [updatedCycle] = await this.db
          .select()
          .from(payrollCycles)
          .where(eq(payrollCycles.id, cycle.id))
          .limit(1);
        if (updatedCycle) {
          cycle = updatedCycle;
        }
        payslips = await this.getPayslipsForCycle(cycle.id);
      } catch (err: any) {
        this.logger.error(`Failed to auto-heal draft payroll cycle: ${err.message}`, err.stack);
        await this.db
          .update(payrollCycles)
          .set({ isProcessing: false })
          .where(eq(payrollCycles.id, cycle.id));
        cycle.isProcessing = false;
      }
    }

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

  private parseOfficeTime(timeStr: string, dateStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  }

  private parseTimeString(timeStr: string, dateStr: string): Date {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  }

  private getLatePenaltyHours(penaltyText: string): number {
    const text = penaltyText.toLowerCase();
    if (text.includes('30 minutes') || text.includes('half hour')) return 0.5;
    if (text.includes('1 hour') || text.includes('one hour')) return 1;
    if (text.includes('2 hours') || text.includes('two hours')) return 2;
    if (text.includes('half-day') || text.includes('half day')) return 4;
    return 0;
  }

  private getLocalTodayStr(): string {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
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
      const [settings] = await this.db.select().from(attendanceSettings).where(eq(attendanceSettings.id, 'default')).limit(1);
      const [year, month] = monthKey.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      const startOfMonthStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const endOfMonthStr = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
      const todayStr = this.getLocalTodayStr();

      const holidaysList = await this.db
        .select()
        .from(holidays)
        .where(
          and(
            lte(holidays.startDate, endOfMonthStr),
            gte(holidays.endDate, startOfMonthStr),
          )
        );

      let totalWorkingDays = 0;
      const weeklyHolidays = settings?.weeklyHolidays || ['Saturday', 'Sunday'];
      const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        const currentDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayName = DAY_NAMES[currentDate.getDay()];

        const isWeeklyHoliday = weeklyHolidays.includes(dayName);
        const isPublicHoliday = holidaysList.some((h) => {
          return currentDateStr >= h.startDate && currentDateStr <= h.endDate;
        });

        if (!isWeeklyHoliday && !isPublicHoliday) {
          totalWorkingDays++;
        }
      }
      if (totalWorkingDays === 0) totalWorkingDays = 22; // Fallback

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
        let components: any[] = [];
        if (salAssignment.templateId) {
          components = await this.db
            .select()
            .from(salaryTemplateComponents)
            .where(eq(salaryTemplateComponents.templateId, salAssignment.templateId))
            .orderBy(asc(salaryTemplateComponents.sortOrder));
        }

        const calc = this.calculateSalaryBreakdown(basic, pfApplicable, pfRate, components);

        // Fetch employee's attendance logs for this month
        const logs = await this.db
          .select()
          .from(attendanceLogs)
          .where(
            and(
              eq(attendanceLogs.employeeId, emp.id),
              between(attendanceLogs.date, startOfMonthStr, endOfMonthStr)
            )
          );
        const logsMap = new Map(logs.map(l => [l.date, l]));

        // Fetch approved leave applications for this employee for this month
        const leaveApps = await this.db
          .select({
            startDate: leaveApplications.startDate,
            endDate: leaveApplications.endDate,
            paid: leaveTypes.paid,
          })
          .from(leaveApplications)
          .innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
          .where(
            and(
              eq(leaveApplications.employeeId, emp.id),
              eq(leaveApplications.status, 'Approved'),
              lte(leaveApplications.startDate, endOfMonthStr),
              gte(leaveApplications.endDate, startOfMonthStr),
            )
          );

        // Count attendance exceptions
        let absentDays = 0;
        let lwpDays = 0;
        let halfDays = 0;
        let totalLatePenaltyHours = 0;
        let lateDays = 0;
        let leaveDays = 0;
        let prorationDaysBefore = 0;
        let prorationDaysAfter = 0;

        for (let day = 1; day <= daysInMonth; day++) {
          const currentDate = new Date(year, month - 1, day);
          const currentDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayName = DAY_NAMES[currentDate.getDay()];

          const isWeeklyHoliday = weeklyHolidays.includes(dayName);
          const isPublicHoliday = holidaysList.some((h) => {
            return currentDateStr >= h.startDate && currentDateStr <= h.endDate;
          });
          const isWorkingDay = !isWeeklyHoliday && !isPublicHoliday;

          // Proration cuts
          if (isWorkingDay) {
            if (currentDateStr < emp.joinDate) {
              prorationDaysBefore++;
              continue;
            }
            if (emp.inactiveDate && currentDateStr > emp.inactiveDate && emp.status !== 'active') {
              prorationDaysAfter++;
              continue;
            }
          }

          const existingLog = logsMap.get(currentDateStr);
          const hasApprovedLeave = leaveApps.some(app => currentDateStr >= app.startDate && currentDateStr <= app.endDate);
          const isUnpaidLeave = leaveApps.some(app => !app.paid && currentDateStr >= app.startDate && currentDateStr <= app.endDate);

          // 1. Absent Days
          if (isWorkingDay && currentDateStr <= todayStr && !hasApprovedLeave) {
            if (!existingLog || existingLog.status === 'absent') {
              absentDays++;
            }
          }

          // 2. Leave Without Pay (LWP)
          if (isWorkingDay && isUnpaidLeave) {
            lwpDays++;
          }

          // 3. Half-Days
          const halfDayThresholdHours = (settings?.halfDayThreshold ?? 240) / 60;
          if (existingLog && existingLog.hours !== null && existingLog.hours < halfDayThresholdHours && existingLog.status !== 'leave' && existingLog.status !== 'holiday' && existingLog.status !== 'weekend') {
            halfDays++;
          }

          // 4. Late Days count
          if (existingLog && existingLog.status === 'late') {
            lateDays++;
          }

          // 5. Late Penalties
          if (existingLog && existingLog.status === 'late' && existingLog.checkIn && settings?.startTime) {
            try {
              const checkInTime = this.parseTimeString(existingLog.checkIn, currentDateStr);
              const officeStart = this.parseOfficeTime(settings.startTime, currentDateStr);
              const lateMinutes = Math.max(0, Math.floor((checkInTime.getTime() - officeStart.getTime()) / (1000 * 60)));

              const matchingRule = settings.lateRules?.find((r: any) => lateMinutes >= r.minMinutes && lateMinutes <= r.maxMinutes);
              if (matchingRule) {
                const penaltyHours = this.getLatePenaltyHours(matchingRule.penalty);
                totalLatePenaltyHours += penaltyHours;
              }
            } catch (err: any) {
              // Ignore parsing errors
            }
          }

          // 6. Leave Days (all approved leaves on working days)
          if (isWorkingDay && hasApprovedLeave) {
            leaveDays++;
          }
        }

        const presentDays = Math.max(0, totalWorkingDays - absentDays - lwpDays - leaveDays);

        const allowancesSum = Object.values(calc.allowances || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
        const gross = basic + allowancesSum;

        const perDayGross = gross / totalWorkingDays;
        const perDayBasic = basic / totalWorkingDays;
        const perHourBasic = perDayBasic / 8;

        const absentDeduction = Math.round(absentDays * perDayGross);
        const lwpDeduction = Math.round(lwpDays * perDayGross);
        const halfDayDeduction = Math.round(halfDays * 0.5 * perDayGross);
        const lateDeduction = Math.round(totalLatePenaltyHours * perHourBasic);
        const prorationDeduction = Math.round((prorationDaysBefore + prorationDaysAfter) * perDayGross);

        if (absentDeduction > 0) {
          calc.deductions['Absenteeism Cut'] = absentDeduction;
        }
        if (lwpDeduction > 0) {
          calc.deductions['LWP Deduction'] = lwpDeduction;
        }
        if (halfDayDeduction > 0) {
          calc.deductions['Half-Day Cut'] = halfDayDeduction;
        }
        if (lateDeduction > 0) {
          calc.deductions['Late Penalty'] = lateDeduction;
        }
        if (prorationDeduction > 0) {
          calc.deductions['Proration Cut'] = prorationDeduction;
        }

        const deductionsSum = Object.values(calc.deductions || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
        const netPay = basic + allowancesSum - deductionsSum;

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
          netPay,
          paymentStatus: 'Unpaid',
          totalWorkingDays,
          presentDays,
          absentDays,
          leaveDays,
          lateDays,
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
        netPay: employeePayslips.netPay,
        paymentStatus: employeePayslips.paymentStatus,
        paymentMethod: employeePayslips.paymentMethod,
        paymentDate: employeePayslips.paymentDate,
        paymentReference: employeePayslips.paymentReference,
        allowances: employeePayslips.allowances,
        deductions: employeePayslips.deductions,
        totalWorkingDays: employeePayslips.totalWorkingDays,
        presentDays: employeePayslips.presentDays,
        absentDays: employeePayslips.absentDays,
        leaveDays: employeePayslips.leaveDays,
        lateDays: employeePayslips.lateDays,
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

  // Update draft-only manual additions/deductions for a specific payslip.
  async updatePayslipAdjustments(monthKey: string, payslipId: string, dto: UpdatePayslipAdjustmentsDto) {
    const [cycle] = await this.db
      .select()
      .from(payrollCycles)
      .where(eq(payrollCycles.monthKey, monthKey))
      .limit(1);

    if (!cycle) {
      throw new NotFoundException(`Payroll cycle not found`);
    }

    if (cycle.status !== 'Draft') {
      throw new BadRequestException(`Only draft payroll cycles can be adjusted`);
    }

    const [payslip] = await this.db
      .select()
      .from(employeePayslips)
      .where(
        and(
          eq(employeePayslips.id, payslipId),
          eq(employeePayslips.payrollCycleId, cycle.id),
        ),
      )
      .limit(1);

    if (!payslip) {
      throw new NotFoundException(`Payslip not found`);
    }

    const additionalAmount = Math.max(0, Number(dto.additionalAmount || 0));
    const deductionReductionAmount = Math.max(0, Number(dto.deductionReductionAmount || 0));
    const extraDeductionAmount = Math.max(0, Number(dto.extraDeductionAmount || 0));
    const cleanManualEntries = (entries: Record<string, number> | null | undefined) => {
      const cleaned: Record<string, number> = {};
      for (const [key, value] of Object.entries(entries || {})) {
        if (
          key.startsWith('Manual Addition') ||
          key.startsWith('Deduction Reduction') ||
          key.startsWith('Extra Deduction')
        ) {
          continue;
        }
        cleaned[key] = Number(value) || 0;
      }
      return cleaned;
    };

    const makeLabel = (prefix: string, description?: string) => {
      const suffix = description?.trim();
      return suffix ? `${prefix}: ${suffix}` : prefix;
    };

    const allowances = cleanManualEntries(payslip.allowances);
    const deductions = cleanManualEntries(payslip.deductions);

    if (additionalAmount > 0) {
      allowances[makeLabel('Manual Addition', dto.additionalDescription)] = additionalAmount;
    }
    if (deductionReductionAmount > 0) {
      deductions[makeLabel('Deduction Reduction', dto.deductionDescription)] = -deductionReductionAmount;
    }
    if (extraDeductionAmount > 0) {
      deductions[makeLabel('Extra Deduction', dto.deductionDescription)] = extraDeductionAmount;
    }

    const basic = payslip.basicSalary;
    const allowancesSum = Object.values(allowances).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const deductionsSum = Object.values(deductions).reduce((sum, val) => sum + (Number(val) || 0), 0);

    const netPay = basic + allowancesSum - deductionsSum;

    await this.db
      .update(employeePayslips)
      .set({
        allowances,
        deductions,
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
      const [settings] = await this.db.select().from(attendanceSettings).where(eq(attendanceSettings.id, 'default')).limit(1);
      const [year, month] = monthKey.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      const startOfMonthStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const endOfMonthStr = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
      const todayStr = this.getLocalTodayStr();

      const holidaysList = await this.db
        .select()
        .from(holidays)
        .where(
          and(
            lte(holidays.startDate, endOfMonthStr),
            gte(holidays.endDate, startOfMonthStr),
          )
        );

      let totalWorkingDays = 0;
      const weeklyHolidays = settings?.weeklyHolidays || ['Saturday', 'Sunday'];
      const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        const currentDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayName = DAY_NAMES[currentDate.getDay()];

        const isWeeklyHoliday = weeklyHolidays.includes(dayName);
        const isPublicHoliday = holidaysList.some((h) => {
          return currentDateStr >= h.startDate && currentDateStr <= h.endDate;
        });

        if (!isWeeklyHoliday && !isPublicHoliday) {
          totalWorkingDays++;
        }
      }
      if (totalWorkingDays === 0) totalWorkingDays = 22; // Fallback

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
        let components: any[] = [];
        if (salAssignment.templateId) {
          components = await this.db
            .select()
            .from(salaryTemplateComponents)
            .where(eq(salaryTemplateComponents.templateId, salAssignment.templateId))
            .orderBy(asc(salaryTemplateComponents.sortOrder));
        }

        const calc = this.calculateSalaryBreakdown(basic, pfApplicable, pfRate, components);

        // Fetch employee's attendance logs for this month
        const logs = await this.db
          .select()
          .from(attendanceLogs)
          .where(
            and(
              eq(attendanceLogs.employeeId, emp.id),
              between(attendanceLogs.date, startOfMonthStr, endOfMonthStr)
            )
          );
        const logsMap = new Map(logs.map(l => [l.date, l]));

        // Fetch approved leave applications for this employee for this month
        const leaveApps = await this.db
          .select({
            startDate: leaveApplications.startDate,
            endDate: leaveApplications.endDate,
            paid: leaveTypes.paid,
          })
          .from(leaveApplications)
          .innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
          .where(
            and(
              eq(leaveApplications.employeeId, emp.id),
              eq(leaveApplications.status, 'Approved'),
              lte(leaveApplications.startDate, endOfMonthStr),
              gte(leaveApplications.endDate, startOfMonthStr),
            )
          );

        // Count attendance exceptions
        let absentDays = 0;
        let lwpDays = 0;
        let halfDays = 0;
        let totalLatePenaltyHours = 0;
        let lateDays = 0;
        let leaveDays = 0;
        let prorationDaysBefore = 0;
        let prorationDaysAfter = 0;

        for (let day = 1; day <= daysInMonth; day++) {
          const currentDate = new Date(year, month - 1, day);
          const currentDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayName = DAY_NAMES[currentDate.getDay()];

          const isWeeklyHoliday = weeklyHolidays.includes(dayName);
          const isPublicHoliday = holidaysList.some((h) => {
            return currentDateStr >= h.startDate && currentDateStr <= h.endDate;
          });
          const isWorkingDay = !isWeeklyHoliday && !isPublicHoliday;

          // Proration cuts
          if (isWorkingDay) {
            if (currentDateStr < emp.joinDate) {
              prorationDaysBefore++;
              continue;
            }
            if (emp.inactiveDate && currentDateStr > emp.inactiveDate && emp.status !== 'active') {
              prorationDaysAfter++;
              continue;
            }
          }

          const existingLog = logsMap.get(currentDateStr);
          const hasApprovedLeave = leaveApps.some(app => currentDateStr >= app.startDate && currentDateStr <= app.endDate);
          const isUnpaidLeave = leaveApps.some(app => !app.paid && currentDateStr >= app.startDate && currentDateStr <= app.endDate);

          // 1. Absent Days
          if (isWorkingDay && currentDateStr <= todayStr && !hasApprovedLeave) {
            if (!existingLog || existingLog.status === 'absent') {
              absentDays++;
            }
          }

          // 2. Leave Without Pay (LWP)
          if (isWorkingDay && isUnpaidLeave) {
            lwpDays++;
          }

          // 3. Half-Days
          const halfDayThresholdHours = (settings?.halfDayThreshold ?? 240) / 60;
          if (existingLog && existingLog.hours !== null && existingLog.hours < halfDayThresholdHours && existingLog.status !== 'leave' && existingLog.status !== 'holiday' && existingLog.status !== 'weekend') {
            halfDays++;
          }

          // 4. Late Days count
          if (existingLog && existingLog.status === 'late') {
            lateDays++;
          }

          // 5. Late Penalties
          if (existingLog && existingLog.status === 'late' && existingLog.checkIn && settings?.startTime) {
            try {
              const checkInTime = this.parseTimeString(existingLog.checkIn, currentDateStr);
              const officeStart = this.parseOfficeTime(settings.startTime, currentDateStr);
              const lateMinutes = Math.max(0, Math.floor((checkInTime.getTime() - officeStart.getTime()) / (1000 * 60)));

              const matchingRule = settings.lateRules?.find((r: any) => lateMinutes >= r.minMinutes && lateMinutes <= r.maxMinutes);
              if (matchingRule) {
                const penaltyHours = this.getLatePenaltyHours(matchingRule.penalty);
                totalLatePenaltyHours += penaltyHours;
              }
            } catch (err: any) {
              // Ignore parsing errors
            }
          }

          // 6. Leave Days (all approved leaves on working days)
          if (isWorkingDay && hasApprovedLeave) {
            leaveDays++;
          }
        }

        const presentDays = Math.max(0, totalWorkingDays - absentDays - lwpDays - leaveDays);

        const allowancesSum = Object.values(calc.allowances || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
        const gross = basic + allowancesSum;

        const perDayGross = gross / totalWorkingDays;
        const perDayBasic = basic / totalWorkingDays;
        const perHourBasic = perDayBasic / 8;

        const absentDeduction = Math.round(absentDays * perDayGross);
        const lwpDeduction = Math.round(lwpDays * perDayGross);
        const halfDayDeduction = Math.round(halfDays * 0.5 * perDayGross);
        const lateDeduction = Math.round(totalLatePenaltyHours * perHourBasic);
        const prorationDeduction = Math.round((prorationDaysBefore + prorationDaysAfter) * perDayGross);

        if (absentDeduction > 0) {
          calc.deductions['Absenteeism Cut'] = absentDeduction;
        }
        if (lwpDeduction > 0) {
          calc.deductions['LWP Deduction'] = lwpDeduction;
        }
        if (halfDayDeduction > 0) {
          calc.deductions['Half-Day Cut'] = halfDayDeduction;
        }
        if (lateDeduction > 0) {
          calc.deductions['Late Penalty'] = lateDeduction;
        }
        if (prorationDeduction > 0) {
          calc.deductions['Proration Cut'] = prorationDeduction;
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

        const deductionsSum = Object.values(calc.deductions || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);

        if (existingPayslip) {
          const netPay = basic + allowancesSum - deductionsSum;

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
              netPay,
              totalWorkingDays,
              presentDays,
              absentDays,
              leaveDays,
              lateDays,
            })
            .where(eq(employeePayslips.id, existingPayslip.id));
        } else {
          const netPay = basic + allowancesSum - deductionsSum;

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
            netPay,
            paymentStatus: 'Unpaid',
            totalWorkingDays,
            presentDays,
            absentDays,
            leaveDays,
            lateDays,
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
