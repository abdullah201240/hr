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
  status: "approved"
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

export interface Task {
  id: number
  text: string
  priority: string
  due: string
  done: boolean
}

export interface Announcement {
  id: string
  title: string
  content: string
  category: string
  department: string
  date: string
  author: string
  status: string
}

// ─── Constants ─────────────────────────────────────────────────────────────────

export const DEFAULT_LEAVE_BALANCES: LeaveBalance[] = [
  { label: "Annual Leave", used: 8, total: 18, color: "bg-sky-500", light: "text-sky-500", icon: Coffee, key: "annual" },
  { label: "Sick Leave", used: 2, total: 10, color: "bg-rose-500", light: "text-rose-500", icon: Heart, key: "sick" },
  { label: "Casual Leave", used: 1, total: 5, color: "bg-amber-500", light: "text-amber-500", icon: Star, key: "casual" },
  { label: "Late", used: 1, total: 3, color: "bg-orange-500", light: "text-orange-500", icon: Clock, key: "late" },
  { label: "Travel", used: 0, total: 5, color: "bg-teal-500", light: "text-teal-500", icon: MapPin, key: "travel" },
  { label: "Movement", used: 0, total: 3, color: "bg-indigo-500", light: "text-indigo-500", icon: Briefcase, key: "movement" },
  { label: "Emergency Leave", used: 0, total: 5, color: "bg-red-600", light: "text-red-600", icon: AlertTriangle, key: "emergency" },
  { label: "Unpaid Leave", used: 0, total: 10, color: "bg-slate-500", light: "text-slate-500", icon: XCircle, key: "unpaid" },
]

