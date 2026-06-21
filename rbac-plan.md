# Enterprise Role-Based Access Control (RBAC) — Full Implementation Plan

## 1. Executive Summary

This document defines a **world-class, enterprise-grade Role-Based Access Control (RBAC)** implementation plan for the ASG HR Management System. The plan covers the backend (NestJS + PostgreSQL), the frontend (React + TypeScript), and operational governance — modeled after Google Workspace / enterprise SaaS RBAC patterns.

---

## 2. Current State Audit

### 2.1 Existing Roles (Hardcoded Strings)

| Role | Stored In | Where Used |
|------|-----------|------------|
| `admin` | `employees.role` (varchar) | `@Roles('admin', 'hr')` decorators, JWT payload, `req.user.role` |
| `hr` | `employees.role` (varchar) | Same as above |
| `employee` | `employees.role` (varchar) | Mostly default, rarely explicitly gated |

### 2.2 Current Auth Architecture (Already Strong)

| Layer | Status | Implementation |
|-------|--------|---------------|
| JWT Access Token (15m) | ✅ Done | `JwtStrategy` + `JwtAuthGuard` (global) |
| Refresh Token Rotation | ✅ Done | Version tracking, Redis blacklist |
| Rate Limiting | ✅ Done | `LoginThrottleGuard` (Redis per IP+email) |
| Global Guards | ✅ Done | `JwtAuthGuard` + `RolesGuard` in `AppModule` |
| `@Public()` Decorator | ✅ Done | Skips auth for health/login endpoints |
| `@Roles()` Decorator | ✅ Done | `SetMetadata` + `RolesGuard` |

### 2.3 Critical Gaps Identified

| # | Gap | Risk Level | Module(s) Affected |
|---|-----|-----------|-------------------|
| G1 | **Recruitment has ZERO role guards** — any authenticated user can create jobs, candidates, issue offer letters | 🔴 CRITICAL | `recruitment.controller.ts` (all 16 endpoints) |
| G2 | **Announcements has ZERO role guards** — any user can create/update/delete announcements | 🔴 CRITICAL | `announcements.controller.ts` (CUD endpoints) |
| G3 | **Festival Bonus has ZERO role guards** — any user can create/modify bonus rules | 🔴 CRITICAL | `festival-bonus.controller.ts` (all 4 endpoints) |
| G4 | **Frontend has NO route-level role protection** — `ProtectedRoute` only checks `isAuthenticated`, not role | 🟠 HIGH | All routes in `App.tsx` |
| G5 | **Sidebar nav items have no `roles` property** — all menu items visible to everyone | 🟠 HIGH | `nav-data.ts` |
| G6 | **No ownership-based access control (ABAC)** — e.g., employees can view ANY claim by ID, not just their own | 🟠 HIGH | Claims, Leave, Attendance detail endpoints |
| G7 | **Role is a plain varchar string** — no enum constraint, no dedicated permissions table | 🟡 MEDIUM | DB schema `employees.role` |
| G8 | **No admin-only superuser concept** — admin and hr always share identical permissions | 🟡 MEDIUM | Architecture-wide |
| G9 | **Employee `findAll` has no role filter** — regular employees see entire employee directory | 🟡 MEDIUM | `employee.controller.ts` GET `/` |
| G10 | **No API audit logging** — no trail of who did what | 🟡 MEDIUM | All modules |
| G11 | **Notifications broadcast endpoint is admin-only** but preferences are unguarded | 🟢 LOW | `notifications.controller.ts` |
| G12 | **Chat room management has no role guards** — any user can create channels, add/remove members | 🟢 LOW | `chat.controller.ts` |

---

## 3. Target Role Architecture

### 3.1 Role Hierarchy (4 Tiers)

```
┌─────────────────────────────────────────────────┐
│  SUPER_ADMIN (admin)                            │
│  Full system control, user management,          │
│  settings, audit logs, role assignment          │
├─────────────────────────────────────────────────┤
│  HR_MANAGER (hr)                                │
│  Employee CRUD, payroll, leave approval,        │
│  recruitment, letters, separation, disciplinary │
├─────────────────────────────────────────────────┤
│  MANAGER (manager)  ← NEW ROLE                  │
│  Team attendance review, leave approval,        │
│  task management, performance reviews           │
├─────────────────────────────────────────────────┤
│  EMPLOYEE (employee)                            │
│  Self-service: attendance, leave apply,         │
│  claims, tasks, profile, chat                   │
└─────────────────────────────────────────────────┘
```

### 3.2 Permission Matrix (Module × Action × Role)

Legend: ✅ = Allowed | ❌ = Denied | 👤 = Own data only | 🔶 = Manager sees team

