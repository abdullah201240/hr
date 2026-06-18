import {
  pgTable,
  varchar,
  text,
  date,
  boolean,
  uuid,
  integer,
  doublePrecision,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseTable } from './_base';
import { employees } from './employee';

// ─── Salary Templates ──────────────────────────────────────────────────────
// Reusable salary structures (e.g., "Standard Full-Time", "Contract Worker")

export const salaryTemplates = pgTable(
  'salary_templates',
  {
    ...baseTable,

    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').default(''),

    /** Soft delete / active flag */
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => [
    index('salary_templates_is_active_idx').on(table.isActive),
  ],
);

// ─── Salary Template Components ─────────────────────────────────────────────
// Individual salary components within a template (earnings & deductions)

export const salaryTemplateComponents = pgTable(
  'salary_template_components',
  {
    ...baseTable,

    templateId: uuid('template_id')
      .notNull()
      .references(() => salaryTemplates.id, { onDelete: 'cascade' }),

    /** Component name (e.g., "HRA", "Transport Allowance", "Income Tax") */
    name: varchar('name', { length: 255 }).notNull(),

    /** earning | deduction */
    type: varchar('type', { length: 50 }).notNull(),

    /** percentage | fixed */
    calculationType: varchar('calculation_type', { length: 50 }).notNull(),

    /** Percentage rate (of basic) or fixed amount */
    value: doublePrecision('value').notNull(),

    /** Whether this component is taxable */
    isTaxable: boolean('is_taxable').default(false).notNull(),

    /** Display ordering */
    sortOrder: integer('sort_order').default(0).notNull(),
  },
  (table) => [
    index('salary_template_components_template_id_idx').on(table.templateId),
  ],
);

// ─── Employee Salaries ──────────────────────────────────────────────────────
// Per-employee salary assignments with effective dates

export const employeeSalaries = pgTable(
  'employee_salaries',
  {
    ...baseTable,

    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),

    /** Assigned salary template (nullable — can have custom salary without template) */
    templateId: uuid('template_id').references(() => salaryTemplates.id, {
      onDelete: 'set null',
    }),

    /** Employee's basic salary amount */
    basicSalary: doublePrecision('basic_salary').notNull(),

    /** When this salary takes effect */
    effectiveDate: date('effective_date').notNull(),

    /** Whether Provident Fund deduction applies */
    pfApplicable: boolean('pf_applicable').default(true).notNull(),

    /** Whether festival bonus rules apply */
    festivalBonusApplicable: boolean('festival_bonus_applicable')
      .default(true)
      .notNull(),

    /** active | superseded */
    status: varchar('status', { length: 20 }).default('active').notNull(),

    /** Admin notes for this salary record */
    notes: text('notes').default(''),
  },
  (table) => [
    index('employee_salaries_employee_id_idx').on(table.employeeId),
    index('employee_salaries_template_id_idx').on(table.templateId),
    index('employee_salaries_status_idx').on(table.status),
    index('employee_salaries_effective_date_idx').on(table.effectiveDate),
  ],
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const salaryTemplatesRelations = relations(
  salaryTemplates,
  ({ many }) => ({
    components: many(salaryTemplateComponents),
    employeeSalaries: many(employeeSalaries),
  }),
);

export const salaryTemplateComponentsRelations = relations(
  salaryTemplateComponents,
  ({ one }) => ({
    template: one(salaryTemplates, {
      fields: [salaryTemplateComponents.templateId],
      references: [salaryTemplates.id],
    }),
  }),
);

export const employeeSalariesRelations = relations(
  employeeSalaries,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeSalaries.employeeId],
      references: [employees.id],
    }),
    template: one(salaryTemplates, {
      fields: [employeeSalaries.templateId],
      references: [salaryTemplates.id],
    }),
  }),
);
