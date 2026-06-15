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
