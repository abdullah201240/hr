/**
 * Centralized Redis key registry.
 *
 * Every cache key used across the application MUST be defined here.
 * This prevents key collisions, makes TTL policies visible, and
 * enables type-safe cache access via CacheService.
 */

// ── Key prefix ────────────────────────────────────────────────────
const PREFIX = 'hr:' as const;

/** Build a fully-qualified Redis key from a segment. */
const key = (segment: string) => `${PREFIX}${segment}` as const;

// ── Key definitions ───────────────────────────────────────────────
// Each entry defines: the key pattern, default TTL (seconds), and a
// human-readable description.
//
// Use `:id` placeholders for dynamic parts.
// Resolve them at call-time with the helper below.

export const CacheKeys = {
  /** Health-check sentinel key */
  healthCheck: {
    key: key('health:check'),
    ttl: 60,
    description: 'Health check sentinel',
  },

  /** Cached employee list (paginated) */
  employeeList: {
    key: key('employees:list:*'),
    ttl: 300, // 5 min
    description: 'Paginated employee list',
  },

  /** Simple list of active employees for dropdown select options */
  employeeOptions: {
    key: key('employees:options'),
    ttl: 600, // 10 min
    description: 'Simplified employee dropdown options list',
  },

  /** Single employee by ID — TTL kept short to limit stale window after direct DB changes */
  employeeById: {
    key: key('employees:id:*'),
    ttl: 300, // 5 min
    description: 'Employee record by ID',
  },

  /** Leave balance for an employee */
  leaveBalance: {
    key: key('leave:balance:*'),
    ttl: 300, // 5 min
    description: 'Leave balance by employee ID',
  },

  /** Attendance summary for a date range */
  attendanceSummary: {
    key: key('attendance:summary:*'),
    ttl: 120, // 2 min
    description: 'Attendance summary by employee + date range',
  },

  /** Department list */
  departmentList: {
    key: key('departments:list'),
    ttl: 600, // 10 min
    description: 'All departments',
  },

  /** Cached department list (paginated) */
  departmentListPaginated: {
    key: key('departments:list:*'),
    ttl: 300, // 5 min
    description: 'Paginated department list',
  },

  /** Department record by ID */
  departmentById: {
    key: key('departments:id:*'),
    ttl: 300, // 5 min
    description: 'Department record by ID',
  },

  /** Designation list */
  designationList: {
    key: key('designations:list'),
    ttl: 600, // 10 min
    description: 'All designations',
  },

  /** Cached designation list (paginated) */
  designationListPaginated: {
    key: key('designations:list:*'),
    ttl: 300, // 5 min
    description: 'Paginated designation list',
  },

  /** Designation record by ID */
  designationById: {
    key: key('designations:id:*'),
    ttl: 300, // 5 min
    description: 'Designation record by ID',
  },

  /** Leave type configuration (dropdown list) */
  leaveTypes: {
    key: key('leave:types'),
    ttl: 900, // 15 min
    description: 'Leave type configuration options',
  },

  /** Cached leave type list (paginated) */
  leaveTypeListPaginated: {
    key: key('leave:types:list:*'),
    ttl: 300, // 5 min
    description: 'Paginated leave type list',
  },

  /** Leave type record by ID */
  leaveTypeById: {
    key: key('leave:types:id:*'),
    ttl: 300, // 5 min
    description: 'Leave type record by ID',
  },

  /** Payroll run result */
  payrollRun: {
    key: key('payroll:run:*'),
    ttl: 1800, // 30 min
    description: 'Payroll run result by period',
  },

  /** Attendance settings (singleton) */
  attendanceSettings: {
    key: key('attendance:settings'),
    ttl: 1800, // 30 min
    description: 'Attendance settings singleton',
  },

  /** Holidays list */
  holidaysList: {
    key: key('attendance:holidays'),
    ttl: 1800, // 30 min
    description: 'Holidays configuration list',
  },

  /** Generic settings / config cache */
  settings: {
    key: key('settings:*'),
    ttl: 1800, // 30 min
    description: 'Application settings by key',
  },

  /** Uploaded file metadata cache */
  uploadMeta: {
    key: key('uploads:meta:*'),
    ttl: 600, // 10 min
    description: 'Uploaded file metadata by public ID',
  },

  /** Folder listing cache */
  uploadFolderList: {
    key: key('uploads:folder:*'),
    ttl: 120, // 2 min
    description: 'Cloudinary folder listing cache',
  },

  /** Login rate limiting */
  loginRateLimit: {
    key: key('auth:rate:login:*'),
    ttl: 60, // 1 min window
    description: 'Login rate limit counter by IP and email',
  },

  /** Token blacklist */
  tokenBlacklist: {
    key: key('auth:blacklist:*'),
    ttl: 0, // dynamic TTL based on token expiry
    description: 'Revoked JWT blacklist',
  },

  /** JWT validation cache (short-lived) */
  jwtValidate: {
    key: key('jwt:validate:*'),
    ttl: 15, // 15 seconds
    description: 'Cached JWT user validation result',
  },

  /** Announcement list (legacy, non-paginated) */
  announcementList: {
    key: key('announcements:list'),
    ttl: 300, // 5 min
    description: 'All announcements (legacy)',
  },

  /** Announcement paginated list (cursor-based) */
  announcementCursorPage: {
    key: key('announcements:cursor:*'), // cursor:limit:status:search
    ttl: 300, // 5 min
    description: 'Cursor-paginated announcements page',
  },

  /** Single announcement by ID */
  announcementById: {
    key: key('announcements:id:*'),
    ttl: 300, // 5 min
    description: 'Announcement record by ID',
  },

  /** Attendance logs for employee by month */
  attendanceLogsByMonth: {
    key: key('attendance:logs:*:*:*'), // employeeId:year:month
    ttl: 120, // 2 min
    description: 'Monthly attendance logs by employee',
  },

  /** Daily attendance logs for admin view */
  attendanceDailyLogs: {
    key: key('attendance:daily:*'), // date
    ttl: 120, // 2 min
    description: 'Daily attendance logs for admin',
  },

  /** Pending attendance corrections */
  attendancePendingCorrections: {
    key: key('attendance:corrections:pending'),
    ttl: 60, // 1 min
    description: 'Pending attendance correction requests',
  },

  /** Festival bonus rules list */
  festivalBonusRules: {
    key: key('festival-bonus:rules'),
    ttl: 1800, // 30 min
    description: 'Festival bonus configuration rules',
  },

  /** Single festival bonus rule by ID */
  festivalBonusRuleById: {
    key: key('festival-bonus:rules:id:*'),
    ttl: 1800, // 30 min
    description: 'Festival bonus rule by ID',
  },

  /** Provident fund settings (singleton) */
  providentFundSettings: {
    key: key('provident-fund:settings'),
    ttl: 1800, // 30 min
    description: 'Provident fund configuration settings',
  },

  /** Leave applications list (paginated/filtered) */
  leaveApplicationsList: {
    key: key('leave:applications:list:*'),
    ttl: 300, // 5 min
    description: 'Paginated and filtered leave applications list',
  },

  /** Single leave application by ID */
  leaveApplicationById: {
    key: key('leave:applications:id:*'),
    ttl: 300, // 5 min
    description: 'Single leave application details by ID',
  },

  /** Employee leave balances by year */
  leaveBalances: {
    key: key('leave:balances:*:*'), // employeeId:year
    ttl: 300, // 5 min
    description: 'Calculated leave balances for employee by year',
  },

  /** Salary templates list */
  salaryTemplates: {
    key: key('salary:templates'),
    ttl: 600, // 10 min
    description: 'All salary templates with components',
  },

  /** Single salary template by ID */
  salaryTemplateById: {
    key: key('salary:templates:id:*'),
    ttl: 600, // 10 min
    description: 'Salary template by ID',
  },

  /** Employee salary assignments list */
  employeeSalaryList: {
    key: key('salary:employee:list'),
    ttl: 300, // 5 min
    description: 'All employee salary assignments',
  },

  /** Employee salary by employee ID */
  employeeSalaryById: {
    key: key('salary:employee:id:*'),
    ttl: 300, // 5 min
    description: 'Employee salary by employee ID',
  },

  /** Claims list (paginated/filtered) */
  claimsList: {
    key: key('claims:list:*'),
    ttl: 300, // 5 min
    description: 'Paginated and filtered claims list',
  },

  /** Single claim by ID */
  claimById: {
    key: key('claims:id:*'),
    ttl: 300, // 5 min
    description: 'Claim record by ID',
  },

  payrollDisbursements: {
    key: key('payroll:disbursements'),
    ttl: 300, // 5 min
    description: 'All historical payroll disbursements',
  },

  lettersList: {
    key: key('letters:list:*'),
    ttl: 300, // 5 min
    description: 'List of issued HR letters',
  },
} as const;


export type CacheKeyDefinition = (typeof CacheKeys)[keyof typeof CacheKeys];

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Resolve a wildcard key pattern with concrete values.
 *
 * @example
 *   resolveKey(CacheKeys.employeeById, '42')
 *   // → 'hr:employees:id:42'
 *
 *   resolveKey(CacheKeys.attendanceSummary, '42', '2025-06')
 *   // → 'hr:attendance:summary:42:2025-06'
 */
export function resolveKey(
  definition: { key: string },
  ...parts: string[]
): string {
  // Replace each trailing `*` with the corresponding part
  let resolved = definition.key;
  for (const part of parts) {
    resolved = resolved.replace('*', part);
  }
  return resolved;
}

/**
 * Return the glob pattern for a key definition (useful for `delPattern`).
 *
 * @example
 *   patternOf(CacheKeys.employeeList)
 *   // → 'hr:employees:list:*'
 */
export function patternOf(definition: { key: string }): string {
  return definition.key;
}
