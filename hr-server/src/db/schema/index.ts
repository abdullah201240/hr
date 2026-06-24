// Re-export base table for convenience
export { baseTable } from './_base';

// ─────────────────────────────────────────────────────────────
// Domain tables (all consolidated in employee.ts to avoid circular imports)
// ─────────────────────────────────────────────────────────────
export * from './employee';
export * from './leave-type';
export * from './attendance';
export * from './announcement';
export * from './provident-fund';
export * from './leave-application';
export * from './salary';
export * from './claims';
export * from './recruitment';
export * from './payroll';
export * from './letters';
export * from './performance';
export * from './disciplinary';
export * from './separation';
export * from './org-chart';
export * from './tasks';
export * from './chat';
export * from './notifications';
export * from './audit-logs';
export * from './roles';
export * from './office-regulations';
export * from './office-regulations-relations';
export * from './festival-bonus';
