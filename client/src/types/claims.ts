// ─── Claim Types ─────────────────────────────────────────────────────────────

export type ClaimType = 'medical_reimbursement' | 'tada' | 'travel_advance';
export type ClaimStatus = 'Pending' | 'Pending_2nd' | 'Approved' | 'Rejected' | 'Settled';

export interface ClaimAttachment {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
}

export interface Claim {
  id: string;
  employeeId: string;
  claimType: ClaimType;
  amount: string; // numeric from DB comes as string
  status: ClaimStatus;
  description: string;
  approvedAmount: string | null;
  details: Record<string, any> | null;
  firstApprovedById: string | null;
  firstApprovedAt: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  settledAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  employeeName: string;
  employeeEmail: string;
  employeeIdCode: string;
  employeeLineManagerId: string | null;
  approvedByName: string | null;
  firstApprovedByName: string | null;
  attachments: ClaimAttachment[];
}

export interface ClaimQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ClaimStatus;
  claimType?: ClaimType;
  employeeId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateClaimPayload {
  claimType: ClaimType;
  amount: number;
  description?: string;
  details?: Record<string, any>;
  attachments?: Omit<ClaimAttachment, 'id'>[];
}

export interface UpdateClaimStatusPayload {
  status: 'Approved' | 'Rejected' | 'Settled';
  rejectionReason?: string;
  approvedAmount?: number;
}
