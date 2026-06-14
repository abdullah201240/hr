import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Coffee,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  Star,
  Heart,
  CheckCircle2,
  Clock,
  MapPin,
  XCircle,
  GripVertical,
  Trash2,
  Briefcase,
  AlertTriangle,
  Megaphone,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ─── Leave Balances ───────────────────────────────────────────────────────────
const leaveBalances = [
  { label: "Annual Leave", used: 8, total: 18, color: "bg-sky-500", light: "text-sky-500", icon: Coffee, key: "annual" },
  { label: "Sick Leave", used: 2, total: 10, color: "bg-rose-500", light: "text-rose-500", icon: Heart, key: "sick" },
  { label: "Casual Leave", used: 1, total: 5, color: "bg-amber-500", light: "text-amber-500", icon: Star, key: "casual" },
  { label: "Late", used: 1, total: 3, color: "bg-orange-500", light: "text-orange-500", icon: Clock, key: "late" },
  { label: "Travel", used: 0, total: 5, color: "bg-teal-500", light: "text-teal-500", icon: MapPin, key: "travel" },
  { label: "Movement", used: 0, total: 3, color: "bg-indigo-500", light: "text-indigo-500", icon: Briefcase, key: "movement" },
  { label: "Emergency Leave", used: 0, total: 5, color: "bg-red-600", light: "text-red-600", icon: AlertTriangle, key: "emergency" },
  { label: "Unpaid Leave", used: 0, total: 10, color: "bg-slate-500", light: "text-slate-500", icon: XCircle, key: "unpaid" },
]

// ─── My Tasks ─────────────────────────────────────────────────────────────────
const initialTasks = [
  { id: 1, text: "Finalize Q2 feedback forms", priority: "high", due: "Today", done: false },
  { id: 2, text: "Update passport document copy", priority: "medium", due: "3 days", done: false },
  { id: 3, text: "Review new hire onboarding plan", priority: "medium", due: "Jun 20", done: false },
  { id: 4, text: "Submit travel reimbursement receipt", priority: "low", due: "Jun 18", done: true },
  { id: 5, text: "Complete React 19 cert module", priority: "low", due: "Jun 25", done: false },
]

// ─── Calendar Events ──────────────────────────────────────────────────────────
const calendarEvents: Record<number, { type: string; label: string }[]> = {
  11: [{ type: "meeting", label: "Monthly HR Sync @ 11:00 AM" }],
  14: [{ type: "leave", label: "Team: David Kim – On Leave" }],
  18: [{ type: "birthday", label: "🎂 Sara Chen's Birthday" }],
  22: [{ type: "meeting", label: "Q2 Retrospective @ 3:00 PM" }],
  25: [{ type: "deadline", label: "Expense Reports Due" }],
  29: [{ type: "holiday", label: "Company Picnic Day" }],
  30: [{ type: "payday", label: "💰 Payday!" }],
}

// ─── Attendance Mock Data for June 2026 ───────────────────────────────────────────
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
  attachments?: { id: string; title: string; fileName: string }[]
}

const initialJuneAttendance: AttendanceRecord[] = [
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
  { day: 30, dateStr: "Jun 30", dayName: "Tuesday", status: "present", checkIn: "08:58 AM", checkOut: "06:02 PM", hours: 9.07, breakHours: 1, location: "Office", ipAddress: "192.168.10.45", device: "Chrome / macOS" }
]

export interface SetupHoliday {
  id: string
  name: string
  startDay: number
  endDay: number
  startDate?: string
  endDate?: string
}

// ─── Helper styles ────────────────────────────────────────────────────────────
const priorityStyle: Record<string, string> = {
  high: "text-rose-500 bg-rose-500/10",
  medium: "text-amber-500 bg-amber-500/10",
  low: "text-emerald-500 bg-emerald-500/10",
}

