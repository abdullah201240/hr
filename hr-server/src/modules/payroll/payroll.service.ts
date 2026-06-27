import { Injectable, Inject, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { eq, and, or, sql, asc, not, inArray, between, lte, gte } from 'drizzle-orm';
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
  payrollApprovals,
  permissions,
  rolePermissions,
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
        .where(
          and(
            eq(employees.status, 'active'),
            eq(employees.isSalary, true),
          ),
        );

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
              inArray(employeeSalaries.status, ['active', 'superseded']),
              lte(employeeSalaries.effectiveDate, endOfMonthStr),
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
        let earlyOutDays = 0;
        let leaveDays = 0;
        let prorationDaysBefore = 0;
        let prorationDaysAfter = 0;
        let totalOvertimeHours = 0;

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

          // 4.5 Early Out count
          if (existingLog && existingLog.checkOut && settings?.endTime) {
            try {
              const checkOutTime = this.parseTimeString(existingLog.checkOut, currentDateStr);
              const officeEnd = this.parseOfficeTime(settings.endTime, currentDateStr);
              const earlyThreshold = settings.earlyOutThreshold ?? 15;
              const earlyMinutes = Math.max(0, Math.floor((officeEnd.getTime() - checkOutTime.getTime()) / (1000 * 60)));
              if (earlyMinutes > earlyThreshold && existingLog.status !== 'leave' && existingLog.status !== 'holiday' && existingLog.status !== 'weekend') {
                earlyOutDays++;
              }
            } catch (err) {
              // Ignore parsing errors
            }
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

          // 7. Overtime (hours > 8)
          if (existingLog && existingLog.hours !== null && existingLog.hours > 8) {
            totalOvertimeHours += (existingLog.hours - 8);
          }
        }

        const presentDays = Math.max(0, totalWorkingDays - absentDays - lwpDays - leaveDays - prorationDaysBefore - prorationDaysAfter);

        const allowancesSum = Object.values(calc.allowances || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
        const gross = basic + allowancesSum;

        const perDayGross = gross / daysInMonth;
        const perDayBasic = basic / daysInMonth;
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

        if (settings?.enableLateDeduction) {
          const maxLate = settings.maxLateAllowedPerMonth ?? 3;
          const rate = settings.lateToDayDeductionRate ?? 3;
          if (lateDays > maxLate && rate > 0) {
            const excess = lateDays - maxLate;
            const deductionDays = Math.floor(excess / rate);
            const lateLimitDeduction = Math.round(deductionDays * perDayGross);
            if (lateLimitDeduction > 0) {
              calc.deductions['Late Limit Deduction'] = lateLimitDeduction;
            }
          }
        }

        if (settings?.enableEarlyOutDeduction) {
          const maxEarly = settings.maxEarlyOutAllowedPerMonth ?? 3;
          const rate = settings.earlyOutToDayDeductionRate ?? 3;
          if (earlyOutDays > maxEarly && rate > 0) {
            const excess = earlyOutDays - maxEarly;
            const deductionDays = Math.floor(excess / rate);
            const earlyOutLimitDeduction = Math.round(deductionDays * perDayGross);
            if (earlyOutLimitDeduction > 0) {
              calc.deductions['Early Out Limit Deduction'] = earlyOutLimitDeduction;
            }
          }
        }

        const deductionsSum = Object.values(calc.deductions || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);

        // Calculate overtime
        const overtimeEarnings = Math.round(totalOvertimeHours * perHourBasic * 1.5);
        if (overtimeEarnings > 0) {
          calc.allowances['Overtime'] = overtimeEarnings;
        }

        const updatedAllowancesSum = Object.values(calc.allowances || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
        const netPay = Math.max(0, basic + updatedAllowancesSum - deductionsSum);

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
          earlyOutDays,
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
        earlyOutDays: employeePayslips.earlyOutDays,
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
          key.startsWith('Extra Deduction') ||
          key.startsWith('Adjustment:')
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

    const adjustmentItems = Array.isArray(dto.adjustments)
      ? dto.adjustments
          .map((item) => ({
            title: item.title?.trim(),
            amount: Math.max(0, Number(item.amount || 0)),
            type: item.type,
          }))
          .filter((item) => item.title && item.amount > 0 && ['addition', 'deduction'].includes(item.type))
      : [];

    if (adjustmentItems.length > 0) {
      for (const item of adjustmentItems) {
        const label = `Adjustment: ${item.title}`;
        if (item.type === 'addition') {
          allowances[label] = (allowances[label] || 0) + item.amount;
        } else {
          deductions[label] = (deductions[label] || 0) + item.amount;
        }
      }
    } else {
      if (additionalAmount > 0) {
        allowances[makeLabel('Manual Addition', dto.additionalDescription)] = additionalAmount;
      }
      if (deductionReductionAmount > 0) {
        deductions[makeLabel('Deduction Reduction', dto.deductionDescription)] = -deductionReductionAmount;
      }
      if (extraDeductionAmount > 0) {
        deductions[makeLabel('Extra Deduction', dto.deductionDescription)] = extraDeductionAmount;
      }
    }

    const basic = payslip.basicSalary;
    const allowancesSum = Object.values(allowances).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const deductionsSum = Object.values(deductions).reduce((sum, val) => sum + (Number(val) || 0), 0);

    const netPay = Math.max(0, basic + allowancesSum - deductionsSum);

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

  // Unlock and revert payroll cycle to draft
  async unlockCycle(monthKey: string) {
    const [cycle] = await this.db
      .select()
      .from(payrollCycles)
      .where(eq(payrollCycles.monthKey, monthKey))
      .limit(1);

    if (!cycle) {
      throw new NotFoundException(`Payroll cycle not found`);
    }

    if (cycle.status !== 'Processed') {
      throw new BadRequestException(`Only processed cycles can be unlocked`);
    }

    await this.db
      .update(payrollCycles)
      .set({ status: 'Draft' })
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

    // Trigger Notification
    await this.triggerPayrollDistributionNotifications(cycle.id, monthKey);

    await this.invalidateCache(monthKey);
    return this.getOrCreateCycle(monthKey);
  }

  // Record Disbursement
  async recordDisbursement(dto: DisburseDto, userId?: string) {
    const [cycle] = await this.db
      .select()
      .from(payrollCycles)
      .where(eq(payrollCycles.monthKey, dto.monthKey))
      .limit(1);

    if (!cycle) {
      throw new NotFoundException(`Payroll cycle for ${dto.monthKey} not found`);
    }

    if (
      cycle.status !== 'Processed' &&
      cycle.status !== 'Distributed' &&
      cycle.status !== 'Awaiting_Disbursement'
    ) {
      throw new BadRequestException(`Payroll cycle must be processed or approved before disbursement`);
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
            status: 'Disbursed',
            paymentMethod: dto.paymentMethod,
            paymentDate: dto.disbursementDate,
            paymentReference: dto.referenceId,
          })
          .where(eq(employeePayslips.id, slip.id));

        if (userId) {
          await tx.insert(payrollApprovals).values({
            payrollCycleId: cycle.id,
            employeePayslipId: slip.id,
            stage: 'Accounts',
            status: 'Approved',
            comment: `Disbursed via ${dto.paymentMethod} (Ref: ${dto.referenceId})`,
            actionById: userId,
          });
        }
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
        .set({ status: 'Disbursed' })
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
          actionUrl: '/profile?tab=payslips',
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
          actionUrl: '/profile?tab=payslips',
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
        .where(
          and(
            eq(employees.status, 'active'),
            eq(employees.isSalary, true),
          ),
        );

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
              inArray(employeeSalaries.status, ['active', 'superseded']),
              lte(employeeSalaries.effectiveDate, endOfMonthStr),
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
        let earlyOutDays = 0;
        let leaveDays = 0;
        let prorationDaysBefore = 0;
        let prorationDaysAfter = 0;
        let totalOvertimeHours = 0;

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

          // 4.5 Early Out count
          if (existingLog && existingLog.checkOut && settings?.endTime) {
            try {
              const checkOutTime = this.parseTimeString(existingLog.checkOut, currentDateStr);
              const officeEnd = this.parseOfficeTime(settings.endTime, currentDateStr);
              const earlyThreshold = settings.earlyOutThreshold ?? 15;
              const earlyMinutes = Math.max(0, Math.floor((officeEnd.getTime() - checkOutTime.getTime()) / (1000 * 60)));
              if (earlyMinutes > earlyThreshold && existingLog.status !== 'leave' && existingLog.status !== 'holiday' && existingLog.status !== 'weekend') {
                earlyOutDays++;
              }
            } catch (err) {
              // Ignore parsing errors
            }
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

          // 7. Overtime (hours > 8)
          if (existingLog && existingLog.hours !== null && existingLog.hours > 8) {
            totalOvertimeHours += (existingLog.hours - 8);
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

        const presentDays = Math.max(0, totalWorkingDays - absentDays - lwpDays - leaveDays - prorationDaysBefore - prorationDaysAfter);

        const allowancesSum = Object.values(calc.allowances || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
        const gross = basic + allowancesSum;

        const perDayGross = gross / daysInMonth;
        const perDayBasic = basic / daysInMonth;
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

        if (settings?.enableLateDeduction) {
          const maxLate = settings.maxLateAllowedPerMonth ?? 3;
          const rate = settings.lateToDayDeductionRate ?? 3;
          if (lateDays > maxLate && rate > 0) {
            const excess = lateDays - maxLate;
            const deductionDays = Math.floor(excess / rate);
            const lateLimitDeduction = Math.round(deductionDays * perDayGross);
            if (lateLimitDeduction > 0) {
              calc.deductions['Late Limit Deduction'] = lateLimitDeduction;
            }
          }
        }

        if (settings?.enableEarlyOutDeduction) {
          const maxEarly = settings.maxEarlyOutAllowedPerMonth ?? 3;
          const rate = settings.earlyOutToDayDeductionRate ?? 3;
          if (earlyOutDays > maxEarly && rate > 0) {
            const excess = earlyOutDays - maxEarly;
            const deductionDays = Math.floor(excess / rate);
            const earlyOutLimitDeduction = Math.round(deductionDays * perDayGross);
            if (earlyOutLimitDeduction > 0) {
              calc.deductions['Early Out Limit Deduction'] = earlyOutLimitDeduction;
            }
          }
        }

        // Preserve manual adjustments if existing payslip is present
        const preservedAllowances: Record<string, number> = {};
        const preservedDeductions: Record<string, number> = {};
        if (existingPayslip) {
          const existingAllowances = (existingPayslip.allowances as Record<string, number>) || {};
          for (const [key, val] of Object.entries(existingAllowances)) {
            if (
              key.startsWith('Manual Addition') ||
              key.startsWith('Adjustment:')
            ) {
              preservedAllowances[key] = val;
            }
          }
          const existingDeductions = (existingPayslip.deductions as Record<string, number>) || {};
          for (const [key, val] of Object.entries(existingDeductions)) {
            if (
              key.startsWith('Deduction Reduction') ||
              key.startsWith('Extra Deduction') ||
              key.startsWith('Adjustment:')
            ) {
              preservedDeductions[key] = val;
            }
          }
        }

        // Add manual adjustments to new calculation
        Object.assign(calc.allowances, preservedAllowances);
        Object.assign(calc.deductions, preservedDeductions);

        const deductionsSum = Object.values(calc.deductions || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);

        // Calculate overtime
        const overtimeEarnings = Math.round(totalOvertimeHours * perHourBasic * 1.5);
        if (overtimeEarnings > 0) {
          calc.allowances['Overtime'] = overtimeEarnings;
        }

        const updatedAllowancesSum = Object.values(calc.allowances || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
        const netPay = Math.max(0, basic + updatedAllowancesSum - deductionsSum);

        if (existingPayslip) {
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
              earlyOutDays,
              status: 'Draft',
              rejectionReason: null,
              lmApprovedById: null,
              lmApprovedAt: null,
              mdApprovedById: null,
              mdApprovedAt: null,
            })
            .where(eq(employeePayslips.id, existingPayslip.id));
        } else {
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
            earlyOutDays,
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

  // Get accumulated PF balances based on Paid or Distributed payslips
  async getPfBalances() {
    return this.db
      .select({
        employeeId: employeePayslips.employeeId,
        totalPf: sql<number>`COALESCE(SUM(${employeePayslips.deductionPf}), 0)`,
        monthsContributed: sql<number>`COUNT(DISTINCT ${employeePayslips.payrollCycleId})`,
      })
      .from(employeePayslips)
      .innerJoin(payrollCycles, eq(employeePayslips.payrollCycleId, payrollCycles.id))
      .where(
        or(
          eq(employeePayslips.paymentStatus, 'Paid'),
          eq(payrollCycles.status, 'Distributed'),
        ),
      )
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

  // Get all finalized/distributed payslips for a specific employee
  async getMyPayslips(employeeId: string) {
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
        earlyOutDays: employeePayslips.earlyOutDays,
        monthKey: payrollCycles.monthKey,
        name: employees.fullNameEnglish,
        email: employees.email,
        employeeDisplayId: employees.employeeId,
        joinDate: employees.joinDate,
        designationName: designations.name,
        departmentName: departments.name,
      })
      .from(employeePayslips)
      .innerJoin(employees, eq(employeePayslips.employeeId, employees.id))
      .innerJoin(payrollCycles, eq(employeePayslips.payrollCycleId, payrollCycles.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(
        and(
          eq(employeePayslips.employeeId, employeeId),
          eq(payrollCycles.status, 'Distributed'),
        ),
      );
  }

  // Invalidate cache helpers
  private async invalidateCache(monthKey: string) {
    await this.cache.delByKey(CacheKeys.payrollDisbursements);
  }

  // ─── Workflow Approval API Methods ────────────────────────────────────────

  async submitForApproval(monthKey: string, userId: string) {
    const [cycle] = await this.db
      .select()
      .from(payrollCycles)
      .where(eq(payrollCycles.monthKey, monthKey))
      .limit(1);

    if (!cycle) {
      throw new NotFoundException(`Payroll cycle for ${monthKey} not found`);
    }

    if (cycle.status !== 'Draft' && cycle.status !== 'Rejected') {
      throw new BadRequestException(`Only draft or rejected payroll cycles can be submitted for approval`);
    }

    // Fetch all payslips in this cycle with employee details
    const payslips = await this.db
      .select({
        id: employeePayslips.id,
        employeeId: employeePayslips.employeeId,
        lineManagerId: employees.lineManagerId,
      })
      .from(employeePayslips)
      .innerJoin(employees, eq(employeePayslips.employeeId, employees.id))
      .where(eq(employeePayslips.payrollCycleId, cycle.id));

    await this.db.transaction(async (tx) => {
      for (const slip of payslips) {
        const nextStatus = slip.lineManagerId ? 'Awaiting_LM_Approval' : 'Awaiting_MD_Approval';
        await tx
          .update(employeePayslips)
          .set({
            status: nextStatus,
            rejectionReason: null,
          })
          .where(eq(employeePayslips.id, slip.id));
      }
      await tx
        .update(payrollCycles)
        .set({ status: 'Awaiting_LM_Approval' })
        .where(eq(payrollCycles.id, cycle.id));
    });

    await this.bubbleCycleStatus(cycle.id);
    await this.invalidateCache(monthKey);
    return this.getOrCreateCycle(monthKey);
  }

  async approvePayslip(payslipId: string, userId: string) {
    const [payslip] = await this.db
      .select()
      .from(employeePayslips)
      .where(eq(employeePayslips.id, payslipId))
      .limit(1);

    if (!payslip) {
      throw new NotFoundException(`Payslip not found`);
    }

    const [cycle] = await this.db
      .select()
      .from(payrollCycles)
      .where(eq(payrollCycles.id, payslip.payrollCycleId))
      .limit(1);

    if (!cycle) {
      throw new NotFoundException(`Payroll cycle not found`);
    }

    const [emp] = await this.db
      .select({
        lineManagerId: employees.lineManagerId,
      })
      .from(employees)
      .where(eq(employees.id, payslip.employeeId))
      .limit(1);

    if (payslip.status === 'Awaiting_LM_Approval') {
      if (emp?.lineManagerId && emp.lineManagerId !== userId) {
        throw new BadRequestException('You are not authorized to approve this payslip as the Line Manager');
      }

      await this.db.transaction(async (tx) => {
        await tx
          .update(employeePayslips)
          .set({
            status: 'Awaiting_MD_Approval',
            lmApprovedById: userId,
            lmApprovedAt: new Date(),
          })
          .where(eq(employeePayslips.id, payslipId));

        await tx.insert(payrollApprovals).values({
          payrollCycleId: payslip.payrollCycleId,
          employeePayslipId: payslipId,
          stage: 'LineManager',
          status: 'Approved',
          actionById: userId,
        });
      });
    } else if (payslip.status === 'Awaiting_MD_Approval') {
      await this.db.transaction(async (tx) => {
        await tx
          .update(employeePayslips)
          .set({
            status: 'Awaiting_Disbursement',
            mdApprovedById: userId,
            mdApprovedAt: new Date(),
          })
          .where(eq(employeePayslips.id, payslipId));

        await tx.insert(payrollApprovals).values({
          payrollCycleId: payslip.payrollCycleId,
          employeePayslipId: payslipId,
          stage: 'MD',
          status: 'Approved',
          actionById: userId,
        });
      });
    } else {
      throw new BadRequestException(`Payslip cannot be approved at status ${payslip.status}`);
    }

    await this.bubbleCycleStatus(payslip.payrollCycleId);
    await this.invalidateCache(cycle.monthKey);
    return this.getOrCreateCycle(cycle.monthKey);
  }

  async rejectPayslip(payslipId: string, comment: string, userId: string) {
    if (!comment || !comment.trim()) {
      throw new BadRequestException('Rejection reason comment is required');
    }

    const [payslip] = await this.db
      .select()
      .from(employeePayslips)
      .where(eq(employeePayslips.id, payslipId))
      .limit(1);

    if (!payslip) {
      throw new NotFoundException(`Payslip not found`);
    }

    const [cycle] = await this.db
      .select()
      .from(payrollCycles)
      .where(eq(payrollCycles.id, payslip.payrollCycleId))
      .limit(1);

    if (!cycle) {
      throw new NotFoundException(`Payroll cycle not found`);
    }

    const stage = payslip.status === 'Awaiting_LM_Approval' ? 'LineManager' : 'MD';

    await this.db.transaction(async (tx) => {
      await tx
        .update(employeePayslips)
        .set({
          status: 'Rejected',
          rejectionReason: comment,
          lmApprovedById: null,
          lmApprovedAt: null,
          mdApprovedById: null,
          mdApprovedAt: null,
        })
        .where(eq(employeePayslips.id, payslipId));

      await tx.insert(payrollApprovals).values({
        payrollCycleId: payslip.payrollCycleId,
        employeePayslipId: payslipId,
        stage,
        status: 'Rejected',
        comment,
        actionById: userId,
      });

      // Reset overall cycle status to Draft
      await tx
        .update(payrollCycles)
        .set({ status: 'Draft' })
        .where(eq(payrollCycles.id, payslip.payrollCycleId));
    });

    await this.invalidateCache(cycle.monthKey);
    return this.getOrCreateCycle(cycle.monthKey);
  }

  async bulkApprove(monthKey: string, userId: string) {
    const [cycle] = await this.db
      .select()
      .from(payrollCycles)
      .where(eq(payrollCycles.monthKey, monthKey))
      .limit(1);

    if (!cycle) {
      throw new NotFoundException(`Payroll cycle for ${monthKey} not found`);
    }

    // Query logged-in user permissions directly
    const userPermsList = await this.db
      .select({
        action: permissions.action,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .innerJoin(employees, eq(employees.customRoleId, rolePermissions.roleKey))
      .where(
        and(
          eq(employees.id, userId),
          eq(permissions.resource, 'payroll')
        )
      );

    const isMD = userPermsList.some(p => p.action === 'approve_md');
    const isLM = userPermsList.some(p => p.action === 'approve_lm');

    const payslips = await this.db
      .select({
        id: employeePayslips.id,
        status: employeePayslips.status,
        employeeId: employeePayslips.employeeId,
      })
      .from(employeePayslips)
      .where(eq(employeePayslips.payrollCycleId, cycle.id));

    let approvedCount = 0;

    for (const payslip of payslips) {
      const [emp] = await this.db
        .select({ lineManagerId: employees.lineManagerId })
        .from(employees)
        .where(eq(employees.id, payslip.employeeId))
        .limit(1);

      const isSubordinate = emp?.lineManagerId === userId;

      if (payslip.status === 'Awaiting_LM_Approval' && (isSubordinate || isLM)) {
        await this.approvePayslip(payslip.id, userId);
        approvedCount++;
      } else if (payslip.status === 'Awaiting_MD_Approval' && isMD) {
        await this.approvePayslip(payslip.id, userId);
        approvedCount++;
      }
    }

    return {
      success: true,
      message: `Bulk approved ${approvedCount} payslips`,
    };
  }

  async isLineManagerForPayslip(userId: string, payslipId: string): Promise<boolean> {
    const [result] = await this.db
      .select({
        lineManagerId: employees.lineManagerId,
      })
      .from(employeePayslips)
      .innerJoin(employees, eq(employeePayslips.employeeId, employees.id))
      .where(eq(employeePayslips.id, payslipId))
      .limit(1);

    return result ? result.lineManagerId === userId : false;
  }

  private async bubbleCycleStatus(cycleId: string) {
    const payslips = await this.db
      .select({
        id: employeePayslips.id,
        status: employeePayslips.status,
      })
      .from(employeePayslips)
      .where(eq(employeePayslips.payrollCycleId, cycleId));

    if (payslips.length === 0) return;

    const hasRejected = payslips.some(p => p.status === 'Rejected');
    if (hasRejected) {
      await this.db
        .update(payrollCycles)
        .set({ status: 'Draft' })
        .where(eq(payrollCycles.id, cycleId));
      return;
    }

    const allDisbursed = payslips.every(p => p.status === 'Disbursed');
    if (allDisbursed) {
      await this.db
        .update(payrollCycles)
        .set({ status: 'Disbursed' })
        .where(eq(payrollCycles.id, cycleId));
      return;
    }

    const allAwaitingDisbursement = payslips.every(
      p => p.status === 'Awaiting_Disbursement' || p.status === 'Disbursed'
    );
    if (allAwaitingDisbursement) {
      await this.db
        .update(payrollCycles)
        .set({ status: 'Awaiting_Disbursement' })
        .where(eq(payrollCycles.id, cycleId));
      return;
    }

    const allAwaitingMD = payslips.every(
      p => p.status === 'Awaiting_MD_Approval' || p.status === 'Awaiting_Disbursement' || p.status === 'Disbursed'
    );
    if (allAwaitingMD) {
      await this.db
        .update(payrollCycles)
        .set({ status: 'Awaiting_MD_Approval' })
        .where(eq(payrollCycles.id, cycleId));
      return;
    }

    await this.db
      .update(payrollCycles)
      .set({ status: 'Awaiting_LM_Approval' })
      .where(eq(payrollCycles.id, cycleId));
  }
}