| Module | Action | admin | hr | manager | employee |
|--------|--------|-------|-----|---------|----------|
| **Employees** | Create | ✅ | ✅ | ❌ | ❌ |
| | Update | ✅ | ✅ | ❌ | ❌ |
| | View All | ✅ | ✅ | 🔶 | ❌ |
| | View Single | ✅ | ✅ | 🔶 | 👤 |
| | Delete/Status Change | ✅ | ❌ | ❌ | ❌ |
| | Reset Password | ✅ | ✅ | ❌ | ❌ |
| **Departments** | Create/Update/Delete | ✅ | ✅ | ❌ | ❌ |
| | View | ✅ | ✅ | ✅ | ✅ |
| **Designations** | Create/Update/Delete | ✅ | ✅ | ❌ | ❌ |
| | View | ✅ | ✅ | ✅ | ✅ |
| **Attendance** | Check-in/out | ✅ | ✅ | ✅ | ✅ |
| | View Own Logs | ✅ | ✅ | ✅ | ✅ |
| | View All/Daily/Range | ✅ | ✅ | 🔶 | ❌ |
| | Correction Request | ✅ | ✅ | ✅ | ✅ |
| | Approve Correction | ✅ | ✅ | 🔶 | ❌ |
| **Attendance Settings** | View | ✅ | ✅ | ✅ | ✅ |
| | Update | ✅ | ✅ | ❌ | ❌ |
| | Holiday CRUD | ✅ | ✅ | ❌ | ❌ |
| **Leave** | Apply | ✅ | ✅ | ✅ | ✅ |
| | View Own | ✅ | ✅ | ✅ | ✅ |
| | View All | ✅ | ✅ | 🔶 | ❌ |
| | Approve/Reject | ✅ | ✅ | 🔶 | ❌ |
| | Cancel Own | ✅ | ✅ | ✅ | ✅ |
| **Leave Types** | CRUD | ✅ | ✅ | ❌ | ❌ |
| | View | ✅ | ✅ | ✅ | ✅ |
| **Payroll** | All operations | ✅ | ✅ | ❌ | ❌ |
| **Salary** | All operations | ✅ | ✅ | ❌ | ❌ |
| **Claims** | Create | ✅ | ✅ | ✅ | ✅ |
| | View Own | ✅ | ✅ | ✅ | ✅ |
| | View All | ✅ | ✅ | 🔶 | ❌ |
| | Approve/Reject/Settle | ✅ | ✅ | ❌ | ❌ |
| | Delete (pending only) | ✅ | ✅ | ✅ | ✅ |
| **Recruitment** | All operations | ✅ | ✅ | ❌ | ❌ |
| **Letters** | All operations | ✅ | ✅ | ❌ | ❌ |
| **Separation** | All operations | ✅ | ✅ | ❌ | ❌ |
| | View Own | ✅ | ✅ | ❌ | 👤 |
| **Disciplinary** | All operations | ✅ | ✅ | ❌ | ❌ |
| **Performance** | Create/View KPI | ✅ | ✅ | ✅ | ✅ |
| | Approve/Review | ✅ | ✅ | 🔶 | ❌ |
| | Settings | ✅ | ✅ | ❌ | ❌ |
| **Announcements** | Create/Update/Delete | ✅ | ✅ | ❌ | ❌ |
| | View | ✅ | ✅ | ✅ | ✅ |
| **Org Chart** | CRUD | ✅ | ✅ | ❌ | ❌ |
| | View | ✅ | ✅ | ✅ | ✅ |
| **Tasks** | Create/Update/Delete | ✅ | ✅ | ✅ | ✅ |
| | View All | ✅ | ✅ | 🔶 | 👤 |
| | Assign | ✅ | ✅ | 🔶 | ❌ |
| **Festival Bonus** | CRUD | ✅ | ✅ | ❌ | ❌ |
| **Chat** | Direct Messages | ✅ | ✅ | ✅ | ✅ |
| | Create Channel | ✅ | ✅ | ❌ | ❌ |
| | Manage Members | ✅ | ✅ | ❌ | ❌ |
| **Notifications** | View/Read/Archive Own | ✅ | ✅ | ✅ | ✅ |
| | Broadcast | ✅ | ❌ | ❌ | ❌ |
| | Preferences | ✅ | ✅ | ✅ | ✅ |
| **Settings** | View/Update | ✅ | ❌ | ❌ | ❌ |
| **Reports** | View | ✅ | ✅ | 🔶 | ❌ |
| **Profile** | View/Update Own | ✅ | ✅ | ✅ | ✅ |
| **Upload** | Upload files | ✅ | ✅ | ✅ | ✅ |

---

## 4. Implementation Plan

### Task 1: Database Schema — Add `manager` Role + Permissions Infrastructure

**Files:** `hr-server/src/db/schema/employee.ts`, new migration

```sql
-- 1. Add CHECK constraint to enforce valid roles
ALTER TABLE employees
  ADD CONSTRAINT chk_role CHECK (role IN ('admin', 'hr', 'manager', 'employee'));

-- 2. Add manager role documentation
COMMENT ON COLUMN employees.role IS 'User role: admin | hr | manager | employee';
```

**Drizzle schema change** in `employee.ts`:
```ts
role: varchar('role', { length: 20, enum: ['admin', 'hr', 'manager', 'employee'] })
  .default('employee').notNull(),
```

**Also update:** `CreateEmployeeDto` to add `@IsIn(['admin', 'hr', 'manager', 'employee'])`.

---

### Task 2: Backend — Create Typed Role Enum + Constants

**New file:** `hr-server/src/common/enums/role.enum.ts`

```ts
export enum Role {
  ADMIN = 'admin',
  HR = 'hr',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

/** Roles that can manage people (employee CRUD, leave approval, etc.) */
export const PEOPLE_MANAGERS = [Role.ADMIN, Role.HR] as const;

/** Roles that can view team data */
export const TEAM_VIEWERS = [Role.ADMIN, Role.HR, Role.MANAGER] as const;

/** All authenticated roles */
export const ALL_ROLES = [Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE] as const;
```

**Update:** All controllers to use `Role` enum instead of string literals:
```ts
// Before
@Roles('admin', 'hr')
// After
@Roles(...PEOPLE_MANAGERS)
```

---

### Task 3: Backend — Fix CRITICAL Gap: Add Missing `@Roles()` Guards

#### 3a. Recruitment Controller (16 unguarded endpoints)

