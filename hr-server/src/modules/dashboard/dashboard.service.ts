import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, count, sql, gte, lte, isNull, desc } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import {
  employees,
  departments,
  attendanceLogs,
  leaveApplications,
  leaveTypes,
  jobOpenings,
  candidates,
  tasks,
  claims,
  appraisalCycles,
  employeeAppraisals,
  employeeSalaries,
  separationRecords,
  festivalBonusCycles,
  employeeFestivalBonuses,
} from '../../db/schema';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(@Inject(DB_CONNECTION) private readonly db: Database) {}

  async getExecutiveSummary() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Run all queries in parallel for performance
    const [
      workforceStats,
      attendanceStats,
      leaveStats,
      recruitmentStats,
      payrollStats,
      performanceStats,
      taskStats,
      claimsStats,
      festivalStats,
    ] = await Promise.all([
      this.getWorkforceStats(monthStart, monthEnd),
      this.getAttendanceStats(today),
      this.getLeaveStats(monthStart, monthEnd, today),
      this.getRecruitmentStats(monthStart, monthEnd),
      this.getPayrollStats(),
      this.getPerformanceStats(),
      this.getTaskStats(),
      this.getClaimsStats(monthStart, monthEnd),
      this.getFestivalBonusStats(),
    ]);

    return {
      workforce: workforceStats,
      attendance: attendanceStats,
      leave: leaveStats,
      recruitment: recruitmentStats,
      payroll: payrollStats,
      performance: performanceStats,
      tasks: taskStats,
      claims: claimsStats,
      festivalBonus: festivalStats,
    };
  }

  private async getWorkforceStats(monthStart: string, monthEnd: string) {
    const [totalResult, activeResult, newHiresResult, separationsResult, deptBreakdown, typeBreakdown] =
      await Promise.all([
        this.db.select({ count: count() }).from(employees).where(isNull(employees.deletedAt)),
        this.db
          .select({ count: count() })
          .from(employees)
          .where(and(eq(employees.status, 'active'), isNull(employees.deletedAt))),
        this.db
          .select({ count: count() })
          .from(employees)
          .where(
            and(
              gte(employees.joinDate, monthStart),
              lte(employees.joinDate, monthEnd),
              isNull(employees.deletedAt),
            ),
          ),
        this.db
          .select({ count: count() })
          .from(separationRecords)
          .where(
            and(
              gte(separationRecords.lastWorkingDay, monthStart),
              lte(separationRecords.lastWorkingDay, monthEnd),
            ),
          ),
        this.db
          .select({
            department: departments.name,
            count: count(),
          })
          .from(employees)
          .innerJoin(departments, eq(employees.departmentId, departments.id))
          .where(and(eq(employees.status, 'active'), isNull(employees.deletedAt)))
          .groupBy(departments.name)
          .orderBy(count()),
        this.db
          .select({
            type: employees.employeeType,
            count: count(),
          })
          .from(employees)
          .where(and(eq(employees.status, 'active'), isNull(employees.deletedAt)))
          .groupBy(employees.employeeType)
          .orderBy(count()),
      ]);

    const totalEmployees = totalResult[0]?.count ?? 0;
    const activeEmployees = activeResult[0]?.count ?? 0;
    const newHiresThisMonth = newHiresResult[0]?.count ?? 0;
    const separationsThisMonth = separationsResult[0]?.count ?? 0;
    const turnoverRate = activeEmployees > 0 ? Number(((separationsThisMonth / activeEmployees) * 100).toFixed(1)) : 0;

    return {
      totalEmployees,
      activeEmployees,
      newHiresThisMonth,
      separationsThisMonth,
      turnoverRate,
      departmentBreakdown: deptBreakdown.map((d) => ({ department: d.department, count: d.count })),
      employeeTypeBreakdown: typeBreakdown.map((t) => ({ type: t.type, count: t.count })),
    };
  }

  private async getAttendanceStats(today: string) {
    const statusCounts = await this.db
      .select({
        status: attendanceLogs.status,
        count: count(),
      })
      .from(attendanceLogs)
      .where(eq(attendanceLogs.date, today))
      .groupBy(attendanceLogs.status);

    const statusMap: Record<string, number> = {};
    statusCounts.forEach((row) => {
      statusMap[row.status] = row.count;
    });

    const presentToday = statusMap['present'] ?? 0;
    const lateToday = statusMap['late'] ?? 0;
    const absentToday = statusMap['absent'] ?? 0;
    const onLeaveToday = statusMap['leave'] ?? 0;
    const totalLogged = presentToday + lateToday + absentToday + onLeaveToday;
    const attendanceRate = totalLogged > 0 ? Math.round(((presentToday + lateToday) / totalLogged) * 100) : 0;

    // Weekly trend (last 7 days)
    const weeklyTrend = await this.getWeeklyTrend(today);

    return {
      presentToday,
      lateToday,
      absentToday,
      onLeaveToday,
      attendanceRate,
      weeklyTrend,
    };
  }

  private async getWeeklyTrend(today: string) {
    const days: { day: string; present: number; absent: number; late: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const counts = await this.db
        .select({
          status: attendanceLogs.status,
          count: count(),
        })
        .from(attendanceLogs)
        .where(eq(attendanceLogs.date, dateStr))
        .groupBy(attendanceLogs.status);

      const statusMap: Record<string, number> = {};
      counts.forEach((row) => {
        statusMap[row.status] = row.count;
      });

      days.push({
        day: dayName,
        present: statusMap['present'] ?? 0,
        absent: statusMap['absent'] ?? 0,
        late: statusMap['late'] ?? 0,
      });
    }
    return days;
  }

  private async getLeaveStats(monthStart: string, monthEnd: string, today: string) {
    const [pendingResult, approvedResult, rejectedResult, onLeaveResult, typeBreakdown] =
      await Promise.all([
        this.db
          .select({ count: count() })
          .from(leaveApplications)
          .where(eq(leaveApplications.status, 'Pending')),
        this.db
          .select({ count: count() })
          .from(leaveApplications)
          .where(
            and(
              eq(leaveApplications.status, 'Approved'),
              gte(leaveApplications.approvedAt, new Date(monthStart)),
            ),
          ),
        this.db
          .select({ count: count() })
          .from(leaveApplications)
          .where(
            and(
              eq(leaveApplications.status, 'Rejected'),
              gte(leaveApplications.rejectedAt, new Date(monthStart)),
            ),
          ),
        this.db
          .select({ count: count() })
          .from(leaveApplications)
          .where(
            and(
              lte(leaveApplications.startDate, today),
              gte(leaveApplications.endDate, today),
              eq(leaveApplications.status, 'Approved'),
            ),
          ),
        this.db
          .select({
            type: leaveTypes.name,
            count: count(),
          })
          .from(leaveApplications)
          .innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
          .where(eq(leaveApplications.status, 'Approved'))
          .groupBy(leaveTypes.name)
          .orderBy(count()),
      ]);

    return {
      pendingApplications: pendingResult[0]?.count ?? 0,
      approvedThisMonth: approvedResult[0]?.count ?? 0,
      rejectedThisMonth: rejectedResult[0]?.count ?? 0,
      onLeaveToday: onLeaveResult[0]?.count ?? 0,
      leaveTypeBreakdown: typeBreakdown.map((t) => ({ type: t.type, count: t.count })),
    };
  }

  private async getRecruitmentStats(monthStart: string, monthEnd: string) {
    const [openJobsResult, applicantsResult, pipelineResult, hiredResult, pipelineByStage] =
      await Promise.all([
        this.db
          .select({ count: count() })
          .from(jobOpenings)
          .where(eq(jobOpenings.status, 'Open')),
        this.db.select({ count: count() }).from(candidates),
        this.db
          .select({ count: count() })
          .from(candidates)
          .where(sql`${candidates.stage} NOT IN ('Hired', 'Rejected')`),
        this.db
          .select({ count: count() })
          .from(candidates)
          .where(
            and(
              eq(candidates.stage, 'Hired'),
              gte(candidates.appliedDate, monthStart),
              lte(candidates.appliedDate, monthEnd),
            ),
          ),
        this.db
          .select({
            stage: candidates.stage,
            count: count(),
          })
          .from(candidates)
          .where(sql`${candidates.stage} NOT IN ('Rejected')`)
          .groupBy(candidates.stage)
          .orderBy(count()),
      ]);

    return {
      openPositions: openJobsResult[0]?.count ?? 0,
      totalApplicants: applicantsResult[0]?.count ?? 0,
      pipelineActive: pipelineResult[0]?.count ?? 0,
      hiredThisMonth: hiredResult[0]?.count ?? 0,
      pipelineByStage: pipelineByStage.map((s) => ({ stage: s.stage, count: s.count })),
    };
  }

  private async getPayrollStats() {
    const salarySummary = await this.db
      .select({
        total: sql<number>`COALESCE(SUM(${employeeSalaries.basicSalary}), 0)`,
        avg: sql<number>`COALESCE(AVG(${employeeSalaries.basicSalary}), 0)`,
        count: count(),
      })
      .from(employeeSalaries)
      .where(eq(employeeSalaries.status, 'active'));

    return {
      totalMonthlyPayroll: Number(salarySummary[0]?.total ?? 0),
      averageSalary: Number(salarySummary[0]?.avg ?? 0),
      totalProvidentFund: 0,
      payrollCycleStatus: 'N/A',
    };
  }

  private async getPerformanceStats() {
    const [activeCyclesResult, pendingSelfResult, pendingManagerResult, completedResult] =
      await Promise.all([
        this.db
          .select({ count: count() })
          .from(appraisalCycles)
          .where(eq(appraisalCycles.status, 'active')),
        this.db
          .select({ count: count() })
          .from(employeeAppraisals)
          .where(eq(employeeAppraisals.status, 'pending_self')),
        this.db
          .select({ count: count() })
          .from(employeeAppraisals)
          .where(eq(employeeAppraisals.status, 'pending_manager')),
        this.db
          .select({ count: count() })
          .from(employeeAppraisals)
          .where(eq(employeeAppraisals.status, 'completed')),
      ]);

    return {
      activeCycles: activeCyclesResult[0]?.count ?? 0,
      pendingSelfAppraisals: pendingSelfResult[0]?.count ?? 0,
      pendingManagerAppraisals: pendingManagerResult[0]?.count ?? 0,
      completedAppraisals: completedResult[0]?.count ?? 0,
    };
  }

  private async getTaskStats() {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const [activeResult, overdueResult, completedWeekResult, priorityBreakdown] =
      await Promise.all([
        this.db
          .select({ count: count() })
          .from(tasks)
          .where(and(sql`${tasks.status} NOT IN ('Done', 'Cancelled')`, isNull(tasks.deletedAt))),
        this.db
          .select({ count: count() })
          .from(tasks)
          .where(
            and(
              sql`${tasks.status} NOT IN ('Done', 'Cancelled')`,
              lte(tasks.dueDate, today),
              isNull(tasks.deletedAt),
            ),
          ),
        this.db
          .select({ count: count() })
          .from(tasks)
          .where(
            and(
              eq(tasks.status, 'Done'),
              gte(tasks.updatedAt, new Date(weekStartStr)),
              isNull(tasks.deletedAt),
            ),
          ),
        this.db
          .select({
            priority: tasks.priority,
            count: count(),
          })
          .from(tasks)
          .where(and(sql`${tasks.status} NOT IN ('Done', 'Cancelled')`, isNull(tasks.deletedAt)))
          .groupBy(tasks.priority)
          .orderBy(count()),
      ]);

    return {
      totalActive: activeResult[0]?.count ?? 0,
      overdueTasks: overdueResult[0]?.count ?? 0,
      completedThisWeek: completedWeekResult[0]?.count ?? 0,
      byPriority: priorityBreakdown.map((p) => ({ priority: p.priority, count: p.count })),
    };
  }

  private async getClaimsStats(monthStart: string, monthEnd: string) {
    const [pendingResult, approvedResult, totalAmountResult] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(claims)
        .where(sql`${claims.status} IN ('Pending', 'Pending_2nd')`),
      this.db
        .select({ count: count() })
        .from(claims)
        .where(
          and(
            eq(claims.status, 'Approved'),
            gte(claims.approvedAt, new Date(monthStart)),
          ),
        ),
      this.db
        .select({
          total: sql<number>`COALESCE(SUM(${claims.amount}), 0)`,
        })
        .from(claims)
        .where(eq(claims.status, 'Approved')),
    ]);

    return {
      pendingClaims: pendingResult[0]?.count ?? 0,
      approvedThisMonth: approvedResult[0]?.count ?? 0,
      totalClaimAmount: Number(totalAmountResult[0]?.total ?? 0),
    };
  }

  private async getFestivalBonusStats() {
    try {
      const [latestCycle] = await this.db
        .select()
        .from(festivalBonusCycles)
        .orderBy(desc(festivalBonusCycles.createdAt))
        .limit(1);

      if (!latestCycle) {
        return {
          activeCycleName: 'N/A',
          activeCycleStatus: 'N/A',
          awaitingMdApprovalCount: 0,
          totalBonusAmount: 0,
        };
      }

      const [awaitingMdCount] = await this.db
        .select({ count: count() })
        .from(employeeFestivalBonuses)
        .where(
          and(
            eq(employeeFestivalBonuses.festivalBonusCycleId, latestCycle.id),
            eq(employeeFestivalBonuses.isEligible, true),
            eq(employeeFestivalBonuses.status, 'Awaiting_MD_Approval'),
          ),
        );

      return {
        activeCycleName: latestCycle.name,
        activeCycleStatus: latestCycle.status,
        awaitingMdApprovalCount: awaitingMdCount?.count ?? 0,
        totalBonusAmount: Number(latestCycle.totalAmount || 0),
      };
    } catch (err: any) {
      this.logger.error(`Failed to get festival bonus dashboard stats: ${err.message}`);
      return {
        activeCycleName: 'Error',
        activeCycleStatus: 'Error',
        awaitingMdApprovalCount: 0,
        totalBonusAmount: 0,
      };
    }
  }
}
