import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, sql, between, gte, lte, count, sum, avg } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import {
  employees,
  departments,
  designations,
  attendanceLogs,
  leaveApplications,
  leaveTypes,
  employeePayslips,
  payrollCycles,
} from '../../db/schema';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
  ) {}

  // ─── Summary KPIs ────────────────────────────────────────────────────────
  async getSummaryKpis() {
    try {
      // 1. Total Active Headcount
      const [activeCountRow] = await this.db
        .select({ value: count() })
        .from(employees)
        .where(eq(employees.status, 'active'));
      const activeHeadcount = activeCountRow?.value ?? 0;

      // 2. Average Attendance Audit & Compliance Rating (for the current month)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const startOfMonth = `${year}-${month}-01`;
      const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
      const endOfMonth = `${year}-${month}-${daysInMonth}`;

      // Fetch active attendance logs for this month
      const attendanceStats = await this.db
        .select({
          totalDays: count(attendanceLogs.id),
          presentDays: sql<number>`SUM(CASE WHEN ${attendanceLogs.status} = 'present' THEN 1 ELSE 0 END)`,
          lateDays: sql<number>`SUM(CASE WHEN ${attendanceLogs.status} = 'late' THEN 1 ELSE 0 END)`,
          earlyOutDays: sql<number>`SUM(CASE WHEN ${attendanceLogs.correctionStatus} = 'none' AND ${attendanceLogs.status} = 'present' AND ${attendanceLogs.hours} < 8 THEN 1 ELSE 0 END)`,
          absentDays: sql<number>`SUM(CASE WHEN ${attendanceLogs.status} = 'absent' THEN 1 ELSE 0 END)`,
        })
        .from(attendanceLogs)
        .where(between(attendanceLogs.date, startOfMonth, endOfMonth));

      const stats = attendanceStats[0];
      const totalDays = Number(stats?.totalDays) || 0;
      const presentDays = Number(stats?.presentDays) || 0;
      const lateDays = Number(stats?.lateDays) || 0;
      const absentDays = Number(stats?.absentDays) || 0;

      // Calculate attendance audit: percentage of logs that are present or late
      const presentOrLate = presentDays + lateDays;
      const avgAttendanceAudit = totalDays > 0 ? Math.round((presentOrLate / totalDays) * 100) : 100;

      // Calculate compliance: penalize lates, absents
      let complianceRating = 100;
      if (totalDays > 0) {
        const penalties = (lateDays * 0.2) + (absentDays * 1.0);
        complianceRating = Math.max(0, Math.min(100, Math.round((1 - penalties / totalDays) * 100)));
      }

      return {
        activeHeadcount,
        avgAttendanceAudit: `${avgAttendanceAudit}%`,
        complianceRating: `${complianceRating}%`,
      };
    } catch (err: any) {
      this.logger.error(`Error calculating summary KPIs: ${err.message}`, err.stack);
      return {
        activeHeadcount: 0,
        avgAttendanceAudit: '0%',
        complianceRating: '0%',
      };
    }
  }

  // ─── Workforce Headcount Report ──────────────────────────────────────────
  async getWorkforceHeadcount() {
    // 1. Headcount by Department
    const deptStats = await this.db
      .select({
        departmentId: departments.id,
        departmentName: departments.name,
        departmentCode: departments.code,
        headcount: count(employees.id),
        avgSalary: avg(sql<number>`COALESCE(${employeePayslips.basicSalary}, 0)`),
      })
      .from(departments)
      .leftJoin(
        employees,
        and(eq(employees.departmentId, departments.id), eq(employees.status, 'active'))
      )
      .leftJoin(
        employeePayslips,
        eq(employeePayslips.employeeId, employees.id)
      )
      .groupBy(departments.id, departments.name, departments.code);

    // 2. Headcount by Designation
    const desigStats = await this.db
      .select({
        designationId: designations.id,
        designationName: designations.name,
        headcount: count(employees.id),
      })
      .from(designations)
      .leftJoin(
        employees,
        and(eq(employees.designationId, designations.id), eq(employees.status, 'active'))
      )
      .groupBy(designations.id, designations.name);

    // 3. Headcount by Gender
    const genderStats = await this.db
      .select({
        gender: employees.gender,
        headcount: count(employees.id),
      })
      .from(employees)
      .where(eq(employees.status, 'active'))
      .groupBy(employees.gender);

    // 4. Headcount by Type (full-time, part-time, etc.)
    const typeStats = await this.db
      .select({
        employeeType: employees.employeeType,
        headcount: count(employees.id),
      })
      .from(employees)
      .where(eq(employees.status, 'active'))
      .groupBy(employees.employeeType);

    return {
      departmentBreakdown: deptStats.map(d => ({
        ...d,
        avgSalary: Math.round(Number(d.avgSalary) || 0),
      })),
      designationBreakdown: desigStats,
      genderBreakdown: genderStats,
      typeBreakdown: typeStats,
    };
  }

  // ─── Attendance Summary Report ──────────────────────────────────────────
  async getAttendanceSummary(startDate: string, endDate: string, departmentId?: string) {
    const conditions: any[] = [between(attendanceLogs.date, startDate, endDate)];

    if (departmentId) {
      conditions.push(eq(employees.departmentId, departmentId));
    }

    const logs = await this.db
      .select({
        employeeId: employees.id,
        employeeDisplayId: employees.employeeId,
        fullName: employees.fullNameEnglish,
        departmentName: departments.name,
        designationName: designations.name,
        totalDays: count(attendanceLogs.id),
        presentDays: sql<number>`SUM(CASE WHEN ${attendanceLogs.status} = 'present' THEN 1 ELSE 0 END)`,
        absentDays: sql<number>`SUM(CASE WHEN ${attendanceLogs.status} = 'absent' THEN 1 ELSE 0 END)`,
        leaveDays: sql<number>`SUM(CASE WHEN ${attendanceLogs.status} = 'leave' THEN 1 ELSE 0 END)`,
        lateDays: sql<number>`SUM(CASE WHEN ${attendanceLogs.status} = 'late' THEN 1 ELSE 0 END)`,
        earlyOutDays: sql<number>`SUM(CASE WHEN ${attendanceLogs.hours} < 8 AND ${attendanceLogs.status} = 'present' THEN 1 ELSE 0 END)`,
        totalHours: sum(attendanceLogs.hours),
        avgHours: avg(attendanceLogs.hours),
      })
      .from(employees)
      .innerJoin(attendanceLogs, eq(attendanceLogs.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(and(...conditions))
      .groupBy(
        employees.id,
        employees.employeeId,
        employees.fullNameEnglish,
        departments.name,
        designations.name
      );

    return logs.map(log => ({
      ...log,
      totalHours: Math.round((Number(log.totalHours) || 0) * 10) / 10,
      avgHours: Math.round((Number(log.avgHours) || 0) * 10) / 10,
    }));
  }

  // ─── Leave Utilization Report ────────────────────────────────────────────
  async getLeaveUtilization(year: number, departmentId?: string) {
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;

    const employeesList = await this.db
      .select({
        id: employees.id,
        employeeDisplayId: employees.employeeId,
        fullName: employees.fullNameEnglish,
        departmentName: departments.name,
        designationName: designations.name,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(
        and(
          eq(employees.status, 'active'),
          departmentId ? eq(employees.departmentId, departmentId) : undefined
        )
      );

    const activeLeaveTypes = await this.db
      .select({
        id: leaveTypes.id,
        name: leaveTypes.name,
        days: leaveTypes.days,
      })
      .from(leaveTypes)
      .where(eq(leaveTypes.isActive, true));

    const approvedLeaves = await this.db
      .select({
        employeeId: leaveApplications.employeeId,
        leaveTypeId: leaveApplications.leaveTypeId,
        totalDays: sum(leaveApplications.days),
      })
      .from(leaveApplications)
      .where(
        and(
          eq(leaveApplications.status, 'Approved'),
          between(leaveApplications.startDate, startOfYear, endOfYear)
        )
      )
      .groupBy(leaveApplications.employeeId, leaveApplications.leaveTypeId);

    // Map leaves taken for ease of lookup
    const leavesMap = new Map<string, number>();
    for (const record of approvedLeaves) {
      leavesMap.set(`${record.employeeId}:${record.leaveTypeId}`, Number(record.totalDays) || 0);
    }

    return employeesList.map(emp => {
      const breakdown = activeLeaveTypes.map(lt => {
        const taken = leavesMap.get(`${emp.id}:${lt.id}`) || 0;
        const allocated = lt.days;
        const remaining = Math.max(0, allocated - taken);
        return {
          leaveTypeName: lt.name,
          allocated,
          taken,
          remaining,
        };
      });

      const totalAllocated = breakdown.reduce((sum, item) => sum + item.allocated, 0);
      const totalTaken = breakdown.reduce((sum, item) => sum + item.taken, 0);
      const totalRemaining = breakdown.reduce((sum, item) => sum + item.remaining, 0);

      return {
        ...emp,
        breakdown,
        totalAllocated,
        totalTaken,
        totalRemaining,
      };
    });
  }

  // ─── Payroll & Cost Report ───────────────────────────────────────────────
  async getPayrollCost(year: number, departmentId?: string) {
    const startOfMonthKey = `${year}-01`;
    const endOfMonthKey = `${year}-12`;

    const conditions: any[] = [
      between(payrollCycles.monthKey, startOfMonthKey, endOfMonthKey),
      eq(payrollCycles.status, 'Disbursed'),
    ];

    if (departmentId) {
      conditions.push(eq(employees.departmentId, departmentId));
    }

    const costs = await this.db
      .select({
        monthKey: payrollCycles.monthKey,
        departmentName: departments.name,
        totalBasic: sum(employeePayslips.basicSalary),
        totalAllowances: sum(sql<number>`COALESCE(${employeePayslips.allowanceHra},0) + COALESCE(${employeePayslips.allowanceTransport},0) + COALESCE(${employeePayslips.allowanceMedical},0)`),
        totalTax: sum(employeePayslips.deductionTax),
        totalPf: sum(employeePayslips.deductionPf),
        totalNetPay: sum(employeePayslips.netPay),
        totalCost: sum(sql<number>`COALESCE(${employeePayslips.basicSalary},0) + COALESCE(${employeePayslips.allowanceHra},0) + COALESCE(${employeePayslips.allowanceTransport},0) + COALESCE(${employeePayslips.allowanceMedical},0)`),
      })
      .from(payrollCycles)
      .innerJoin(employeePayslips, eq(employeePayslips.payrollCycleId, payrollCycles.id))
      .innerJoin(employees, eq(employeePayslips.employeeId, employees.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(and(...conditions))
      .groupBy(payrollCycles.monthKey, departments.name)
      .orderBy(payrollCycles.monthKey);

    return costs.map(c => ({
      ...c,
      totalBasic: Math.round(Number(c.totalBasic) || 0),
      totalAllowances: Math.round(Number(c.totalAllowances) || 0),
      totalTax: Math.round(Number(c.totalTax) || 0),
      totalPf: Math.round(Number(c.totalPf) || 0),
      totalNetPay: Math.round(Number(c.totalNetPay) || 0),
      totalCost: Math.round(Number(c.totalCost) || 0),
    }));
  }
}
