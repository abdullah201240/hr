import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Clock,
  UserCheck,
  Coffee,
  Bell,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileText,
  ArrowRight,
  CircleCheck,
  Plus,
  Target,
  Activity,
  Flame,
  Award,
  CalendarClock,
  MessageSquare,
  Star,
  AlertCircle,
  BarChart3,
  Timer,
  ArrowUpRight,
  TrendingUp,
  Wallet,
  ShieldCheck,
  MapPin,
  GraduationCap,
  Heart,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"

// ─── Employee Profile (mocked) ────────────────────────────────────────────────
const employee = {
  name: "Alex Johnson",
  firstName: "Alex",
  role: "Senior Frontend Engineer",
  department: "Engineering",
  employeeId: "EMP-0042",
  email: "alex.johnson@company.com",
  joinDate: "Mar 14, 2022",
  avatar: "AJ",
  manager: "Sarah Kim",
  location: "Dhaka, Bangladesh",
}

// ─── Leave Balances ───────────────────────────────────────────────────────────
const leaveBalances = [
  { label: "Annual Leave",   used: 8,  total: 18, color: "bg-sky-500",     light: "text-sky-500",    icon: Coffee },
  { label: "Sick Leave",     used: 2,  total: 10, color: "bg-rose-500",    light: "text-rose-500",   icon: Heart },
  { label: "Casual Leave",   used: 1,  total: 5,  color: "bg-amber-500",   light: "text-amber-500",  icon: Star },
  { label: "Training Leave", used: 0,  total: 3,  color: "bg-violet-500",  light: "text-violet-500", icon: GraduationCap },
]

// ─── Attendance — this week ───────────────────────────────────────────────────
const weekAttendance = [
  { day: "Mon", date: "Jun 9",  status: "present", checkIn: "09:02 AM", checkOut: "06:05 PM", hours: "9h 03m" },
  { day: "Tue", date: "Jun 10", status: "present", checkIn: "08:55 AM", checkOut: "06:12 PM", hours: "9h 17m" },
  { day: "Wed", date: "Jun 11", status: "today",   checkIn: "09:10 AM", checkOut: null,        hours: null },
  { day: "Thu", date: "Jun 12", status: "upcoming", checkIn: null,       checkOut: null,        hours: null },
  { day: "Fri", date: "Jun 13", status: "upcoming", checkIn: null,       checkOut: null,        hours: null },
]

// ─── Payslip ──────────────────────────────────────────────────────────────────
const payslip = {
  month: "May 2026",
  netPay: "৳ 1,42,500",
  grossPay: "৳ 1,65,000",
  deductions: "৳ 22,500",
  nextPayday: "Jun 30, 2026",
  daysUntilPayday: 19,
  status: "Processed",
}

// ─── My Tasks ─────────────────────────────────────────────────────────────────
const initialTasks = [
  { id: 1, text: "Finalize Q2 feedback forms",          priority: "high",   due: "Today",    done: false },
  { id: 2, text: "Update passport document copy",        priority: "medium", due: "3 days",   done: false },
  { id: 3, text: "Review new hire onboarding plan",      priority: "medium", due: "Jun 20",   done: false },
  { id: 4, text: "Submit travel reimbursement receipt",  priority: "low",    due: "Jun 18",   done: true  },
  { id: 5, text: "Complete React 19 cert module",        priority: "low",    due: "Jun 25",   done: false },
]

// ─── Calendar Events ──────────────────────────────────────────────────────────
const calendarEvents: Record<number, { type: string; label: string }[]> = {
  11: [{ type: "meeting",  label: "Monthly HR Sync @ 11:00 AM" }],
  14: [{ type: "leave",    label: "Team: David Kim – On Leave"  }],
  18: [{ type: "birthday", label: "🎂 Sara Chen's Birthday"      }],
  22: [{ type: "meeting",  label: "Q2 Retrospective @ 3:00 PM"  }],
  25: [{ type: "deadline", label: "Expense Reports Due"          }],
  29: [{ type: "holiday",  label: "Company Picnic Day"           }],
  30: [{ type: "payday",   label: "💰 Payday!"                   }],
}

