import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, or, like, desc, between, sql } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import {
  separationRecords,
  finalSettlements,
  employees,
  employeeSalaries,
  salaryTemplateComponents,
  leaveTypes,
  leaveApplications,
  employeePayslips,
  payrollCycles,
} from '../../db/schema';
import { CreateSeparationDto, UpdateSeparationDto, SeparationQueryDto } from './dto/separation.dto';
import { CalculateSettlementDto } from './dto/settlement.dto';
import { NotificationService } from '../notifications/notifications.service';
import { NotificationModule, NotificationCategory } from '../notifications/types/notification.types';

@Injectable()
export class SeparationService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly notificationService: NotificationService,
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

    await this.triggerSeparationRequestNotification(created);

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

    await this.triggerSeparationUpdateNotification(updated);

    return updated;
  }

  private async triggerSeparationRequestNotification(sepRecord: any) {
    try {
      const [employee] = await this.db
        .select()
        .from(employees)
        .where(eq(employees.email, sepRecord.employeeEmail))
        .limit(1);

      if (!employee) return;

      const recipientIds = employee.lineManagerId
        ? [employee.lineManagerId]
        : (
            await this.db
              .select({ id: employees.id })
              .from(employees)
              .where(or(eq(employees.role, 'admin'), eq(employees.role, 'hr')))
          ).map((r) => r.id);

      if (recipientIds.length > 0) {
        await this.notificationService.emitBulk(
          recipientIds.map((recipientId) => ({
            recipientId,
            actorId: employee.id,
            module: NotificationModule.SEPARATION,
            category: NotificationCategory.ASSIGNMENT,
            title: 'Resignation Request Submitted',
            message: `${sepRecord.employeeName} has submitted a resignation request. Last working day: ${sepRecord.lastWorkingDay}.`,
            actionUrl: `/separation`,
            entityType: 'separation',
            entityId: sepRecord.id,
          })),
        );
      }
    } catch (err: any) {
      // Ignore
    }
  }

  private async triggerSeparationUpdateNotification(sepRecord: any) {
    try {
      const [employee] = await this.db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.email, sepRecord.employeeEmail))
        .limit(1);

      if (employee) {
        await this.notificationService.emit({
          recipientId: employee.id,
          module: NotificationModule.SEPARATION,
          category: NotificationCategory.STATUS_CHANGE,
          title: 'Separation Status Updated',
          message: `Your resignation/separation case status has been updated to "${sepRecord.status}".`,
          actionUrl: '/separation',
          entityType: 'separation',
          entityId: sepRecord.id,
        });
      }
    } catch (err: any) {
      // Ignore
    }
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

  // ─── F&F SETTLEMENT SERVICES ──────────────────────────────────────────────

  async calculateSettlementDraft(separationId: string, dto: CalculateSettlementDto) {
    const [sepRecord] = await this.db
      .select()
      .from(separationRecords)
      .where(eq(separationRecords.id, separationId))
      .limit(1);

    if (!sepRecord) {
      throw new NotFoundException(`Separation record with ID "${separationId}" not found`);
    }

    const [employee] = await this.db
      .select()
      .from(employees)
      .where(eq(employees.email, sepRecord.employeeEmail))
      .limit(1);

    if (!employee) {
      throw new NotFoundException(`Employee with email "${sepRecord.employeeEmail}" not found`);
    }

    // 1. Service Years
    const joinDate = new Date(employee.joinDate);
    const lastWorkingDate = new Date(sepRecord.lastWorkingDay);
    const diffTime = Math.abs(lastWorkingDate.getTime() - joinDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const serviceYears = Number((diffDays / 365.25).toFixed(2));

    // 2. Basic Salary & Gross Salary
    let basicSalary = 50000;
    const [salaryRecord] = await this.db
      .select()
      .from(employeeSalaries)
      .where(
        and(
          eq(employeeSalaries.employeeId, employee.id),
          eq(employeeSalaries.status, 'active')
        )
      )
      .limit(1);

    if (salaryRecord) {
      basicSalary = salaryRecord.basicSalary;
    }

    // Fetch HRA, transport, medical from template or fallback
    let hra = Math.round(basicSalary * 0.20);
    let transport = Math.round(basicSalary * 0.10);
    let medical = Math.round(basicSalary * 0.05);

    if (salaryRecord?.templateId) {
      const components = await this.db
        .select()
        .from(salaryTemplateComponents)
        .where(eq(salaryTemplateComponents.templateId, salaryRecord.templateId));
      
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

    // 3. Salary Payable
    const year = lastWorkingDate.getFullYear();
    const month = lastWorkingDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const payableDays = dto.payableDays;
    const salaryPayable = Number(((grossSalary / daysInMonth) * payableDays).toFixed(2));

    // 4. Separation Benefit
    let separationBenefit = 0;
    const separationType = dto.separationType;

    if (separationType === 'Retirement') {
      if (serviceYears <= 10) {
        separationBenefit = 1 * basicSalary * serviceYears;
      } else {
        separationBenefit = 1.5 * basicSalary * serviceYears;
      }
    } else if (separationType === 'Resignation') {
      if (serviceYears >= 5 && serviceYears <= 10) {
        separationBenefit = (14 / 30) * basicSalary * serviceYears;
      } else if (serviceYears > 10) {
        separationBenefit = 1 * basicSalary * serviceYears;
      }
    } else if (separationType === 'Termination') {
      if (serviceYears <= 10) {
        separationBenefit = 1 * basicSalary * serviceYears;
      } else {
        separationBenefit = 1.5 * basicSalary * serviceYears;
      }
    }
    separationBenefit = Number(separationBenefit.toFixed(2));

    // 5. Leave Encashment
    const encashableAlDays = dto.encashableAlDays;
    const leaveEncashment = Number(((basicSalary / 30) * encashableAlDays).toFixed(2));

    // 6. Festival Bonus Adjustment
    const startOfYearDate = new Date(year, 0, 1);
    const startDateForBonus = joinDate > startOfYearDate ? joinDate : startOfYearDate;
    const diffTimeYear = Math.max(0, lastWorkingDate.getTime() - startDateForBonus.getTime());
    const serviceDaysCurrentYear = Math.ceil(diffTimeYear / (1000 * 60 * 60 * 24)) + 1;
    const earnedBonus = (basicSalary * 2) * (serviceDaysCurrentYear / 365);

    const paidPayslips = await this.db
      .select({
        festivalBonusAmount: employeePayslips.festivalBonusAmount,
      })
      .from(employeePayslips)
      .innerJoin(payrollCycles, eq(employeePayslips.payrollCycleId, payrollCycles.id))
      .where(
        and(
          eq(employeePayslips.employeeId, employee.id),
          like(payrollCycles.monthKey, `${year}-%`)
        )
      );

    const disbursedBonus = paidPayslips.reduce((sum, item) => sum + (item.festivalBonusAmount || 0), 0);
    const festivalBonusAdjustment = Number((earnedBonus - disbursedBonus).toFixed(2));

    // 7. PF Balance
    const pfHistory = await this.db
      .select({
        pf: employeePayslips.deductionPf,
      })
      .from(employeePayslips)
      .where(eq(employeePayslips.employeeId, employee.id));

    const employeePfBalance = pfHistory.reduce((sum, item) => sum + (item.pf || 0), 0);
    const employerPfBalance = employeePfBalance;

    // 8. Wellness Allowance (pro-rata of 12000 per year)
    const defaultWellness = (12000 * (serviceDaysCurrentYear / 365));
    const wellnessAllowance = dto.wellnessAllowance !== undefined ? dto.wellnessAllowance : Number(defaultWellness.toFixed(2));

    // Overrides or defaults
    const pfInterest = dto.pfInterest || 0;
    const medicalReimbursement = dto.medicalReimbursement || 0;
    const otherReimbursements = dto.otherReimbursements || 0;

    const salaryAdvanceRecovery = dto.salaryAdvanceRecovery || 0;
    const loanRecovery = dto.loanRecovery || 0;
    const noticePayRecovery = dto.noticePayRecovery || 0;
    const assetRecovery = dto.assetRecovery || 0;
    const taxAdjustment = dto.taxAdjustment || 0;
    const otherCompanyDues = dto.otherCompanyDues || 0;

    // Net Amount Calculation
    const totalEarnings = 
      salaryPayable + 
      separationBenefit + 
      leaveEncashment + 
      festivalBonusAdjustment + 
      employeePfBalance + 
      employerPfBalance + 
      pfInterest + 
      medicalReimbursement + 
      wellnessAllowance + 
      otherReimbursements;

    const totalRecoveries = 
      salaryAdvanceRecovery + 
      loanRecovery + 
      noticePayRecovery + 
      assetRecovery + 
      taxAdjustment + 
      otherCompanyDues;

    const netSettlementAmount = Number((totalEarnings - totalRecoveries).toFixed(2));

    return {
      separationRecordId: separationId,
      employeeEmail: sepRecord.employeeEmail,
      separationType,
      serviceYears,
      payableDays,
      encashableAlDays,
      salaryPayable,
      separationBenefit,
      leaveEncashment,
      festivalBonusAdjustment,
      employeePfBalance,
      employerPfBalance,
      pfInterest,
      medicalReimbursement,
      wellnessAllowance,
      otherReimbursements,
      salaryAdvanceRecovery,
      loanRecovery,
      noticePayRecovery,
      assetRecovery,
      taxAdjustment,
      otherCompanyDues,
      netSettlementAmount,
      status: 'Draft',
      paymentDetails: '',
      basicSalary,
      grossSalary,
    };
  }

  async getSettlement(separationId: string) {
    const [existing] = await this.db
      .select()
      .from(finalSettlements)
      .where(eq(finalSettlements.separationRecordId, separationId))
      .limit(1);

    if (existing) {
      let basicSalary = 50000;
      let grossSalary = 67500;
      const [employee] = await this.db
        .select()
        .from(employees)
        .where(eq(employees.email, existing.employeeEmail))
        .limit(1);

      if (employee) {
        const [salaryRecord] = await this.db
          .select()
          .from(employeeSalaries)
          .where(
            and(
              eq(employeeSalaries.employeeId, employee.id),
              eq(employeeSalaries.status, 'active')
            )
          )
          .limit(1);

        if (salaryRecord) {
          basicSalary = salaryRecord.basicSalary;
          let hra = Math.round(basicSalary * 0.20);
          let transport = Math.round(basicSalary * 0.10);
          let medical = Math.round(basicSalary * 0.05);

          if (salaryRecord.templateId) {
            const components = await this.db
              .select()
              .from(salaryTemplateComponents)
              .where(eq(salaryTemplateComponents.templateId, salaryRecord.templateId));
            
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
          grossSalary = basicSalary + hra + transport + medical;
        }
      }

      return {
        ...existing,
        serviceYears: Number(existing.serviceYears),
        payableDays: Number(existing.payableDays),
        encashableAlDays: Number(existing.encashableAlDays),
        salaryPayable: Number(existing.salaryPayable),
        separationBenefit: Number(existing.separationBenefit),
        leaveEncashment: Number(existing.leaveEncashment),
        festivalBonusAdjustment: Number(existing.festivalBonusAdjustment),
        employeePfBalance: Number(existing.employeePfBalance),
        employerPfBalance: Number(existing.employerPfBalance),
        pfInterest: Number(existing.pfInterest),
        medicalReimbursement: Number(existing.medicalReimbursement),
        wellnessAllowance: Number(existing.wellnessAllowance),
        otherReimbursements: Number(existing.otherReimbursements),
        salaryAdvanceRecovery: Number(existing.salaryAdvanceRecovery),
        loanRecovery: Number(existing.loanRecovery),
        noticePayRecovery: Number(existing.noticePayRecovery),
        assetRecovery: Number(existing.assetRecovery),
        taxAdjustment: Number(existing.taxAdjustment),
        otherCompanyDues: Number(existing.otherCompanyDues),
        netSettlementAmount: Number(existing.netSettlementAmount),
        basicSalary,
        grossSalary,
      };
    }

    const [sepRecord] = await this.db
      .select()
      .from(separationRecords)
      .where(eq(separationRecords.id, separationId))
      .limit(1);

    if (!sepRecord) {
      throw new NotFoundException(`Separation record with ID "${separationId}" not found`);
    }

    const [employee] = await this.db
      .select()
      .from(employees)
      .where(eq(employees.email, sepRecord.employeeEmail))
      .limit(1);

    let separationType = 'Resignation';
    if (sepRecord.reason) {
      const reasonLower = sepRecord.reason.toLowerCase();
      if (reasonLower.includes('retire')) separationType = 'Retirement';
      else if (reasonLower.includes('terminat')) separationType = 'Termination';
      else if (reasonLower.includes('dismiss')) separationType = 'Dismissal';
    }

    const lastWorkingDate = new Date(sepRecord.lastWorkingDay);
    const payableDays = lastWorkingDate.getDate();

    let encashableAlDays = 0;
    if (employee) {
      const [annualLeaveType] = await this.db
        .select()
        .from(leaveTypes)
        .where(like(leaveTypes.name, '%Annual%'))
        .limit(1);

      if (annualLeaveType) {
        const currentYear = lastWorkingDate.getFullYear();
        const startOfYear = `${currentYear}-01-01`;
        const endOfYear = `${currentYear}-12-31`;

        const approvedLeaves = await this.db
          .select({
            days: leaveApplications.days,
          })
          .from(leaveApplications)
          .where(
            and(
              eq(leaveApplications.employeeId, employee.id),
              eq(leaveApplications.leaveTypeId, annualLeaveType.id),
              eq(leaveApplications.status, 'Approved'),
              between(leaveApplications.startDate, startOfYear, endOfYear),
            ),
          );

        const usedAlDays = approvedLeaves.reduce((sum, item) => sum + item.days, 0);
        encashableAlDays = Math.max(0, annualLeaveType.days - usedAlDays);
      }
    }

    return this.calculateSettlementDraft(separationId, {
      separationType,
      payableDays,
      encashableAlDays,
    });
  }

  async saveOrUpdateSettlement(separationId: string, dto: CalculateSettlementDto) {
    const draft = await this.calculateSettlementDraft(separationId, dto);

    const [existing] = await this.db
      .select()
      .from(finalSettlements)
      .where(eq(finalSettlements.separationRecordId, separationId))
      .limit(1);

    if (existing) {
      const [updated] = await this.db
        .update(finalSettlements)
        .set({
          separationType: draft.separationType,
          serviceYears: String(draft.serviceYears),
          payableDays: String(draft.payableDays),
          encashableAlDays: String(draft.encashableAlDays),
          salaryPayable: String(draft.salaryPayable),
          separationBenefit: String(draft.separationBenefit),
          leaveEncashment: String(draft.leaveEncashment),
          festivalBonusAdjustment: String(draft.festivalBonusAdjustment),
          employeePfBalance: String(draft.employeePfBalance),
          employerPfBalance: String(draft.employerPfBalance),
          pfInterest: String(draft.pfInterest),
          medicalReimbursement: String(draft.medicalReimbursement),
          wellnessAllowance: String(draft.wellnessAllowance),
          otherReimbursements: String(draft.otherReimbursements),
          salaryAdvanceRecovery: String(draft.salaryAdvanceRecovery),
          loanRecovery: String(draft.loanRecovery),
          noticePayRecovery: String(draft.noticePayRecovery),
          assetRecovery: String(draft.assetRecovery),
          taxAdjustment: String(draft.taxAdjustment),
          otherCompanyDues: String(draft.otherCompanyDues),
          netSettlementAmount: String(draft.netSettlementAmount),
        })
        .where(eq(finalSettlements.separationRecordId, separationId))
        .returning();
      return {
        ...updated,
        serviceYears: Number(updated.serviceYears),
        payableDays: Number(updated.payableDays),
        encashableAlDays: Number(updated.encashableAlDays),
        salaryPayable: Number(updated.salaryPayable),
        separationBenefit: Number(updated.separationBenefit),
        leaveEncashment: Number(updated.leaveEncashment),
        festivalBonusAdjustment: Number(updated.festivalBonusAdjustment),
        employeePfBalance: Number(updated.employeePfBalance),
        employerPfBalance: Number(updated.employerPfBalance),
        pfInterest: Number(updated.pfInterest),
        medicalReimbursement: Number(updated.medicalReimbursement),
        wellnessAllowance: Number(updated.wellnessAllowance),
        otherReimbursements: Number(updated.otherReimbursements),
        salaryAdvanceRecovery: Number(updated.salaryAdvanceRecovery),
        loanRecovery: Number(updated.loanRecovery),
        noticePayRecovery: Number(updated.noticePayRecovery),
        assetRecovery: Number(updated.assetRecovery),
        taxAdjustment: Number(updated.taxAdjustment),
        otherCompanyDues: Number(updated.otherCompanyDues),
        netSettlementAmount: Number(updated.netSettlementAmount),
      };
    } else {
      const randomNum = Math.floor(100 + Math.random() * 900);
      const setId = `SET-${randomNum}`;

      const [created] = await this.db
        .insert(finalSettlements)
        .values({
          id: setId,
          separationRecordId: separationId,
          employeeEmail: draft.employeeEmail,
          separationType: draft.separationType,
          serviceYears: String(draft.serviceYears),
          payableDays: String(draft.payableDays),
          encashableAlDays: String(draft.encashableAlDays),
          salaryPayable: String(draft.salaryPayable),
          separationBenefit: String(draft.separationBenefit),
          leaveEncashment: String(draft.leaveEncashment),
          festivalBonusAdjustment: String(draft.festivalBonusAdjustment),
          employeePfBalance: String(draft.employeePfBalance),
          employerPfBalance: String(draft.employerPfBalance),
          pfInterest: String(draft.pfInterest),
          medicalReimbursement: String(draft.medicalReimbursement),
          wellnessAllowance: String(draft.wellnessAllowance),
          otherReimbursements: String(draft.otherReimbursements),
          salaryAdvanceRecovery: String(draft.salaryAdvanceRecovery),
          loanRecovery: String(draft.loanRecovery),
          noticePayRecovery: String(draft.noticePayRecovery),
          assetRecovery: String(draft.assetRecovery),
          taxAdjustment: String(draft.taxAdjustment),
          otherCompanyDues: String(draft.otherCompanyDues),
          netSettlementAmount: String(draft.netSettlementAmount),
          status: 'Draft',
          paymentDetails: '',
        })
        .returning();
      return {
        ...created,
        serviceYears: Number(created.serviceYears),
        payableDays: Number(created.payableDays),
        encashableAlDays: Number(created.encashableAlDays),
        salaryPayable: Number(created.salaryPayable),
        separationBenefit: Number(created.separationBenefit),
        leaveEncashment: Number(created.leaveEncashment),
        festivalBonusAdjustment: Number(created.festivalBonusAdjustment),
        employeePfBalance: Number(created.employeePfBalance),
        employerPfBalance: Number(created.employerPfBalance),
        pfInterest: Number(created.pfInterest),
        medicalReimbursement: Number(created.medicalReimbursement),
        wellnessAllowance: Number(created.wellnessAllowance),
        otherReimbursements: Number(created.otherReimbursements),
        salaryAdvanceRecovery: Number(created.salaryAdvanceRecovery),
        loanRecovery: Number(created.loanRecovery),
        noticePayRecovery: Number(created.noticePayRecovery),
        assetRecovery: Number(created.assetRecovery),
        taxAdjustment: Number(created.taxAdjustment),
        otherCompanyDues: Number(created.otherCompanyDues),
        netSettlementAmount: Number(created.netSettlementAmount),
      };
    }
  }

  async updateSettlementStatus(separationId: string, status: string, paymentDetails?: string) {
    const [updated] = await this.db
      .update(finalSettlements)
      .set({
        status,
        paymentDetails: paymentDetails || '',
      })
      .where(eq(finalSettlements.separationRecordId, separationId))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Settlement for separation ID "${separationId}" not found`);
    }

    return {
      ...updated,
      serviceYears: Number(updated.serviceYears),
      payableDays: Number(updated.payableDays),
      encashableAlDays: Number(updated.encashableAlDays),
      salaryPayable: Number(updated.salaryPayable),
      separationBenefit: Number(updated.separationBenefit),
      leaveEncashment: Number(updated.leaveEncashment),
      festivalBonusAdjustment: Number(updated.festivalBonusAdjustment),
      employeePfBalance: Number(updated.employeePfBalance),
      employerPfBalance: Number(updated.employerPfBalance),
      pfInterest: Number(updated.pfInterest),
      medicalReimbursement: Number(updated.medicalReimbursement),
      wellnessAllowance: Number(updated.wellnessAllowance),
      otherReimbursements: Number(updated.otherReimbursements),
      salaryAdvanceRecovery: Number(updated.salaryAdvanceRecovery),
      loanRecovery: Number(updated.loanRecovery),
      noticePayRecovery: Number(updated.noticePayRecovery),
      assetRecovery: Number(updated.assetRecovery),
      taxAdjustment: Number(updated.taxAdjustment),
      otherCompanyDues: Number(updated.otherCompanyDues),
      netSettlementAmount: Number(updated.netSettlementAmount),
    };
  }
}