export interface LeaveApplication {
  id: string
  startDay: number
  endDay: number
  leaveType: string
  reason: string
  attachments: { id: string; title: string; fileName: string }[]
  status: "approved"
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Load Announcements from localStorage
  const [announcements] = useState<any[]>(() => {
    const saved = localStorage.getItem("hr_announcements")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.filter((a: any) => a.status === "Published")
      } catch (e) {
        console.error(e)
      }
    }
    return [
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
  })
  const [isViewAnnOpen, setIsViewAnnOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null)

  const [tasks, setTasks] = useState(initialTasks)
  const [calMonth, setCalMonth] = useState(5) // June (0-indexed)
  const [calYear] = useState(2026)
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(11)

  // Day Detail Dialog State
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false)

  // Leave Dialog State
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [leaveType, setLeaveType] = useState("annual")
  const [leaveReason, setLeaveReason] = useState("")
  const [dialogAttachments, setDialogAttachments] = useState<{ id: string; title: string; fileName: string }[]>([])
  const [newAttachmentTitle, setNewAttachmentTitle] = useState("")
  const [newAttachmentFileName, setNewAttachmentFileName] = useState("")

  // Drag & Drop state
  const [dragOverDay, setDragOverDay] = useState<number | null>(null)

  // Date Range state
  const [startDay, setStartDay] = useState(11)
  const [endDay, setEndDay] = useState(11)

  // Stateful leave applications list
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>(() => {
    const saved = localStorage.getItem("hr_leave_applications")
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { console.error(e) }
    }
    return [
      {
        id: "default-leave-1",
        startDay: 15,
        endDay: 15,
        leaveType: "casual",
        reason: "Personal family matter",
        attachments: [],
        status: "approved"
      }
    ]
  })

  // Synchronize startDay and endDay when dialog opens
  useEffect(() => {
    if (isLeaveDialogOpen && selectedDayNumber) {
      setStartDay(selectedDayNumber)
      setEndDay(selectedDayNumber)
    }
  }, [isLeaveDialogOpen, selectedDayNumber])

  useEffect(() => {
    if (!isLeaveDialogOpen) {
      setDialogAttachments([])
      setNewAttachmentTitle("")
      setNewAttachmentFileName("")
    }
  }, [isLeaveDialogOpen])

  // Stateful leave balances
  const [balances, setBalances] = useState<typeof leaveBalances>(() => {
    const saved = localStorage.getItem("hr_leave_balances")
    const defaultBalances = [
      { label: "Annual Leave", used: 8, total: 18, color: "bg-sky-500", light: "text-sky-500", icon: Coffee, key: "annual" },
      { label: "Sick Leave", used: 2, total: 10, color: "bg-rose-500", light: "text-rose-500", icon: Heart, key: "sick" },
      { label: "Casual Leave", used: 1, total: 5, color: "bg-amber-500", light: "text-amber-500", icon: Star, key: "casual" },
      { label: "Late", used: 1, total: 3, color: "bg-orange-500", light: "text-orange-500", icon: Clock, key: "late" },
      { label: "Travel", used: 0, total: 5, color: "bg-teal-500", light: "text-teal-500", icon: MapPin, key: "travel" },
      { label: "Movement", used: 0, total: 3, color: "bg-indigo-500", light: "text-indigo-500", icon: Briefcase, key: "movement" },
      { label: "Emergency Leave", used: 0, total: 5, color: "bg-red-600", light: "text-red-600", icon: AlertTriangle, key: "emergency" },
      { label: "Unpaid Leave", used: 0, total: 10, color: "bg-slate-500", light: "text-slate-500", icon: XCircle, key: "unpaid" },
    ]
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Validate that all current leave type keys exist in saved data
        const savedKeys = new Set(parsed.map((b: any) => b.key))
        const requiredKeys = ["annual", "sick", "casual", "late", "travel", "movement", "emergency", "unpaid"]
        const hasAllKeys = requiredKeys.every(k => savedKeys.has(k))
        if (hasAllKeys) {
          return parsed.map((b: any) => {
            let icon = Coffee
            if (b.key === "sick") icon = Heart
            else if (b.key === "casual") icon = Star
            else if (b.key === "late") icon = Clock
            else if (b.key === "travel") icon = MapPin
            else if (b.key === "movement") icon = Briefcase
            else if (b.key === "emergency") icon = AlertTriangle
            else if (b.key === "unpaid") icon = XCircle
            return { ...b, icon }
          })
        }
        // Saved data is outdated, clear it
        localStorage.removeItem("hr_leave_balances")
      } catch (e) {
        console.error(e)
      }
    }
    return defaultBalances
  })

  // Stateful June attendance
  const [attendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem("hr_june_attendance_records")
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { console.error(e) }
    }
    return initialJuneAttendance
  })
  
  // Load Holiday Settings from localStorage
  const [weeklyHolidays, setWeeklyHolidays] = useState<string[]>(["Saturday", "Sunday"])
  const [regularHolidays, setRegularHolidays] = useState<SetupHoliday[]>([
    { id: "default-1", name: "National Holiday - Independence Celebration", startDay: 18, endDay: 18 }
  ])

  useEffect(() => {
    const savedWeekly = localStorage.getItem("hr_weekly_holidays")
    if (savedWeekly) {
      try { setWeeklyHolidays(JSON.parse(savedWeekly)) } catch (e) { console.error(e) }
    }

    const savedRegular = localStorage.getItem("hr_regular_holidays")
    if (savedRegular) {
      try { setRegularHolidays(JSON.parse(savedRegular)) } catch (e) { console.error(e) }
    }
  }, [])

  // Apply Leave Handler
  const handleApplyLeave = () => {
    if (!selectedDayNumber) return

    const duration = endDay - startDay + 1
    if (duration <= 0) return

    const newApp: LeaveApplication = {
      id: Math.random().toString(36).substring(2, 9),
      startDay,
      endDay,
      leaveType,
      reason: leaveReason.trim() || "No reason provided",
      attachments: dialogAttachments,
      status: "approved"
    }

    const updatedApps = [...leaveApplications, newApp]

    // Update balances
    const updatedBalances = balances.map(b => {
      if (b.key === leaveType) {
        return { ...b, used: b.used + duration }
      }
      return b
    })

    // Remove components (icons) before stringifying
    const serializableBalances = updatedBalances.map(({ icon, ...rest }) => rest)

    setLeaveApplications(updatedApps)
    setBalances(updatedBalances)
    localStorage.setItem("hr_leave_applications", JSON.stringify(updatedApps))
    localStorage.setItem("hr_leave_balances", JSON.stringify(serializableBalances))

    setIsLeaveDialogOpen(false)
    setLeaveReason("")
    setDialogAttachments([])
  }

  // Cancel Leave Handler by ID
  const handleCancelLeaveById = (id: string) => {
    const appToCancel = leaveApplications.find(la => la.id === id)
    if (!appToCancel) return

    const duration = appToCancel.endDay - appToCancel.startDay + 1
    const updatedApps = leaveApplications.filter(la => la.id !== id)

    const updatedBalances = balances.map(b => {
      if (b.key === appToCancel.leaveType) {
        return { ...b, used: Math.max(0, b.used - duration) }
      }
      return b
    })

    const serializableBalances = updatedBalances.map(({ icon, ...rest }) => rest)

    setLeaveApplications(updatedApps)
    setBalances(updatedBalances)
    localStorage.setItem("hr_leave_applications", JSON.stringify(updatedApps))
    localStorage.setItem("hr_leave_balances", JSON.stringify(serializableBalances))
  }

  // Compute final attendance records dynamically based on weekly, regular holidays, and leave applications
  const finalAttendance = attendanceRecords.map((record) => {
    // Check if this day is covered by an approved leave application
    const matchingLeave = leaveApplications.find(la => record.day >= la.startDay && record.day <= la.endDay)
    if (matchingLeave) {
      const selectedTypeObj = balances.find(b => b.key === matchingLeave.leaveType)
      const typeLabel = selectedTypeObj?.label || "Leave"
      return {
        ...record,
        status: "leave" as const,
        notes: `Approved ${typeLabel}: ${matchingLeave.reason}`,
        attachments: matchingLeave.attachments
      }
    }

    if (record.status === "upcoming") return record

    // Check regular holidays
    const matchingRegularHoliday = regularHolidays.find(h => {
      if (h.startDate && h.endDate) {
        const recordDate = new Date(2026, 5, record.day)
        const start = new Date(h.startDate)
        const end = new Date(h.endDate)
        recordDate.setHours(0, 0, 0, 0)
        start.setHours(0, 0, 0, 0)
        end.setHours(0, 0, 0, 0)
        return recordDate >= start && recordDate <= end
      }
      return record.day >= h.startDay && record.day <= h.endDay
    })
    if (matchingRegularHoliday) {
      return {
        ...record,
        status: "holiday" as const,
        notes: matchingRegularHoliday.name,
        checkIn: null,
        checkOut: null,
        hours: null
      }
    }

    // Check weekly holidays
    const isWeeklyHoliday = weeklyHolidays.includes(record.dayName)
    if (isWeeklyHoliday) {
      if (!record.checkIn) {
        return {
          ...record,
          status: "weekend" as const,
          checkIn: null,
          checkOut: null,
          hours: null
        }
      }
    } else {
      if (!record.checkIn && record.status !== "leave") {
        return {
          ...record,
          status: "absent" as const
        }
      }
    }

    return record
  })

  const leaveTypeShort: Record<string, string> = {
    annual: "AL",
    sick: "SL",
    casual: "CL",
    late: "LT",
    travel: "TR",
    movement: "MV",
    emergency: "EL",
    unpaid: "UL",
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  // ── Timers ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const toggleTask = (id: number) =>
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t))

  // ── Calendar Calculations ──────────────────────────────────────────────────
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const startOffset = (new Date(calYear, calMonth, 1).getDay() + 6) % 7
  const isCurrentMo = calMonth === currentTime.getMonth() && calYear === currentTime.getFullYear()
  const today = currentTime.getDate()

  // ── Computed ───────────────────────────────────────────────────────────────
  const doneTasks = tasks.filter(t => t.done).length
  const totalTasks = tasks.length
  const taskPct = Math.round((doneTasks / totalTasks) * 100)

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ══ Full-Width Layout: Calendar + Tasks ═══════════════════════════════════ */}
      <div className="space-y-6">

        {/* ── Interactive Calendar (Full Width) ──────────────────────────────────── */}
        <div className="space-y-6">
          <Card className="shadow-none border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Shift & Attendance Calendar</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{monthNames[calMonth]} {calYear}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCalMonth(m => m === 0 ? 11 : m - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCalMonth(m => m === 11 ? 0 : m + 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Left Column: Calendar Grid */}
            <div className="space-y-4">
            {/* Leave Balance + Draggable Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Leave Balance</p>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                  {balances.reduce((acc, b) => acc + (b.total - b.used), 0)} / {balances.reduce((acc, b) => acc + b.total, 0)} days left
                </Badge>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {balances.map(b => {
                  const Icon = b.icon as any
                  const remaining = b.total - b.used
                  return (
                    <div
                      key={b.key}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("leaveType", b.key)
                        e.dataTransfer.effectAllowed = "copy"
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold cursor-grab active:cursor-grabbing border border-border/40 bg-background hover:bg-muted/30 transition-colors select-none"
                    >
                      <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                      <Icon className={cn("h-4 w-4 shrink-0", b.light)} />
                      <span className="truncate">{b.label.replace(" Leave", "")}</span>
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 py-0 font-bold ml-auto shrink-0">
                        {remaining}/{b.total}
                      </Badge>
                    </div>
                  )
                })}
              </div>
              <p className="text-[9px] text-muted-foreground/50 italic">Drag a leave type onto a calendar date to apply</p>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 text-center">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                <div key={d} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider py-2.5">{d}</div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
              {Array.from({ length: startOffset }).map((_, i) => <div key={`pad-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const record = calMonth === 5 ? finalAttendance.find(d => d.day === day) : null
                const events = calendarEvents[day] || []
                const isToday = isCurrentMo && day === today
                const isSel = day === selectedDayNumber && calMonth === 5

                // Color-coded cell styling
                let cellBg = "bg-transparent hover:bg-muted/30"
                let textColor = "text-foreground"
                if (record) {
                  if (record.status === "present") {
                    cellBg = "bg-emerald-500/10 hover:bg-emerald-500/15 dark:bg-emerald-500/[0.04]"
                    textColor = "text-emerald-600 dark:text-emerald-400 font-semibold"
                  } else if (record.status === "late") {
                    cellBg = "bg-amber-500/10 hover:bg-amber-500/15 dark:bg-amber-500/[0.04]"
                    textColor = "text-amber-600 dark:text-amber-400 font-semibold"
                  } else if (record.status === "absent") {
                    cellBg = "bg-red-500/10 hover:bg-red-500/15 dark:bg-red-500/[0.04]"
                    textColor = "text-red-600 dark:text-red-400 font-semibold"
                  } else if (record.status === "leave") {
                    cellBg = "bg-sky-500/10 hover:bg-sky-500/15 dark:bg-sky-500/[0.04]"
                    textColor = "text-sky-600 dark:text-sky-400 font-semibold"
                  } else if (record.status === "holiday") {
                    cellBg = "bg-violet-500/10 hover:bg-violet-500/15 dark:bg-violet-500/[0.04]"
                    textColor = "text-violet-600 dark:text-violet-400 font-semibold"
                  } else if (record.status === "weekend") {
                    cellBg = "bg-muted/30 hover:bg-muted/40 dark:bg-muted/15"
                    textColor = "text-muted-foreground/60"
                  } else if (record.status === "upcoming") {
                    cellBg = "bg-transparent border border-dashed border-border/80 hover:bg-muted/20"
                    textColor = "text-muted-foreground"
                  }
                }

                return (
                  <Tooltip key={`d-${day}`}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          if (record) {
                            setSelectedDayNumber(day)
                            if (record.status !== "upcoming") setIsDayDetailOpen(true)
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = "copy"
                          setDragOverDay(day)
                        }}
                        onDragLeave={() => setDragOverDay(null)}
                        onDrop={(e) => {
                          e.preventDefault()
                          const droppedType = e.dataTransfer.getData("leaveType")
                          if (droppedType) {
                            setSelectedDayNumber(day)
                            setLeaveType(droppedType)
                            setIsLeaveDialogOpen(true)
                          }
                          setDragOverDay(null)
                        }}
                        className={cn(
                          "relative rounded-xl flex flex-col items-stretch p-2 text-xs font-medium transition-all duration-200 hover:scale-[1.02] min-h-[100px] group",
                          cellBg,
                          isToday && "ring-2 ring-primary",
                          isSel && "ring-2 ring-foreground",
                          dragOverDay === day && "ring-2 ring-primary ring-offset-1 bg-primary/5 scale-[1.04]"
                        )}
                      >
                        {/* Day Number + Action Buttons */}
                        <div className="flex items-start justify-between">
                          <span className={cn("text-xs leading-none font-semibold", isToday ? "text-primary font-extrabold" : textColor)}>{day}</span>
                          {record && record.status !== "upcoming" && record.status !== "weekend" && record.status !== "holiday" && (
                            record.status === "leave" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const app = leaveApplications.find(la => day >= la.startDay && day <= la.endDay)
                                  if (app) handleCancelLeaveById(app.id)
                                }}
                                className="h-3.5 w-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-red-500 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                                title="Cancel leave"
                              >×</button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedDayNumber(day)
                                  setIsLeaveDialogOpen(true)
                                }}
                                className="h-3.5 w-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-sky-500 hover:bg-sky-500/20 transition-colors opacity-0 group-hover:opacity-100"
                                title="Apply leave"
                              >+</button>
                            )
                          )}
                        </div>

                        {/* Cell Content - Rich Info */}
                        {record && record.status !== "upcoming" && record.status !== "weekend" && (
                          <div className="flex flex-col gap-0.5 mt-1 flex-1 justify-center">
                            {/* Status Badge */}
                            <span className={cn(
                              "text-[9px] font-bold uppercase tracking-tight leading-none px-1.5 py-0.5 rounded self-start",
                              record.status === "present" && "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
                              record.status === "late" && "bg-amber-500/20 text-amber-700 dark:text-amber-400",
                              record.status === "absent" && "bg-red-500/20 text-red-700 dark:text-red-400",
                              record.status === "leave" && "bg-sky-500/20 text-sky-700 dark:text-sky-400",
                              record.status === "holiday" && "bg-violet-500/20 text-violet-700 dark:text-violet-400"
                            )}>
                              {record.status === "leave"
                                ? (() => {
                                    const matchingLeave = leaveApplications.find(la => day >= la.startDay && day <= la.endDay)
                                    const short = matchingLeave ? (leaveTypeShort[matchingLeave.leaveType] || "LV") : "LV"
                                    return short
                                  })()
                                : record.status === "holiday"
                                  ? "HOLIDAY"
                                  : record.status === "absent"
                                    ? "ABSENT"
                                    : record.status === "present"
                                      ? "REGULAR"
                                      : "LATE"
                              }
                            </span>

                            {/* Punch Times for Present/Late */}
                            {(record.status === "present" || record.status === "late") && record.checkIn && (
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                                <span className="text-[9px] text-muted-foreground leading-none truncate">
                                  {record.checkIn}–{record.checkOut || "Active"}
                                </span>
                              </div>
                            )}

                            {/* Hours for Present/Late */}
                            {(record.status === "present" || record.status === "late") && record.hours && (
                              <span className="text-[9px] text-muted-foreground/80 leading-none">
                                {record.hours}h{record.location === "Remote" ? " · RM" : ""}
                              </span>
                            )}

                            {/* Leave reason snippet */}
                            {record.status === "leave" && record.notes && (
                              <span className="text-[8px] text-sky-600/70 dark:text-sky-400/70 leading-none truncate">
                                {record.notes.replace("Approved ", "").split(":")[0]}
                              </span>
                            )}

                            {/* Holiday name snippet */}
                            {record.status === "holiday" && record.notes && (
                              <span className="text-[8px] text-violet-600/70 dark:text-violet-400/70 leading-none truncate">
                                {record.notes.length > 22 ? record.notes.substring(0, 22) + "…" : record.notes}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs max-w-[200px] p-2 space-y-1">
                      <p className="font-bold">June {day}, 2026</p>
                      {record && (
                        <p className="capitalize">Status: <span className="font-semibold">{record.status}</span></p>
                      )}
                      {record && record.checkIn && (
                        <p>Punch: {record.checkIn} - {record.checkOut || "Active"}</p>
                      )}
                      {events.map((ev, ei) => (
                        <p key={ei} className="font-medium text-primary">★ {ev.label}</p>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
         
          </div>

          {/* Apply Leave Dialog (standalone, triggered from cells & drag-drop) */}
          <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
            <DialogContent className="sm:max-w-[420px]">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">Apply Leave for June {selectedDayNumber}, 2026</DialogTitle>
                <DialogDescription className="text-xs">
                  Select leave type and provide details to apply for leave.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-3">
                <div className="space-y-1.5">
                  <Label htmlFor="leave-type" className="text-xs font-semibold">Leave Type</Label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger id="leave-type" className="w-full text-xs h-9">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {balances.map((b) => (
                        <SelectItem key={b.key} value={b.key} disabled={b.total - b.used <= 0} className="text-xs">
                          {b.label} ({b.total - b.used} days left)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="start-day" className="text-xs font-semibold">Start Day</Label>
                    <Input id="start-day" type="date" min="2026-06-01" max="2026-06-30"
                      value={`2026-06-${startDay.toString().padStart(2, "0")}`}
                      onChange={(e) => { const parts = e.target.value.split("-"); if (parts[2]) { const day = parseInt(parts[2]); setStartDay(day); if (endDay < day) setEndDay(day); } }}
                      className="w-full text-xs h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="end-day" className="text-xs font-semibold">End Day</Label>
                    <Input id="end-day" type="date" min={`2026-06-${startDay.toString().padStart(2, "0")}`} max="2026-06-30"
                      value={`2026-06-${endDay.toString().padStart(2, "0")}`}
                      onChange={(e) => { const parts = e.target.value.split("-"); if (parts[2]) setEndDay(parseInt(parts[2])); }}
                      className="w-full text-xs h-9" />
                  </div>
                </div>
                {endDay >= startDay && (
                  <p className="text-[10px] text-sky-600 dark:text-sky-400 font-bold bg-sky-500/10 px-2 py-1 rounded w-fit">
                    Duration: {endDay - startDay + 1} {endDay - startDay + 1 === 1 ? "day" : "days"}
                  </p>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="reason" className="text-xs font-semibold">Reason for Leave</Label>
                  <Textarea id="reason" placeholder="Please specify the reason..."
                    value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)}
                    className="text-xs min-h-[80px] resize-none" />
                </div>
                <div className="space-y-2 border-t border-border/40 pt-3">
                  <Label className="text-xs font-semibold">Attachments</Label>
                  {dialogAttachments.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {dialogAttachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/20 text-xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-semibold text-primary shrink-0">{att.title}:</span>
                            <span className="text-muted-foreground truncate">{att.fileName}</span>
                          </div>
                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded"
                            onClick={() => setDialogAttachments(dialogAttachments.filter(a => a.id !== att.id))}>&times;</Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2 p-2.5 rounded-lg border border-border/40 bg-muted/10">
                    <div className="space-y-1">
                      <Label htmlFor="att-title" className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Document Title</Label>
                      <input id="att-title" type="text" placeholder="e.g. Doctor Certificate, Ticket"
                        value={newAttachmentTitle} onChange={(e) => setNewAttachmentTitle(e.target.value)}
                        className="w-full text-xs bg-background border border-input rounded-md px-2.5 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="att-file" className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Select File</Label>
                      <div className="flex items-center gap-2">
                        <input id="att-file" type="file" className="hidden"
                          onChange={(e) => { const file = e.target.files?.[0]; if (file) setNewAttachmentFileName(file.name); }} />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById("att-file")?.click()}
                          className="h-8 text-[11px] font-semibold flex items-center gap-1.5">Browse...</Button>
                        <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">{newAttachmentFileName || "No file chosen"}</span>
                        {newAttachmentFileName && (
                          <Button size="sm" variant="ghost" onClick={() => setNewAttachmentFileName("")} className="h-6 w-6 p-0 text-muted-foreground hover:bg-muted">&times;</Button>
                        )}
                      </div>
                    </div>
                    <Button type="button" size="sm" variant="secondary"
                      disabled={!newAttachmentTitle.trim() || !newAttachmentFileName}
                      onClick={() => { if (newAttachmentTitle.trim() && newAttachmentFileName) { setDialogAttachments([...dialogAttachments, { id: Math.random().toString(36).substring(2, 9), title: newAttachmentTitle.trim(), fileName: newAttachmentFileName }]); setNewAttachmentTitle(""); setNewAttachmentFileName(""); } }}
                      className="w-full h-8 text-[11px] font-semibold bg-primary/10 hover:bg-primary/20 text-primary border-none mt-1">Add Document</Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setIsLeaveDialogOpen(false)} className="text-xs">Cancel</Button>
                <Button size="sm" onClick={handleApplyLeave} className="text-xs bg-sky-500 hover:bg-sky-600 text-white border-none">Submit Leave Request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Day Detail Dialog - Opens on cell click */}
          <Dialog open={isDayDetailOpen} onOpenChange={setIsDayDetailOpen}>
            <DialogContent className="sm:max-w-[640px]">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">
                  {(() => {
                    const rec = finalAttendance.find(d => d.day === selectedDayNumber)
                    return rec ? `${rec.dayName}, ${rec.dateStr} 2026 — Day Details` : `Day ${selectedDayNumber}`
                  })()}
                </DialogTitle>
                <DialogDescription className="text-xs">Complete attendance and shift information for this day.</DialogDescription>
              </DialogHeader>
              {(() => {
                const rec = finalAttendance.find(d => d.day === selectedDayNumber)
                if (!rec) return null
                const matchingLeave = leaveApplications.find(la => selectedDayNumber >= la.startDay && selectedDayNumber <= la.endDay)
                const workMinutes = rec.hours ? Math.round(rec.hours * 60) : null
                const leaveTypeLabel = matchingLeave ? balances.find(b => b.key === matchingLeave.leaveType)?.label : null

                return (
                  <div className="space-y-4 py-2">
                    {/* Section 1: Employee & Shift Info */}
                    <div className="rounded-lg border border-border/40 overflow-hidden">
                      <div className="bg-muted/40 px-3 py-1.5 border-b border-border/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Employee & Shift Info</p>
                      </div>
                      <div className="grid grid-cols-2 divide-x divide-border/20">
                        <div className="p-3 space-y-2">
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Date</span><span className="font-semibold">{rec.dateStr} {rec.dayName}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Department</span><span className="font-semibold">Information Technology</span></div>
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Employee</span><span className="font-semibold">Abdullah Al Sakib</span></div>
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Shift Name</span><span className="font-semibold">Head Office (General)</span></div>
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Roster Time</span><span className="font-semibold">10:00 AM – 7:00 PM</span></div>
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Day Duration</span><span className="font-semibold">Day Shift (9h)</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Duty & Leave Details */}
                    <div className="rounded-lg border border-border/40 overflow-hidden">
                      <div className="bg-muted/40 px-3 py-1.5 border-b border-border/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Duty & Leave Details</p>
                      </div>
                      <div className="grid grid-cols-2 divide-x divide-border/20">
                        <div className="p-3 space-y-2">
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Duty Type</span><span className="font-semibold">Regular</span></div>
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Present Status</span>
                            <Badge className={cn("text-[9px] font-bold",
                              rec.status === "present" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                              rec.status === "late" && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                              rec.status === "absent" && "bg-red-500/10 text-red-600 border-red-500/20",
                              rec.status === "leave" && "bg-sky-500/10 text-sky-600 border-sky-500/20",
                              rec.status === "holiday" && "bg-violet-500/10 text-violet-600 border-violet-500/20",
                              rec.status === "weekend" && "bg-muted text-muted-foreground"
                            )}>
                              {rec.status === "weekend" ? "Weekend" : rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Leave Status</span>
                            <span className="font-semibold">{rec.status === "leave" ? "On Leave" : "—"}</span>
                          </div>
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Leave Application</span>
                            <span className="font-semibold">{leaveTypeLabel || "—"}</span>
                          </div>
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Holiday</span>
                            <span className="font-semibold text-right max-w-[180px] truncate">{rec.status === "holiday" && rec.notes ? rec.notes : "—"}</span>
                          </div>
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Leave Reason</span>
                            <span className="font-semibold text-right max-w-[180px] truncate">{matchingLeave ? matchingLeave.reason : "—"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Time & Attendance */}
                    <div className="rounded-lg border border-border/40 overflow-hidden">
                      <div className="bg-muted/40 px-3 py-1.5 border-b border-border/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Time & Attendance</p>
                      </div>
                      <div className="grid grid-cols-2 divide-x divide-border/20">
                        <div className="p-3 space-y-2">
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Punch In</span><span className="font-semibold">{rec.checkIn || "—"}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Punch Out</span><span className="font-semibold">{rec.checkOut || "Active"}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Punch Duration</span><span className="font-semibold">{rec.checkIn ? `${rec.checkIn} – ${rec.checkOut || "Active"}` : "—"}</span></div>
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Work Minutes</span><span className="font-semibold">{workMinutes ? `${workMinutes} min` : "—"}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Break Hours</span><span className="font-semibold">{rec.breakHours}h</span></div>
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Location</span>
                            <div className="flex items-center gap-1">
                              <span className="font-semibold">{rec.location || "—"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Log Details */}
                    <div className="rounded-lg border border-border/40 overflow-hidden">
                      <div className="bg-muted/40 px-3 py-1.5 border-b border-border/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Log Details</p>
                      </div>
                      <div className="grid grid-cols-2 divide-x divide-border/20">
                        <div className="p-3 space-y-2">
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">IP Address</span><span className="font-semibold">{rec.ipAddress || "—"}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Device</span><span className="font-semibold">{rec.device || "—"}</span></div>
                        </div>
                        <div className="p-3 space-y-2">
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Confirm Status</span><span className="font-semibold">Draft</span></div>
                          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Remark</span><span className="font-semibold">{rec.notes || "—"}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Attachments */}
                    {rec.attachments && rec.attachments.length > 0 && (
                      <div className="rounded-lg border border-border/40 overflow-hidden">
                        <div className="bg-muted/40 px-3 py-1.5 border-b border-border/30">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Attachments</p>
                        </div>
                        <div className="p-3">
                          <div className="flex flex-wrap gap-2">
                            {rec.attachments.map(att => (
                              <div key={att.id} className="flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/20 text-sky-600 rounded-lg px-2 py-1 text-[11px] font-semibold">
                                <span className="opacity-70">{att.title}:</span>
                                <span className="underline cursor-pointer">{att.fileName}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
              <DialogFooter className="gap-2">
                {(() => {
                  const rec = finalAttendance.find(d => d.day === selectedDayNumber)
                  if (!rec || rec.status === "holiday" || rec.status === "weekend") return null
                  if (rec.status === "leave") {
                    const app = leaveApplications.find(la => selectedDayNumber >= la.startDay && selectedDayNumber <= la.endDay)
                    return (
                      <Button size="sm" variant="outline"
                        onClick={() => { if (app) { handleCancelLeaveById(app.id); setIsDayDetailOpen(false); } }}
                        className="h-8 border-red-500/30 hover:border-red-500 hover:bg-red-500/10 text-red-600 dark:text-red-400 gap-1 text-[11px] font-bold px-3">
                        <XCircle className="h-3.5 w-3.5" /> Cancel Leave
                      </Button>
                    )
                  }
                  return (
                    <Button size="sm" variant="outline"
                      onClick={() => { setIsDayDetailOpen(false); setIsLeaveDialogOpen(true); }}
                      className="h-8 border-sky-500/30 hover:border-sky-500 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400 gap-1 text-[11px] font-bold px-3">
                      <Coffee className="h-3.5 w-3.5" /> Apply Leave
                    </Button>
                  )
                })()}
                <Button variant="outline" size="sm" onClick={() => setIsDayDetailOpen(false)} className="h-8 text-[11px]">Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </CardContent>
      </Card>
    </div>

        {/* ── Two-Column Row: My Tasks + Announcements ───────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Column 1: My Tasks */}
          <Card className="shadow-none border-border/40 flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">My Tasks</CardTitle>
                    <p className="text-[10px] text-muted-foreground">{doneTasks}/{totalTasks} completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold">
                    <span className="text-muted-foreground">{taskPct}%</span>
                    <Progress value={taskPct} className="h-1.5 w-20 rounded-full" />
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    {tasks.filter(t => !t.done).length} Pending
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/30">
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="w-12 border-b-0 hover:bg-transparent">
                      <Checkbox
                        checked={doneTasks === totalTasks && totalTasks > 0}
                        onCheckedChange={(checked) => {
                          if (checked) setTasks(ts => ts.map(t => ({ ...t, done: true })))
                          else setTasks(ts => ts.map(t => ({ ...t, done: false })))
                        }}
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Task</TableHead>
                    <TableHead className="w-24 font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Priority</TableHead>
                    <TableHead className="w-24 font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Due</TableHead>
                    <TableHead className="w-24 font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Status</TableHead>
                    <TableHead className="w-12 border-b-0 hover:bg-transparent"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map(task => (
                    <TableRow
                      key={task.id}
                      className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                    >
                      <TableCell className="py-3">
                        <Checkbox
                          checked={task.done}
                          onCheckedChange={() => toggleTask(task.id)}
                        />
                      </TableCell>
                      <TableCell className="py-3">
                        <span className={cn(
                          "text-xs font-medium",
                          task.done && "line-through text-muted-foreground"
                        )}>{task.text}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={cn("text-[9px] border-none font-semibold", priorityStyle[task.priority])}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-xs text-muted-foreground">{task.due}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={cn("text-[9px] font-bold border-none",
                          task.done
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                        )}>
                          {task.done ? "Done" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <button
                          onClick={() => setTasks(ts => ts.filter(t => t.id !== task.id))}
                          className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Add Task Row */}
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableCell colSpan={6} className="py-3">
                      <button
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Task
                      </button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Column 2: Announcements */}
          <Card className="shadow-none border-border/40 flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Megaphone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Latest Announcements</CardTitle>
                    <p className="text-[10px] text-muted-foreground">Recent updates and notices</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="divide-y divide-border/20">
                {announcements.length > 0 ? (
                  announcements.slice(0, 4).map((ann) => {
                    return (
                      <div
                        key={ann.id}
                        onClick={() => {
                          setSelectedAnnouncement(ann)
                          setIsViewAnnOpen(true)
                        }}
                        className="p-4 hover:bg-muted/10 transition-colors cursor-pointer flex items-start justify-between gap-3 group"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-muted-foreground">{ann.date}</span>
                            <span className="text-[10px] font-medium text-muted-foreground/85">by {ann.author}</span>
                          </div>
                          <h5 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {ann.title}
                          </h5>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {ann.content}
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-12 text-center space-y-2">
                    <Megaphone className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs text-muted-foreground">No announcements found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Announcement View Dialog */}
      <Dialog open={isViewAnnOpen} onOpenChange={setIsViewAnnOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedAnnouncement && (
            <>
              <DialogHeader className="space-y-3">
                <div className="flex items-center justify-end">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-medium">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Published: {selectedAnnouncement.date}
                  </span>
                </div>
                <DialogTitle className="text-base font-bold leading-snug">
                  {selectedAnnouncement.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 border-t border-border/40 mt-2">
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedAnnouncement.content}
                </p>
                <div className="bg-muted/30 border border-border/20 rounded-xl p-3 flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Clock className="h-4 w-4" />
                    Author: {selectedAnnouncement.author}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setIsViewAnnOpen(false)} className="text-xs">
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
