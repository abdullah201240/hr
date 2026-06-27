import { Injectable, Inject, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
import { DB_CONNECTION, type Database } from '../../db';
import { permissions, customRoles, rolePermissions, employees, leaveApplications, claims, regulationRequests, employeePayslips } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

// Predefined set of resources and actions for seeding
export interface PermissionSeed {
  resource: string;
  action: string;
  description: string;
}

const SYSTEM_PERMISSIONS: PermissionSeed[] = [
  // Employees
  { resource: 'employees', action: 'create', description: 'Create new employees' },
  { resource: 'employees', action: 'read', description: 'Read employee basic details' },
  { resource: 'employees', action: 'update', description: 'Update employee details' },
  { resource: 'employees', action: 'delete', description: 'Delete employee record' },
  { resource: 'employees', action: 'view_all', description: 'View full employee directory' },
  { resource: 'employees', action: 'view_own', description: 'View own profile details' },
  { resource: 'employees', action: 'view_team', description: 'View team members profiles' },
  { resource: 'employees', action: 'reset_password', description: 'Reset employee password' },

  // Payroll & Salary
  { resource: 'payroll', action: 'create', description: 'Create payroll cycles' },
  { resource: 'payroll', action: 'read', description: 'Read payroll reports' },
  { resource: 'payroll', action: 'process', description: 'Process salary payouts' },
  { resource: 'payroll', action: 'disburse', description: 'Disburse payroll funds' },
  { resource: 'payroll', action: 'view_own', description: 'View own payslips and salary details' },
  { resource: 'payroll', action: 'view_all', description: 'View payroll details for all employees' },
  { resource: 'payroll', action: 'approve_lm', description: 'Stage 1: Line Manager Approval' },
  { resource: 'payroll', action: 'approve_md', description: 'Stage 2: Managing Director Approval' },

  // Festival Bonus
  { resource: 'bonus', action: 'create', description: 'Create and configure festival bonus cycles' },
  { resource: 'bonus', action: 'read', description: 'Read festival bonus registers and history' },
  { resource: 'bonus', action: 'process', description: 'Process bonus calculations and adjustments' },
  { resource: 'bonus', action: 'approve_lm', description: 'Line Manager approval for subordinates bonus' },
  { resource: 'bonus', action: 'approve_md', description: 'MD final approval for festival bonus' },
  { resource: 'bonus', action: 'disburse', description: 'Disburse festival bonus funds' },

  // Leave Management
  { resource: 'leave', action: 'apply', description: 'Apply for leave requests' },
  { resource: 'leave', action: 'create', description: 'Create leave types and configurations' },
  { resource: 'leave', action: 'update', description: 'Update leave types and configurations' },
  { resource: 'leave', action: 'approve', description: 'Approve leave requests' },
  { resource: 'leave', action: 'reject', description: 'Reject leave requests' },
  { resource: 'leave', action: 'cancel', description: 'Cancel leave requests' },
  { resource: 'leave', action: 'delete', description: 'Delete leave types and records' },
  { resource: 'leave', action: 'view_own', description: 'View own leave applications and balances' },
  { resource: 'leave', action: 'view_team', description: 'View leave requests of team members' },
  { resource: 'leave', action: 'view_all', description: 'View all leave requests in company' },

  // Claims & Reimbursement
  { resource: 'claims', action: 'create', description: 'Submit claims' },
  { resource: 'claims', action: 'approve', description: 'Approve claims' },
  { resource: 'claims', action: 'reject', description: 'Reject claims' },
  { resource: 'claims', action: 'settle', description: 'Settle approved claims' },
  { resource: 'claims', action: 'delete', description: 'Delete pending claims' },
  { resource: 'claims', action: 'view_own', description: 'View own claims' },
  { resource: 'claims', action: 'view_team', description: 'View claims of team members' },
  { resource: 'claims', action: 'view_all', description: 'View all claims in company' },

  // Recruitment
  { resource: 'recruitment', action: 'create', description: 'Create job postings and candidate profiles' },
  { resource: 'recruitment', action: 'read', description: 'View recruitment pipelines' },
  { resource: 'recruitment', action: 'update', description: 'Update candidate stages' },
  { resource: 'recruitment', action: 'delete', description: 'Remove job openings and candidates' },
  { resource: 'recruitment', action: 'interview', description: 'Schedule and log interviews' },
  { resource: 'recruitment', action: 'offer_letter', description: 'Issue offer letters' },
  { resource: 'recruitment', action: 'onboarding', description: 'Initiate employee onboarding' },

  // HR Letters
  { resource: 'letters', action: 'create', description: 'Generate official letters' },
  { resource: 'letters', action: 'read', description: 'View generated letters' },
  { resource: 'letters', action: 'update', description: 'Modify letters' },
  { resource: 'letters', action: 'delete', description: 'Revoke/delete letters' },

  // Announcements
  { resource: 'announcements', action: 'create', description: 'Publish announcements' },
  { resource: 'announcements', action: 'read', description: 'Read announcements' },
  { resource: 'announcements', action: 'update', description: 'Edit announcements' },
  { resource: 'announcements', action: 'delete', description: 'Delete announcements' },

  // Chat & Channels
  { resource: 'chat', action: 'create_channel', description: 'Create public and private channels' },
  { resource: 'chat', action: 'manage_members', description: 'Add/remove members from channels' },
  { resource: 'chat', action: 'direct_message', description: 'Send direct messages' },

  // Settings
  { resource: 'settings', action: 'read', description: 'View settings' },
  { resource: 'settings', action: 'update', description: 'Modify system-wide settings' },

  // Audit Logs
  { resource: 'audit_logs', action: 'read', description: 'View system audit trails' },

  // Separation / Offboarding
  { resource: 'separation', action: 'create', description: 'Initiate offboarding process' },
  { resource: 'separation', action: 'read', description: 'View separation records' },
  { resource: 'separation', action: 'update', description: 'Update separation clearance' },
  { resource: 'separation', action: 'delete', description: 'Delete separation records' },

  // Disciplinary
  { resource: 'disciplinary', action: 'create', description: 'Log disciplinary cases' },
  { resource: 'disciplinary', action: 'read', description: 'View disciplinary cases' },
  { resource: 'disciplinary', action: 'update', description: 'Update disciplinary cases' },
  { resource: 'disciplinary', action: 'delete', description: 'Revoke disciplinary cases' },

  // Performance
  { resource: 'performance', action: 'create', description: 'Create appraisal cycles and KPIs' },
  { resource: 'performance', action: 'read', description: 'View performance data' },
  { resource: 'performance', action: 'update', description: 'Update appraisals and KPIs' },
  { resource: 'performance', action: 'delete', description: 'Delete KPIs' },
  { resource: 'performance', action: 'view_own', description: 'View own performance data' },
  { resource: 'performance', action: 'view_all', description: 'View all performance data' },

  // Attendance
  { resource: 'attendance', action: 'read', description: 'View attendance logs' },
  { resource: 'attendance', action: 'view_all', description: 'View all employee attendance' },
  { resource: 'attendance', action: 'approve', description: 'Approve attendance corrections' },
  { resource: 'attendance', action: 'update', description: 'Override/update attendance settings' },
  { resource: 'attendance', action: 'create', description: 'Create attendance overrides and settings' },
  { resource: 'attendance', action: 'delete', description: 'Delete attendance settings' },

  // Tasks & Projects
  { resource: 'tasks', action: 'create', description: 'Create tasks and projects' },
  { resource: 'tasks', action: 'read', description: 'View tasks and projects' },
  { resource: 'tasks', action: 'update', description: 'Update tasks and projects' },
  { resource: 'tasks', action: 'delete', description: 'Delete tasks and projects' },
  { resource: 'tasks', action: 'manage', description: 'Manage projects, milestones, bulk operations' },

  // Organisation Chart
  { resource: 'org_chart', action: 'read', description: 'View org chart' },
  { resource: 'org_chart', action: 'create', description: 'Create org chart nodes' },
  { resource: 'org_chart', action: 'update', description: 'Update org chart nodes' },
  { resource: 'org_chart', action: 'delete', description: 'Delete org chart nodes' },

  // Notifications
  { resource: 'notifications', action: 'broadcast', description: 'Broadcast notifications to all employees' },

  // Upload / Files
  { resource: 'upload', action: 'read', description: 'View uploaded files' },
  { resource: 'upload', action: 'create', description: 'Upload files' },
  { resource: 'upload', action: 'delete', description: 'Delete uploaded files' },

  // Departments
  { resource: 'departments', action: 'create', description: 'Create departments' },
  { resource: 'departments', action: 'read', description: 'View departments' },
  { resource: 'departments', action: 'update', description: 'Update departments' },
  { resource: 'departments', action: 'delete', description: 'Deactivate departments' },

  // Designations
  { resource: 'designations', action: 'create', description: 'Create designations' },
  { resource: 'designations', action: 'read', description: 'View designations' },
  { resource: 'designations', action: 'update', description: 'Update designations' },
  { resource: 'designations', action: 'delete', description: 'Deactivate designations' },

  // Salary Management
  { resource: 'salary', action: 'create', description: 'Create salary templates and assignments' },
  { resource: 'salary', action: 'read', description: 'View salary data' },
  { resource: 'salary', action: 'update', description: 'Update salary records' },
  { resource: 'salary', action: 'delete', description: 'Delete salary records' },

  // Executive Dashboard
  { resource: 'dashboard', action: 'view_executive', description: 'Access the CEO Executive Dashboard with cross-module analytics' },

  // Office Regulations
  { resource: 'regulations', action: 'create', description: 'Create regulation policies' },
  { resource: 'regulations', action: 'read', description: 'View regulation policies' },
  { resource: 'regulations', action: 'update', description: 'Edit regulation policies' },
  { resource: 'regulations', action: 'delete', description: 'Delete regulation policies' },
  { resource: 'regulations', action: 'apply', description: 'Submit regulation requests' },
  { resource: 'regulations', action: 'view_own', description: 'View own regulation requests' },
  { resource: 'regulations', action: 'view_team', description: 'View team regulation requests (Line Manager)' },
  { resource: 'regulations', action: 'view_all', description: 'View all regulation requests (Admin/HR)' },
  { resource: 'regulations', action: 'approve', description: 'Final approval of regulation requests' },
];

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(@Inject(DB_CONNECTION) private readonly db: Database) {}

  async onModuleInit() {
    await this.seedPermissions();
  }

  // ─── Startup Seeding ───────────────────────────────────────────────────────
  private async seedPermissions() {
    // Insert all permissions, skipping duplicates based on (resource, action)
    await this.db
      .insert(permissions)
      .values(SYSTEM_PERMISSIONS)
      .onConflictDoNothing({ target: [permissions.resource, permissions.action] });
  }

  // ─── Query Endpoints ───────────────────────────────────────────────────────
  async getPermissions() {
    return this.db.select().from(permissions);
  }

  async getRoles() {
    // 1. Get custom roles
    const customRolesList = await this.db.select().from(customRoles);

    // 2. Fetch role permissions mapping for all roles
    const mappings = await this.db.select().from(rolePermissions);

    // Group permissions by roleKey
    const rolePermsMap: Record<string, string[]> = {};
    for (const mapping of mappings) {
      if (!rolePermsMap[mapping.roleKey]) {
        rolePermsMap[mapping.roleKey] = [];
      }
      rolePermsMap[mapping.roleKey].push(mapping.permissionId);
    }

    return customRolesList.map(cr => ({
      id: cr.id,
      name: cr.name,
      description: cr.description,
      isSystem: false,
      permissions: rolePermsMap[cr.id] || [],
    }));
  }

  // ─── Custom Role Mutations ────────────────────────────────────────────────
  async createCustomRole(name: string, description: string, permissionIds: string[]) {
    // 1. Insert custom role
    const [cr] = await this.db
      .insert(customRoles)
      .values({ name, description, isSystem: false })
      .returning();

    // 2. Insert permission mappings
    if (permissionIds.length > 0) {
      await this.db
        .insert(rolePermissions)
        .values(permissionIds.map(pId => ({ roleKey: cr.id, permissionId: pId })));
    }

    return this.getRoleDetails(cr.id);
  }

  async updateCustomRole(id: string, name: string, description: string, permissionIds: string[]) {
    const [existing] = await this.db.select().from(customRoles).where(eq(customRoles.id, id)).limit(1);
    if (!existing) {
      throw new NotFoundException(`Custom role with ID "${id}" not found`);
    }

    // Update fields
    await this.db.update(customRoles).set({ name, description }).where(eq(customRoles.id, id));

    // Reset permissions mapping
    await this.db.delete(rolePermissions).where(eq(rolePermissions.roleKey, id));

    // Re-insert permissions mapping
    if (permissionIds.length > 0) {
      await this.db
        .insert(rolePermissions)
        .values(permissionIds.map(pId => ({ roleKey: id, permissionId: pId })));
    }

    return this.getRoleDetails(id);
  }

  async deleteCustomRole(id: string) {
    const [existing] = await this.db.select().from(customRoles).where(eq(customRoles.id, id)).limit(1);
    if (!existing) {
      throw new NotFoundException(`Custom role with ID "${id}" not found`);
    }

    // Verify if any employee is currently assigned to this custom role
    const [assignedEmployee] = await this.db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.customRoleId, id))
      .limit(1);

    if (assignedEmployee) {
      throw new BadRequestException('Cannot delete custom role because it is currently assigned to one or more employees.');
    }

    await this.db.delete(rolePermissions).where(eq(rolePermissions.roleKey, id));
    await this.db.delete(customRoles).where(eq(customRoles.id, id));

    return { success: true, message: `Custom role "${existing.name}" has been deleted.` };
  }

  private async getRoleDetails(id: string) {
    const [cr] = await this.db.select().from(customRoles).where(eq(customRoles.id, id)).limit(1);
    if (!cr) return null;

    const mappings = await this.db.select().from(rolePermissions).where(eq(rolePermissions.roleKey, id));
    return {
      id: cr.id,
      name: cr.name,
      description: cr.description,
      isSystem: false,
      permissions: mappings.map(m => m.permissionId),
    };
  }

  // ─── Permission Checking Helper ───────────────────────────────────────────
  async getUserPermissions(customRoleId: string): Promise<Set<string>> {
    const list = await this.db
      .select({
        resource: permissions.resource,
        action: permissions.action,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleKey, customRoleId));

    return new Set(list.map(p => `${p.resource}:${p.action}`));
  }

  async isLineManagerForLeave(userId: string, leaveId: string): Promise<boolean> {
    const [result] = await this.db
      .select({
        lineManagerId: employees.lineManagerId,
      })
      .from(leaveApplications)
      .innerJoin(employees, eq(leaveApplications.employeeId, employees.id))
      .where(eq(leaveApplications.id, leaveId))
      .limit(1);

    return result ? result.lineManagerId === userId : false;
  }

  async isLineManagerForClaim(userId: string, claimId: string): Promise<boolean> {
    const [result] = await this.db
      .select({
        lineManagerId: employees.lineManagerId,
      })
      .from(claims)
      .innerJoin(employees, eq(claims.employeeId, employees.id))
      .where(eq(claims.id, claimId))
      .limit(1);

    return result ? result.lineManagerId === userId : false;
  }

  async isLineManagerForRegulation(userId: string, requestId: string): Promise<boolean> {
    const [result] = await this.db
      .select({
        lineManagerId: employees.lineManagerId,
      })
      .from(regulationRequests)
      .innerJoin(employees, eq(regulationRequests.employeeId, employees.id))
      .where(eq(regulationRequests.id, requestId))
      .limit(1);

    return result ? result.lineManagerId === userId : false;
  }

  async isLineManagerForPayslip(userId: string, payslipId: string): Promise<boolean> {
    const [result] = await this.db
      .select({
        lineManagerId: employees.lineManagerId,
      })
      .from(employeePayslips)
      .innerJoin(employees, eq(employeePayslips.employeeId, employees.id))
      .where(eq(employeePayslips.id, payslipId))
      .limit(1);

    return result ? result.lineManagerId === userId : false;
  }
}