**File:** `hr-server/src/modules/recruitment/recruitment.controller.ts`

| Endpoint | Add Guard |
|----------|-----------|
| `POST /jobs` | `@Roles('admin', 'hr')` |
| `GET /jobs` | `@Roles('admin', 'hr')` |
| `GET /jobs/:id` | `@Roles('admin', 'hr')` |
| `PATCH /jobs/:id` | `@Roles('admin', 'hr')` |
| `DELETE /jobs/:id` | `@Roles('admin', 'hr')` |
| `POST /candidates` | `@Roles('admin', 'hr')` |
| `GET /candidates` | `@Roles('admin', 'hr')` |
| `GET /candidates/:id` | `@Roles('admin', 'hr')` |
| `PATCH /candidates/:id` | `@Roles('admin', 'hr')` |
| `DELETE /candidates/:id` | `@Roles('admin', 'hr')` |
| `PATCH /candidates/:id/stage` | `@Roles('admin', 'hr')` |
| `PATCH /candidates/:id/interview` | `@Roles('admin', 'hr')` |
| `PATCH /candidates/:id/offer` | `@Roles('admin', 'hr')` |
| `PATCH /candidates/:id/joining` | `@Roles('admin', 'hr')` |
| All onboarding endpoints | `@Roles('admin', 'hr')` |
| `GET /analytics` | `@Roles('admin', 'hr')` |

#### 3b. Announcements Controller

**File:** `hr-server/src/modules/announcements/announcements.controller.ts`

| Endpoint | Add Guard |
|----------|-----------|
| `GET /` | No guard (all authenticated users) |
| `GET /:id` | No guard (all authenticated users) |
| `POST /` | `@Roles('admin', 'hr')` |
| `PATCH /:id` | `@Roles('admin', 'hr')` |
| `DELETE /:id` | `@Roles('admin', 'hr')` |

Also: Remove redundant `@UseGuards(JwtAuthGuard)` since it's already a global guard.

#### 3c. Festival Bonus Controller

**File:** `hr-server/src/modules/festival-bonus/festival-bonus.controller.ts`

| Endpoint | Add Guard |
|----------|-----------|
| `GET /` | No guard (read for all) |
| `POST /` | `@Roles('admin', 'hr')` |
| `PATCH /:id` | `@Roles('admin', 'hr')` |
| `DELETE /:id` | `@Roles('admin', 'hr')` |

#### 3d. Chat Controller — Guard Channel Management

**File:** `hr-server/src/modules/chat/chat.controller.ts`

| Endpoint | Add Guard |
|----------|-----------|
| `GET /rooms` | All authenticated |
| `POST /rooms/direct` | All authenticated |
| `POST /rooms/channel` | `@Roles('admin', 'hr')` |
| `POST /rooms/:roomId/members` | `@Roles('admin', 'hr')` |
| `DELETE /rooms/:roomId/members/:employeeId` | `@Roles('admin', 'hr')` |

---

### Task 4: Backend — Ownership-Based Access Control (ABAC Layer)

Add an `@OwnerOnly()` decorator + `OwnershipGuard` for endpoints where employees should only access their own data.

**New files:**
- `hr-server/src/modules/auth/guards/owner.decorator.ts`
- `hr-server/src/modules/auth/guards/ownership.guard.ts`

```ts
// owner.decorator.ts
export const OWNER_ONLY_KEY = 'owner_only';
export const OwnerOnly = () => SetMetadata(OWNER_ONLY_KEY, true);

// ownership.guard.ts
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isOwnerOnly = this.reflector.getAllAndOverride<boolean>(OWNER_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isOwnerOnly) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    // Admin/HR bypass ownership check
    if (user.role === 'admin' || user.role === 'hr') return true;

    // Manager can access team members' data
    if (user.role === 'manager') {
      // Check if the target resource belongs to a team member
      // (Implementation depends on the resource — see per-module logic below)
    }

    // Employee: only own data
    const resourceId = req.params.id || req.params.employeeId;
    if (resourceId && resourceId !== user.id) {
      throw new ForbiddenException('You can only access your own data');
    }

    return true;
  }
}
```

**Apply `@OwnerOnly()` to:**

| Endpoint | Behavior |
|----------|----------|
| `GET /claims/:id` | Employee sees own claims only |
| `GET /leave-applications/:id` | Employee sees own leave only |
| `GET /employees/:id` | Employee sees own profile only |
| `GET /attendance/my-logs` | Already scoped by `req.user.id` ✅ |

---

### Task 5: Backend — Employee List Endpoint Role Scoping

**File:** `hr-server/src/modules/employee/employee.service.ts`

Update `findAll()` to scope results based on the requesting user's role:

```ts
async findAll(query: EmployeeQueryDto, requestingUser: { id: string; role: string; departmentId: string }) {
  // Admin/HR: see all employees
  if (requestingUser.role === 'admin' || requestingUser.role === 'hr') {
    // existing logic — no filter
  }

  // Manager: see only employees in their department
  if (requestingUser.role === 'manager') {
    query.departmentId = requestingUser.departmentId;
  }

  // Employee: cannot list all employees (return empty or throw)
  if (requestingUser.role === 'employee') {
    // Return only dropdown options (already have GET /employees/options)
    throw new ForbiddenException('You do not have permission to view the employee directory');
  }
}
```

**Update controller:**
```ts
@Get()
async findAll(@Req() req: any, @Query() query: EmployeeQueryDto) {
  return this.employeeService.findAll(query, req.user);
}
```

---

### Task 6: Backend — Leave Approval: Manager Scope

**File:** `hr-server/src/modules/leave-application/leave-application.controller.ts`