// ─── Upcoming Events ──────────────────────────────────────────────────────────
const upcomingEvents = [
  { date: "Today",  time: "11:00 AM", label: "Monthly HR Sync",         type: "meeting",  icon: MessageSquare },
  { date: "Jun 14", time: "All Day",  label: "David Kim – On Leave",     type: "leave",    icon: Coffee },
  { date: "Jun 18", time: "All Day",  label: "Sara Chen's Birthday 🎂",  type: "birthday", icon: Star },
  { date: "Jun 22", time: "3:00 PM",  label: "Q2 Retrospective",         type: "meeting",  icon: BarChart3 },
  { date: "Jun 25", time: "EOD",      label: "Expense Reports Due",       type: "deadline", icon: AlertCircle },
  { date: "Jun 30", time: "Payday",   label: "Salary Credit Day 💰",      type: "payday",   icon: Wallet },
]

// ─── Announcements ────────────────────────────────────────────────────────────
const announcements = [
  {
    title: "Summer Work Hours Effective",
    body: "Work hours will adjust to 8 AM – 4 PM starting next Monday.",
    author: "HR Team",
    avatar: "HR",
    time: "2h ago",
    tag: "Policy",
    tagColor: "text-sky-500 bg-sky-500/10",
    read: false,
  },
  {
    title: "New Expense Reimbursement Policy",
    body: "All claims must include digital receipts, submitted before the 25th via portal.",
    author: "Finance Dept",
    avatar: "FD",
    time: "5h ago",
    tag: "Finance",
    tagColor: "text-violet-500 bg-violet-500/10",
    read: false,
  },
  {
    title: "Q2 Performance Reviews Kickoff",
    body: "Your manager will schedule a 1-on-1 review session between June 15–22.",
    author: "Leadership",
    avatar: "LD",
    time: "1d ago",
    tag: "Review",
    tagColor: "text-amber-500 bg-amber-500/10",
    read: true,
  },
]

// ─── Quick Actions ────────────────────────────────────────────────────────────
const quickActions = [
  { icon: Coffee,      label: "Apply for Leave",    sub: "Submit a leave request",      color: "text-amber-500",  bg: "bg-amber-500/10"  },
  { icon: FileText,    label: "View Payslips",       sub: "Download salary history",     color: "text-sky-500",    bg: "bg-sky-500/10"    },
  { icon: Target,      label: "Log Daily Task",      sub: "Add to your to-do list",      color: "text-violet-500", bg: "bg-violet-500/10" },
  { icon: Timer,       label: "Log Overtime",        sub: "Record extra work hours",     color: "text-rose-500",   bg: "bg-rose-500/10"   },
  { icon: ShieldCheck, label: "Update Profile",      sub: "Edit personal information",   color: "text-emerald-500",bg: "bg-emerald-500/10"},
  { icon: GraduationCap, label: "Training Portal",  sub: "Access learning materials",   color: "text-indigo-500", bg: "bg-indigo-500/10" },
]

// ─── Helper styles ────────────────────────────────────────────────────────────
const eventTypeDot: Record<string, string> = {
  meeting:  "bg-sky-500",
  leave:    "bg-emerald-500",
  birthday: "bg-pink-500",
  deadline: "bg-rose-500",
  holiday:  "bg-amber-500",
  payday:   "bg-violet-500",
}

const eventTypeBorder: Record<string, string> = {
  meeting:  "border-l-sky-400",
  leave:    "border-l-emerald-400",
  birthday: "border-l-pink-400",
  deadline: "border-l-rose-400",
  holiday:  "border-l-amber-400",
  payday:   "border-l-violet-400",
}

const priorityStyle: Record<string, string> = {
  high:   "text-rose-500 bg-rose-500/10",
  medium: "text-amber-500 bg-amber-500/10",
  low:    "text-emerald-500 bg-emerald-500/10",
}

