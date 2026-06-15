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
  isActive?: boolean;
}
