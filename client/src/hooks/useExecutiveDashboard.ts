import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface DepartmentBreakdown {
  department: string;
  count: number;
}

export interface EmployeeTypeBreakdown {
  type: string;
  count: number;
}

export interface WorkforceStats {
  totalEmployees: number;
  activeEmployees: number;
  newHiresThisMonth: number;
  separationsThisMonth: number;
  turnoverRate: number;
  departmentBreakdown: DepartmentBreakdown[];
  employeeTypeBreakdown: EmployeeTypeBreakdown[];
}

export interface WeeklyTrendDay {
  day: string;
  present: number;
  absent: number;
  late: number;
}

export interface AttendanceStats {
  presentToday: number;
  lateToday: number;
  absentToday: number;
  onLeaveToday: number;
  attendanceRate: number;
  weeklyTrend: WeeklyTrendDay[];
}

export interface LeaveTypeBreakdown {
  type: string;
  count: number;
}

export interface LeaveStats {
  pendingApplications: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  onLeaveToday: number;
  leaveTypeBreakdown: LeaveTypeBreakdown[];
}

export interface PipelineStage {
  stage: string;
  count: number;
}

export interface RecruitmentStats {
  openPositions: number;
  totalApplicants: number;
  pipelineActive: number;
  hiredThisMonth: number;
  pipelineByStage: PipelineStage[];
}

export interface PayrollStats {
  totalMonthlyPayroll: number;
  averageSalary: number;
  totalProvidentFund: number;
  payrollCycleStatus: string;
}

export interface PerformanceStats {
  activeCycles: number;
  pendingSelfAppraisals: number;
  pendingManagerAppraisals: number;
  completedAppraisals: number;
}

export interface PriorityBreakdown {
  priority: string;
  count: number;
}

export interface TaskStats {
  totalActive: number;
  overdueTasks: number;
  completedThisWeek: number;
  byPriority: PriorityBreakdown[];
}

export interface ClaimsStats {
  pendingClaims: number;
  approvedThisMonth: number;
  totalClaimAmount: number;
}

export interface ExecutiveDashboardData {
  workforce: WorkforceStats;
  attendance: AttendanceStats;
  leave: LeaveStats;
  recruitment: RecruitmentStats;
  payroll: PayrollStats;
  performance: PerformanceStats;
  tasks: TaskStats;
  claims: ClaimsStats;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useExecutiveDashboardQuery() {
  return useQuery<ExecutiveDashboardData>({
    queryKey: ["executive-dashboard"],
    queryFn: () => apiClient.get<ExecutiveDashboardData>("dashboard/executive-summary"),
    refetchInterval: 120000, // 2 min refresh
    staleTime: 60000,
  });
}