const statusStyle: Record<string, string> = {
  present:  "bg-emerald-500/10 text-emerald-600",
  today:    "bg-sky-500/10 text-sky-600",
  upcoming: "bg-muted/60 text-muted-foreground",
  absent:   "bg-rose-500/10 text-rose-500",
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [checkedIn, setCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState<string | null>("09:10 AM")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [tasks, setTasks] = useState(initialTasks)
  const [calMonth, setCalMonth] = useState(5) // June (0-indexed)
  const [calYear]  = useState(2026)
  const [selectedDay, setSelectedDay] = useState<number | null>(11)

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"]

  // ── Timers ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let iv: ReturnType<typeof setInterval>
    if (checkedIn) iv = setInterval(() => setElapsedSeconds(s => s + 1), 1000)
    return () => clearInterval(iv)
  }, [checkedIn])

  const fmt = (s: number) => {
    const h  = Math.floor(s / 3600).toString().padStart(2, "0")
    const m  = Math.floor((s % 3600) / 60).toString().padStart(2, "0")
    const ss = (s % 60).toString().padStart(2, "0")
    return `${h}:${m}:${ss}`
  }

  const handleCheckIn = useCallback(() => {
    if (!checkedIn) {
      setCheckedIn(true)
      const now = new Date()
      const t = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      setCheckInTime(t)
      setElapsedSeconds(0)
      toast.success("Checked In! 🚀", { description: `Session started at ${t}` })
    } else {
      setCheckedIn(false)
      toast.info("Checked Out", { description: `Session: ${fmt(elapsedSeconds)}` })
    }
  }, [checkedIn, elapsedSeconds])

  const toggleTask = (id: number) =>
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t))

  // ── Calendar ───────────────────────────────────────────────────────────────
  const daysInMonth   = new Date(calYear, calMonth + 1, 0).getDate()
  const startOffset   = (new Date(calYear, calMonth, 1).getDay() + 6) % 7
  const isCurrentMo   = calMonth === currentTime.getMonth() && calYear === currentTime.getFullYear()
  const today         = currentTime.getDate()

  // ── Computed ───────────────────────────────────────────────────────────────
  const doneTasks  = tasks.filter(t => t.done).length
  const totalTasks = tasks.length
  const taskPct    = Math.round((doneTasks / totalTasks) * 100)

  const totalHrsThisWeek = weekAttendance
    .filter(d => d.hours)
    .reduce((acc, d) => {
      const [h, m] = (d.hours as string).replace("m","").split("h ").map(Number)
      return acc + h + m / 60
    }, 0)

  const getGreeting = () => {
    const h = currentTime.getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="space-y-5">

      {/* ══ HERO BANNER ═══════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-primary/8 via-muted/20 to-muted/10 p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary/6 blur-3xl" />
        <div className="pointer-events-none absolute -left-6 bottom-0 h-32 w-32 rounded-full bg-sky-500/6 blur-3xl" />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          {/* Greeting */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-primary/10 text-primary border-none font-semibold text-[10px] uppercase tracking-wider gap-1">
                <Sparkles className="h-3 w-3" /> My Portal
              </Badge>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-semibold text-[10px] gap-1">
                <Activity className="h-3 w-3" /> Live
              </Badge>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {getGreeting()}, {employee.firstName} 👋
              </h2>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{employee.role}</span>
                <span>·</span>
                <span>{employee.department}</span>
                <span>·</span>
                <MapPin className="h-3 w-3" />
                <span>{employee.location}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
                <Flame className="h-3 w-3 text-rose-500" /> 5-day streak
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
                <Award className="h-3 w-3 text-amber-500" /> {taskPct}% tasks done
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
                <TrendingUp className="h-3 w-3 text-emerald-500" /> {totalHrsThisWeek.toFixed(1)}h this week
              </span>
            </div>
          </div>

          {/* Clock + Check-in side by side */}
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            {/* Live clock card */}
            <div className="rounded-2xl border border-border/20 bg-background/50 backdrop-blur-md px-5 py-4 flex items-center gap-3 shadow-sm">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${checkedIn ? "bg-emerald-500/10" : "bg-primary/10"}`}>
                <Clock className={`h-5 w-5 ${checkedIn ? "text-emerald-500 animate-pulse" : "text-primary"}`} />
              </div>
              <div>
                <p className="text-lg font-bold tabular-nums leading-none">
                  {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                  {currentTime.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
                </p>
              </div>
            </div>

            {/* Check-in card */}
            <div className="rounded-2xl border border-border/20 bg-background/50 backdrop-blur-md px-5 py-4 flex items-center gap-3 shadow-sm">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${checkedIn ? "bg-emerald-500/10" : "bg-muted"}`}>
                <UserCheck className={`h-5 w-5 ${checkedIn ? "text-emerald-500" : "text-muted-foreground"}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {checkedIn ? "Working" : checkInTime ? "Checked in" : "Not checked in"}
                </p>
                {checkedIn ? (
                  <p className="text-sm font-bold tabular-nums text-emerald-500">{fmt(elapsedSeconds)}</p>
                ) : checkInTime ? (
                  <p className="text-sm font-bold tabular-nums">Since {checkInTime}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">Start your session</p>
                )}
              </div>
              <Button
                variant={checkedIn ? "destructive" : "default"}
                size="sm"
                onClick={handleCheckIn}
                className="font-semibold h-8 text-xs px-4 shrink-0"
              >
                {checkedIn ? "Check Out" : "Check In"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ ROW 1: My Attendance + My Leave Balance ════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── This Week Attendance (3/5) ─────────────────────────────────────── */}
        <div className="lg:col-span-3 rounded-2xl border border-border/30 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-sky-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm">My Attendance This Week</h3>
                <p className="text-[11px] text-muted-foreground">Week of Jun 9 – 13, 2026</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary font-semibold h-7 px-2">
              Full History <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div className="space-y-2">
            {weekAttendance.map((d) => (
              <div
                key={d.day}
                className={`flex items-center gap-3 rounded-xl p-2.5 border transition-colors ${d.status === "today" ? "border-sky-400/40 bg-sky-500/5" : "border-border/20 bg-muted/10"}`}
              >
                {/* Day label */}
                <div className="w-10 text-center shrink-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{d.day}</p>
                  <p className="text-[10px] text-muted-foreground">{d.date.split(" ")[1]}</p>
                </div>

                {/* Status dot */}
                <div className={`h-2 w-2 rounded-full shrink-0 ${
                  d.status === "present"  ? "bg-emerald-500" :
                  d.status === "today"    ? "bg-sky-500 animate-pulse" :
                  d.status === "absent"   ? "bg-rose-500" : "bg-border"
                }`} />

                {/* Times */}
                <div className="flex-1 min-w-0">
                  {d.status === "upcoming" ? (
                    <p className="text-[11px] text-muted-foreground italic">Upcoming</p>
                  ) : (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[11px] font-medium">
                        In: <span className="text-foreground font-semibold">{d.checkIn}</span>
                      </span>
                      {d.checkOut && (
                        <span className="text-[11px] font-medium">
                          Out: <span className="text-foreground font-semibold">{d.checkOut}</span>
                        </span>
                      )}
                      {!d.checkOut && d.status === "today" && (
                        <span className="text-[11px] text-sky-500 font-semibold animate-pulse">In progress…</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Hours badge */}
                <Badge
                  className={`text-[9px] font-semibold border-none shrink-0 ${statusStyle[d.status]}`}
                >
                  {d.hours ?? (d.status === "today" ? "Today" : d.status === "upcoming" ? "—" : "—")}
                </Badge>
              </div>
            ))}
          </div>

          {/* Week summary */}
          <div className="pt-3 border-t border-border/10 grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-extrabold">{totalHrsThisWeek.toFixed(1)}h</p>
              <p className="text-[10px] text-muted-foreground font-medium">Hours Logged</p>
            </div>
            <div className="text-center border-x border-border/10">
              <p className="text-lg font-extrabold">2/5</p>
              <p className="text-[10px] text-muted-foreground font-medium">Days Present</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-extrabold text-emerald-500">100%</p>
              <p className="text-[10px] text-muted-foreground font-medium">Punctuality</p>
            </div>
          </div>
        </div>

        {/* ── My Leave Balance (2/5) ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 rounded-2xl border border-border/30 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Coffee className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm">My Leave Balance</h3>
                <p className="text-[11px] text-muted-foreground">2026 allocation</p>
              </div>
            </div>
            <Button variant="default" size="sm" className="h-7 text-[11px] font-semibold px-3">
              Apply
            </Button>
          </div>

          <div className="space-y-3">
            {leaveBalances.map((lb) => {
              const Icon = lb.icon
              const remaining = lb.total - lb.used
              const pct = Math.round((lb.used / lb.total) * 100)
              return (
                <div key={lb.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 ${lb.light}`} />
                      <span className="text-[11px] font-semibold">{lb.label}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      <span className={`font-bold ${lb.light}`}>{remaining}</span> / {lb.total} days left
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${lb.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Leave summary tiles */}
          <div className="pt-3 border-t border-border/10 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-muted/20 p-2.5 text-center">
              <p className="text-base font-extrabold">11</p>
              <p className="text-[10px] text-muted-foreground font-medium">Days Used</p>
            </div>
            <div className="rounded-xl bg-muted/20 p-2.5 text-center">
              <p className="text-base font-extrabold text-emerald-500">25</p>
              <p className="text-[10px] text-muted-foreground font-medium">Days Remaining</p>
            </div>
          </div>
        </div>
      </div>

      {/* ══ ROW 2: My Payslip + My Tasks ══════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Payslip Card ───────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border/30 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm">My Payslip</h3>
                <p className="text-[11px] text-muted-foreground">Latest: {payslip.month}</p>
              </div>
            </div>
            <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-none font-semibold">
              {payslip.status}
            </Badge>
          </div>

          {/* Net pay highlight */}
          <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-sky-500/10 border border-emerald-500/20 p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Net Pay</p>
              <p className="text-2xl font-extrabold mt-0.5">{payslip.netPay}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Gross Pay</p>
              <p className="text-sm font-bold">{payslip.grossPay}</p>
              <p className="text-[10px] text-rose-500 mt-0.5">- {payslip.deductions} deducted</p>
            </div>
          </div>

          {/* Next payday countdown */}
          <div className="flex items-center justify-between rounded-xl border border-border/20 bg-muted/20 p-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-violet-500" />
              <div>
                <p className="text-[11px] font-semibold">Next Payday</p>
                <p className="text-[10px] text-muted-foreground">{payslip.nextPayday}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-violet-500">{payslip.daysUntilPayday}</p>
              <p className="text-[10px] text-muted-foreground">days away</p>
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-2">
            <FileText className="h-3.5 w-3.5" /> Download Payslip (PDF)
          </Button>
        </div>

        {/* ── My Tasks ───────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border/30 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm">My Tasks</h3>
                <p className="text-[11px] text-muted-foreground">{doneTasks}/{totalTasks} completed</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px] font-bold">
              {tasks.filter(t => !t.done).length} Pending
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="text-muted-foreground">Completion Rate</span>
              <span>{taskPct}%</span>
            </div>
            <Progress value={taskPct} className="h-2 rounded-full" />
          </div>

          {/* Task items */}
          <div className="space-y-1.5">
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                  task.done
                    ? "border-border/10 bg-muted/10 opacity-60"
                    : "border-border/20 bg-muted/20 hover:bg-muted/40"
                }`}
              >
                {/* Checkbox */}
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  task.done
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-border group-hover:border-primary"
                }`}>
                  {task.done && <CircleCheck className="h-3.5 w-3.5 text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${task.done ? "line-through text-muted-foreground" : ""}`}>
                    {task.text}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Due: {task.due}</p>
                </div>

                <Badge className={`text-[9px] border-none font-semibold shrink-0 ${priorityStyle[task.priority]}`}>
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Task
          </Button>
        </div>
      </div>

      {/* ══ ROW 3: Calendar + Upcoming Events ═════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Interactive Calendar (2/3) ─────────────────────────────────────── */}
        <div className="lg:col-span-2 rounded-2xl border border-border/30 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm">My Calendar</h3>
                <p className="text-[11px] text-muted-foreground">{monthNames[calMonth]} {calYear}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCalMonth(m => m === 0 ? 11 : m - 1)}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted/60 transition-colors border border-border/30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCalMonth(m => m === 11 ? 0 : m + 1)}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted/60 transition-colors border border-border/30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 text-center">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
              <div key={d} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => <div key={`pad-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day      = i + 1
              const events   = calendarEvents[day] || []
              const isToday  = isCurrentMo && day === today
              const isSel    = day === selectedDay && calMonth === 5

              return (
                <Tooltip key={`d-${day}`}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setSelectedDay(day)}
                      className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all duration-200 hover:scale-105 ${
                        isToday
                          ? "bg-primary text-primary-foreground font-extrabold shadow-md"
                          : isSel
                          ? "bg-primary/15 text-primary font-bold ring-1 ring-primary/30"
                          : "hover:bg-muted/60 text-foreground"
                      }`}
                    >
                      <span>{day}</span>
                      {events.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {events.slice(0, 2).map((ev, ei) => (
                            <span
                              key={ei}
                              className={`h-1 w-1 rounded-full ${eventTypeDot[ev.type] || "bg-gray-400"} ${isToday ? "bg-primary-foreground/70" : ""}`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  </TooltipTrigger>
                  {events.length > 0 && (
                    <TooltipContent side="top" className="text-xs max-w-[180px]">
                      {events.map((ev, ei) => <p key={ei} className="font-medium">{ev.label}</p>)}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-border/10">
            {[
              { type: "meeting",  label: "Meeting",  color: "bg-sky-500"    },
              { type: "leave",    label: "Leave",    color: "bg-emerald-500" },
              { type: "birthday", label: "Birthday", color: "bg-pink-500"   },
              { type: "deadline", label: "Deadline", color: "bg-rose-500"   },
              { type: "holiday",  label: "Holiday",  color: "bg-amber-500"  },
              { type: "payday",   label: "Payday",   color: "bg-violet-500" },
            ].map(l => (
              <div key={l.type} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${l.color}`} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Upcoming Events (1/3) ──────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border/30 bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <CalendarClock className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Coming Up</h3>
              <p className="text-[11px] text-muted-foreground">Your next events</p>
            </div>
          </div>

          <div className="space-y-2">
            {upcomingEvents.map((ev, i) => {
              const Icon = ev.icon
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border-l-2 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer ${eventTypeBorder[ev.type] || "border-l-gray-400"}`}
                >
                  <div className="h-7 w-7 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border/20 mt-0.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{ev.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{ev.date} · {ev.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ══ ROW 4: Quick Actions + Announcements ══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── Quick Actions (2/5) ────────────────────────────────────────────── */}
        <div className="lg:col-span-2 rounded-2xl border border-border/30 bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Quick Actions</h3>
              <p className="text-[11px] text-muted-foreground">Your most-used features</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(qa => {
              const Icon = qa.icon
              return (
                <button
                  key={qa.label}
                  className="flex flex-col items-start gap-2 p-3 rounded-xl border border-border/20 bg-muted/10 hover:bg-muted/40 hover:border-border/40 transition-all text-left group"
                >
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${qa.bg}`}>
                    <Icon className={`h-4 w-4 ${qa.color}`} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold leading-tight">{qa.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{qa.sub}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Announcements (3/5) ────────────────────────────────────────────── */}
        <div className="lg:col-span-3 rounded-2xl border border-border/30 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <Bell className="h-4 w-4 text-sky-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Company Announcements</h3>
                <p className="text-[11px] text-muted-foreground">{announcements.filter(a => !a.read).length} unread</p>
              </div>
            </div>
            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {announcements.filter(a => !a.read).length}
            </span>
          </div>

          <div className="space-y-2.5">
            {announcements.map((ann, i) => (
              <div
                key={i}
                className={`relative p-3 rounded-xl border border-border/20 space-y-1.5 hover:bg-muted/30 transition-colors cursor-pointer ${ann.read ? "bg-muted/5 opacity-80" : "bg-muted/15"}`}
              >
                {!ann.read && (
                  <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
                )}
                <div className="flex items-center gap-2 pr-5">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">{ann.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold leading-tight truncate">{ann.title}</p>
                    <p className="text-[10px] text-muted-foreground">{ann.author} · {ann.time}</p>
                  </div>
                  <Badge className={`text-[9px] border-none font-semibold shrink-0 ${ann.tagColor}`}>{ann.tag}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed pl-8">{ann.body}</p>
              </div>
            ))}
          </div>

          <Button variant="ghost" size="sm" className="w-full text-xs font-semibold text-primary gap-1.5">
            See All Announcements <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ══ ROW 5: Employee Profile Card (compact) ════════════════════════════ */}
      <div className="rounded-2xl border border-border/30 bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm">My Profile Summary</h3>
              <p className="text-[11px] text-muted-foreground">Your employment details</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[11px] font-semibold px-3">
            Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Employee ID",    value: employee.employeeId,  icon: ShieldCheck },
            { label: "Department",     value: employee.department,  icon: GraduationCap },
            { label: "Role",           value: employee.role,        icon: Target },
            { label: "Manager",        value: employee.manager,     icon: UserCheck },
            { label: "Joined",         value: employee.joinDate,    icon: CalendarDays },
            { label: "Location",       value: employee.location,    icon: MapPin },
          ].map(field => {
            const Icon = field.icon
            return (
              <div key={field.label} className="rounded-xl bg-muted/20 border border-border/20 p-3 space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Icon className="h-3 w-3" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider">{field.label}</p>
                </div>
                <p className="text-xs font-bold truncate" title={field.value}>{field.value}</p>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
