# HR Management System

Enterprise-grade Human Resource Management System built with a full-stack TypeScript architecture — **NestJS + Fastify** backend and **React 19 + Vite** frontend, powered by PostgreSQL, Redis, and WebSocket real-time communication.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Security](#security)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Testing](#testing)
- [Knowledge Graph](#knowledge-graph)
- [Architecture Decisions](#architecture-decisions)

---

## Features

### Core HR
| Feature | Description |
|---------|-------------|
| **Employee Management** | Full CRUD with 7-step form: personal info, employment, family, nominees, banking, documents, review |
| **Employee Profile** | View/edit employee details, status changes (active/inactive/terminated), password reset |
| **Department Management** | CRUD with hierarchy views, employee count tracking |
| **Designation Management** | CRUD with department linkage |
| **Organization Chart** | Visual tree view of reporting structure with drag-and-drop hierarchy |
| **Documents** | Employee document management with Cloudinary cloud storage |

### Attendance & Leave
| Feature | Description |
|---------|-------------|
| **My Attendance** | Personal check-in/check-out, monthly calendar view, daily logs |
| **Company Attendance** | Manager/HR view for team-wide attendance monitoring with filters |
| **Attendance Settings** | Office hours config, holiday management, auto-checkin/checkout cron |
| **Override Attendance** | Admin override for missed punches or corrections |
| **Request Correction** | Employee self-service attendance correction with approval flow |
| **Leave Applications** | Apply, approve, cancel with multi-type leave (annual, sick, casual, etc.) |
| **Leave Types** | Configurable leave types with color-coded badges, carry-forward rules |
| **Leave Balance** | Real-time balance tracking, utilization metrics, leave summary cards |
| **Leave Applications Page** | Manager view for all team leave requests with approve/cancel actions |
| **Auto Check-in/out** | BullMQ scheduled jobs that auto-punch on working days (holiday/weekend aware) |

### Payroll & Compensation
| Feature | Description |
|---------|-------------|
| **Payroll Processing** | Monthly cycle: generate payslips, adjustments, cross-month partial payments |
| **Salary Management** | Template-based salary structure (basic, HRA, transport, etc.) with bulk revision |
| **Payslip Generation** | Printable payslips with detailed allowance/deduction breakdown |
| **Payroll Approvals** | Line Manager → MD multi-level approval workflow |
| **Payroll Disbursement** | Final disbursement with bank transfer tracking |
| **Disbursement Logs** | Audit trail of all payroll disbursements |
| **Festival Bonus** | Cycle-based bonus distribution with LM/MD approval tiers |
| **Provident Fund** | PF contribution tracking, withdrawal requests, ledger, settings |
| **Loans & Advances** | Loan requests with installment plans, manual payment recording |
| **Assets** | Company asset allocation (laptop, phone, etc.) with return tracking and history |
| **Employee Salary** | Per-employee salary view with history and template assignment |

### Claims & Reimbursement
| Feature | Description |
|---------|-------------|
| **Medical Reimbursement** | Medical expense claims with attachment uploads |
| **TADA Claims** | Travel and daily allowance claims |
| **Business Travel Advance** | Advance payment requests for business travel |
| **Claim Attachments** | File uploads via Cloudinary with claim linking |

### Recruitment & Onboarding
| Feature | Description |
|---------|-------------|
| **Job Openings** | Create/manage job postings with department, designation, deadline |
| **Candidate Pipeline** | Kanban-style tracking through stages (applied → interview → offered → hired) |
| **Interview Scheduling** | Schedule interviews with date, type, and notes |
| **Recruitment Analytics** | Pipeline funnel, open positions, time-to-hire metrics |
| **Offer Letters** | Auto-generated offer letter templates with print |
| **Joining Letters** | Auto-generated joining letter templates with print |
| **Onboarding** | Structured onboarding profile with task checklist for new hires |

### Performance Management
| Feature | Description |
|---------|-------------|
| **KPI Management** | Define Key Performance Indicators with weightage and scoring |
| **Appraisal Cycles** | Create review cycles, assign KPIs, track progress |
| **Self Appraisal** | Employees self-score against assigned KPIs |
| **Manager Appraisal** | Managers score team members' KPIs independently |
| **Performance Overview** | Visual performance trends and cycle history |

### Task & Project Management
| Feature | Description |
|---------|-------------|
| **Projects** | Create projects with description, members, deadlines |
| **Milestones** | Break projects into milestones with target dates |
| **Tasks** | Create/assign tasks with priority, status, due dates |
| **Task Views** | Board (Kanban), List, Gantt chart, Workload views |
| **Checklists** | Sub-task checklists within each task |
| **Dependencies** | Task-to-task dependency linking |
| **Time Tracking** | Built-in timer + manual time entry with descriptions |
| **Attachments** | File attachments on tasks via Cloudinary |
| **Comments** | Threaded comments for task collaboration |
| **Activity Log** | Full audit trail of task changes |
| **Bulk Operations** | Bulk import, delete, time log entry |
| **WebSocket Sync** | Real-time task updates across connected clients |

### Communication
| Feature | Description |
|---------|-------------|
| **Chat System** | Real-time messaging via WebSocket — channels and direct messages |
| **Voice/Video Calls** | WebRTC-based calling with signaling server, call logs |
| **Chat Rooms** | Create channels, add members, role-based access (owner/admin/member) |
| **Presence** | Online/offline/typing indicators via WebSocket |
| **Announcements** | Company-wide and targeted announcements with priority |
| **Notifications** | Real-time notification bell with module/category/priority, action routing |
| **Notification Preferences** | Per-employee config: disable modules, quiet hours, digest frequency |
| **Deduplication** | Smart notification dedup to prevent spam |

### Administration
| Feature | Description |
|---------|-------------|
| **Roles & Permissions** | Pure custom RBAC — create roles, assign granular permissions |
| **Settings: Attendance** | Office hours, holidays, auto-action config |
| **Settings: Salary** | Salary template management, component configuration |
| **Settings: Festival Bonus** | Bonus cycle settings |
| **Settings: Access Control** | Role CRUD with permission assignment |
| **Settings: Theme** | Light/dark/system theme preference |
| **Settings: Notifications** | Notification preference management |
| **Audit Logs** | Trail of all state-changing operations (POST, PATCH, PUT, DELETE) |
| **Office Regulations** | Policy creation and request management |
| **Reports** | Workforce headcount, attendance summary, leave utilization, payroll cost analytics |

### Executive Dashboard
| Feature | Description |
|---------|-------------|
| **CEO Dashboard** | High-level KPIs: workforce charts, attendance trends, leave analytics |
| **Performance Overview** | Quick performance metrics for executives |
| **Recruitment Pipeline** | Hiring funnel visualization |
| **Quick Actions** | Fast access to key management functions |
| **Activity Feed** | Recent system activity stream |
| **Line Manager Approvals** | Payroll and festival bonus approval workflow |
| **MD Approvals** | Final approval authority for payroll disbursement |

### Employee Lifecycle
| Feature | Description |
|---------|-------------|
| **Employee Separation** | Exit process initiation with settlement calculation |
| **Final Settlement** | Settlement draft with dues/credits computation |
| **Disciplinary Cases** | Case tracking, action management, resolution workflow |

### Letters & Print Templates
| Feature | Description |
|---------|-------------|
| **HR Letters** | Create, manage, and issue HR letters (experience, termination, etc.) |
| **Letter Status** | Track letter lifecycle (draft → issued → acknowledged) |
| **Print: Joining Letter** | Printable joining letter template |
| **Print: Offer Letter** | Printable offer letter template |
| **Print: HR Letter** | Printable HR letter template |
| **Print: Payslip** | Printable payslip with full breakdown |

---

## Technology Stack

### Backend (`hr-server/`)

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 20+ |
| Framework | NestJS | 11 |
| HTTP Engine | Fastify | (via @nestjs/platform-fastify) |
| Language | TypeScript | 5.7 |
| Database | PostgreSQL (Neon serverless) | — |
| ORM | Drizzle ORM | 0.39+ |
| Migrations | Drizzle Kit | 0.31+ |
| Cache | Redis (ioredis) | 5.11+ |
| Job Queue | BullMQ | 5.78+ |
| Auth | JWT + Passport | @nestjs/jwt 11, passport-jwt 4 |
| Password | bcrypt | 6.0 |
| File Upload | Cloudinary | 2.10+ (via @fastify/multipart) |
| WebSocket | @nestjs/websockets + ws | 11.1+ / 8.21+ |
| Validation | class-validator + class-transformer | 0.15 / 0.5 |
| Security | @fastify/helmet | 13.0 |
| Rate Limiting | @fastify/rate-limit | 11.0 |
| Compression | @fastify/compress (Brotli + Gzip) | 9.0 |
| Cookies | @fastify/cookie | 11.0 |
| Logging | Pino + pino-pretty | 10.3 / 13.1 |
| API Docs | @nestjs/swagger | 11.4 |
| Testing | Jest 30 + Supertest 7 | E2E |
| Config | @nestjs/config (typed, namespaced) | 4.0 |

### Frontend (`client/`)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.2 |
| Build Tool | Vite | 8.0 |
| Language | TypeScript | 6.0 |
| Compiler | React Compiler (Babel) | babel-plugin-react-compiler |
| Styling | Tailwind CSS | 4.3 |
| UI Primitives | shadcn/ui + Radix UI | 4.11 / 1.5 |
| Icons | Lucide React | 1.17 |
| State (global) | Zustand | 5.0 |
| Data Fetching | TanStack React Query | 5.101 |
| HTTP Client | Axios | 1.18 |
| Routing | React Router | 7.17 |
| Forms | React Hook Form + Zod | 7.78 / 4.4 |
| Charts | Recharts | 3.8 |
| Date Handling | date-fns | 4.4 |
| Calendar | react-day-picker | 10.0 |
| Theme | next-themes (light/dark/system) | 0.4 |
| Toast | Sonner | 2.0 |
| Alerts | SweetAlert2 | 11.26 |
| Carousel | embla-carousel-react | 8.6 |
| OTP Input | input-otp | 1.4 |
| Panels | react-resizable-panels | 4.11 |
| Drawer | vaul | 1.1 |
| Command Palette | cmdk | 1.1 |
| Font | Geist Variable | 5.2 |

### Infrastructure

| Component | Service | Purpose |
|-----------|---------|---------|
| Database | Neon PostgreSQL | Serverless Postgres with connection pooling |
| File Storage | Cloudinary | Image/document upload, transformation, CDN |
| Cache | Redis (local) | API response caching, session keys, rate limit counters |
| Job Queue | BullMQ (Redis-backed) | Auto-checkin/out, notification processing, chat notifications |
| Tunnel | Cloudflare Tunnel | Production HTTPS endpoint without public IP |
| WebSocket | Native ws | Chat, task sync, notification push |

---

## Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (React 19 + Vite)                        │
│                                                                          │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌───────────────────────┐  │
│  │  Pages   │  │ Components │  │  Hooks   │  │    Zustand Stores     │  │
│  │  (50+)   │  │  (shadcn)  │  │(React Q) │  │  auth, chat, call,    │  │
│  │ lazy     │  │  55 UI +   │  │  34 hook  │  │  notification, org    │  │
│  │ loaded   │  │  20 domain │  │  files    │  │                       │  │
│  └────┬─────┘  └─────┬──────┘  └────┬─────┘  └───────────┬───────────┘  │
│       └───────────────┴──────────────┴────────────────────┘              │
│                        Axios Instance + WebSocket Hooks                   │
│              (auto token refresh, error toast, retry queue)               │
└───────────────────────────────────┬──────────────────────────────────────┘
                                    │ HTTPS / WSS
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     SERVER (NestJS 11 + Fastify)                         │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    Global Middleware Pipeline                      │  │
│  │  Request ID → Helmet → Rate Limit → CORS → Cookie → Compression   │  │
│  │  → Multipart → Validation (whitelist) → Logging → Audit Log       │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                  Security Guard Chain (3 layers)                   │  │
│  │  JwtAuthGuard → RolesGuard → OwnershipGuard                       │  │
│  │  (validate token)  (check permissions)  (verify resource owner)    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────┐  ┌────────────────────────────────────┐   │
│  │   32 Feature Modules     │  │   3 WebSocket Gateways             │   │
│  │                          │  │                                    │   │
│  │  Each module contains:   │  │  ChatGateway    (messaging, calls) │   │
│  │  • Controller (routes)   │  │  TasksGateway   (real-time sync)   │   │
│  │  • Service (business)    │  │  NotificationGateway (push)        │   │
│  │  • DTOs (validation)     │  │                                    │   │
│  │  • Repository (data)     │  └────────────────────────────────────┘   │
│  └──────────┬───────────────┘                                           │
│             │                                                            │
│  ┌──────────┴───────────────────────────────────────────────────────┐   │
│  │                       Data & Infrastructure                      │   │
│  │  PostgreSQL (Drizzle)  │  Redis Cache  │  BullMQ Processors      │   │
│  │  61 tables, migrations │  TTL-based    │  Auto-checkin/out       │   │
│  │                        │  caching      │  Notification dispatch  │   │
│  │                        │               │  Chat notifications     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Authentication & Token Flow

```
┌─────────┐     POST /auth/login      ┌──────────┐
│  Client  │ ──────────────────────────▶│  Server  │
│          │    { email, password }     │          │
│          │◀──────────────────────────│          │
│          │  { accessToken (15m) }     │          │
│          │  Set-Cookie: refreshToken  │          │
│          │    (httpOnly, 7d)          │          │
└─────────┘                            └──────────┘

  Subsequent requests:
    Authorization: Bearer <accessToken>
    Cookie: refreshToken=httpOnly

  On 401:
    → Client queues failed requests
    → Calls POST /auth/refresh (uses httpOnly cookie)
    → Gets new accessToken
    → Replays queued requests
    → On refresh failure → logout + redirect to /login
```

### RBAC Permission Model

```
┌────────────────────────────────────────────────────────────────┐
│                    Pure Custom RBAC                            │
│    (No system roles — all roles are user-defined)              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Employee → Custom Role → Permission[]                         │
│                                                                │
│  Permissions are resource:action pairs:                        │
│    employees:create, employees:view_all, employees:view_team   │
│    payroll:process, payroll:approve_md, payroll:disburse       │
│    settings:read, settings:update                              │
│    dashboard:view_executive                                    │
│    recruitment:read, letters:read                              │
│    ...                                                         │
│                                                                │
│  Enforcement layers:                                           │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Backend Guards   │  │ Frontend Routes  │  │ Sidebar UI   │  │
│  │ JwtAuth→Roles→  │  │ PermissionGuard  │  │ permission-  │  │
│  │ Ownership        │  │ on <Route>       │  │ based menu   │  │
│  └─────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                │
│  @Roles() decorator on controllers                             │
│  @Owner() decorator for resource ownership                     │
│  @Public() decorator to skip auth                              │
└────────────────────────────────────────────────────────────────┘
```

### Frontend Data Flow

```
  User Action
       │
       ▼
  React Component (Page)
       │
       ├── useXxxQuery() ──── React Query ──── GET /api/xxx
       │                         │
       │                    Cache (5min stale, 10min GC)
       │
       ├── useXxxMutation() ── React Query ──── POST/PATCH/DELETE /api/xxx
       │                         │
       │                    invalidateQueries() → auto-refetch
       │
       └── Zustand Store ───── Local state (auth tokens, chat, call, org)
```

---

## Project Structure

```
hr/
├── client/                              # React Frontend (Vite)
│   ├── public/                          # Static assets
│   │   ├── favicon.svg, logo.png, logo.jpeg
│   │   ├── icons.svg                    # Icon sprite sheet
│   │   └── theme-script.js             # Inline theme flash prevention
│   ├── src/
│   │   ├── components/
│   │   │   ├── attendance/              # 6 files: KPIs, EmployeeTab, MyTab, Override, Correction, utils
│   │   │   ├── auth/                    # 3 files: login-form, protected-route, role-guard (PermissionGuard)
│   │   │   ├── ceo-dashboard/           # 8 files: activity-feed, attendance-trend, KPI cards, leave-analytics,
│   │   │   │                            #          performance-overview, quick-actions, recruitment-pipeline, workforce-charts
│   │   │   ├── chat/                    # Chat overlay component
│   │   │   ├── common/                  # UserAvatar, shared utilities
│   │   │   ├── dashboard/               # 7 files: announcements-card, apply-leave-dialog, attendance-calendar,
│   │   │   │                            #          day-detail-dialog, leave-balance-chips, my-tasks-card, types
│   │   │   ├── employee/                # 11 files: add-employee-form (7 steps), form-schema, form-ui,
│   │   │   │                            #          status-change-dialog + step components
│   │   │   ├── leave/                   # 4 files: leave-details-dialog, leave-summary-cards, leave-type-dialog, leave-types-list
│   │   │   ├── letters/                 # Letter create dialog, preview dialog, print templates
│   │   │   ├── navigation/              # Breadcrumb component
│   │   │   ├── notifications/           # 5 files: bell, icon, item, list, preferences
│   │   │   ├── organization/            # Org chart tree visualization
│   │   │   ├── payroll/                 # 13 files: DetailedPayslip, Disbursement tabs (regular + festival bonus),
│   │   │   │                            #          EmployeeSalary, LM/MD Approval tabs, Processing, ProvidentFund,
│   │   │   │                            #          ActionDialogs, PayoutComments
│   │   │   ├── recruitment/             # 8 files: AnalyticsTab, JobsTab, PipelineTab, KPIs, Dialogs, Onboarding, utils
│   │   │   ├── regulations/             # 6 files: policy/request forms, detail views, list
│   │   │   ├── separation/              # Separation records component
│   │   │   ├── settings/                # 6 files: access-control, attendance-setup, festival-bonus-setup,
│   │   │   │                            #          office-hours, salary-setup, theme-settings
│   │   │   ├── tasks/                   # 7+ files: Board, Create, Gantt, List, ListView, ProjectCreate,
│   │   │   │                            #          TaskDetailsSheet, WorkloadView, details/
│   │   │   ├── ui/                      # 55 shadcn/ui primitives (see below)
│   │   │   ├── error-boundary.tsx       # Global error boundary
│   │   │   └── theme-provider.tsx       # next-themes wrapper
│   │   ├── hooks/                       # 34 custom hooks:
│   │   │   │                            # useAnnouncements, useAssets, useAttendance, useAttendanceSettings,
│   │   │   │                            # useClaims, useDepartments, useDesignations, useDisciplinary,
│   │   │   │                            # useEmployees, useExecutiveDashboard, useFestivalBonus,
│   │   │   │                            # useLeaveApplications, useLeaveTypes, useLetters, useLoans,
│   │   │   │                            # useNotifications, useNotificationSocket, useOrgChart,
│   │   │   │                            # usePayroll, usePerformance, usePermissions, useProvidentFund,
│   │   │   │                            # useRecruitment, useRegulations, useReports, useRoles,
│   │   │   │                            # useSalary, useSeparation, useSettlement, useTasks,
│   │   │   │                            # useTasksWebSocket, useWebSocket
│   │   │   │                            # + use-mobile, use-theme
│   │   ├── layouts/                     # auth-layout, dashboard-layout, footer, header, sidebar
│   │   ├── lib/                         # api.ts (axios + interceptors), export.ts (CSV/PDF), utils.ts (cn)
│   │   ├── routes/pages/                # 50 page components + print/ directory
│   │   │   ├── print/                   # 4 print templates: joining-letter, offer-letter, hr-letter, payslip
│   │   │   └── *.tsx                    # All route pages (lazy loaded in App.tsx)
│   │   ├── store/                       # 5 Zustand stores:
│   │   │   │                            # useAuthStore, useCallStore, useChatStore,
│   │   │   │                            # useNotificationStore, useOrgStore
│   │   ├── types/                       # 8 type files: attendance, claims, index, leave,
│   │   │   │                            # notifications, org, provident-fund, salary
│   │   ├── App.tsx                      # Router config with lazy loading + permission guards
│   │   ├── main.tsx                     # React entry + QueryClient + ErrorBoundary
│   │   └── index.css                    # Tailwind imports + global styles
│   ├── vite.config.ts                   # Vite + React Compiler + Tailwind + chunk splitting
│   └── package.json
│
├── hr-server/                           # NestJS Backend (Fastify)
│   ├── src/
│   │   ├── common/
│   │   │   ├── cache/                   # RedisModule, CacheService, CacheKeys (pattern-based key resolution)
│   │   │   ├── decorators/              # @Public(), @Roles(), @Owner() parameter/role decorators
│   │   │   ├── dto/                     # Shared pagination DTO
│   │   │   ├── filters/                 # GlobalExceptionFilter (standardized error responses)
│   │   │   ├── interceptors/            # ResponseInterceptor (unwrap), LoggingInterceptor (Pino),
│   │   │   │                            # AuditLogInterceptor (state-change trail)
│   │   │   └── guards/                  # LoginThrottleGuard (per-IP rate limit on login)
│   │   ├── config/                      # 5 typed configs: app, database, redis, cloudinary, jwt
│   │   ├── db/
│   │   │   ├── schema/                  # 27 schema files → 61 PostgreSQL tables
│   │   │   │   ├── _base.ts             # Shared base columns (id, createdAt, updatedAt)
│   │   │   │   ├── employee.ts          # 8 tables: departments, designations, employees, spouses,
│   │   │   │   │                        #   children, nominees, bank_details, documents
│   │   │   │   ├── attendance.ts        # 3 tables: settings, holidays, logs
│   │   │   │   ├── leave-type.ts        # 1 table: leave_types
│   │   │   │   ├── leave-application.ts # 2 tables: leave_applications, leave_attachments
│   │   │   │   ├── salary.ts            # 3 tables: salary_templates, template_components, employee_salaries
│   │   │   │   ├── payroll.ts           # 4 tables: cycles, payslips, disbursements, approvals
│   │   │   │   ├── claims.ts            # 2 tables: claims, claim_attachments
│   │   │   │   ├── recruitment.ts       # 5 tables: job_openings, candidates, stage_histories,
│   │   │   │   │                        #   onboarding_hires, onboarding_tasks
│   │   │   │   ├── performance.ts       # 3 tables: appraisal_cycles, employee_appraisals, employee_kpis
│   │   │   │   ├── tasks.ts             # 9 tables: projects, milestones, tasks, checklists, comments,
│   │   │   │   │                        #   activities, dependencies, attachments, time_entries
│   │   │   │   ├── chat.ts              # 4 tables: rooms, room_members, messages, call_logs
│   │   │   │   ├── notifications.ts     # 2 tables: notifications, notification_preferences
│   │   │   │   ├── roles.ts             # 2 tables: permissions, custom_roles
│   │   │   │   ├── letters.ts           # 1 table: issued_letters
│   │   │   │   ├── announcement.ts      # 1 table: announcements
│   │   │   │   ├── disciplinary.ts      # 1 table: disciplinary_cases
│   │   │   │   ├── separation.ts        # 2 tables: separation_records, final_settlements
│   │   │   │   ├── festival-bonus.ts    # 3 tables: settings, cycles, employee_bonuses
│   │   │   │   ├── provident-fund.ts    # 3 tables: settings, transactions, withdrawals
│   │   │   │   ├── loans.ts             # 2 tables: loans, loan_payments
│   │   │   │   ├── assets.ts            # 2 tables: assets, asset_history
│   │   │   │   ├── org-chart.ts         # 1 table: org_chart_nodes
│   │   │   │   ├── office-regulations.ts # 2 tables: regulation_policies, regulation_requests
│   │   │   │   └── audit-logs.ts        # 1 table: audit_logs
│   │   │   └── migrations/              # SQL migration files (managed by drizzle-kit)
│   │   ├── modules/                     # 32 Feature Modules
│   │   │   ├── auth/                    # AuthController, AuthService, JwtStrategy, TokenBlacklistService
│   │   │   │   ├── guards/              # JwtAuthGuard, RolesGuard, OwnershipGuard, LoginThrottleGuard
│   │   │   │   ├── strategies/          # JwtStrategy (Passport)
│   │   │   │   └── dto/                 # LoginDto, ChangePasswordDto, RefreshTokenDto
│   │   │   ├── employee/                # EmployeeController, EmployeeService, EmployeeProcessor
│   │   │   │   └── dto/                 # CreateEmployee, UpdateEmployee, ChangeStatus, Query, ResetPassword
│   │   │   ├── department/              # Department CRUD
│   │   │   ├── designation/             # Designation CRUD
│   │   │   ├── attendance/              # Check-in/out, daily logs, correction approval, CSV export
│   │   │   ├── attendance-settings/     # Office hours, holiday CRUD, auto-action config
│   │   │   ├── leave-type/              # Leave type CRUD with active toggle
│   │   │   ├── leave-application/       # Apply, approve, cancel, calculate leave days
│   │   │   ├── salary/                  # Salary template CRUD, employee salary assignment, bulk revision
│   │   │   ├── payroll/                 # Cycle processing, payslip generation, approval, disbursement
│   │   │   │   └── payroll.processor.ts # BullMQ processor for payroll jobs
│   │   │   ├── claims/                  # Medical, TADA, advance claims with attachments
│   │   │   ├── recruitment/             # Job openings, candidates, interviews, onboarding
│   │   │   ├── performance/             # KPI management, appraisal cycles, self/manager scoring
│   │   │   ├── tasks/                   # Projects, milestones, tasks, time tracking, dependencies
│   │   │   │   ├── realtime.gateway.ts  # WebSocket gateway for real-time task sync
│   │   │   │   └── tasks.processor.ts   # BullMQ processor for task notifications
│   │   │   ├── chat/                    # Real-time messaging + voice/video calls
│   │   │   │   ├── chat.gateway.ts      # WebSocket gateway (messages, calls, presence)
│   │   │   │   ├── repositories/        # ChatRepository (data access layer)
│   │   │   │   └── processors/          # Chat notification processor (BullMQ)
│   │   │   ├── notifications/           # Notification system with preferences
│   │   │   │   ├── notifications.gateway.ts  # WebSocket push gateway
│   │   │   │   ├── notifications.processor.ts # BullMQ async dispatch
│   │   │   │   ├── services/            # PreferencesService (per-employee config)
│   │   │   │   ├── guards/              # Notification-specific guards
│   │   │   │   └── types/               # Notification type definitions
│   │   │   ├── announcements/           # Company-wide announcements
│   │   │   ├── letters/                 # HR letter generation and management
│   │   │   ├── roles/                   # Custom RBAC role management
│   │   │   ├── dashboard/               # Dashboard statistics aggregation
│   │   │   ├── org-chart/               # Org tree builder (buildTree, flattenNodes)
│   │   │   ├── regulations/             # Office policy and request management
│   │   │   ├── reports/                 # Analytics and reporting
│   │   │   ├── provident-fund/          # PF tracking, withdrawals, ledger
│   │   │   ├── loans/                   # Loan management with installments
│   │   │   ├── assets/                  # Asset allocation and return tracking
│   │   │   ├── festival-bonus/          # Bonus cycles with LM/MD approval tiers
│   │   │   ├── separation/              # Employee exit + final settlement
│   │   │   ├── disciplinary/            # Disciplinary case management
│   │   │   ├── upload/                  # Cloudinary file upload/delete
│   │   │   ├── queue/                   # BullMQ configuration and module
│   │   │   └── health/                  # Health check endpoint
│   │   ├── app.module.ts                # Root module: 32 imports, 3 global guards, 1 audit interceptor
│   │   └── main.ts                      # Bootstrap: Fastify, Helmet, CORS, Rate Limit, Swagger
│   ├── test/                            # E2E tests (30+ spec files)
│   └── drizzle.config.ts                # Drizzle Kit migration config
│
└── graphify-out/                        # Knowledge Graph (auto-generated)
    ├── graph.html                       # Interactive 3D visualization
    ├── graph.json                       # Full graph data (2511 nodes, 3655 edges)
    └── GRAPH_REPORT.md                  # Community analysis report
```

### shadcn/ui Components (55 primitives)

```
accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb,
button, button-group, calendar, card, carousel, chart, checkbox, collapsible,
combobox, command, context-menu, dialog, direction, drawer, dropdown-menu,
empty, field, hover-card, input, input-group, input-otp, item, kbd, label,
menubar, native-select, navigation-menu, pagination, popover, progress,
radio-group, resizable, scroll-area, select, separator, sheet, sidebar,
skeleton, slider, sonner, spinner, switch, table, tabs, textarea, toggle,
toggle-group, tooltip
```

### All 50+ Routes

| Route | Component | Permission |
|-------|-----------|-----------|
| `/login` | LoginPage | Public |
| `/` | DashboardPage | Authenticated |
| `/attendance` | AttendancePage | Authenticated |
| `/attendance/company` | CompanyAttendancePage | employees:view_all/team/read |
| `/leave` | LeavePage | Authenticated |
| `/leave-applications` | LeaveApplicationsPage | Authenticated |
| `/claims/medical` | MedicalReimbursementPage | Authenticated |
| `/claims/tada` | TADAClaimPage | Authenticated |
| `/claims/advance` | BusinessTravelAdvancePage | Authenticated |
| `/tasks` | TasksPage | Authenticated |
| `/announcements` | AnnouncementsPage | Authenticated |
| `/profile` | ProfilePage | Authenticated |
| `/chat` | ChatPage | Authenticated |
| `/notifications` | NotificationsPage | Authenticated |
| `/regulations` | RegulationsPage | Authenticated |
| `/payroll/lm-approvals` | PayrollLmApprovalsPage | Authenticated |
| `/payroll/provident-fund` | PayrollProvidentFundPage | Authenticated |
| `/payroll/loans` | PayrollLoansPage | Authenticated |
| `/payroll/assets` | PayrollAssetsPage | Authenticated |
| `/departments` | DepartmentsPage | Authenticated |
| `/departments/view/:id` | ViewDepartmentPage | Authenticated |
| `/designations/view/:id` | ViewDesignationPage | Authenticated |
| `/documents` | DocumentsPage | Authenticated |
| `/employees/view/:id` | ViewEmployeePage | Authenticated (Owner guard) |
| `/ceo-dashboard` | CeoDashboardPage | dashboard:view_executive |
| `/employees` | EmployeesPage | employees:view_all/team/read |
| `/performance` | PerformancePage | employees:view_all/team/read |
| `/reports` | ReportsPage | employees:view_all/team/read |
| `/payroll/md-approvals` | PayrollMdApprovalsPage | payroll:approve_md/read/process |
| `/payroll/disbursement` | PayrollDisbursementPage | payroll:disburse/read/process |
| `/employees/create` | CreateEmployeePage | employees:create + more |
| `/employees/edit/:id` | EditEmployeePage | employees:create + more |
| `/payroll` | PayrollPage | employees:create + more |
| `/payroll/employee-salary` | PayrollEmployeeSalaryPage | employees:create + more |
| `/payroll/processing` | PayrollProcessingPage | employees:create + more |
| `/payroll/disbursement-logs` | PayrollDisbursementLogsPage | employees:create + more |
| `/payroll/festival-bonus` | PayrollFestivalBonusPage | employees:create + more |
| `/recruitment` | RecruitmentPage | employees:create + more |
| `/separation` | SeparationPage | employees:create + more |
| `/disciplinary` | DisciplinaryPage | employees:create + more |
| `/letters` | LettersPage | employees:create + more |
| `/letters/view/:id` | ViewLetterPage | employees:create + more |
| `/departments/create` | CreateDepartmentPage | employees:create + more |
| `/departments/edit/:id` | EditDepartmentPage | employees:create + more |
| `/designations/create` | CreateDesignationPage | employees:create + more |
| `/designations/edit/:id` | EditDesignationPage | employees:create + more |
| `/settings` | SettingsPage | settings:read/update |
| `/recruitment/print/:id` | PrintJoiningLetterPage | recruitment:read/letters:read |
| `/recruitment/print-offer/:id` | PrintOfferLetterPage | recruitment:read/letters:read |
| `/letters/print/:id` | PrintHRLetterPage | recruitment:read/letters:read |
| `/payroll/print/:monthKey/:id` | PrintPayslipPage | Authenticated |

---

## Database Schema

**61 PostgreSQL tables** across 27 schema files, managed via Drizzle ORM with migration-only evolution:

### Core Employee (8 tables)
| Table | Purpose |
|-------|---------|
| `departments` | Department records |
| `designations` | Job title/position records |
| `employees` | Master employee data (personal, employment, status) |
| `employee_spouses` | Family: spouse information |
| `employee_children` | Family: children information |
| `employee_nominees` | Nominee/next-of-kin records |
| `employee_bank_details` | Bank account details |
| `employee_documents` | Document file references |

### Attendance & Leave (6 tables)
| Table | Purpose |
|-------|---------|
| `attendance_settings` | Office hours, auto-checkin/out config |
| `holidays` | Holiday calendar |
| `attendance_logs` | Daily check-in/check-out records |
| `leave_types` | Configurable leave categories |
| `leave_applications` | Leave requests with approval status |
| `leave_attachments` | Supporting documents for leave |

### Payroll & Compensation (16 tables)
| Table | Purpose |
|-------|---------|
| `salary_templates` | Salary structure definitions |
| `salary_template_components` | Template line items (basic, HRA, etc.) |
| `employee_salaries` | Per-employee salary assignments |
| `payroll_cycles` | Monthly payroll periods |
| `employee_payslips` | Individual payslip records |
| `disbursements` | Payroll disbursement records |
| `payroll_approvals` | Approval audit trail |
| `festival_bonus_settings` | Bonus configuration |
| `festival_bonus_cycles` | Bonus periods |
| `employee_festival_bonuses` | Individual bonus payouts |
| `provident_fund_settings` | PF contribution config |
| `provident_fund_transactions` | PF ledger entries |
| `provident_fund_withdrawals` | Withdrawal requests |
| `loans` | Loan records |
| `loan_payments` | Installment payment records |
| `claims` + `claim_attachments` | Expense claims |

### Recruitment (5 tables)
| Table | Purpose |
|-------|---------|
| `job_openings` | Job postings |
| `candidates` | Applicant records |
| `candidate_stage_histories` | Pipeline stage transitions |
| `onboarding_hires` | Onboarding profiles |
| `onboarding_tasks` | Onboarding checklist items |

### Performance (3 tables)
| Table | Purpose |
|-------|---------|
| `appraisal_cycles` | Review periods |
| `employee_appraisals` | Self + manager scores |
| `employee_kpis` | KPI definitions per employee |

### Tasks & Projects (9 tables)
| Table | Purpose |
|-------|---------|
| `task_projects` | Project records |
| `task_milestones` | Milestone targets |
| `tasks` | Task records (status, priority, assignee) |
| `task_checklists` | Sub-task items |
| `task_comments` | Threaded comments |
| `task_activities` | Change audit log |
| `task_dependencies` | Task-to-task links |
| `task_attachments` | File attachments |
| `time_entries` | Time tracking logs |

### Communication (7 tables)
| Table | Purpose |
|-------|---------|
| `chat_rooms` | DM and channel rooms |
| `chat_room_members` | Room membership + roles |
| `chat_messages` | Message records |
| `call_logs` | Voice/video call history |
| `notifications` | Notification records (with dedup, priority, actions) |
| `notification_preferences` | Per-employee notification config |
| `announcements` | Company announcements |

### Employee Lifecycle (5 tables)
| Table | Purpose |
|-------|---------|
| `disciplinary_cases` | Case tracking |
| `separation_records` | Exit records |
| `final_settlements` | Settlement calculations |
| `issued_letters` | HR letter records |
| `assets` + `asset_history` | Asset allocation |

### Organization & Admin (4 tables)
| Table | Purpose |
|-------|---------|
| `org_chart_nodes` | Org tree structure |
| `regulation_policies` | Office policies |
| `regulation_requests` | Policy requests |
| `audit_logs` | State-change audit trail |

### Auth & Roles (2 tables)
| Table | Purpose |
|-------|---------|
| `permissions` | Permission definitions |
| `custom_roles` | Role + permission assignments |

---

## Security

| Layer | Implementation | Details |
|-------|---------------|---------|
| **Authentication** | JWT dual-token | Access token (15m, Bearer header) + Refresh token (7d, httpOnly cookie) |
| **Password Hashing** | bcrypt | Salt rounds configured per environment |
| **Authorization** | 3-layer guard chain | JwtAuthGuard → RolesGuard → OwnershipGuard |
| **Login Throttle** | LoginThrottleGuard | Per-IP rate limiting on login endpoint |
| **CORS** | Environment-based | `CORS_ORIGINS` env variable, strict origin matching |
| **HTTP Security** | Helmet | CSP (production), X-Frame-Options, HSTS, X-Content-Type |
| **Rate Limiting** | Global | 100 requests/minute per IP |
| **Compression** | Brotli + Gzip | @fastify/compress with Brotli preferred |
| **Input Validation** | class-validator | whitelist: true, forbidNonWhitelisted: true |
| **File Uploads** | Cloudinary | 10MB limit, 5 files max per request |
| **CSRF** | Not required | Bearer token auth — no session cookies for authentication |
| **Token Refresh** | Silent rotation | Request queue during refresh, auto-logout on failure |
| **Request ID** | UUID per request | X-Request-Id header for tracing |
| **Audit Trail** | AuditLogInterceptor | Logs all POST/PATCH/PUT/DELETE operations |
| **Token Blacklist** | TokenBlacklistService | Server-side token revocation on logout |

---

## Getting Started

### Prerequisites
- **Node.js** 20+
- **PostgreSQL** — Neon serverless (or local PostgreSQL)
- **Redis** — local (`redis-server`) or managed
- **Cloudinary** account (for file uploads)

### Backend Setup

```bash
cd hr-server
cp .env.example .env
# Edit .env with your credentials

npm install
npm run db:migrate      # Run database migrations
npm run start:dev       # Start dev server on port 3000 (API) + 3001 (WebSocket)
```

### Frontend Setup

```bash
cd client
npm install
npm run dev             # Start Vite dev server on port 5173
```

### Environment Variables

**Backend (`hr-server/.env`):**
```env
# Application
NODE_ENV=development
PORT=3000
WS_PORT=3001
API_PREFIX=api

# CORS (comma-separated origins)
CORS_ORIGINS=https://localhost:5173,http://localhost:5173

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=300

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
CLOUDINARY_SECURE=true
CLOUDINARY_MAX_FILE_SIZE=10485760
CLOUDINARY_DEFAULT_FOLDER=hr-system

# BullMQ
BULLMQ_CONCURRENCY=5

# JWT
JWT_ACCESS_SECRET=<generate-64-char-secret>
JWT_REFRESH_SECRET=<generate-64-char-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

**Frontend (`client/.env`):**
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3001/ws
```

---

## Scripts

### Backend (`hr-server/`)

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start dev server with hot reload (port 3000) |
| `npm run build` | Compile TypeScript for production |
| `npm run start:prod` | Run production build (`node dist/main`) |
| `npm run db:generate` | Generate Drizzle migration from schema changes |
| `npm run db:migrate` | Run pending SQL migrations |
| `npm run db:studio` | Open Drizzle Studio (visual DB GUI) |
| `npm run db:pull` | Pull remote DB schema into local files |
| `npm run test:e2e` | Run all E2E tests |
| `npm run test:e2e:auth` | Run auth module E2E tests |
| `npm run test:e2e:employees` | Run employee module E2E tests |
| `npm run test:e2e:tasks` | Run tasks module E2E tests |
| `npm run test:seed` | Seed test data for E2E tests |
| `npm run lint` | ESLint check + auto-fix |
| `npm run format` | Prettier format all TS files |

### Frontend (`client/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | TypeScript check + Vite production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint check |

---

## Testing

E2E test coverage for **30+ modules** using Jest + Supertest:

```
announcements, assets, attendance, attendance-settings, auth, chat, claims,
dashboard, departments, designations, disciplinary, employees, health,
leave-applications, leave-types, letters, notifications, org-chart, payroll,
performance, provident-fund, recruitment, roles, salary, separation, tasks,
upload
```

Each test file follows a consistent pattern: bootstrap app → authenticate → CRUD operations → cleanup.

---

## Knowledge Graph

This project maintains a navigable knowledge graph of the entire codebase using graphify:

| Metric | Value |
|--------|-------|
| Nodes | 2,511 (classes, functions, components, hooks) |
| Edges | 3,655 (imports, calls, implements, references) |
| Communities | 318 (feature clusters via community detection) |
| Extraction | 97% EXTRACTED, 3% INFERRED |
| Interactive Viz | `graphify-out/graph.html` — open in browser |
| Full Report | `graphify-out/GRAPH_REPORT.md` |
| Graph JSON | `graphify-out/graph.json` |

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Fastify over Express** | 2-3x faster, lower memory footprint, native async/await support |
| **Drizzle over Prisma** | Type-safe SQL-like API, zero runtime overhead, full control over queries |
| **Custom RBAC (no system roles)** | Maximum flexibility — HR permission models vary by organization |
| **React Compiler** | Automatic memoization at compile time, fewer manual `useMemo`/`useCallback` |
| **Zustand over Redux** | Minimal boilerplate, TypeScript-first, no provider wrapper needed |
| **WebSocket (ws) over Socket.IO** | Native protocol, lower overhead, no client library dependency |
| **Cloudinary over S3** | Built-in image transformations, easier setup, CDN included |
| **Migration-only DB changes** | Prevents schema drift, provides audit trail, team-safe |
| **Lazy-loaded pages** | Code splitting per route — faster initial bundle, on-demand loading |
| **Manual chunk splitting** | Optimized browser caching: vendor-react, vendor-query, vendor-ui |
| **BullMQ for scheduled jobs** | Redis-backed, reliable, supports concurrency, retries, and prioritization |
| **Pino over Winston** | 5x faster, JSON-native, better for structured logging |
| **Bearer token + httpOnly cookie** | Access token in header (API-friendly), refresh in cookie (secure, XSS-safe) |
| **Neon serverless Postgres** | Auto-scaling, branching, connection pooling, no DB server management |
| **Theme flash prevention** | Inline `<script>` in `index.html` reads localStorage before React hydration |