Currently leave approval is `@Roles('admin', 'hr')`. Add manager support scoped to their team:

```ts
@Patch(':id/approve')
@Roles('admin', 'hr', 'manager')
async approve(@Param('id') id: string, @Req() req: any) {
  // Manager can only approve leave for employees in their department
  return this.leaveApplicationService.approve(id, req.user);
}
```

**Service logic:**
```ts
if (user.role === 'manager') {
  const applicant = await this.getEmployee(app.employeeId);
  if (applicant.departmentId !== user.departmentId) {
    throw new ForbiddenException('You can only approve leave for your team members');
  }
}
```

---

### Task 7: Frontend — Role-Based Route Protection

**New file:** `client/src/components/auth/role-guard.tsx`

```tsx
import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/store/useAuthStore';

interface RoleGuardProps {
  allowedRoles: string[];
  fallbackPath?: string;
}

export function RoleGuard({ allowedRoles, fallbackPath = '/' }: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}
```

**Update `App.tsx` routes:**

```tsx
{/* Admin/HR only routes */}
<Route element={<RoleGuard allowedRoles={['admin', 'hr']} />}>
  <Route path="employees/create" element={<CreateEmployeePage />} />
  <Route path="employees/edit/:id" element={<EditEmployeePage />} />
  <Route path="payroll" element={<PayrollPage />} />
  <Route path="recruitment" element={<RecruitmentPage />} />
  <Route path="separation" element={<SeparationPage />} />
  <Route path="disciplinary" element={<DisciplinaryPage />} />
  <Route path="letters" element={<LettersPage />} />
  <Route path="reports" element={<ReportsPage />} />
  <Route path="settings" element={<SettingsPage />} />
  {/* Department/Designation CRUD */}
  <Route path="departments/create" element={<CreateDepartmentPage />} />
  <Route path="departments/edit/:id" element={<EditDepartmentPage />} />
  <Route path="designations/create" element={<CreateDesignationPage />} />
  <Route path="designations/edit/:id" element={<EditDesignationPage />} />
</Route>

{/* Manager+ routes */}
<Route element={<RoleGuard allowedRoles={['admin', 'hr', 'manager']} />}>
  <Route path="attendance/company" element={<CompanyAttendancePage />} />
  <Route path="performance" element={<PerformancePage />} />
</Route>

{/* All authenticated routes (no role restriction) */}
<Route path="attendance" element={<AttendancePage />} />
<Route path="leave" element={<LeavePage />} />
<Route path="tasks" element={<TasksPage />} />
<Route path="claims/*" element={...} />
<Route path="chat" element={<ChatPage />} />
<Route path="profile" element={<ProfilePage />} />
<Route path="announcements" element={<AnnouncementsPage />} />
```

---

### Task 8: Frontend — Sidebar Navigation Role Filtering

**Update `nav-data.ts`** to add `roles` property to each nav item:

```ts
export const navGroups: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { title: 'Dashboard', href: '/', icon: LayoutDashboard },
      { title: 'Chats & Channels', href: '/chat', icon: MessageSquare },
    ],
  },
  {
    label: 'Workforce',
    items: [
      {
        title: 'Employees',
        href: '/employees',
        icon: Users,
        roles: ['admin', 'hr', 'manager'],  // ← Employees can't see this
      },
      {
        title: 'Recruitment',
        href: '/recruitment',
        icon: UserPlus,
        roles: ['admin', 'hr'],
      },
      { title: 'Task Management', href: '/tasks', icon: CheckSquare },
      { title: 'Attendance', href: '/attendance', icon: CalendarClock },
      {
        title: 'Company Attendance',
        href: '/attendance/company',
        icon: CalendarClock,
        roles: ['admin', 'hr', 'manager'],
      },
      { title: 'Leave Management', href: '/leave', icon: CalendarOff },
      {
        title: 'HR Letters',
        href: '/letters',
        icon: FileText,
        roles: ['admin', 'hr'],
      },
      {
        title: 'Separation',
        href: '/separation',
        icon: UserMinus,
        roles: ['admin', 'hr'],
      },
      {
        title: 'Disciplinary',
        href: '/disciplinary',
        icon: Scale,
        roles: ['admin', 'hr'],
      },
      {
        title: 'KPI & Performance',
        href: '/performance',
        icon: Target,
        roles: ['admin', 'hr', 'manager'],
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        title: 'Salary & Payroll',
        href: '/payroll',
        icon: Coins,
        roles: ['admin', 'hr'],
      },
      { title: 'Claims & Reimbursement', href: '/claims', icon: HeartPulse, items: [...] },
    ],
  },
  {
    label: 'Organization',
    items: [
      { title: 'Org Structure', href: '/departments', icon: Building2 },
      { title: 'Announcements', href: '/announcements', icon: Megaphone },
      {
        title: 'Reports',
        href: '/reports',
        icon: BarChart3,
        roles: ['admin', 'hr', 'manager'],
      },
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        roles: ['admin'],  // Only super admin
      },
    ],
  },
];
```

The sidebar already filters by `item.roles.includes(mappedUser.role)` on line 104 — so this will work immediately.

---

### Task 9: Frontend — Conditional UI Elements (Buttons/Actions)

Create a reusable `<Authorized>` component for inline permission checks:

**New file:** `client/src/components/auth/authorized.tsx`

