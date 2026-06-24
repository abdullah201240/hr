// ─── Salary Template Types ──────────────────────────────────────────────────

export interface SalaryTemplateComponent {
  id: string;
  templateId: string;
  name: string;
  type: 'earning' | 'deduction';
  calculationType: 'percentage' | 'fixed';
  value: number;
  isTaxable: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryTemplate {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  components: SalaryTemplateComponent[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSalaryTemplateComponentPayload {
  name: string;
  type: 'earning' | 'deduction';
  calculationType: 'percentage' | 'fixed';
  value: number;
  isTaxable?: boolean;
  sortOrder?: number;
}

export interface CreateSalaryTemplatePayload {
  name: string;
  description?: string;
  components?: CreateSalaryTemplateComponentPayload[];
}

export interface UpdateSalaryTemplatePayload {
  name?: string;
  description?: string;
  isActive?: boolean;
  components?: CreateSalaryTemplateComponentPayload[];
}

// ─── Employee Salary Types ──────────────────────────────────────────────────

export interface EmployeeSalary {
  id: string;
  employeeId: string;
  templateId: string | null;
  basicSalary: number;
  effectiveDate: string;
  pfApplicable: boolean;
  status: 'active' | 'superseded';
  notes: string;
  createdAt?: string;
  updatedAt?: string;
  // Joined fields
  employeeEmployeeId?: string;
  employeeName?: string;
  employeeEmail?: string;
  employeePhone?: string;
  employeeStatus?: string;
  employeePhotoUrl?: string | null;
  joinDate?: string;
  departmentName?: string;
  designationName?: string;
  templateName?: string | null;
}

export interface AssignEmployeeSalaryPayload {
  employeeId: string;
  templateId?: string;
  basicSalary: number;
  effectiveDate: string;
  pfApplicable?: boolean;
  notes?: string;
}

export interface UpdateEmployeeSalaryPayload {
  templateId?: string | null;
  basicSalary?: number;
  effectiveDate?: string;
  pfApplicable?: boolean;
  status?: 'active' | 'superseded';
  notes?: string;
}

export interface SalarySummary {
  totalBudget: number;
  assignedCount: number;
  totalEmployees: number;
  avgSalary: number;
  pfContributors: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  basicSalary: number;
  allowanceHra: number;
  allowanceTransport: number;
  allowanceMedical: number;
  deductionTax: number;
  deductionPf: number;
  netPay: number;
  paymentStatus: "Unpaid" | "Paid";
  paymentMethod?: string;
  paymentDate?: string;
  paymentReference?: string;
  name: string;
  email: string;
  designationName?: string;
  department?: string;
  departmentName?: string;
  employeeDisplayId?: string;
  joinDate?: string;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  totalWorkingDays?: number;
  presentDays?: number;
  absentDays?: number;
  leaveDays?: number;
  lateDays?: number;
  monthKey?: string;
  status: "Draft" | "Awaiting_LM_Approval" | "Awaiting_MD_Approval" | "Awaiting_Disbursement" | "Disbursed" | "Rejected";
  rejectionReason?: string;
  lmApprovedById?: string;
  lmApprovedAt?: string;
  mdApprovedById?: string;
  mdApprovedAt?: string;
}

export interface PayrollCycle {
  id: string;
  monthKey: string;
  status: "Draft" | "Processed" | "Distributed" | "Awaiting_LM_Approval" | "Awaiting_MD_Approval" | "Awaiting_Disbursement" | "Disbursed";
  isProcessing?: boolean;
  payslips: Payslip[];
}

export interface DisbursementRecord {
  id: string;
  monthKey: string;
  disbursementDate: string;
  paymentMethod: string;
  referenceId: string;
  totalDisbursed: number;
  employeeCount: number;
}

export interface FestivalBonusSettings {
  id: string;
  bonusesPerYear: number;
  minServiceMonths: number;
  amountFormula: string;
  eligibleEmployeeTypes: string[];
  allowSpecialApproval: boolean;
}

export interface UpdateFestivalBonusSettingsPayload {
  bonusesPerYear?: number;
  minServiceMonths?: number;
  amountFormula?: string;
  eligibleEmployeeTypes?: string[];
  allowSpecialApproval?: boolean;
}
