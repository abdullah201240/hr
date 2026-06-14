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

  /** Designation list */
  designationList: {
    key: key('designations:list'),
    ttl: 600, // 10 min
    description: 'All designations',
  },

  /** Leave type configuration */
  leaveTypes: {
    key: key('leave:types'),
    ttl: 900, // 15 min
    description: 'Leave type configuration',
  },

  /** Payroll run result */
  payrollRun: {
    key: key('payroll:run:*'),
    ttl: 1800, // 30 min
    description: 'Payroll run result by period',
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
    ttl: 60, // 1 min
    description: 'Cached JWT user validation result',
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