```tsx
import { useAuthStore } from '@/store/useAuthStore';

interface AuthorizedProps {
  roles?: string[];
  /** If true, also check ownership (current user's ID matches resourceOwnerId) */
  ownOnly?: boolean;
  resourceOwnerId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Authorized({ roles, ownOnly, resourceOwnerId, children, fallback = null }: AuthorizedProps) {
  const { user } = useAuthStore();

  if (!user) return <>{fallback}</>;

  // Role check
  if (roles && !roles.includes(user.role)) return <>{fallback}</>;

  // Ownership check (employee can only act on own resources)
  if (ownOnly && user.role === 'employee' && resourceOwnerId !== user.id) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

**Usage examples:**
```tsx
{/* Only Admin/HR see the "Add Employee" button */}
<Authorized roles={['admin', 'hr']}>
  <Button onClick={() => navigate('/employees/create')}>Add Employee</Button>
</Authorized>

{/* Only owner or admin can delete a claim */}
<Authorized roles={['admin', 'hr']} ownOnly resourceOwnerId={claim.employeeId}>
  <Button variant="destructive">Delete</Button>
</Authorized>
```

---

### Task 10: Backend — Update JWT Payload with Department Context

**File:** `hr-server/src/modules/auth/auth.service.ts`

Add `departmentId` to the JWT payload so the `OwnershipGuard` and frontend can use it without extra API calls:

```ts
// In generateTokens()
this.jwtService.signAsync({
  sub: userId,
  email,
  role,
  ver: version,
  jti: randomUUID(),
  departmentId,  // ← Add this
}, ...)
```

**Update `JwtStrategy`** to include `departmentId` in the user object attached to `req.user`.

---

### Task 11: Backend — Audit Logging Interceptor

**New files:**
- `hr-server/src/common/interceptors/audit-log.interceptor.ts`

```ts
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly db: DrizzleService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    // Only log state-changing operations
    if (['GET', 'OPTIONS', 'HEAD'].includes(method)) {
      return next.handle();
    }

    const startTime = Date.now();
    return next.handle().pipe(
      tap(async () => {
        const duration = Date.now() - startTime;
        await this.db.insert(auditLogs).values({
          userId: req.user?.id,
          userRole: req.user?.role,
          action: `${method} ${req.routeOptions?.url || req.url}`,
          resourceType: req.routeOptions?.url?.split('/')[1] || 'unknown',
          resourceId: req.params?.id || null,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          statusCode: context.switchToHttp().getResponse().statusCode,
          duration,
        });
      }),
    );
  }
}
```

**New schema table:**
```ts
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => employees.id),
  userRole: varchar('user_role', { length: 20 }),
  action: varchar('action', { length: 500 }).notNull(),
  resourceType: varchar('resource_type', { length: 100 }),
  resourceId: varchar('resource_id', { length: 100 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  statusCode: integer('status_code'),
  duration: integer('duration'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

### Task 12: Database Migration

**Steps:**
1. Add `manager` to role CHECK constraint
2. Create `audit_logs` table
3. Create index on `audit_logs(user_id, created_at)`
4. Create index on `audit_logs(resource_type, resource_id)`
5. Seed a `manager` role employee for testing

**Drizzle migration commands:**
```bash
cd hr-server
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

### Task 13: Update Auth Store Type

**File:** `client/src/store/useAuthStore.ts`

```ts
export interface User {
  // ... existing fields
  role: 'admin' | 'hr' | 'manager' | 'employee';  // Typed union instead of string
}
```

---

### Task 14: Update `types/index.ts` NavItem

**File:** `client/src/types/index.ts`

Ensure `NavItem` type includes `roles`:
```ts
export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  roles?: string[];  // If omitted, visible to all
  items?: NavItem[];
}
```

---

### Task 15: Testing Checklist

| # | Test Case | Expected Result |
|---|-----------|----------------|
| 1 | Employee logs in → visits `/payroll` | Redirected to `/` |
| 2 | Employee logs in → sidebar | Payroll, Recruitment, Letters, Settings NOT visible |
| 3 | Employee → `POST /recruitment/jobs` | 403 Forbidden |
| 4 | Employee → `POST /announcements` | 403 Forbidden |
| 5 | Employee → `GET /claims/:id` (not their claim) | 403 Forbidden |
| 6 | Employee → `GET /employees` | 403 Forbidden |
| 7 | HR → all recruitment endpoints | 200 OK |
| 8 | HR → create announcement | 200 OK |
| 9 | Manager → view team attendance | 200 OK (team only) |
| 10 | Manager → approve leave for team member | 200 OK |
| 11 | Manager → approve leave for non-team member | 403 Forbidden |
| 12 | Manager → access payroll | 403 Forbidden / redirected |
| 13 | Admin → full access to everything | 200 OK |
| 14 | Admin → audit log entries created for POST/PATCH/DELETE | Records in `audit_logs` |
| 15 | Employee → direct URL `/employees/create` | Redirected to `/` |

---

## 5. Implementation Order (Priority Sequence)

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P0 | Task 3a: Guard Recruitment endpoints | 30 min | 🔴 Fixes CRITICAL security hole |
| P0 | Task 3b: Guard Announcements endpoints | 15 min | 🔴 Fixes CRITICAL security hole |
| P0 | Task 3c: Guard Festival Bonus endpoints | 15 min | 🔴 Fixes CRITICAL security hole |
| P1 | Task 7: Frontend route protection | 45 min | 🟠 Prevents unauthorized page access |
| P1 | Task 8: Sidebar role filtering | 20 min | 🟠 Hides irrelevant menu items |
| P1 | Task 5: Employee list role scoping | 30 min | 🟠 Prevents employee directory leak |
| P2 | Task 1: Add `manager` role to DB | 30 min | 🟡 Enables new role tier |
| P2 | Task 2: Typed Role enum | 20 min | 🟡 Code quality + type safety |
| P2 | Task 4: Ownership-based access control | 1 hr | 🟠 Prevents cross-user data access |
| P2 | Task 9: `<Authorized>` component | 30 min | 🟡 Better UX for role-gated UI |
| P3 | Task 6: Manager leave approval scope | 45 min | 🟡 Manager feature |
| P3 | Task 10: JWT department context | 20 min | 🟡 Supports manager scoping |
| P3 | Task 11: Audit logging | 1 hr | 🟡 Compliance trail |
| P3 | Task 12: DB migration | 30 min | 🟡 Schema changes |

---

## 6. Security Hardening Notes

### 6.1 Defense in Depth
- **Layer 1:** Global `JwtAuthGuard` (authentication)
- **Layer 2:** `RolesGuard` (authorization by role)
- **Layer 3:** `OwnershipGuard` (authorization by resource ownership)
- **Layer 4:** Service-level checks (business logic validation)
- **Layer 5:** Frontend route guards + sidebar filtering (UX)
- **Layer 6:** `<Authorized>` component (UI element visibility)

### 6.2 OWASP Compliance
- ✅ Short-lived access tokens (15m)
- ✅ Refresh token rotation with version tracking
- ✅ Redis-backed token blacklist
- ✅ Rate-limited login
- 🔲 Add: Audit logging (Task 11)
- 🔲 Add: CSRF token for cookie-based auth (future)
- 🔲 Add: API request signing (future)

### 6.3 Principle of Least Privilege
- Every endpoint defaults to **deny-all** (requires authentication)
- `@Roles()` explicitly lists which roles are allowed
- No wildcard "allow all" patterns
- Employees only access their own data by default

---

## 7. Google-Standard Enterprise Features (Phase 2)

### 7.1 Resource-Based Permission Model (Google IAM Style)

Instead of coarse role strings, define granular **resource:action** permissions stored in the database:

**New tables:**

```sql
-- permissions: the universe of all possible actions
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource VARCHAR(100) NOT NULL,    -- 'employees', 'payroll', 'leave', 'claims'
  action VARCHAR(50) NOT NULL,       -- 'create', 'read', 'update', 'delete', 'approve', 'export'
  description TEXT,
  UNIQUE(resource, action)
);

-- role_permissions: which roles have which permissions
CREATE TABLE role_permissions (
  role VARCHAR(20) NOT NULL,
  permission_id UUID REFERENCES permissions(id),
  PRIMARY KEY(role, permission_id)
);

-- custom_role_permissions: for admin-created custom roles
CREATE TABLE custom_role_permissions (
  custom_role_id UUID REFERENCES custom_roles(id),
  permission_id UUID REFERENCES permissions(id),
  PRIMARY KEY(custom_role_id, permission_id)
);
```

**Seed permissions (84 total):**

```
employees:create    employees:read     employees:update    employees:delete
employees:export    employees:reset_password               employees:view_all
employees:view_own  employees:view_team
payroll:create      payroll:read       payroll:process     payroll:disburse
payroll:export      payroll:view_all   payroll:view_own
leave:apply         leave:approve      leave:reject        leave:view_all
leave:view_own      leave:view_team    leave:cancel        leave:export
claims:create       claims:approve     claims:reject       claims:settle
claims:view_all     claims:view_own    claims:delete
recruitment:create  recruitment:read   recruitment:update  recruitment:delete
recruitment:interview  recruitment:offer_letter  recruitment:onboarding
letters:create      letters:read       letters:update      letters:delete
separation:create   separation:read    separation:update   separation:delete
separation:settlement
disciplinary:create disciplinary:read  disciplinary:update disciplinary:delete
performance:create  performance:review performance:approve performance:view_all
performance:view_own  performance:view_team
attendance:checkin  attendance:checkout attendance:correction_request
attendance:approve_correction  attendance:view_all  attendance:view_own
attendance:view_team  attendance_settings:update
announcements:create announcements:read announcements:update announcements:delete
departments:create  departments:read   departments:update  departments:delete
designations:create designations:read  designations:update designations:delete
org_chart:create    org_chart:read     org_chart:update    org_chart:delete
salary:create       salary:read        salary:update       salary:delete
salary:bulk_revision  salary:export
festival_bonus:create festival_bonus:read festival_bonus:update festival_bonus:delete
tasks:create        tasks:read         tasks:update        tasks:delete
tasks:assign        tasks:view_all     tasks:view_own      tasks:view_team
settings:read       settings:update
reports:read        reports:export
chat:create_channel chat:manage_members chat:direct_message
notifications:broadcast  notifications:preferences
audit_logs:read     audit_logs:export
```

**Default role→permission mapping:**

| Role | Permission Scope |
|------|-----------------|
| `admin` | ALL permissions (superuser) |
| `hr` | Everything except `settings:update`, `audit_logs:*`, `employees:delete` |
| `manager` | `*_team` + `*_own` + approval flows for their department |
| `employee` | `*_own` + create/apply actions only |

**New decorator:** `@RequirePermission('payroll:approve')` replaces `@Roles('admin', 'hr')`:

```ts
// New file: hr-server/src/common/decorators/permissions.decorator.ts
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// New guard: hr-server/src/common/guards/permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private db: DrizzleService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (!required?.length) return true;

    const { user } = context.switchToHttp().getRequest();

    // Admin bypass — has all permissions
    if (user.role === 'admin') return true;

    // Fetch user's permissions from DB (cached in Redis)
    const userPerms = await this.getUserPermissions(user.role);
    return required.every(p => userPerms.has(p));
  }
}
```

---

### 7.2 Custom Roles (Admin-Defined)

Allow the super admin to create custom roles with specific permission sets:

```sql
CREATE TABLE custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_by UUID REFERENCES employees(id),
  is_system BOOLEAN DEFAULT FALSE,  -- system roles can't be deleted
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- employees reference custom roles too
ALTER TABLE employees ADD COLUMN custom_role_id UUID REFERENCES custom_roles(id);
```

**Admin UI:** Settings → Roles & Permissions → Create Role → toggle checkboxes for each permission.

---

### 7.3 Separation of Duties (SoD)

Google enforces that **no single person can complete a sensitive workflow end-to-end**. Apply this to:

| Workflow | Rule | Implementation |
|----------|------|---------------|
| **Payroll** | Creator ≠ Approver ≠ Disburser | Track `created_by`, `approved_by`, `disbursed_by` — reject if same person |
| **Salary Revision** | Proposer ≠ Approver | Require 2 different HR/admin users |
| **Claims > ৳50,000** | Requires dual approval | Add `second_approver_id` column |
| **Separation Settlement** | Calculator ≠ Approver | Different users for draft vs. approval |

**Implementation:**
```ts
// In payroll service
async processCycle(monthKey: string, userId: string) {
  const cycle = await this.getCycle(monthKey);
  if (cycle.createdBy === userId) {
    throw new ForbiddenException(
      'Separation of duties: the person who created the payroll cycle cannot process it'
    );
  }
  // ...
}
```

---

### 7.4 Conditional Access Policies (CAP)

Inspired by Google Workspace / Azure AD conditional access:

```sql
CREATE TABLE access_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  -- Conditions (JSON for flexibility)
  conditions JSONB NOT NULL DEFAULT '{}',
  -- Effect
  effect VARCHAR(10) NOT NULL DEFAULT 'deny',  -- 'allow' | 'deny' | 'require_mfa'
  -- Target
  target_roles TEXT[],         -- which roles this applies to
  target_resources TEXT[],     -- which resources/modules
  priority INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Example policies:**

