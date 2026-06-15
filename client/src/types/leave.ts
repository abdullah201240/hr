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
