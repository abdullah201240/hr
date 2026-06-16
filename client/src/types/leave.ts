export interface LeaveType {
  id: string;
  name: string;
  icon: string;
  color: string;
  days: number;
  paid: boolean;
  requiresApproval: boolean;
  requiresDocument: boolean;
  description: string;
  clause?: string | null;
  carryForward: boolean;
  maxCarryOverDays?: number | null;
  encashment: boolean;
  encashmentPercent?: number | null;
  isProRata: boolean;
  sandwichRule: boolean;
  compLeaveExpiryDays?: number | null;
  eligibility?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveTypeQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateLeaveTypePayload {
  name: string;
  icon?: string;
  color?: string;
  days: number;
  paid?: boolean;
  requiresApproval?: boolean;
  requiresDocument?: boolean;
  description?: string;
  clause?: string | null;
  carryForward?: boolean;
  maxCarryOverDays?: number | null;
  encashment?: boolean;
  encashmentPercent?: number | null;
  isProRata?: boolean;
  sandwichRule?: boolean;
  compLeaveExpiryDays?: number | null;
  eligibility?: string | null;
}

export interface UpdateLeaveTypePayload {
  name?: string;
  icon?: string;
  color?: string;
  days?: number;
  paid?: boolean;
  requiresApproval?: boolean;
  requiresDocument?: boolean;
  description?: string;
  clause?: string | null;
  carryForward?: boolean;
  maxCarryOverDays?: number | null;
  encashment?: boolean;
  encashmentPercent?: number | null;
  isProRata?: boolean;
  sandwichRule?: boolean;
  compLeaveExpiryDays?: number | null;
  eligibility?: string | null;
  isActive?: boolean;
}

export interface Attachment {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
}

export interface LeaveApplication {
  id: string;
  employeeId?: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  attachments: Attachment[];
  createdAt: string;
  employeeName: string;
  employeeEmail: string;
  employeeIdCode: string;
  leaveTypeName: string;
  leaveTypeId: string;
  rejectionReason: string | null;
  employeePhone?: string;
  employeeEmergencyPhone?: string;
  leaveTypePaid?: boolean;
  approvedByName?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export interface LeaveBalance {
  id: string;
  key: string;
  label: string;
  color: string;
  icon: string;
  total: number;
  used: number;
  requiresDocument?: boolean;
}

export interface CreateLeaveApplicationPayload {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  attachments?: Attachment[];
}

export interface UpdateLeaveApplicationStatusPayload {
  status: 'Approved' | 'Rejected';
  rejectionReason?: string;
}

export interface LeaveApplicationQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
  employeeId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