```json
{
  "name": "Payroll only during business hours",
  "conditions": {
    "time_window": { "start": "08:00", "end": "20:00", "timezone": "Asia/Dhaka" }
  },
  "effect": "deny",
  "target_roles": ["hr"],
  "target_resources": ["payroll:disburse"]
}
```

```json
{
  "name": "Admin requires 2FA",
  "conditions": {},
  "effect": "require_mfa",
  "target_roles": ["admin"],
  "target_resources": ["*"]
}
```

```json
{
  "name": "Block access from outside office IP",
  "conditions": {
    "ip_not_in": ["103.48.16.0/24", "103.95.97.0/24"]
  },
  "effect": "deny",
  "target_roles": ["hr", "manager"],
  "target_resources": ["payroll:*", "salary:*"]
}
```

**Policy evaluation middleware:**
```ts
@Injectable()
export class ConditionalAccessGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const resource = `${req.routeOptions?.url?.split('/')[1]}:${req.method.toLowerCase()}`;

    const policies = await this.getPoliciesForUser(req.user.role, resource);

    for (const policy of policies.sort((a, b) => a.priority - b.priority)) {
      const matches = await this.evaluateConditions(policy.conditions, req);
      if (matches) {
        if (policy.effect === 'deny') throw new ForbiddenException(`Blocked by policy: ${policy.name}`);
        if (policy.effect === 'require_mfa' && !req.user.mfaVerified) {
          throw new ForbiddenException('MFA required for this action');
        }
      }
    }
    return true;
  }
}
```

