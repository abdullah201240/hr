import {
  Coffee,
  Star,
  Heart,
  Clock,
  MapPin,
  XCircle,
  Briefcase,
  AlertTriangle,
} from "lucide-react"

// ─── Shared Types ──────────────────────────────────────────────────────────────

export interface Attachment {
  id: string
  title: string
  fileName: string
}

export interface AttendanceRecord {
  day: number
  dateStr: string
  dayName: string
  status: "present" | "late" | "absent" | "leave" | "holiday" | "weekend" | "upcoming"
  checkIn: string | null
  checkOut: string | null
  hours: number | null
  breakHours: number
  location: "Office" | "Remote" | null
  ipAddress: string | null
  device: string | null
  notes?: string
  attachments?: Attachment[]
}

export interface SetupHoliday {
  id: string
  name: string
  startDay: number
  endDay: number
  startDate?: string
  endDate?: string
}

export interface LeaveApplication {
  id: string
  startDay: number
  endDay: number
  leaveType: string
  reason: string
  attachments: Attachment[]
  status: "pending" | "approved" | "rejected" | "cancelled"
}

export interface LeaveBalance {
  label: string
  used: number
  total: number
  color: string
  light: string
  icon: typeof Coffee
  key: string
}

export interface DashboardTask {
  id: string
  text: string
  priority: string
  due: string
  done: boolean
  projectName?: string | null
  subtasksTotal?: number
  subtasksCompleted?: number
  overdue?: boolean
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  department: string;
  date: string;
  author: string;
  status: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

export const INITIAL_TASKS: DashboardTask[] = []

export const LEAVE_TYPE_SHORT: Record<string, string> = {
  annual: "AL",
  sick: "SL",
  casual: "CL",
  late: "LT",
  travel: "TR",
  movement: "MV",
  emergency: "EL",
  unpaid: "UL",
}

export const PRIORITY_STYLE: Record<string, string> = {
  high: "text-rose-500 bg-rose-500/10 hover:bg-rose-500/10",
  High: "text-rose-500 bg-rose-500/10 hover:bg-rose-500/10",
  medium: "text-amber-500 bg-amber-500/10 hover:bg-amber-500/10",
  Medium: "text-amber-500 bg-amber-500/10 hover:bg-amber-500/10",
  low: "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/10",
  Low: "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/10",
  urgent: "text-rose-600 bg-rose-600/10 hover:bg-rose-600/10 font-bold",
  Urgent: "text-rose-600 bg-rose-600/10 hover:bg-rose-600/10 font-bold",
}

/** Format month+year using Intl (e.g. "June 2026") */
export function formatMonthYear(month: number, year: number): string {
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(year, month, 1))
}

/** Format a full date using Intl (e.g. "Monday, June 16, 2026") */
export function formatFullDate(day: number, month: number, year: number): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(year, month, day))
}

/** Format an ISO date string using Intl (e.g. "Jun 16, 2026") */
export function formatDateStr(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(d)
}

/** Resolve icon from key after localStorage deserialization */
export function resolveLeaveIcon(key: string): typeof Coffee {
  switch (key) {
    case "sick": return Heart
    case "casual": return Star
    case "late": return Clock
    case "travel": return MapPin
    case "movement": return Briefcase
    case "emergency": return AlertTriangle
    case "unpaid": return XCircle
    default: return Coffee
  }
}