export const INITIAL_TASKS: Task[] = [
  { id: 1, text: "Finalize Q2 feedback forms", priority: "high", due: "Today", done: false },
  { id: 2, text: "Update passport document copy", priority: "medium", due: "3 days", done: false },
  { id: 3, text: "Review new hire onboarding plan", priority: "medium", due: "Jun 20", done: false },
  { id: 4, text: "Submit travel reimbursement receipt", priority: "low", due: "Jun 18", done: true },
  { id: 5, text: "Complete React 19 cert module", priority: "low", due: "Jun 25", done: false },
]

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { day: 1, dateStr: "Jun 1", dayName: "Monday", status: "present", checkIn: "08:55 AM", checkOut: "06:05 PM", hours: 9.1, breakHours: 1, location: "Office", ipAddress: "192.168.10.45", device: "Chrome / macOS", notes: "Regular check-in" },
  { day: 2, dateStr: "Jun 2", dayName: "Tuesday", status: "present", checkIn: "09:02 AM", checkOut: "06:15 PM", hours: 9.2, breakHours: 1, location: "Office", ipAddress: "192.168.10.45", device: "Chrome / macOS" },
  { day: 3, dateStr: "Jun 3", dayName: "Wednesday", status: "late", checkIn: "09:22 AM", checkOut: "06:00 PM", hours: 8.6, breakHours: 1, location: "Remote", ipAddress: "103.45.23.11", device: "Safari / iOS", notes: "Commute delay due to rain" },
  { day: 4, dateStr: "Jun 4", dayName: "Thursday", status: "present", checkIn: "08:45 AM", checkOut: "05:45 PM", hours: 9.0, breakHours: 1, location: "Office", ipAddress: "192.168.10.45", device: "Chrome / macOS" },
  { day: 5, dateStr: "Jun 5", dayName: "Friday", status: "present", checkIn: "08:58 AM", checkOut: "06:30 PM", hours: 9.5, breakHours: 1, location: "Remote", ipAddress: "103.45.23.11", device: "Chrome / macOS", notes: "Extended shift to push release" },
  { day: 6, dateStr: "Jun 6", dayName: "Saturday", status: "weekend", checkIn: null, checkOut: null, hours: null, breakHours: 0, location: null, ipAddress: null, device: null },
  { day: 7, dateStr: "Jun 7", dayName: "Sunday", status: "weekend", checkIn: null, checkOut: null, hours: null, breakHours: 0, location: null, ipAddress: null, device: null },
  { day: 8, dateStr: "Jun 8", dayName: "Monday", status: "present", checkIn: "08:50 AM", checkOut: "06:00 PM", hours: 9.1, breakHours: 1, location: "Office", ipAddress: "192.168.10.45", device: "Chrome / macOS" },
  { day: 9, dateStr: "Jun 9", dayName: "Tuesday", status: "present", checkIn: "09:02 AM", checkOut: "06:05 PM", hours: 9.05, breakHours: 1, location: "Office", ipAddress: "192.168.10.45", device: "Chrome / macOS" },
  { day: 10, dateStr: "Jun 10", dayName: "Wednesday", status: "present", checkIn: "08:55 AM", checkOut: "06:12 PM", hours: 9.28, breakHours: 1, location: "Office", ipAddress: "192.168.10.45", device: "Chrome / macOS" },
  { day: 11, dateStr: "Jun 11", dayName: "Thursday", status: "present", checkIn: "09:10 AM", checkOut: null, hours: 8.5, breakHours: 1, location: "Remote", ipAddress: "103.45.23.11", device: "Chrome / macOS", notes: "Active session" },
  { day: 12, dateStr: "Jun 12", dayName: "Friday", status: "upcoming", checkIn: null, checkOut: null, hours: null, breakHours: 0, location: null, ipAddress: null, device: null },
  { day: 13, dateStr: "Jun 13", dayName: "Saturday", status: "weekend", checkIn: null, checkOut: null, hours: null, breakHours: 0, location: null, ipAddress: null, device: null },
  { day: 14, dateStr: "Jun 14", dayName: "Sunday", status: "weekend", checkIn: null, checkOut: null, hours: null, breakHours: 0, location: null, ipAddress: null, device: null },
  { day: 15, dateStr: "Jun 15", dayName: "Monday", status: "upcoming", checkIn: null, checkOut: null, hours: null, breakHours: 0, location: null, ipAddress: null, device: null },
  { day: 16, dateStr: "Jun 16", dayName: "Tuesday", status: "present", checkIn: "08:52 AM", checkOut: "05:55 PM", hours: 9.05, breakHours: 1, location: "Office", ipAddress: "192.168.10.45", device: "Chrome / macOS" },
  { day: 17, dateStr: "Jun 17", dayName: "Wednesday", status: "absent", checkIn: null, checkOut: null, hours: null, breakHours: 0, location: null, ipAddress: null, device: null, notes: "Unexcused absence / Forgot to punch" },
  { day: 18, dateStr: "Jun 18", dayName: "Thursday", status: "holiday", checkIn: null, checkOut: null, hours: null, breakHours: 0, location: null, ipAddress: null, device: null, notes: "National Holiday - Independence Celebration" },
  { day: 19, dateStr: "Jun 19", dayName: "Friday", status: "present", checkIn: "09:00 AM", checkOut: "06:00 PM", hours: 9.0, breakHours: 1, location: "Office", ipAddress: "192.168.10.45", device: "Chrome / macOS" },
  { day: 20, dateStr: "Jun 20", dayName: "Saturday", status: "weekend", checkIn: null, checkOut: null, hours: null, breakHours: 0, location: null, ipAddress: null, device: null },
  { day: 21, dateStr: "Jun 21", dayName: "Sunday", status: "weekend", checkIn: null, checkOut: null, hours: null, breakHours: 0, location: null, ipAddress: null, device: null },
  { day: 22, dateStr: "Jun 22", dayName: "Monday", status: "present", checkIn: "08:48 AM", checkOut: "06:05 PM", hours: 9.28, breakHours: 1, location: "Office", ipAddress: "192.168.10.45", device: "Chrome / macOS" },
  { day: 23, dateStr: "Jun 23", dayName: "Tuesday", status: "late", checkIn: "09:40 AM", checkOut: "06:30 PM", hours: 8.83, breakHours: 1, location: "Remote", ipAddress: "103.45.23.11", device: "Chrome / macOS", notes: "Doctor visit in the morning" },
  { day: 24, dateStr: "Jun 24", dayName: "Wednesday", status: "present", checkIn: "08:59 AM", checkOut: "06:00 PM", hours: 9.0, breakHours: 1, location: "Office", ipAddress: "192.168.10.45", device: "Chrome / macOS" },
  { day: 25, dateStr: "Jun 25", dayName: "Thursday", status: "present", checkIn: "08:52 AM", checkOut: "05:58 PM", hours: 9.1, breakHours: 1, location: "Office", ipAddress: "192.168.10.45", device: "Chrome / macOS" },
  { day: 26, dateStr: "Jun 26", dayName: "Friday", status: "present", checkIn: "08:55 AM", checkOut: "06:10 PM", hours: 9.25, breakHours: 1, location: "Remote", ipAddress: "103.45.23.11", device: "Safari / macOS" },
  { day: 27, dateStr: "Jun 27", dayName: "Saturday", status: "weekend", checkIn: null, checkOut: null, hours: null, breakHours: 0, location: null, ipAddress: null, device: null },
  { day: 28, dateStr: "Jun 28", dayName: "Sunday", status: "weekend", checkIn: null, checkOut: null, hours: null, breakHours: 0, location: null, ipAddress: null, device: null },
  { day: 29, dateStr: "Jun 29", dayName: "Monday", status: "present", checkIn: "09:00 AM", checkOut: "06:00 PM", hours: 9.0, breakHours: 1, location: "Office", ipAddress: "192.168.10.45", device: "Chrome / macOS" },
  { day: 30, dateStr: "Jun 30", dayName: "Tuesday", status: "present", checkIn: "08:58 AM", checkOut: "06:02 PM", hours: 9.07, breakHours: 1, location: "Office", ipAddress: "192.168.10.45", device: "Chrome / macOS" },
]

export const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-1",
    title: "Annual Company Picnic scheduled for June 29",
    content: "We are excited to announce that our Annual Company Picnic will be held on Monday, June 29th at Golden Gate Park. The picnic will feature food trucks, team-building activities, and live music. Families are welcome! Please RSVP by June 20th.",
    category: "event",
    department: "All Departments",
    date: "2026-06-10",
    author: "Alex Johnson",
    status: "Published",
  },
  {
    id: "ann-2",
    title: "Updated Remote Work & Hybrid Schedule Policy",
    content: "Starting next month, all employees are requested to sync their core working days (Tuesday & Thursday) in the office. Remote work request configurations can be managed in the settings area. Please read the document in the Policies folder for further details.",
    category: "policy",
    department: "All Departments",
    date: "2026-06-08",
    author: "Alex Johnson",
    status: "Published",
  },
  {
    id: "ann-3",
    title: "Scheduled Server Maintenance: Saturday Night",
    content: "The internal IT systems and HR portal will be offline for scheduled database maintenance this Saturday, June 20th, from 10:00 PM to 2:00 AM. Please ensure you save all pending tasks and reports before then.",
    category: "warning",
    department: "All Departments",
    date: "2026-06-12",
    author: "IT Infrastructure Team",
    status: "Published",
  },
]

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
  high: "text-rose-500 bg-rose-500/10",
  medium: "text-amber-500 bg-amber-500/10",
  low: "text-emerald-500 bg-emerald-500/10",
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

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
