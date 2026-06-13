import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Coffee,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CircleCheck,
  Plus,
  Star,
  GraduationCap,
  Heart,
  CheckCircle2,
  Clock,
  MapPin,
  Laptop,
  Info,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  { label: "Training Leave", used: 0, total: 3, color: "bg-violet-500", light: "text-violet-500", icon: GraduationCap, key: "training" },
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
  const [tasks, setTasks] = useState(initialTasks)
  const [calMonth, setCalMonth] = useState(5) // June (0-indexed)
  const [calYear] = useState(2026)
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(11)

  // Leave Dialog State
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [leaveType, setLeaveType] = useState("annual")
  const [leaveReason, setLeaveReason] = useState("")
  const [dialogAttachments, setDialogAttachments] = useState<{ id: string; title: string; fileName: string }[]>([])
  const [newAttachmentTitle, setNewAttachmentTitle] = useState("")
  const [newAttachmentFileName, setNewAttachmentFileName] = useState("")

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
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Re-attach icons
        return parsed.map((b: any) => {
          let icon = Coffee
          if (b.key === "sick") icon = Heart
          else if (b.key === "casual") icon = Star
          else if (b.key === "training") icon = GraduationCap
          return { ...b, icon }
        })
      } catch (e) {
        console.error(e)
      }
    }
    return [
      { label: "Annual Leave", used: 8, total: 18, color: "bg-sky-500", light: "text-sky-500", icon: Coffee, key: "annual" },
      { label: "Sick Leave", used: 2, total: 10, color: "bg-rose-500", light: "text-rose-500", icon: Heart, key: "sick" },
      { label: "Casual Leave", used: 1, total: 5, color: "bg-amber-500", light: "text-amber-500", icon: Star, key: "casual" },
      { label: "Training Leave", used: 0, total: 3, color: "bg-violet-500", light: "text-violet-500", icon: GraduationCap, key: "training" },
    ]
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

  const selectedRecord = finalAttendance.find(d => d.day === selectedDayNumber)

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
      {/* ══ Header Section ═══════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* ══ Main Grid: Calendar + Side Panels ═══════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Interactive Calendar (2/3) ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
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
          <CardContent className="space-y-6 md:space-y-0 md:grid md:grid-cols-5 md:gap-6">
            {/* Left Column: Calendar Grid (cols 1-3) */}
            <div className="md:col-span-3 space-y-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 text-center">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                <div key={d} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-2">{d}</div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
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
                        onClick={() => record && setSelectedDayNumber(day)}
                        className={cn(
                          "relative aspect-square rounded-xl flex flex-col items-center justify-between p-1.5 text-xs font-medium transition-all duration-200 hover:scale-105",
                          cellBg,
                          isToday && "ring-2 ring-primary",
                          isSel && "ring-2 ring-foreground"
                        )}
                      >
                        <span className={cn(isToday ? "text-primary font-extrabold" : textColor)}>{day}</span>
                        
                        {/* Tiny Indicator Dot/Text */}
                        <div className="flex flex-col items-center w-full">
                          {record && record.status !== "upcoming" && record.status !== "weekend" && (
                            <span className="text-[8px] font-bold uppercase tracking-tight scale-90 mt-0.5 leading-none">
                              {record.status === "present" && "PR"}
                              {record.status === "late" && "LT"}
                              {record.status === "absent" && "AB"}
                              {record.status === "leave" && "LV"}
                              {record.status === "holiday" && "HL"}
                            </span>
                          )}
                        </div>
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

            {/* Selected Day Log Panel */}
            {selectedRecord && (
              <div className="mt-4 p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-bold uppercase tracking-wide">
                      {selectedRecord.dayName}
                    </Badge>
                    <span className="text-xs font-bold">{selectedRecord.dateStr}, 2026</span>
                    <Badge className={cn("text-[10px] font-bold capitalize",
                      selectedRecord.status === "present" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                      selectedRecord.status === "late" && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                      selectedRecord.status === "absent" && "bg-red-500/10 text-red-600 border-red-500/20",
                      selectedRecord.status === "leave" && "bg-sky-500/10 text-sky-600 border-sky-500/20",
                      selectedRecord.status === "holiday" && "bg-violet-500/10 text-violet-600 border-violet-500/20",
                      selectedRecord.status === "weekend" && "bg-muted text-muted-foreground"
                    )}>
                      {selectedRecord.status}
                    </Badge>

                    {/* Apply Leave Dialog Button */}
                    {selectedRecord.status !== "leave" && selectedRecord.status !== "holiday" && selectedRecord.status !== "weekend" && (
                      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-7 border-sky-500/30 hover:border-sky-500 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400 gap-1 text-[10px] font-bold px-2.5">
                            <Coffee className="h-3 w-3" /> Apply Leave
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[420px]">
                          <DialogHeader>
                            <DialogTitle className="text-base font-bold">Apply Leave for {selectedRecord.dateStr}, 2026</DialogTitle>
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

                            {/* Date Range Selection (Start Day & End Day) */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label htmlFor="start-day" className="text-xs font-semibold">Start Day</Label>
                                <Select value={startDay.toString()} onValueChange={(val) => setStartDay(parseInt(val))}>
                                  <SelectTrigger id="start-day" className="w-full text-xs h-9">
                                    <SelectValue placeholder="Start Day" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 30 }).map((_, i) => (
                                      <SelectItem key={i + 1} value={(i + 1).toString()} className="text-xs">
                                        June {i + 1}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor="end-day" className="text-xs font-semibold">End Day</Label>
                                <Select value={endDay.toString()} onValueChange={(val) => setEndDay(parseInt(val))}>
                                  <SelectTrigger id="end-day" className="w-full text-xs h-9">
                                    <SelectValue placeholder="End Day" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 30 }).map((_, i) => (
                                      <SelectItem key={i + 1} value={(i + 1).toString()} className="text-xs" disabled={i + 1 < startDay}>
                                        June {i + 1}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {endDay >= startDay && (
                              <p className="text-[10px] text-sky-600 dark:text-sky-400 font-bold bg-sky-500/10 px-2 py-1 rounded w-fit">
                                Duration: {endDay - startDay + 1} {endDay - startDay + 1 === 1 ? "day" : "days"}
                              </p>
                            )}
                            <div className="space-y-1.5">
                              <Label htmlFor="reason" className="text-xs font-semibold">Reason for Leave</Label>
                              <Textarea
                                id="reason"
                                placeholder="Please specify the reason for your leave request..."
                                value={leaveReason}
                                onChange={(e) => setLeaveReason(e.target.value)}
                                className="text-xs min-h-[80px] resize-none"
                              />
                            </div>

                            {/* File Attachments Area */}
                            <div className="space-y-2 border-t border-border/40 pt-3">
                              <Label className="text-xs font-semibold">Attachments</Label>
                              
                              {/* Current Attachments List */}
                              {dialogAttachments.length > 0 && (
                                <div className="space-y-1.5 mb-2">
                                  {dialogAttachments.map((att) => (
                                    <div key={att.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/20 text-xs">
                                      <div className="flex items-center gap-1.5 truncate">
                                        <span className="font-semibold text-primary shrink-0">{att.title}:</span>
                                        <span className="text-muted-foreground truncate">{att.fileName}</span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 w-5 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded"
                                        onClick={() => setDialogAttachments(dialogAttachments.filter(a => a.id !== att.id))}
                                      >
                                        &times;
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Form to Add Attachment */}
                              <div className="space-y-2 p-2.5 rounded-lg border border-border/40 bg-muted/10">
                                <div className="space-y-1">
                                  <Label htmlFor="att-title" className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Document Title</Label>
                                  <input
                                    id="att-title"
                                    type="text"
                                    placeholder="e.g. Doctor Certificate, Ticket"
                                    value={newAttachmentTitle}
                                    onChange={(e) => setNewAttachmentTitle(e.target.value)}
                                    className="w-full text-xs bg-background border border-input rounded-md px-2.5 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor="att-file" className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Select File</Label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      id="att-file"
                                      type="file"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                          setNewAttachmentFileName(file.name)
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => document.getElementById("att-file")?.click()}
                                      className="h-8 text-[11px] font-semibold flex items-center gap-1.5"
                                    >
                                      Browse...
                                    </Button>
                                    <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                                      {newAttachmentFileName || "No file chosen"}
                                    </span>
                                    {newAttachmentFileName && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setNewAttachmentFileName("")}
                                        className="h-6 w-6 p-0 text-muted-foreground hover:bg-muted"
                                      >
                                        &times;
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  disabled={!newAttachmentTitle.trim() || !newAttachmentFileName}
                                  onClick={() => {
                                    if (newAttachmentTitle.trim() && newAttachmentFileName) {
                                      setDialogAttachments([
                                        ...dialogAttachments,
                                        {
                                          id: Math.random().toString(36).substring(2, 9),
                                          title: newAttachmentTitle.trim(),
                                          fileName: newAttachmentFileName
                                        }
                                      ])
                                      setNewAttachmentTitle("")
                                      setNewAttachmentFileName("")
                                    }
                                  }}
                                  className="w-full h-8 text-[11px] font-semibold bg-primary/10 hover:bg-primary/20 text-primary border-none mt-1"
                                >
                                  Add Document
                                </Button>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" size="sm" onClick={() => setIsLeaveDialogOpen(false)} className="text-xs">
                              Cancel
                            </Button>
                            <Button size="sm" onClick={handleApplyLeave} className="text-xs bg-sky-500 hover:bg-sky-600 text-white border-none">
                              Submit Leave Request
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Cancel Leave Button */}
                    {selectedRecord.status === "leave" && (() => {
                      const matchingApp = leaveApplications.find(la => selectedDayNumber >= la.startDay && selectedDayNumber <= la.endDay)
                      if (!matchingApp) return null
                      return (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelLeaveById(matchingApp.id)}
                          className="h-7 border-red-500/30 hover:border-red-500 hover:bg-red-500/10 text-red-600 dark:text-red-400 gap-1 text-[10px] font-bold px-2.5"
                        >
                          <XCircle className="h-3 w-3" /> Cancel Leave
                        </Button>
                      )
                    })()}
                  </div>
                  {selectedRecord.notes && (
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1">
                      <Info className="h-3.5 w-3.5 text-primary" /> {selectedRecord.notes}
                    </p>
                  )}
                  {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRecord.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-1.5 bg-sky-500/10 dark:bg-sky-500/[0.04] border border-sky-500/20 text-sky-600 dark:text-sky-400 rounded-lg px-2 py-1 text-[11px] font-semibold"
                        >
                          <span className="opacity-70">{att.title}:</span>
                          <span className="underline cursor-pointer hover:text-sky-700 dark:hover:text-sky-300">{att.fileName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedRecord.status !== "weekend" && selectedRecord.status !== "holiday" && selectedRecord.status !== "leave" && selectedRecord.status !== "absent" ? (
                  <div className="flex flex-wrap gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">PUNCH</p>
                        <p className="font-bold">{selectedRecord.checkIn} - {selectedRecord.checkOut || "Active"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">LOCATION</p>
                        <p className="font-bold">{selectedRecord.location}</p>
                      </div>
                    </div>
                    {selectedRecord.hours && (
                      <div className="flex items-center gap-1.5">
                        <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">LOGGED</p>
                          <p className="font-bold">{selectedRecord.hours} hrs</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground font-medium italic">
                    No active punch records for this calendar day.
                  </div>
                )}
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-3 pt-3 border-t border-border/20">
              {[
                { label: "Present", color: "bg-emerald-500" },
                { label: "Late", color: "bg-amber-500" },
                { label: "Absent", color: "bg-red-500" },
                { label: "Leave", color: "bg-sky-500" },
                { label: "Holiday", color: "bg-violet-500" },
                { label: "Weekend", color: "bg-muted-foreground/30" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className={cn("h-2 w-2 rounded-full", l.color)} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Day Details & Leave History (cols 4-5) */}
          <div className="md:col-span-2 space-y-6 flex flex-col justify-start">
            {/* Selected Day Log Panel */}
            {selectedRecord && (
              <div className="p-4 rounded-xl border border-border/60 bg-muted/20 flex flex-col gap-4">
                <div className="space-y-1.5 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-bold uppercase tracking-wide text-[10px]">
                      {selectedRecord.dayName}
                    </Badge>
                    <span className="text-xs font-bold">{selectedRecord.dateStr}, 2026</span>
                    <Badge className={cn("text-[10px] font-bold capitalize",
                      selectedRecord.status === "present" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                      selectedRecord.status === "late" && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                      selectedRecord.status === "absent" && "bg-red-500/10 text-red-600 border-red-500/20",
                      selectedRecord.status === "leave" && "bg-sky-500/10 text-sky-600 border-sky-500/20",
                      selectedRecord.status === "holiday" && "bg-violet-500/10 text-violet-600 border-violet-500/20",
                      selectedRecord.status === "weekend" && "bg-muted text-muted-foreground"
                    )}>
                      {selectedRecord.status}
                    </Badge>

                    {/* Apply Leave Dialog Button */}
                    {selectedRecord.status !== "leave" && selectedRecord.status !== "holiday" && selectedRecord.status !== "weekend" && (
                      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="h-7 border-sky-500/30 hover:border-sky-500 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400 gap-1 text-[10px] font-bold px-2.5">
                            <Coffee className="h-3 w-3" /> Apply Leave
                          </Button>
                        </DialogTrigger>
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

                            {/* Date Range Selection (Start Day & End Day) */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label htmlFor="start-day" className="text-xs font-semibold">Start Day</Label>
                                <Select value={startDay.toString()} onValueChange={(val) => setStartDay(parseInt(val))}>
                                  <SelectTrigger id="start-day" className="w-full text-xs h-9">
                                    <SelectValue placeholder="Start Day" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 30 }).map((_, i) => (
                                      <SelectItem key={i + 1} value={(i + 1).toString()} className="text-xs">
                                        June {i + 1}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor="end-day" className="text-xs font-semibold">End Day</Label>
                                <Select value={endDay.toString()} onValueChange={(val) => setEndDay(parseInt(val))}>
                                  <SelectTrigger id="end-day" className="w-full text-xs h-9">
                                    <SelectValue placeholder="End Day" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 30 }).map((_, i) => (
                                      <SelectItem key={i + 1} value={(i + 1).toString()} className="text-xs" disabled={i + 1 < startDay}>
                                        June {i + 1}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {endDay >= startDay && (
                              <p className="text-[10px] text-sky-600 dark:text-sky-400 font-bold bg-sky-500/10 px-2 py-1 rounded w-fit">
                                Duration: {endDay - startDay + 1} {endDay - startDay + 1 === 1 ? "day" : "days"}
                              </p>
                            )}
                            <div className="space-y-1.5">
                              <Label htmlFor="reason" className="text-xs font-semibold">Reason for Leave</Label>
                              <Textarea
                                id="reason"
                                placeholder="Please specify the reason for your leave request..."
                                value={leaveReason}
                                onChange={(e) => setLeaveReason(e.target.value)}
                                className="text-xs min-h-[80px] resize-none"
                              />
                            </div>

                            {/* File Attachments Area */}
                            <div className="space-y-2 border-t border-border/40 pt-3">
                              <Label className="text-xs font-semibold">Attachments</Label>
                              
                              {/* Current Attachments List */}
                              {dialogAttachments.length > 0 && (
                                <div className="space-y-1.5 mb-2">
                                  {dialogAttachments.map((att) => (
                                    <div key={att.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/20 text-xs">
                                      <div className="flex items-center gap-1.5 truncate">
                                        <span className="font-semibold text-primary shrink-0">{att.title}:</span>
                                        <span className="text-muted-foreground truncate">{att.fileName}</span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 w-5 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded"
                                        onClick={() => setDialogAttachments(dialogAttachments.filter(a => a.id !== att.id))}
                                      >
                                        &times;
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Form to Add Attachment */}
                              <div className="space-y-2 p-2.5 rounded-lg border border-border/40 bg-muted/10">
                                <div className="space-y-1">
                                  <Label htmlFor="att-title" className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Document Title</Label>
                                  <input
                                    id="att-title"
                                    type="text"
                                    placeholder="e.g. Doctor Certificate, Ticket"
                                    value={newAttachmentTitle}
                                    onChange={(e) => setNewAttachmentTitle(e.target.value)}
                                    className="w-full text-xs bg-background border border-input rounded-md px-2.5 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor="att-file" className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Select File</Label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      id="att-file"
                                      type="file"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                          setNewAttachmentFileName(file.name)
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => document.getElementById("att-file")?.click()}
                                      className="h-8 text-[11px] font-semibold flex items-center gap-1.5"
                                    >
                                      Browse...
                                    </Button>
                                    <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                                      {newAttachmentFileName || "No file chosen"}
                                    </span>
                                    {newAttachmentFileName && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setNewAttachmentFileName("")}
                                        className="h-6 w-6 p-0 text-muted-foreground hover:bg-muted"
                                      >
                                        &times;
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  disabled={!newAttachmentTitle.trim() || !newAttachmentFileName}
                                  onClick={() => {
                                    if (newAttachmentTitle.trim() && newAttachmentFileName) {
                                      setDialogAttachments([
                                        ...dialogAttachments,
                                        {
                                          id: Math.random().toString(36).substring(2, 9),
                                          title: newAttachmentTitle.trim(),
                                          fileName: newAttachmentFileName
                                        }
                                      ])
                                      setNewAttachmentTitle("")
                                      setNewAttachmentFileName("")
                                    }
                                  }}
                                  className="w-full h-8 text-[11px] font-semibold bg-primary/10 hover:bg-primary/20 text-primary border-none mt-1"
                                >
                                  Add Document
                                </Button>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" size="sm" onClick={() => setIsLeaveDialogOpen(false)} className="text-xs">
                              Cancel
                            </Button>
                            <Button size="sm" onClick={handleApplyLeave} className="text-xs bg-sky-500 hover:bg-sky-600 text-white border-none">
                              Submit Leave Request
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Cancel Leave Button */}
                    {selectedRecord.status === "leave" && (() => {
                      const matchingApp = leaveApplications.find(la => selectedDayNumber >= la.startDay && selectedDayNumber <= la.endDay)
                      if (!matchingApp) return null
                      return (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelLeaveById(matchingApp.id)}
                          className="h-7 border-red-500/30 hover:border-red-500 hover:bg-red-500/10 text-red-600 dark:text-red-400 gap-1 text-[10px] font-bold px-2.5"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Cancel Leave
                        </Button>
                      )
                    })()}
                  </div>
                  {selectedRecord.notes && (
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1">
                      <Info className="h-3.5 w-3.5 text-primary" /> {selectedRecord.notes}
                    </p>
                  )}
                  {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedRecord.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-1.5 bg-sky-500/10 dark:bg-sky-500/[0.04] border border-sky-500/20 text-sky-600 dark:text-sky-400 rounded-lg px-2 py-1 text-[11px] font-semibold"
                        >
                          <span className="opacity-70">{att.title}:</span>
                          <span className="underline cursor-pointer hover:text-sky-700 dark:hover:text-sky-300">{att.fileName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedRecord.status !== "weekend" && selectedRecord.status !== "holiday" && selectedRecord.status !== "leave" && selectedRecord.status !== "absent" ? (
                  <div className="flex flex-wrap gap-4 text-xs font-medium border-t border-border/20 pt-3 mt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wide">PUNCH</p>
                        <p className="font-bold text-[11px]">{selectedRecord.checkIn} - {selectedRecord.checkOut || "Active"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wide">LOCATION</p>
                        <p className="font-bold text-[11px]">{selectedRecord.location}</p>
                      </div>
                    </div>
                    {selectedRecord.hours && (
                      <div className="flex items-center gap-1.5">
                        <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wide">LOGGED</p>
                          <p className="font-bold text-[11px]">{selectedRecord.hours} hrs</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground font-medium italic border-t border-border/20 pt-3 mt-1">
                    No active punch records for this calendar day.
                  </div>
                )}
              </div>
            )}

            {/* Leave Application History */}
            <div className="space-y-3 pt-4 border-t border-border/25">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Leave History</h3>
                  <p className="text-[10px] text-muted-foreground">Applied leaves in June 2026</p>
                </div>
                <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0 h-4">
                  {leaveApplications.length} Request{leaveApplications.length !== 1 && "s"}
                </Badge>
              </div>

              {leaveApplications.length === 0 ? (
                <div className="text-center py-5 text-[10px] text-muted-foreground italic border border-dashed border-border/40 rounded-xl bg-muted/5">
                  No leave requests found.
                </div>
              ) : (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {leaveApplications.map((app) => {
                    const balanceObj = balances.find(b => b.key === app.leaveType)
                    const label = balanceObj?.label || "Leave"
                    const badgeColor = balanceObj?.light || "text-sky-500"
                    const duration = app.endDay - app.startDay + 1
                    
                    return (
                      <div key={app.id} className="p-2.5 rounded-xl border border-border/40 bg-muted/20 flex flex-col justify-between items-start gap-2 text-xs transition-all hover:bg-muted/30">
                        <div className="w-full space-y-1">
                          <div className="flex items-center justify-between w-full">
                            <span className={cn("text-[10px] font-extrabold uppercase tracking-tight", badgeColor)}>
                              {label}
                            </span>
                            <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/20 text-[9px] font-bold py-0 h-4">
                              {duration}d
                            </Badge>
                          </div>
                          <div className="text-[10px] font-bold text-foreground">
                            {app.startDay === app.endDay ? `June ${app.startDay}` : `June ${app.startDay} - June ${app.endDay}`}
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                            Reason: <span className="text-foreground">{app.reason}</span>
                          </p>
                          
                          {/* Attachments inside history item */}
                          {app.attachments && app.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {app.attachments.map((att) => (
                                <span key={att.id} className="inline-flex items-center gap-1 text-[9px] text-sky-600 dark:text-sky-400 bg-sky-500/5 dark:bg-sky-500/[0.02] border border-sky-500/10 rounded px-1 py-0.5">
                                  <span className="opacity-70 truncate max-w-[80px]">{att.title}:</span>
                                  <span className="underline truncate max-w-[100px]">{att.fileName}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancelLeaveById(app.id)}
                          className="h-6 w-full text-[9px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 font-bold border border-rose-500/10 hover:border-rose-500/25 mt-1"
                        >
                          <XCircle className="h-3 w-3" /> Cancel Request
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

        {/* ── Right Sidebar: Leave + Tasks (1/3) ──────────────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* Leave Balance */}
          <Card className="shadow-none border-border/40">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Coffee className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Leave Balance</CardTitle>
                    <p className="text-[10px] text-muted-foreground">Available days</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                  {balances.reduce((acc, b) => acc + (b.total - b.used), 0)} days
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {balances.map((lb) => {
                const Icon = lb.icon
                const remaining = lb.total - lb.used
                const percentage = (remaining / lb.total) * 100
                return (
                  <div key={lb.label} className="p-2.5 rounded-xl bg-muted/20 border border-border/20">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-3.5 w-3.5", lb.light)} />
                        <span className="text-[11px] font-semibold">{lb.label}</span>
                      </div>
                      <span className="text-[11px] font-bold text-foreground">
                        {remaining} <span className="text-[9px] text-muted-foreground font-normal">/ {lb.total}d</span>
                      </span>
                    </div>
                    <Progress value={percentage} className="h-1" />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* My Tasks */}
          <Card className="shadow-none border-border/40">
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
                <Badge variant="secondary" className="text-[10px] font-bold">
                  {tasks.filter(t => !t.done).length} Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="text-primary">{taskPct}%</span>
                </div>
                <Progress value={taskPct} className="h-2 rounded-full" />
              </div>

              {/* Task items */}
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={cn(
                      "group flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all border",
                      task.done
                        ? "border-border/10 bg-muted/10 opacity-60"
                        : "border-border/20 bg-muted/20 hover:bg-muted/40"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                      task.done
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-border group-hover:border-primary"
                    )}>
                      {task.done && <CircleCheck className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-[11px] font-medium truncate",
                        task.done ? "line-through text-muted-foreground" : ""
                      )}>
                        {task.text}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{task.due}</p>
                    </div>
                    <Badge className={cn("text-[9px] border-none font-semibold shrink-0", priorityStyle[task.priority])}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" className="w-full h-9 text-[11px] font-semibold gap-1.5">
                <Plus className="h-3 w-3" /> Add Task
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
