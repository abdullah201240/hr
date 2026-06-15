export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  headEmployeeId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  employeeCount?: number;
}

export interface Designation {
  id: string;
  name: string;
  code: string;
  description: string;
  grade: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  employeeCount?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DepartmentQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface DesignationQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateDepartmentPayload {
  name: string;
  code: string;
  description?: string;
  headEmployeeId?: string | null;
}

export interface UpdateDepartmentPayload {
  name?: string;
  code?: string;
  description?: string;
  headEmployeeId?: string | null;
  isActive?: boolean;
}

export interface CreateDesignationPayload {
  name: string;
  code: string;
  description?: string;
  grade?: string;
}

export interface UpdateDesignationPayload {
  name?: string;
  code?: string;
  description?: string;
  grade?: string;
  isActive?: boolean;
}

export interface Spouse {
  id: string;
  employeeId: string;
  name: string;
  nid: string;
  phone: string;
  occupation: string;
  marriageDate: string | null;
}

export interface Child {
  id: string;
  employeeId: string;
  name: string;
  dateOfBirth: string | null;
  gender: string;
}

export interface Nominee {
  id: string;
  employeeId: string;
  name: string;
  relation: string;
  nidNumber: string;
  nidPdfUrl: string | null;
  photoUrl: string | null;
}

export interface BankDetails {
  id: string;
  employeeId: string;
  bankName: string;
  branch: string;
  accountNumber: string;
  accountType: string;
  routingNumber: string;
  swiftCode: string;
  ibanNumber: string;
  bankStatementPdfUrl: string | null;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  fileUrl: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  email: string;
  personalEmail: string;
  fullNameEnglish: string;
  fullNameBangla: string;
  phone: string;
  personalMobileNumber: string;
  religion: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup: string;
  maritalStatus: string;
  employeePhotoUrl: string | null;
  nidNumber: string;
  nidPdfUrl: string | null;
  tinNumber: string;
  fatherNameEnglish: string;
  fatherNameBangla: string;
  motherNameEnglish: string;
  motherNameBangla: string;
  currentAddress: string;
  permanentAddress: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactNumber: string;
  designationId: string;
  designationName?: string;
  departmentId: string;
  departmentName?: string;
  employeeType: string;
  joinDate: string;
  lineManagerId: string | null;
  status: string;
  role: string;
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  spouses?: Spouse[];
  children?: Child[];
  nominees?: Nominee[];
  bankDetails?: BankDetails | null;
  documents?: EmployeeDocument[];
}

export interface EmployeeQuery {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  designationId?: string;
  status?: string;
  employeeType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateEmployeePayload {
  employeeId: string;
  email: string;
  personalEmail?: string;
  password?: string;
  fullNameEnglish: string;
  fullNameBangla?: string;
  phone: string;
  personalMobileNumber?: string;
  religion: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup?: string;
  maritalStatus?: string;
  employeePhotoUrl?: string;
  nidNumber: string;
  nidPdfUrl?: string;
  tinNumber?: string;
  fatherNameEnglish?: string;
  fatherNameBangla?: string;
  motherNameEnglish?: string;
  motherNameBangla?: string;
  currentAddress?: string;
  permanentAddress?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactNumber?: string;
  designationId: string;
  departmentId: string;
  employeeType: string;
  joinDate: string;
  lineManagerId?: string;
  spouses?: Omit<Spouse, 'id' | 'employeeId'>[];
  children?: Omit<Child, 'id' | 'employeeId'>[];
  nominees?: Omit<Nominee, 'id' | 'employeeId'>[];
  bankDetails?: Omit<BankDetails, 'id' | 'employeeId'> | null;
  documents?: Omit<EmployeeDocument, 'id' | 'employeeId'>[];
}

export type UpdateEmployeePayload = Partial<CreateEmployeePayload>;

