import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface SummaryKpis {
  activeHeadcount: number;
  avgAttendanceAudit: string;
  complianceRating: string;
}

export interface DepartmentHeadcount {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  headcount: number;
  avgSalary: number;
}

export interface DesignationHeadcount {
  designationId: string;
  designationName: string;
  headcount: number;
}

export interface GenderHeadcount {
  gender: string;
  headcount: number;
}

export interface TypeHeadcount {
  employeeType: string;
  headcount: number;
}

export interface WorkforceHeadcountResponse {
  departmentBreakdown: DepartmentHeadcount[];
  designationBreakdown: DesignationHeadcount[];
  genderBreakdown: GenderHeadcount[];
  typeBreakdown: TypeHeadcount[];
}

export interface AttendanceSummaryRow {
  employeeId: string;
  employeeDisplayId: string;
  fullName: string;
  departmentName: string;
  designationName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  lateDays: number;
  earlyOutDays: number;
  totalHours: number;
  avgHours: number;
}

export interface LeaveUtilizationBreakdown {
  leaveTypeName: string;
  allocated: number;
  taken: number;
  remaining: number;
}

export interface LeaveUtilizationRow {
  id: string;
  employeeDisplayId: string;
  fullName: string;
  departmentName: string;
  designationName: string;
  breakdown: LeaveUtilizationBreakdown[];
  totalAllocated: number;
  totalTaken: number;
  totalRemaining: number;
}

export interface PayrollCostRow {
  monthKey: string;
  departmentName: string;
  totalBasic: number;
  totalAllowances: number;
  totalTax: number;
  totalPf: number;
  totalNetPay: number;
  totalCost: number;
}

export function useReportsSummaryKpisQuery() {
  return useQuery<SummaryKpis>({
    queryKey: ["reportsSummaryKpis"],
    queryFn: () => apiClient.get<SummaryKpis>("reports/summary-kpis"),
  });
}

export function useWorkforceHeadcountQuery() {
  return useQuery<WorkforceHeadcountResponse>({
    queryKey: ["reportsWorkforceHeadcount"],
    queryFn: () => apiClient.get<WorkforceHeadcountResponse>("reports/workforce-headcount"),
  });
}

export function useAttendanceSummaryQuery(filters: { startDate: string; endDate: string; departmentId?: string }) {
  const { startDate, endDate, departmentId } = filters;
  return useQuery<AttendanceSummaryRow[]>({
    queryKey: ["reportsAttendanceSummary", startDate, endDate, departmentId],
    queryFn: () => {
      const params = new URLSearchParams({ startDate, endDate });
      if (departmentId && departmentId !== "all") {
        params.append("departmentId", departmentId);
      }
      return apiClient.get<AttendanceSummaryRow[]>(`reports/attendance-summary?${params.toString()}`);
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useLeaveUtilizationQuery(filters: { year: number; departmentId?: string }) {
  const { year, departmentId } = filters;
  return useQuery<LeaveUtilizationRow[]>({
    queryKey: ["reportsLeaveUtilization", year, departmentId],
    queryFn: () => {
      const params = new URLSearchParams({ year: String(year) });
      if (departmentId && departmentId !== "all") {
        params.append("departmentId", departmentId);
      }
      return apiClient.get<LeaveUtilizationRow[]>(`reports/leave-utilization?${params.toString()}`);
    },
    enabled: !!year,
  });
}

export function usePayrollCostQuery(filters: { year: number; departmentId?: string }) {
  const { year, departmentId } = filters;
  return useQuery<PayrollCostRow[]>({
    queryKey: ["reportsPayrollCost", year, departmentId],
    queryFn: () => {
      const params = new URLSearchParams({ year: String(year) });
      if (departmentId && departmentId !== "all") {
        params.append("departmentId", departmentId);
      }
      return apiClient.get<PayrollCostRow[]>(`reports/payroll-cost?${params.toString()}`);
    },
    enabled: !!year,
  });
}
