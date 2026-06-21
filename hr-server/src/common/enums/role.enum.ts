/**
 * Role Enum — single source of truth for all role strings in the system.
 * Use these typed values in @Roles() decorators instead of raw string literals.
 */
export enum Role {
  ADMIN = 'admin',
  HR = 'hr',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

/** Roles that can manage people: employee CRUD, payroll, recruitment, letters */
export const PEOPLE_MANAGERS = [Role.ADMIN, Role.HR] as const;

/** Roles that can view team-level data: attendance company view, performance */
export const TEAM_VIEWERS = [Role.ADMIN, Role.HR, Role.MANAGER] as const;

/** All authenticated roles */
export const ALL_ROLES = [Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE] as const;