---

### 7.5 Multi-Level Approval Chains

For high-value or sensitive operations, require sequential approvals:

```sql
CREATE TABLE approval_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(50) NOT NULL,        -- 'leave', 'claims', 'payroll'
  resource_id UUID NOT NULL,          -- the entity being approved
  current_step INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending',  -- pending | approved | rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES approval_chains(id),
  step_order INTEGER NOT NULL,
  approver_role VARCHAR(20) NOT NULL,
  approver_id UUID REFERENCES employees(id),
  status VARCHAR(20) DEFAULT 'pending',
  decided_at TIMESTAMPTZ,
  comments TEXT
);
```

**Example: Leave > 7 days requires 2-level approval:**
```
Step 1: Line Manager / HR approves
Step 2: Admin approves (only if days > 7)
```

---

### 7.6 Field-Level Security

Control which roles can see/modify specific fields on an entity:

```ts
// New file: hr-server/src/common/interceptors/field-security.interceptor.ts
const FIELD_VISIBILITY: Record<string, Record<string, string[]>> = {
  employees: {
    passwordHash: [],              // never exposed
    salary: ['admin', 'hr'],       // only admin/hr see salary
    nidNumber: ['admin', 'hr'],    // sensitive PII
    tinNumber: ['admin', 'hr'],
    emergencyContactNumber: ['admin', 'hr', 'employee'],  // own only
    phone: ['admin', 'hr', 'manager', 'employee'],
    email: ['admin', 'hr', 'manager', 'employee'],
  },
};

@Injectable()
export class FieldSecurityInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const resource = req.routeOptions?.url?.split('/')[1];

    return next.handle().pipe(
      map((data) => {
        if (!data || !resource || !FIELD_VISIBILITY[resource]) return data;
        return this.sanitizeFields(data, resource, req.user);
      }),
    );
  }

  private sanitizeFields(data: any, resource: string, user: any) {
    const rules = FIELD_VISIBILITY[resource];
    const sanitized = { ...data };

    for (const [field, allowedRoles] of Object.entries(rules)) {
      if (!allowedRoles.includes(user.role)) {
        delete sanitized[field];
      }
      // Employee can only see own sensitive fields
      if (user.role === 'employee' && data.id !== user.id) {
        delete sanitized[field];
      }
    }
    return sanitized;
  }
}
```

