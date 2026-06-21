import {
  pgTable,
  varchar,
  text,
  date,
  boolean,
  uuid,
  integer,
  timestamp,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseTable } from './_base';
import { customRoles } from './roles';

// ─── Departments ────────────────────────────────────────────────────────────

export const departments = pgTable(
  'departments',
  {
    ...baseTable,

    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    description: text('description').default(''),

    /** Optional head of department (reference to an employee) */
    headEmployeeId: uuid('head_employee_id').references((): AnyPgColumn => employees.id, { onDelete: 'set null' }),

    /** Soft delete / active flag */
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => [
    uniqueIndex('departments_code_idx').on(table.code),
    uniqueIndex('departments_name_idx').on(table.name),
    index('departments_is_active_idx').on(table.isActive),
  ],
);

// ─── Designations ───────────────────────────────────────────────────────────

export const designations = pgTable(
  'designations',
  {
    ...baseTable,

    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    description: text('description').default(''),

    /** Grade/level for hierarchy (e.g. L1, L2, L3 … or "Senior", "Junior") */
    grade: varchar('grade', { length: 50 }).default(''),

    /** Soft delete / active flag */
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => [
    uniqueIndex('designations_code_idx').on(table.code),
    uniqueIndex('designations_name_idx').on(table.name),
    index('designations_is_active_idx').on(table.isActive),
  ],
);

// ─── Employees ──────────────────────────────────────────────────────────────

export const employees = pgTable(
  'employees',
  {
    ...baseTable,

    // Identity
    employeeId: varchar('employee_id', { length: 50 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    personalEmail: varchar('personal_email', { length: 255 }).default(''),
    passwordHash: text('password_hash').notNull(),

    // Personal
    fullNameEnglish: varchar('full_name_english', { length: 255 }).notNull(),
    fullNameBangla: varchar('full_name_bangla', { length: 255 }).default(''),
    phone: varchar('phone', { length: 30 }).notNull(),
    personalMobileNumber: varchar('personal_mobile_number', {
      length: 30,
    }).default(''),
    religion: varchar('religion', { length: 50 }).notNull(),
    gender: varchar('gender', { length: 30 }).notNull(),
    dateOfBirth: date('date_of_birth').notNull(),
    bloodGroup: varchar('blood_group', { length: 10 }).default('Not Specified'),
    maritalStatus: varchar('marital_status', { length: 20 }).default('Single'),
    employeePhotoUrl: text('employee_photo_url'),
    nidNumber: varchar('nid_number', { length: 50 }).notNull(),
    nidPdfUrl: text('nid_pdf_url'),
    tinNumber: varchar('tin_number', { length: 50 }).default(''),

    // Family lineage
    fatherNameEnglish: varchar('father_name_english', { length: 255 }).default(
      '',
    ),
    fatherNameBangla: varchar('father_name_bangla', { length: 255 }).default(
      '',
    ),
    motherNameEnglish: varchar('mother_name_english', { length: 255 }).default(
      '',
    ),
    motherNameBangla: varchar('mother_name_bangla', { length: 255 }).default(
      '',
    ),

    // Address
    currentAddress: text('current_address').default(''),
    permanentAddress: text('permanent_address').default(''),

    // Emergency contact
    emergencyContactName: varchar('emergency_contact_name', {
      length: 255,
    }).default(''),
    emergencyContactRelation: varchar('emergency_contact_relation', {
      length: 100,
    }).default(''),
    emergencyContactNumber: varchar('emergency_contact_number', {
      length: 30,
    }).default(''),

    // Employment
    designationId: uuid('designation_id')
      .notNull()
      .references((): AnyPgColumn => designations.id, { onDelete: 'restrict' }),
    departmentId: uuid('department_id')
      .notNull()
      .references((): AnyPgColumn => departments.id, { onDelete: 'restrict' }),
    employeeType: varchar('employee_type', { length: 50 }).notNull(),
    joinDate: date('join_date').notNull(),
    lineManagerId: uuid('line_manager_id'),

    // Status
    status: varchar('status', { length: 20 }).default('active').notNull(), // active | inactive | terminated
    inactiveDate: date('inactive_date'), // Scheduled date to become inactive

    // Auth
    role: varchar('role', { length: 20, enum: ['admin', 'hr', 'manager', 'employee'] }).default('employee').notNull(), // admin | hr | manager | employee
    customRoleId: uuid('custom_role_id').references((): AnyPgColumn => customRoles.id, { onDelete: 'set null' }),
    refreshTokenVersion: integer('refresh_token_version').default(1).notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    isEmailVerified: boolean('is_email_verified').default(false).notNull(),

    // Metadata
    deletedAt: date('deleted_at'),
  },
  (table) => [
    uniqueIndex('employees_employee_id_idx').on(table.employeeId),
    uniqueIndex('employees_email_idx').on(table.email),
    index('employees_department_id_idx').on(table.departmentId),
    index('employees_designation_id_idx').on(table.designationId),
    index('employees_status_idx').on(table.status),
    index('employees_employee_type_idx').on(table.employeeType),
    index('employees_join_date_idx').on(table.joinDate),
    index('employees_full_name_english_idx').on(table.fullNameEnglish),
  ],
);

// ─── Spouses ────────────────────────────────────────────────────────────────

export const employeeSpouses = pgTable(
  'employee_spouses',
  {
    ...baseTable,
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    nid: varchar('nid', { length: 50 }).default(''),
    phone: varchar('phone', { length: 30 }).default(''),
    occupation: varchar('occupation', { length: 255 }).default(''),
    marriageDate: date('marriage_date'),
  },
  (table) => [index('employee_spouses_employee_id_idx').on(table.employeeId)],
);

// ─── Children ───────────────────────────────────────────────────────────────

export const employeeChildren = pgTable(
  'employee_children',
  {
    ...baseTable,
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    dateOfBirth: date('date_of_birth'),
    gender: varchar('gender', { length: 30 }).default('Not Specified'),
  },
  (table) => [index('employee_children_employee_id_idx').on(table.employeeId)],
);

// ─── Nominees ───────────────────────────────────────────────────────────────

export const employeeNominees = pgTable(
  'employee_nominees',
  {
    ...baseTable,
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    relation: varchar('relation', { length: 100 }).default(''),
    nidNumber: varchar('nid_number', { length: 50 }).default(''),
    nidPdfUrl: text('nid_pdf_url'),
    photoUrl: text('photo_url'),
  },
  (table) => [index('employee_nominees_employee_id_idx').on(table.employeeId)],
);

// ─── Bank Details ───────────────────────────────────────────────────────────

export const employeeBankDetails = pgTable('employee_bank_details', {
  ...baseTable,
  employeeId: uuid('employee_id')
    .notNull()
    .unique()
    .references(() => employees.id, { onDelete: 'cascade' }),
  bankName: varchar('bank_name', { length: 255 }).default(''),
  branch: varchar('branch', { length: 255 }).default(''),
  accountNumber: varchar('account_number', { length: 100 }).default(''),
  accountType: varchar('account_type', { length: 50 }).default(''),
  routingNumber: varchar('routing_number', { length: 50 }).default(''),
  swiftCode: varchar('swift_code', { length: 50 }).default(''),
  ibanNumber: varchar('iban_number', { length: 100 }).default(''),
  bankStatementPdfUrl: text('bank_statement_pdf_url'),
});

// ─── Documents ──────────────────────────────────────────────────────────────

export const employeeDocuments = pgTable(
  'employee_documents',
  {
    ...baseTable,
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').default(''),
    fileUrl: text('file_url').notNull(),
  },
  (table) => [index('employee_documents_employee_id_idx').on(table.employeeId)],
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const departmentsRelations = relations(departments, ({ many, one }) => ({
  employees: many(employees),
  headEmployee: one(employees, {
    fields: [departments.headEmployeeId],
    references: [employees.id],
    relationName: 'headOfDepartment',
  }),
}));

export const designationsRelations = relations(designations, ({ many }) => ({
  employees: many(employees),
}));

export const employeesRelations = relations(employees, ({ many, one }) => ({
  spouses: many(employeeSpouses),
  children: many(employeeChildren),
  nominees: many(employeeNominees),
  bankDetails: one(employeeBankDetails),
  documents: many(employeeDocuments),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  designation: one(designations, {
    fields: [employees.designationId],
    references: [designations.id],
  }),
  lineManager: one(employees, {
    fields: [employees.lineManagerId],
    references: [employees.id],
    relationName: 'lineManager',
  }),
  customRole: one(customRoles, {
    fields: [employees.customRoleId],
    references: [customRoles.id],
  }),
}));

export const employeeSpousesRelations = relations(
  employeeSpouses,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeSpouses.employeeId],
      references: [employees.id],
    }),
  }),
);

export const employeeChildrenRelations = relations(
  employeeChildren,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeChildren.employeeId],
      references: [employees.id],
    }),
  }),
);

export const employeeNomineesRelations = relations(
  employeeNominees,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeNominees.employeeId],
      references: [employees.id],
    }),
  }),
);

export const employeeBankDetailsRelations = relations(
  employeeBankDetails,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeBankDetails.employeeId],
      references: [employees.id],
    }),
  }),
);

export const employeeDocumentsRelations = relations(
  employeeDocuments,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeDocuments.employeeId],
      references: [employees.id],
    }),
  }),
);
