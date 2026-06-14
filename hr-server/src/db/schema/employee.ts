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
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseTable } from './_base';

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
    personalMobileNumber: varchar('personal_mobile_number', { length: 30 }).default(''),
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
    fatherNameEnglish: varchar('father_name_english', { length: 255 }).default(''),
    fatherNameBangla: varchar('father_name_bangla', { length: 255 }).default(''),
    motherNameEnglish: varchar('mother_name_english', { length: 255 }).default(''),
    motherNameBangla: varchar('mother_name_bangla', { length: 255 }).default(''),

    // Address
    currentAddress: text('current_address').default(''),
    permanentAddress: text('permanent_address').default(''),

    // Emergency contact
    emergencyContactName: varchar('emergency_contact_name', { length: 255 }).default(''),
    emergencyContactRelation: varchar('emergency_contact_relation', { length: 100 }).default(''),
    emergencyContactNumber: varchar('emergency_contact_number', { length: 30 }).default(''),

    // Employment
    designation: varchar('designation', { length: 255 }).notNull(),
    department: varchar('department', { length: 255 }).notNull(),
    employeeType: varchar('employee_type', { length: 50 }).notNull(),
    joinDate: date('join_date').notNull(),
    lineManagerId: uuid('line_manager_id'),

    // Status
    status: varchar('status', { length: 20 }).default('active').notNull(), // active | inactive | terminated

    // Auth
    role: varchar('role', { length: 20 }).default('employee').notNull(), // admin | hr | employee
    refreshTokenVersion: integer('refresh_token_version').default(1).notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    isEmailVerified: boolean('is_email_verified').default(false).notNull(),

    // Metadata
    deletedAt: date('deleted_at'),
  },
  (table) => [
    uniqueIndex('employees_employee_id_idx').on(table.employeeId),
    uniqueIndex('employees_email_idx').on(table.email),
    index('employees_department_idx').on(table.department),
    index('employees_status_idx').on(table.status),
    index('employees_join_date_idx').on(table.joinDate),
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

export const employeeBankDetails = pgTable(
  'employee_bank_details',
  {
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
  },
);

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

export const employeesRelations = relations(employees, ({ many, one }) => ({
  spouses: many(employeeSpouses),
  children: many(employeeChildren),
  nominees: many(employeeNominees),
  bankDetails: one(employeeBankDetails),
  documents: many(employeeDocuments),
  lineManager: one(employees, {
    fields: [employees.lineManagerId],
    references: [employees.id],
    relationName: 'lineManager',
  }),
}));

export const employeeSpousesRelations = relations(employeeSpouses, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeSpouses.employeeId],
    references: [employees.id],
  }),
}));

export const employeeChildrenRelations = relations(employeeChildren, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeChildren.employeeId],
    references: [employees.id],
  }),
}));

export const employeeNomineesRelations = relations(employeeNominees, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeNominees.employeeId],
    references: [employees.id],
  }),
}));

export const employeeBankDetailsRelations = relations(employeeBankDetails, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeBankDetails.employeeId],
    references: [employees.id],
  }),
}));

export const employeeDocumentsRelations = relations(employeeDocuments, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeDocuments.employeeId],
    references: [employees.id],
  }),
}));
