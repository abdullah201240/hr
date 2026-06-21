import { Injectable, Inject, OnModuleInit, NotFoundException, BadRequestException } from '@nestjs/common';
import { DB_CONNECTION, type Database } from '../../db';
import { permissions, customRoles, rolePermissions, employees } from '../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

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

  // Leave Management
  { resource: 'leave', action: 'apply', description: 'Apply for leave requests' },
  { resource: 'leave', action: 'approve', description: 'Approve leave requests' },
  { resource: 'leave', action: 'reject', description: 'Reject leave requests' },
  { resource: 'leave', action: 'cancel', description: 'Cancel leave requests' },
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
];

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(@Inject(DB_CONNECTION) private readonly db: Database) {}

  async onModuleInit() {
    await this.seedPermissions();
  }

  // ─── Startup Seeding ───────────────────────────────────────────────────────
  private async seedPermissions() {
    const existing = await this.db.select().from(permissions).limit(1);
    if (existing.length > 0) return; // Already seeded

    // Insert all permissions
    const insertedPerms = await this.db
      .insert(permissions)
      .values(SYSTEM_PERMISSIONS)
      .returning();

    // Map default system roles to permissions
    // Admin gets everything
    const adminPerms = insertedPerms.map(p => ({ roleKey: 'admin', permissionId: p.id }));
    
    // HR gets everything except settings:update, audit_logs:read
    const hrPerms = insertedPerms
      .filter(p => !(p.resource === 'settings' && p.action === 'update') && !(p.resource === 'audit_logs'))
      .map(p => ({ roleKey: 'hr', permissionId: p.id }));

    // Manager gets team & self scoping plus approval flows
    const managerPerms = insertedPerms
      .filter(p => 
        p.action.includes('view_own') || 
        p.action.includes('view_team') || 
        (p.resource === 'leave' && ['apply', 'approve', 'reject', 'cancel'].includes(p.action)) ||
        (p.resource === 'claims' && ['create', 'delete'].includes(p.action)) ||
        (p.resource === 'announcements' && p.action === 'read') ||
        (p.resource === 'chat') ||
        (p.resource === 'employees' && p.action === 'read')
      )
      .map(p => ({ roleKey: 'manager', permissionId: p.id }));

    // Employee gets only self scoping and creation tasks
    const employeePerms = insertedPerms
      .filter(p => 
        p.action.includes('view_own') ||
        (p.resource === 'leave' && ['apply', 'cancel'].includes(p.action)) ||
        (p.resource === 'claims' && ['create', 'delete'].includes(p.action)) ||
        (p.resource === 'announcements' && p.action === 'read') ||
        (p.resource === 'chat' && p.action === 'direct_message')
      )
      .map(p => ({ roleKey: 'employee', permissionId: p.id }));

    const allMappings = [...adminPerms, ...hrPerms, ...managerPerms, ...employeePerms];
    await this.db.insert(rolePermissions).values(allMappings);
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

    // Default system roles definition
    const systemRoles = [
      { id: 'admin', name: 'Super Admin', description: 'System Administrator with full access', isSystem: true, permissions: rolePermsMap['admin'] || [] },
      { id: 'hr', name: 'HR Manager', description: 'Human Resources Manager', isSystem: true, permissions: rolePermsMap['hr'] || [] },
      { id: 'manager', name: 'Manager', description: 'Department or Team Line Manager', isSystem: true, permissions: rolePermsMap['manager'] || [] },
      { id: 'employee', name: 'Employee', description: 'General Employee self-service role', isSystem: true, permissions: rolePermsMap['employee'] || [] },
    ];

    const customRolesFormatted = customRolesList.map(cr => ({
      id: cr.id,
      name: cr.name,
      description: cr.description,
      isSystem: false,
      permissions: rolePermsMap[cr.id] || [],
    }));

    return [...systemRoles, ...customRolesFormatted];
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
  async getUserPermissions(role: string, customRoleId?: string): Promise<Set<string>> {
    const roleKey = customRoleId || role;
    const list = await this.db
      .select({
        resource: permissions.resource,
        action: permissions.action,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleKey, roleKey));

    return new Set(list.map(p => `${p.resource}:${p.action}`));
  }
}
