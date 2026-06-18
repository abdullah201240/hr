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
  festivalBonusApplicable: boolean;
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
  festivalBonusApplicable?: boolean;
  notes?: string;
}

export interface UpdateEmployeeSalaryPayload {
  templateId?: string | null;
  basicSalary?: number;
  effectiveDate?: string;
  pfApplicable?: boolean;
  festivalBonusApplicable?: boolean;
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
  employeeEmail: string;
  name: string;
  role: string;
  dept: string;
  basicSalary: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  bonus: number;
  bonusDescription: string;
  netPay: number;
  paymentStatus: "Unpaid" | "Paid";
  paymentMethod?: string;
  paymentDate?: string;
  paymentReference?: string;
  // Dynamic stats
  lopDays: number;
  lopDeduction: number;
  lateDays: number;
  lateDeduction: number;
  presentDays: number;
  leaveDays: number;
  movementDays: number;
  travelDays: number;
  earlyOutDays: number;
  // Added fields
  festivalBonus?: number;
  specialBonus?: number;
  festivalBonusDescription?: string;
  specialBonusDescription?: string;
  bonusWarning?: string;
}

export interface PayrollCycle {
  monthKey: string;
  status: "Draft" | "Processed" | "Distributed";
  payslips: Payslip[];
}

export interface DisbursementRecord {
  monthKey: string;
  disbursementDate: string;
  paymentMethod: string;
  referenceId: string;
  totalDisbursed: number;
  employeeCount: number;
}