---

### 7.7 Just-in-Time (JIT) Access / Temporary Elevation

Allow managers to temporarily gain elevated permissions with automatic expiry:

```sql
CREATE TABLE temporary_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES employees(id) NOT NULL,
  elevated_role VARCHAR(20) NOT NULL,
  reason TEXT NOT NULL,
  requested_by UUID REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- pending | active | expired | revoked
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Flow:**
1. Manager requests temporary HR access (reason: "HR manager on leave")
2. Admin approves → access granted for 7 days
3. System auto-revokes after expiry via BullMQ scheduled job
4. Audit log records the entire lifecycle

---

### 7.8 Admin Audit Dashboard

A dedicated admin page showing searchable audit trail:

**Backend:** `GET /admin/audit-logs?user=X&resource=Y&action=Z&from=A&to=B&cursor=C`

**Frontend:** `/admin/audit-logs` page with:
- Filterable table (by user, resource, action, date range)
- Export to CSV
- Real-time feed via WebSocket
- Drill-down into individual events

---

### 7.9 Resource Hierarchy & Permission Inheritance

Google's org units allow permissions to cascade. Implement inheritance:

```
Organization
├── Division (Engineering)
│   ├── Department (Backend)
│   │   └── Team (API)
│   └── Department (Frontend)
└── Division (Operations)
    └── Department (HR)
```

**Permission inheritance rules:**
- A `manager` of "Engineering" automatically has manager access to "Backend" and "Frontend"
- HR policies set at org level cascade to all divisions
- Department-level overrides take precedence over division-level settings

**Schema addition:**
```sql
-- Add parent_id to departments for hierarchy
ALTER TABLE departments ADD COLUMN parent_id UUID REFERENCES departments(id);
```

---

### 7.10 Two-Factor Authentication (2FA)

For admin and HR roles, require TOTP-based 2FA:

```sql
ALTER TABLE employees ADD COLUMN mfa_secret VARCHAR(255);
ALTER TABLE employees ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN mfa_backup_codes TEXT[];
```

**Flow:**
1. Admin enables 2FA in Settings → generates QR code (TOTP secret)
2. User scans with Google Authenticator / Authy
3. On login: if `mfa_enabled`, require 6-digit code as second step
4. Backup codes generated for recovery

**Packages:** `otplib` (TOTP), `qrcode` (QR generation)

---

### 7.11 Session Management

Admin can view and manage all active sessions:

```sql
CREATE TABLE active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES employees(id) NOT NULL,
  refresh_token_jti VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_info JSONB,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Admin actions:**
- View all sessions for any user
- Revoke individual sessions
- Revoke all sessions for a user (force logout)
- See login history with IP geolocation

---

### 7.12 Data Classification & Export Controls

Classify data sensitivity and control exports:

| Classification | Example Data | Who Can Export | Watermark |
|---------------|-------------|---------------|----------|
| **Public** | Department names, job titles | Anyone | No |
| **Internal** | Employee directory, attendance | admin, hr | No |
| **Confidential** | Salary, NID, TIN | admin only | Yes (with user stamp) |
| **Restricted** | Password hashes, tokens | Nobody | N/A |

**Implementation:** Tag export endpoints with classification level and enforce role checks + audit logging on every export action.

---

## 8. Implementation Roadmap

| Phase | Scope | Timeline |
|-------|-------|----------|
| **Phase 1** (This sprint) | Tasks 1-15: Core RBAC + gap fixes + frontend protection | 1-2 weeks |
| **Phase 2** (Next sprint) | §7.1-7.3: Permission model + custom roles + SoD | 2-3 weeks |
| **Phase 3** (Month 2) | §7.4-7.6: Conditional access + approval chains + field security | 2-3 weeks |
| **Phase 4** (Month 3) | §7.7-7.12: JIT access + audit dashboard + 2FA + session mgmt | 3-4 weeks |

---

## 9. Comparison: This Plan vs Google Workspace RBAC

| Feature | Google Workspace | This Plan |
|---------|-----------------|----------|
| Role-based access | ✅ | ✅ Phase 1 |
| Resource-based permissions | ✅ `admin.directory.user.read` | ✅ Phase 2 (§7.1) |
| Custom roles | ✅ | ✅ Phase 2 (§7.2) |
| Separation of duties | ✅ | ✅ Phase 2 (§7.3) |
| Conditional access policies | ✅ | ✅ Phase 3 (§7.4) |
| Multi-level approval | ✅ | ✅ Phase 3 (§7.5) |
| Field-level security | ✅ | ✅ Phase 3 (§7.6) |
| Just-in-time access | ✅ | ✅ Phase 4 (§7.7) |
| Audit logging + dashboard | ✅ | ✅ Phase 1 (basic) + Phase 4 (dashboard) |
| Resource hierarchy | ✅ Org units | ✅ Phase 4 (§7.9) |
| 2FA / MFA | ✅ | ✅ Phase 4 (§7.10) |
| Session management | ✅ | ✅ Phase 4 (§7.11) |
| Data classification | ✅ | ✅ Phase 4 (§7.12) |
| SCIM/SAML SSO | ✅ | 🔲 Post-Phase 4 |
