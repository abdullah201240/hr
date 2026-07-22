# HR Management System

Enterprise-grade Human Resource Management System built with a full-stack TypeScript architecture — **NestJS + Fastify** backend and **React 19 + Vite** frontend, powered by **PostgreSQL** (Neon), **Redis** caching, **BullMQ** job queues, **WebRTC** voice/video calling, **WebSocket** real-time messaging, and **Cloudinary** file storage — featuring employee management, attendance tracking, payroll processing, leave management, recruitment, performance reviews, task management, chat, and a pure custom RBAC permission system.

---

## Table of Contents

- [Features](#features)
- [Voice & Video Calling System](#voice--video-calling-system)
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
- [Future Roadmap](#future-roadmap)

---

## Features

### Core HR
| Feature | Description |
|---------|-------------|
| **Employee Management** | Full CRUD with 7-step form: personal info, employment, family, nominees, banking, documents, review |
| **Employee Profile** | Self-service profile with 8 tabs: Personal, Employment, Family, Nominee, Banking, Documents, Payslips (with detailed payslip dialog), Security (change password) |
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
| **Voice/Video Calls** | Full WebRTC calling system — see [Voice & Video Calling System](#voice--video-calling-system) for complete details |
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
| **Settings: Leave Management** | Leave type CRUD with color-coded badges, carry-forward rules, active toggle |
| **Settings: Salary** | Salary template management, component configuration |
| **Settings: Festival Bonus** | Bonus cycle settings |
| **Settings: Access Control** | Role CRUD with permission assignment |
| **Settings: Theme** | Light/dark/system theme preference |
| **Settings: Notifications** | Notification preference management |
| **Audit Logs** | Trail of all state-changing operations (POST, PATCH, PUT, DELETE) |
| **Office Regulations** | Policy creation and request management |
| **Reports** | Workforce headcount, attendance summary, leave utilization, payroll cost analytics |
| **CSV Export** | Export data to CSV files via built-in `exportToCsv()` utility |

### Employee Dashboard
| Feature | Description |
|---------|-------------|
| **Attendance Calendar** | Monthly calendar view with check-in/out status and daily details |
| **Apply Leave Dialog** | Quick leave application directly from dashboard with leave type selection |
| **Day Detail Dialog** | Click any calendar day to see attendance logs, leave details, or holiday info |
| **My Tasks Card** | Live assigned tasks with create, update, delete, and status toggle — inline task management |
| **Announcements Card** | Latest published announcements with paginated feed |
| **Leave Balance Overview** | Leave balance chips showing utilization per leave type |

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

## Voice & Video Calling System

A full-featured, peer-to-peer voice and video calling system built on **WebRTC** with WebSocket-based signaling through the NestJS chat gateway. Calls are initiated directly from within chat rooms (DM or channel conversations) and managed entirely through a Zustand store (`useCallStore`) with a fullscreen overlay UI (`CallOverlay`).

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           CALL SIGNALING FLOW                            │
│                                                                          │
│  Caller (Browser)              WebSocket Server              Callee (Browser)
│  ───────────────              ────────────────              ────────────────
│       │                              │                              │
│  getUserMedia()                      │                              │
│  (acquire local stream)              │                              │
│       │                              │                              │
│  call:initiate ──────────────────────►                              │
│       │                         Redis Pub/Sub                      │
│       │                         chat_events                        │
│       │                              │                              │
│       │                     call_incoming ──────────────────────────►
│       │                              │                         (ringing UI)
│       │                              │                              │
│       │                     call:ringing ◄──────────────────────────
│       │◄────────────────────         │                              │
│  (ringing state)                     │                              │
│       │                              │                              │
│       │                     call:accept ◄───────────────────────────
│       │◄────────────────────         │                              │
│       │                              │                              │
│  RTCPeerConnection                   │                              │
│  createOffer()                       │                              │
│  webrtc:signal {offer} ─────────────►                               │
│       │                         WEBRTC_SIGNAL ──────────────────────►
│       │                              │                    setRemoteDescription(offer)
│       │                              │                    createAnswer()
│       │              webrtc:signal {answer} ◄────────────────────────
│       │◄────────────────────         │                              │
│  setRemoteDescription(answer)        │                              │
│       │                              │                              │
│  ════════════════ WebRTC Peer Connection Established ════════════════
│       │◄────────────────── Media Stream (audio/video) ──────────────►│
│       │                              │                              │
│  call:hangup ────────────────────────►                              │
│       │                    logCallHistory() + cleanup               │
│       │                              │                              │
└──────────────────────────────────────────────────────────────────────────┘
```

### Call States & Lifecycle

| State | Description |
|-------|-------------|
| `idle` | No active call — overlay hidden |
| `calling` | Outgoing call initiated, waiting for callee response (30s timeout) |
| `ringing` | Incoming call detected (callee) or callee phone is ringing (caller) |
| `connected` | WebRTC peer connection established, media flowing |
| `ended` | Call terminated (hangup, cancel, reject, or timeout) |

### Call Types & Controls

| Control | Description |
|---------|-------------|
| **Audio Call** | Voice-only call using microphone |
| **Video Call** | Audio + video using microphone and camera |
| **Mute/Unmute** (`M` key) | Toggle microphone — disables audio track |
| **Camera On/Off** (`V` key) | Toggle camera — disables video track; can upgrade audio call to video mid-call |
| **Screen Sharing** | Share screen via `getDisplayMedia()` — replaces camera feed with screen capture |
| **Speaker/Earpiece** | Toggle audio output device (speaker vs earpiece) via `setSinkId()` |
| **Hang Up** (`Esc` key) | End the call, save call log, clean up all media streams |

### WebRTC Configuration

| Component | Detail |
|-----------|--------|
| **ICE Servers** | Configurable via `VITE_ICE_SERVERS` env var (JSON array) |
| **Default STUN** | Google STUN servers (`stun.l.google.com:19302`, etc.) + Mozilla STUN |
| **TURN Server** | Optional Metered TURN via `VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL` |
| **Dynamic TURN** | Auto-fetches TURN credentials from Metered API via `VITE_METERED_DOMAIN` + `VITE_METERED_API_KEY` |
| **Fallback TURN** | Default Metered OpenRelay (`openrelay.metered.ca:80/443`) if no custom TURN configured |
| **ICE Restart** | Automatic ICE restart on `disconnected` state |
| **ICE Timeout** | 25-second watchdog — auto-hangup if connection quality doesn't reach `excellent` |
| **Candidate Queue** | Buffers ICE candidates received before `remoteDescription` is set, flushes after |

### Connection Quality Monitoring

| Quality | ICE State | Visual Indicator |
|---------|-----------|-----------------|
| `connecting` | `checking` | Cyan pulsing bars |
| `excellent` | `connected` / `completed` | Green solid bars |
| `poor` | `disconnected` | Amber bars (triggers ICE restart) |
| `disconnected` | `failed` | Rose pulsing bars |

Displayed as a 4-bar signal icon in the call header overlay.

### Audio Tone System

A programmatic `CallSoundManager` using the Web Audio API generates call tones — no audio files needed:

| Tone | Frequencies | Pattern |
|------|------------|---------|
| **Dial Tone** | 440Hz + 480Hz sine | Pulses every 4s (2s on, 2s off) |
| **Ring Tone** | 453Hz + 680Hz sine | Dual-ring pattern every 3.5s (0.8s on, 0.4s off, 0.8s on, 1.5s off) |
| **End Tone** | 300Hz → 100Hz sweep | Single descending tone (0.45s) |

### Secure Context Handling

The calling feature requires a **secure context** (HTTPS or localhost) for `navigator.mediaDevices.getUserMedia()` access:

- Detects `!window.isSecureContext` before attempting media acquisition
- Throws `SECURE_CONTEXT_REQUIRED` with a clear user-facing error message
- Graceful fallback: if camera fails but audio succeeds, downgrades to audio-only call with toast notification

### Backend Call Handling (Chat Gateway)

All call signaling flows through the WebSocket gateway at `chat.gateway.ts`:

| WebSocket Event | Direction | Description |
|-----------------|-----------|-------------|
| `call:initiate` | Client → Server | Caller initiates — validates room, checks rate limits, checks active calls, creates `callId`, tracks in Redis |
| `call:ringing` | Client → Server | Callee acknowledges incoming call ring |
| `call:accept` | Client → Server | Callee accepts — updates Redis status to `connected` |
| `call:reject` | Client → Server | Callee rejects — logs call history as `rejected`, clears Redis |
| `call:cancel` | Client → Server | Caller cancels — logs call history as `missed`, clears Redis |
| `call:hangup` | Client → Server | Either party hangs up — calculates duration, logs as `completed`/`cancelled`, clears Redis |
| `webrtc:signal` | Client ↔ Server | Relays SDP offers/answers and ICE candidates between peers via Redis Pub/Sub |

**Server-side events dispatched to clients:**

| Server Event | Trigger |
|-------------|---------|
| `call_incoming` | Callee receives incoming call notification |
| `call_initiated` | Caller receives callId + peer details |
| `call_ringing` | Caller knows callee phone is ringing |
| `call_accepted` | Caller knows callee picked up — triggers WebRTC offer creation |
| `call_rejected` | Caller knows call was declined (with reason: `offline`, `busy`, `declined`) |
| `call_cancelled` | Callee knows caller cancelled |
| `call_hungup` | Other party hung up |
| `webrtc_signal` | Forwarded SDP/ICE between peers |

### Call Rate Limiting & Conflict Prevention

- **Rate Limit**: Server enforces per-user call rate limiting via `checkCallRateLimit()` — prevents spam
- **Active Call Check**: Both caller and callee are checked for existing active calls in Redis before allowing a new call
- **Auto-Busy Signal**: If callee is already in a call, server immediately returns `call_rejected` with reason `busy`
- **30s Ring Timeout**: Outgoing calls auto-cancel after 30 seconds with "No response from user" toast

### Call Logs & History

| Aspect | Detail |
|--------|--------|
| **Table** | `call_logs` (PostgreSQL) |
| **Columns** | `id`, `room_id`, `caller_id`, `callee_id`, `type` (audio/video), `status` (missed/rejected/completed/cancelled), `duration` (seconds), `created_at` |
| **API Endpoint** | `GET /api/chat/call-logs` — returns call history for the authenticated user (as caller or callee) |
| **Active Call Check** | `GET /api/chat/active-call` — returns current active call state (used for WebSocket reconnection sync) |
| **Auto-refresh** | Call logs are re-fetched after every call cleanup via `cleanupCallState()` |

### Frontend Components

| File | Purpose |
|------|---------|
| `client/src/store/useCallStore.ts` | Zustand store (1006 lines) — all call state, WebRTC management, media controls, sound manager |
| `client/src/components/chat/CallOverlay.tsx` | Fullscreen call UI overlay (450 lines) — ringing panel + connected panel with video/audio layouts |
| `client/src/hooks/useWebSocket.ts` | WebSocket hook — routes 8 call-related server events to `useCallStore` handlers |
| `client/src/layouts/dashboard-layout.tsx` | Mounts `<CallOverlay />` globally — always available when authenticated |

### UI Layout

**Ringing/Calling Panel:**
- Centered card with pulsing avatar animation
- Peer name + call status text
- Pre-call controls: Mute, Camera toggle, Speaker toggle
- Accept (green) / Reject (red) buttons for incoming calls
- Cancel (red) button for outgoing calls

**Connected Panel:**
- Fullscreen dark layout (`md:max-w-4xl md:h-[650px]`)
- **Video mode**: Remote video fullscreen + local video as Picture-in-Picture (top-right corner)
- **Audio mode**: Centered avatar with pulsing ring + "Voice Call connected" status
- **Header overlay**: Call type label, connection quality indicator (4-bar signal icon), call duration timer (MM:SS)
- **Bottom control bar**: Mute, Camera, Screen Share, Speaker, Hang Up — floating pill-shaped buttons with backdrop blur
- Screen sharing replaces camera feed; auto-reverts to camera when sharing stops

### Environment Variables

```env
# .env (client)
VITE_ICE_SERVERS=          # Optional: JSON array of RTCIceServer objects
VITE_TURN_URL=             # Optional: TURN server URL (e.g., turn:openrelay.metered.ca:443)
VITE_TURN_USERNAME=        # Optional: TURN server username
VITE_TURN_CREDENTIAL=      # Optional: TURN server credential
VITE_METERED_DOMAIN=       # Optional: Metered API domain for dynamic TURN credential fetching
VITE_METERED_API_KEY=      # Optional: Metered API key for dynamic TURN credentials
```

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
| Real-time Calls | WebRTC (native browser API) | Peer-to-peer audio/video via RTCPeerConnection |
| Sound Synthesis | Web Audio API | Programmatic call tones (dial, ring, end) |
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
│   │   │   ├── chat/                    # CallOverlay (voice/video call UI overlay)
│   │   │   ├── common/                  # UserAvatar, PageSkeleton (loading placeholder)
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
│   │   │   ├── separation/              # SettlementCalculatorModal (final settlement computation dialog)
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
│   │   ├── lib/                         # api.ts (axios + interceptors), export.ts (CSV export), utils.ts (cn)
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
│   │   │   ├── enums/                   # Shared enum constants
│   │   │   └── pipes/                   # Shared validation pipes
│   │   ├── config/                      # 6 typed configs: app, database, redis, cloudinary, jwt, bullmq (in queue module)
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

### All 50+ Routes (48 pages + 2 redirects + 4 print templates)

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
| `/attendance/setup` | → Redirect to `/settings?tab=attendance` | Authenticated |
| `/claims` | → Redirect to `/claims/medical` | Authenticated |
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
| `call_logs` | Voice/video call history — caller, callee, type (audio/video), status (missed/rejected/completed/cancelled), duration |
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
| **WebRTC peer-to-peer calls** | No media server needed — browser-native P2P audio/video with WebSocket signaling |
| **Programmatic audio tones** | Web Audio API oscillators instead of audio files — zero network cost, instant playback |
| **Redis-tracked active calls** | Prevents duplicate calls, enables cross-instance signaling via Pub/Sub, auto-cleanup on disconnect |

---

## Future Roadmap

> Planned features to evolve this platform into a complete A-to-Z software company management system — covering recruitment, collaboration, productivity, communication, health, analytics, and more.

### 1. Recruitment & Interview Pipeline

| Feature | Description |
|---------|-------------|
| **Job Requisition** | Department-wise job request with approval workflow (HOD → HR → CEO) |
| **Career Portal** | Public-facing job listing page with apply functionality (resume upload, cover letter) |
| **Applicant Tracking System (ATS)** | Kanban-style pipeline: Applied → Screening → Technical → HR → Offer → Hired |
| **Interview Scheduling** | Calendar-based slot booking with email invitations to candidates and panel members |
| **Interview Feedback Scorecard** | Structured per-round evaluation (technical, communication, problem-solving, culture fit) with panel comments |
| **Coding Playground / Technical Assessment** | Built-in code editor (JS/Python/Java/C++/Go/Rust) with real-time compilation, test case execution, auto-scoring, and plagiarism detection |
| **Take-Home Assignment** | Timed coding tasks with file upload, deadline tracking, and reviewer evaluation |
| **Offer Letter Generator** | Template-based offer creation with e-signature and candidate acceptance workflow |
| **Candidate Portal** | Login for candidates to check status, schedule interviews, download documents |
| **Bulk Candidate Import** | CSV upload for mass candidate entry from job fairs or referral programs |
| **Referral Tracking** | Employee referral submission with reward status tracking upon hiring |
| **Interview Calendar View** | Day/week/month calendar showing all scheduled interviews across panels |
| **Rejection Reason Analytics** | Track and visualize most common rejection reasons by stage |

### 2. Meeting & Collaboration System

| Feature | Description |
|---------|-------------|
| **Video Conferencing** | Full meeting rooms (extends WebRTC) with host controls, waiting room, lobby, and breakout rooms |
| **Screen Sharing** | Share screen / application window / browser tab with remote cursor visibility |
| **Meeting Scheduling** | Calendar-based meeting creation with participant availability detection and conflict resolution |
| **Meeting Minutes & Transcription** | Auto-generated notes with AI transcription and action item extraction |
| **Meeting Room Booking** | Reserve physical/virtual rooms with conflict detection and recurring meeting support |
| **Live Polls & Q&A** | In-meeting polling, upvoting, and Q&A for town halls |
| **Collaborative Whiteboard** | Real-time drawing/writing board for brainstorming |
| **Meeting Recording & Playback** | Server-side recording with searchable transcript |
| **Meeting Attendance Log** | Auto-track who joined, duration, and late arrivals |
| **Recurring Meeting Templates** | Save meeting formats (daily standup, weekly review) with auto-scheduling |
| **Meeting Cost Calculator** | Estimate meeting cost based on attendee count × average salary per hour |
| **Focus Mode / Do Not Disturb** | Block notifications and auto-reject meeting invites during deep work hours |

### 3. Employee Live Work Tracking

| Feature | Description |
|---------|-------------|
| **Activity Monitoring** | Real-time active application/window tracking with productivity scoring (productive / neutral / unproductive) |
| **Time Tracker** | Manual and automatic time logging per task/project with start/stop/pause and billable classification |
| **Daily Work Log** | End-of-day structured summary (done / blockers / tomorrow's plan) with manager review |
| **Screenshot Capture** | Periodic random screenshots during work hours with privacy controls and employee consent |
| **Desk Time Analytics** | Login/logout patterns, idle time detection, break tracking, overtime alerts |
| **Sprint Burndown Tracking** | Real-time sprint progress linked to task completion and time logged |
| **GPS Check-in/Check-out** | Location-based attendance for field teams with geofencing |
| **Focus Time Tracking** | Track uninterrupted work blocks and flag fragmentation from meetings/notifications |
| **Employee Availability Status** | Real-time status: Available / In Meeting / Deep Work / On Break / Away / OOO |
| **Work Pattern Heatmap** | Visual heatmap showing peak productivity hours across the team |
| **Overtime Prediction** | AI-based early warning when an employee is trending toward excessive overtime |
| **Field Visit Logging** | Track client site visits with check-in time, purpose, and travel distance calculation |

### 4. Internal Email System

| Feature | Description |
|---------|-------------|
| **Internal Mailbox** | Full email client (inbox, sent, drafts, starred, trash, archive) |
| **Rich Text Composer** | Compose with formatting, attachments, @mentions, CC/BCC, scheduling, and templates |
| **Email Threads** | Conversation-view threading with reply/forward/reply-all |
| **Smart Notifications** | Digest mode (immediate / hourly / daily) with priority detection |
| **Department/Team Broadcast** | Send announcements to departments or custom groups |
| **Email Templates** | Pre-built HR templates (offer letters, policy updates, warnings, appreciation) |
| **Search & Labels** | Full-text search with custom labels, filters, and saved searches |
| **External Email Sync** | SMTP/IMAP bridge for Gmail/Outlook unified inbox |
| **Read Receipts & Tracking** | Know when emails are opened with timestamp |
| **Email Rules & Auto-Filter** | Auto-categorize incoming emails with custom rules |
| **Scheduled Send** | Compose now, send later at a scheduled time |
| **Email Signature Builder** | Company-branded email signatures with logo, designation, and contact info |

### 5. Employee Health & Wellness

| Feature | Description |
|---------|-------------|
| **Health Profile** | Medical history, blood group, allergies, chronic conditions, emergency contacts |
| **Health Check-up Scheduling** | Annual/bi-annual screening appointment booking with partner hospitals |
| **Health Reports Upload** | Secure upload of medical reports with doctor notes |
| **Mental Wellness** | Stress self-assessment, meditation reminders, confidential counselor booking |
| **Sick Leave Analytics** | Pattern detection for frequent absences with wellness check-in triggers |
| **Ergonomic Reminders** | Periodic stretch/exercise/break reminders based on continuous desk time |
| **Health Insurance Tracking** | Policy details, coverage, dependents, and claim history |
| **Vaccination & Fitness Drives** | Health camps, vaccination schedules, step-count challenges |
| **Wellness Score** | Composite health score based on activity, sick days, self-assessments, and check-up compliance |
| **Employee Assistance Program (EAP)** | Confidential helpline access, financial counseling, legal aid referrals |
| **Maternity/Paternity Wellness** | Pre and post-natal health tracking, flexible return-to-work scheduling |
| **Blood Donation Drive** | Volunteer registration, camp organization, donor recognition |

### 6. Advanced Task & Project Management

| Feature | Description |
|---------|-------------|
| **Gantt Charts** | Visual project timeline with dependency mapping, milestones, drag-to-reschedule |
| **Workload Management** | Per-employee task load visualization with capacity planning and overallocation alerts |
| **Time Estimation** | Estimated vs actual time per task with variance analysis |
| **Project Budgeting** | Budget allocation with expense tracking and cost-per-task analysis |
| **Sprint Management** | Scrum board with sprint planning, backlog grooming, velocity tracking, retrospectives |
| **Task Dependencies** | Blocker/linked-task with automatic status cascade |
| **Automated Task Assignment** | AI-suggested assignment based on skill, workload, and past performance |
| **Client Portal** | External client view for progress, milestone approval, and feedback |
| **Kanban Board** | Customizable columns with WIP limits, swimlanes, and card aging |
| **Task Templates** | Reusable task templates for recurring work (deployment checklist, onboarding tasks) |
| **Sub-tasks & Checklists** | Nested task breakdown with independent assignment and tracking |
| **Task Comments & Activity Log** | Threaded discussions and full audit trail per task |
| **File Attachments per Task** | Attach documents, designs, and links directly to tasks |
| **Priority Matrix (Eisenhower)** | Urgent/Important quadrant view for task prioritization |
| **Milestone Tracking** | Define project milestones with deliverables, deadlines, and completion criteria |
| **Project Wiki** | Per-project documentation space with rich text editor and file attachments |

### 7. Performance & Growth

| Feature | Description |
|---------|-------------|
| **360° Feedback** | Peer, subordinate, manager, and self-evaluation with anonymized aggregation |
| **OKR Framework** | Company → Department → Individual goal cascade with quarterly tracking |
| **Skill Matrix** | Employee skill inventory with proficiency levels, gap analysis, training recommendations |
| **Learning & Development** | Course catalog, training calendar, completion tracking, certification management |
| **Promotion Workflow** | Promotion request → review → approval with compensation adjustment |
| **PIP (Performance Improvement Plan)** | Structured PIP with milestone tracking and outcome documentation |
| **Continuous Feedback** | Real-time peer-to-peer feedback (not just annual review) with manager visibility |
| **Career Path Visualization** | Visual career progression map showing possible roles and required skills |
| **Training Needs Analysis** | AI-identified skill gaps based on role requirements vs current proficiency |
| **Mentorship Program** | Mentor-mentee matching, session scheduling, and progress tracking |
| **Certification Tracking** | Professional certifications with expiry dates and renewal reminders |
| **Performance Calibration** | Cross-team manager calibration sessions to ensure fair rating distribution |

### 8. Compensation & Benefits Expansion

| Feature | Description |
|---------|-------------|
| **Expense Management** | Expense submission with receipt upload, approval workflow, reimbursement tracking |
| **Travel & Accommodation** | Business trip request, booking approval, per-diem, post-trip settlement |
| **Loan & Advance** | Loan application with EMI calculation, approval chain, salary deduction scheduling |
| **Festival Bonus** | Automated bonus calculation based on salary, tenure, and company policy |
| **Tax Computation** | Annual tax estimation, TDS tracking, tax certificate generation |
| **Salary Benchmarking** | Market rate comparison by role/experience to ensure competitive compensation |
| **Compensation Review Cycle** | Annual/semi-annual salary review with merit increase recommendations |
| **Stock/Equity Tracking** | ESOP allocation, vesting schedule, and exercise tracking |
| **Flexible Benefits Platform** | Choose-your-own-benefits within a budget (health upgrade, gym, transport) |

### 9. Asset & Infrastructure Management

| Feature | Description |
|---------|-------------|
| **Asset Lifecycle** | Asset assignment (laptop, phone, accessories) with serial tracking, condition logging, return workflow |
| **Software License Management** | License allocation, renewal tracking, usage monitoring, compliance reporting |
| **IT Support Ticketing** | Internal helpdesk with ticket creation, priority routing, SLA tracking, resolution logging |
| **Visitor Management** | Visitor registration, host notification, badge printing, visit log |
| **Inventory Management** | Office supplies tracking with reorder alerts and consumption analytics |
| **Workspace/Seat Management** | Desk booking, hot-desking, floor plan visualization |
| **Vehicle Management** | Company vehicle allocation, fuel logs, maintenance scheduling, trip tracking |

### 10. Compliance & Legal

| Feature | Description |
|---------|-------------|
| **Document Management System (DMS)** | Policy/procedure repository with version control and acknowledgment tracking |
| **Grievance Management** | Confidential complaint submission, investigation workflow, resolution tracking |
| **Disciplinary Workflow** | Show-cause → inquiry → warning → suspension → termination with full audit trail |
| **Visa & Immigration** | Work permit/visa expiry alerts, renewal reminders, travel document management |
| **Policy Acknowledgment** | Mandatory policy read-and-accept with digital signature and compliance reporting |
| **Audit Trail** | Immutable log of all system actions (who changed what, when, from where) |
| **GDPR/Data Privacy Compliance** | Data retention policies, right-to-deletion workflows, consent management |

### 11. Dashboards & Analytics

| Feature | Description |
|---------|-------------|
| **CEO Dashboard** | Company-wide KPIs: headcount, revenue per employee, attrition, cost center analysis, org health score |
| **HR Dashboard** | Recruitment pipeline, onboarding status, leave trends, compliance alerts, employee lifecycle metrics |
| **Engineering Manager Dashboard** | Sprint velocity, code review turnaround, deployment frequency, bug resolution time, team capacity utilization |
| **Finance Dashboard** | Payroll cost breakdown, budget vs actual by department, tax liabilities, expense trends, cash flow projection |
| **Employee Self-Service Dashboard** | Personal KPIs: attendance score, leave balance, task completion rate, learning progress, performance rating trend |
| **Recruitment Dashboard** | Time-to-hire, cost-per-hire, source effectiveness, pipeline funnel, offer acceptance rate |
| **Attendance & Punctuality Dashboard** | Late arrivals, early departures, absenteeism rate, overtime distribution by department |
| **Project Health Dashboard** | On-track / at-risk / delayed projects with budget burn, resource allocation, and milestone status |
| **Employee Engagement Dashboard** | eNPS score, feedback participation, recognition frequency, wellness program adoption |
| **Diversity & Inclusion Dashboard** | Gender/age/ethnicity distribution, pay equity analysis, promotion rate by demographic |
| **Learning & Development Dashboard** | Training hours per employee, course completion rate, skill coverage gap, certification status |
| **IT & Asset Dashboard** | Ticket resolution time, asset utilization, license compliance, support satisfaction score |
| **Custom Dashboard Builder** | Drag-and-drop widget-based dashboard creator with 30+ widget types (charts, tables, KPI cards, gauges, heatmaps) |
| **Real-time Data Widgets** | Live-updating dashboard widgets via WebSocket (no manual refresh) |
| **Scheduled Report Delivery** | Auto-generate and email reports on configurable schedule (daily/weekly/monthly) |
| **Drill-Down Analytics** | Click any dashboard metric to see detailed breakdown (e.g., click "Attrition 12%" → see who, when, why) |
| **Comparative Analytics** | Side-by-side department/team/quarter comparisons with trend lines |
| **Export & Embed** | Export any dashboard as PDF/PNG/CSV, or embed dashboard widgets in other pages |
| **Role-Based Dashboard Views** | Different users see different dashboards based on their role and permissions |
| **Anomaly Detection** | AI-flagged unusual patterns (sudden spike in leave requests, drop in productivity, unusual login patterns) |

### 12. Communication & Notifications

| Feature | Description |
|---------|-------------|
| **Team Chat Channels** | Persistent topic-based channels (like Slack) with threading and file sharing |
| **Direct Messages** | 1-on-1 private messaging with read receipts and typing indicators |
| **Announcement Board** | Company-wide and department-wide pinned announcements with read tracking |
| **Push Notifications** | Browser push for urgent updates (leave approval, interview reminder, task deadline) |
| **SMS Integration** | OTP, critical alerts, and optional SMS notifications for employees without app access |
| **Notification Preferences** | Granular per-channel, per-event notification control (email only / push only / mute) |
| **Auto-Reply / Out of Office** | Set automatic replies for chat and email during leave or focus time |

### 13. Employee Engagement & Culture

| Feature | Description |
|---------|-------------|
| **Recognition & Rewards** | Peer-to-peer kudos, spot awards, points-based reward system with redemption catalog |
| **Employee NPS (eNPS)** | Pulse surveys and annual engagement surveys with trend tracking |
| **Birthday & Work Anniversary** | Auto-celebration with team notifications and customizable greetings |
| **Team Building Activities** | Event creation, RSVP tracking, photo uploads, and feedback collection |
| **Idea Box / Suggestion Portal** | Anonymous or named idea submission with voting and management response |
| **Employee Clubs & Interest Groups** | Self-organize around interests (sports, book club, gaming, tech talks) |
| **Internal Job Board** | Open positions visible to current employees for internal mobility |
| **Work Anniversary Milestones** | Auto-recognized at 1, 3, 5, 10 years with customizable rewards |

### 14. Onboarding & Offboarding

| Feature | Description |
|---------|-------------|
| **Onboarding Checklist** | Configurable pre-joining and Day 1 task lists (IT setup, access provisioning, buddy assignment) |
| **Onboarding Timeline** | Visual new-hire journey: offer accepted → documents submitted → first day → 30/60/90 day check-ins |
| **Buddy/Mentor Assignment** | Auto-assign onboarding buddy with scheduled check-in reminders |
| **New Hire Portal** | Pre-joining document upload, form filling, company handbook access |
| **Offboarding Checklist** | Automated exit process: knowledge transfer, asset return, access revocation, full & final settlement |
| **Exit Interview** | Structured exit interview form with anonymized aggregation and trend analysis |
| **Alumni Network** | Former employee directory for boomerang hires and referrals |

### 15. Security & Administration

| Feature | Description |
|---------|-------------|
| **Audit Logs** | Complete action history: who did what, when, from which IP |
| **Session Management** | Active session view, force logout, concurrent session limits |
| **IP Whitelisting** | Restrict access to specific IP ranges for office-only access |
| **Two-Factor Authentication (2FA)** | TOTP (Google Authenticator) and SMS-based 2FA |
| **Single Sign-On (SSO)** | SAML/OAuth2 integration with corporate identity providers (Azure AD, Okta, Google Workspace) |
| **Data Export & Backup** | Automated data backup with point-in-time recovery and full data export |
| **Role Permission Audit** | Periodic review of who has what permissions with staleness detection |
| **API Rate Limiting** | Configurable per-user and per-endpoint rate limits |

### 16. Platform & Integration

| Feature | Description |
|---------|-------------|
| **Slack/Microsoft Teams Bot** | Notifications, leave approval, meeting join links from within Slack/Teams |
| **GitHub/GitLab Integration** | Developer activity tracking, PR/commit linking to tasks, code review metrics |
| **Calendar Sync (Google/Outlook)** | Two-way sync for meetings, leave, and deadlines |
| **Public REST API** | OAuth2 API for third-party integrations and partner access |
| **Webhook System** | Event-driven webhooks for external system notifications |
| **Zapier/Make Integration** | No-code automation connector for 1000+ third-party apps |
| **Multi-Tenant Support** | SaaS-ready architecture for multiple organizations on one instance |
| **White-Label / Custom Branding** | Per-organization logo, color scheme, and domain customization |
| **Localization (i18n)** | Multi-language support (English, Bengali, Hindi, Arabic, etc.) with RTL support |
