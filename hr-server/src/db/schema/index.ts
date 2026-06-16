// Re-export base table for convenience
export { baseTable } from './_base';

// ─────────────────────────────────────────────────────────────
// Domain tables (all consolidated in employee.ts to avoid circular imports)
// ─────────────────────────────────────────────────────────────
export * from './employee';
export * from './leave-type';
export * from './attendance';
export * from './announcement';
export * from './festival-bonus';
export * from './provident-fund';


