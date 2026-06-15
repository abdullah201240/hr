import { useState, useEffect, useMemo, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Laptop,
  Search,
  Filter,
  BarChart3,
  CalendarDays,
  Info,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
} from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { toast } from "sonner"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
} from "date-fns"

// ─── Types ─────────────────────────────────────────────────────────────────────
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
}

interface SetupHoliday {
  id: string
  name: string
  startDate: string
  endDate: string
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

// ─── Mock Data Generator ───────────────────────────────────────────────────────
function generateMockAttendance(
  year: number,
  month: number,
  today: Date,
  weeklyHolidays: string[],
  regularHolidays: SetupHoliday[]
): AttendanceRecord[] {
  const monthStart = startOfMonth(new Date(year, month, 1))
  const monthEnd = endOfMonth(new Date(year, month, 1))
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month
  const todayDay = today.getDate()

  return days.map((date) => {
    const day = date.getDate()
    const dayName = DAY_NAMES[getDay(date)]
    const dateStr = format(date, "MMM d")

    // Check regular holidays
    const dayTime = new Date(year, month, day)
    dayTime.setHours(0, 0, 0, 0)

    const matchingHoliday = regularHolidays.find((h) => {
      const start = new Date(h.startDate)
      const end = new Date(h.endDate)
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      return dayTime >= start && dayTime <= end
    })

    if (matchingHoliday) {
      return {
        day,
        dateStr,
        dayName,
        status: "holiday" as const,
        checkIn: null,
        checkOut: null,
        hours: null,
        breakHours: 0,
        location: null,
        ipAddress: null,
        device: null,
        notes: matchingHoliday.name,
      }
    }

    // Check weekly holidays
    const isWeeklyHoliday = weeklyHolidays.includes(dayName)
    if (isWeeklyHoliday) {
      return {
        day,
        dateStr,
        dayName,
        status: "weekend" as const,
        checkIn: null,
        checkOut: null,
        hours: null,
        breakHours: 0,
        location: null,
        ipAddress: null,
        device: null,
      }
    }

    // Upcoming days
    if (isCurrentMonth && day > todayDay) {
      return {
        day,
        dateStr,
        dayName,
        status: "upcoming" as const,
        checkIn: null,
        checkOut: null,
        hours: null,
        breakHours: 0,
        location: null,
        ipAddress: null,
        device: null,
      }
    }

    // Generate mock data for past/current days
    const seed = (day * 7 + month * 31) % 10
    const isLate = seed === 3
    const isAbsent = seed === 7
    const isLeave = seed === 5
    const isRemote = seed % 3 === 0

    if (isAbsent) {
      return {
        day,
        dateStr,
        dayName,
        status: "absent" as const,
        checkIn: null,
        checkOut: null,
        hours: null,
        breakHours: 0,
        location: null,
        ipAddress: null,
        device: null,
        notes: "Unexcused absence",
      }
    }

    if (isLeave) {
      return {
        day,
        dateStr,
        dayName,
        status: "leave" as const,
        checkIn: null,
        checkOut: null,
        hours: null,
        breakHours: 0,
        location: null,
        ipAddress: null,
        device: null,
        notes: "Approved leave",
      }
    }

    const checkInMin = isLate ? 20 + (seed % 4) * 5 : seed % 5
    const hours = 8.5 + ((seed * 0.3) % 1.5)
    const checkOutHour = 9 + Math.floor(hours) + 6 // 6 hours offset for PM
    const checkOutMin = Math.round((hours % 1) * 60)
    const formattedCheckIn = `09:${checkInMin.toString().padStart(2, "0")} AM`
    const formattedCheckOut = `${checkOutHour > 12 ? checkOutHour - 12 : checkOutHour}:${checkOutMin.toString().padStart(2, "0")} PM`

    return {
      day,
      dateStr,
      dayName,
      status: isLate ? ("late" as const) : ("present" as const),
      checkIn: formattedCheckIn,
      checkOut: formattedCheckOut,
      hours: Math.round(hours * 10) / 10,
      breakHours: 1,
      location: isRemote ? "Remote" : "Office",
      ipAddress: isRemote ? "103.45.23.11" : "192.168.10.45",
      device: isRemote ? "Chrome / macOS" : "Chrome / macOS",
    }
  })
}

// ─── Chart Config ──────────────────────────────────────────────────────────────
const chartConfig = {
  Hours: {
    label: "Hours Logged",
    color: "hsl(var(--primary))",
  },
}

// ─── Page Component ────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today))
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Load settings from localStorage
  const [weeklyHolidays, setWeeklyHolidays] = useState<string[]>(["Saturday", "Sunday"])
  const [regularHolidays, setRegularHolidays] = useState<SetupHoliday[]>([])

  useEffect(() => {
    const savedWeekly = localStorage.getItem("hr_weekly_holidays")
    if (savedWeekly) {
      try {
        setWeeklyHolidays(JSON.parse(savedWeekly))
      } catch (e) {
        console.error(e)
      }
    }

    const savedRegular = localStorage.getItem("hr_regular_holidays")
    if (savedRegular) {
      try {
        setRegularHolidays(JSON.parse(savedRegular))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  // Generate attendance records
  const attendanceRecords = useMemo(
    () =>
      generateMockAttendance(
        viewMonth.getFullYear(),
        viewMonth.getMonth(),
        today,
        weeklyHolidays,
        regularHolidays
      ),
    [viewMonth, weeklyHolidays, regularHolidays]
  )

  const selectedMonthLabel = format(viewMonth, "MMMM yyyy")

  // Selected day
  const [selectedDay, setSelectedDay] = useState<AttendanceRecord | null>(null)

  // Reset selected day when month changes
  useEffect(() => {
    setSelectedDay(null)
  }, [viewMonth])

  // Month navigation
  const goNextMonth = useCallback(() => setViewMonth((m) => addMonths(m, 1)), [])
  const goPrevMonth = useCallback(() => setViewMonth((m) => subMonths(m, 1)), [])

  // Filtered logs
  const filteredLogs = attendanceRecords.filter((log) => {
    if (log.status === "upcoming") return false
    const matchesStatus = filterStatus === "all" || log.status === filterStatus
    const matchesSearch =
      log.dayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.dateStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.location && log.location.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  // Chart data
  const chartData = attendanceRecords
    .filter((d) => (d.status === "present" || d.status === "late") && d.hours)
    .map((d) => ({
      name: d.dateStr,
      Hours: d.hours,
      Target: 8,
    }))

  const handleRequestCorrection = (record: AttendanceRecord) => {
    toast.success(`Correction request submitted for ${record.dateStr}`, {
      description: "Your manager has been notified to review your logs.",
    })
  }

  // Status counts
  const counts = useMemo(() => {
    const c = { present: 0, late: 0, absent: 0, leave: 0, holiday: 0, weekend: 0 }
    for (const r of attendanceRecords) {
      if (r.status !== "upcoming" && r.status in c) {
        c[r.status as keyof typeof c]++
      }
    }
    return c
  }, [attendanceRecords])

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            My Attendance
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time visual schedule, time logs, and monthly analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl border-border/40 bg-card hover:bg-muted/50"
            onClick={goPrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/40 bg-card text-sm font-semibold min-w-[140px] justify-center">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span>{selectedMonthLabel}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl border-border/40 bg-card hover:bg-muted/50"
            onClick={goNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ─── Summary Badges ─── */}
      <div className="flex flex-wrap gap-2 px-1">
        <Badge variant="outline" className="gap-1.5 text-[10px] bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Present: {counts.present}
        </Badge>
        <Badge variant="outline" className="gap-1.5 text-[10px] bg-amber-500/5 text-amber-600 dark:text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Late: {counts.late}
        </Badge>
        <Badge variant="outline" className="gap-1.5 text-[10px] bg-red-500/5 text-red-600 dark:text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Absent: {counts.absent}
        </Badge>
        <Badge variant="outline" className="gap-1.5 text-[10px] bg-sky-500/5 text-sky-600 dark:text-sky-400">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> Leave: {counts.leave}
        </Badge>
        <Badge variant="outline" className="gap-1.5 text-[10px] bg-violet-500/5 text-violet-600 dark:text-violet-400">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> Holiday: {counts.holiday}
        </Badge>
      </div>

      {/* ─── Calendar Grid ─── */}
      <div className="px-1">
        <div className="rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4">
            <div>
              <h3 className="text-lg font-bold">Shift & Status Calendar</h3>
              <p className="text-xs text-muted-foreground">
                Click any day to view detailed check-in logs and settings.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 text-xs">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Present
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Late
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500" /> Absent
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-sky-500" /> Leave
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-violet-500" /> Holiday
              </span>
            </div>
          </div>

          <div className="py-2">
            {/* Day headers */}
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground pb-2 border-b border-border/20 mb-3">
              <div>MON</div>
              <div>TUE</div>
              <div>WED</div>
              <div>THU</div>
              <div>FRI</div>
              <div>SAT</div>
              <div>SUN</div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
              {attendanceRecords.map((record) => {
                const isToday =
                  record.day === today.getDate() &&
                  viewMonth.getMonth() === today.getMonth() &&
                  viewMonth.getFullYear() === today.getFullYear()
                const isSelected = selectedDay?.day === record.day

                let cellBg = "bg-transparent hover:bg-muted/30"
                let cellBorder = "border-0"
                let glowStyle = ""

                if (record.status === "present") {
                  cellBg = "bg-emerald-500/10 hover:bg-emerald-500/15 dark:bg-emerald-500/[0.04]"
                } else if (record.status === "late") {
                  cellBg = "bg-amber-500/10 hover:bg-amber-500/15 dark:bg-amber-500/[0.04]"
                } else if (record.status === "absent") {
                  cellBg = "bg-red-500/10 hover:bg-red-500/15 dark:bg-red-500/[0.04]"
                } else if (record.status === "leave") {
                  cellBg = "bg-sky-500/10 hover:bg-sky-500/15 dark:bg-sky-500/[0.04]"
                } else if (record.status === "holiday") {
                  cellBg = "bg-violet-500/10 hover:bg-violet-500/15 dark:bg-violet-500/[0.04]"
                } else if (record.status === "weekend") {
                  cellBg = "bg-muted/30 hover:bg-muted/40 dark:bg-muted/15"
                } else if (record.status === "upcoming") {
                  cellBg = "bg-transparent opacity-40 cursor-default pointer-events-none"
                }

                if (isToday) {
                  cellBorder = "ring-2 ring-primary/80"
                  glowStyle = "animate-pulse"
                }
                if (isSelected) {
                  cellBorder = "ring-2 ring-foreground"
                }

                return (
                  <button
                    key={record.day}
                    onClick={() => record.status !== "upcoming" && setSelectedDay(record)}
                    className={`flex flex-col justify-between h-14 sm:h-16 p-2 rounded-xl text-left transition-all ${cellBg} ${cellBorder} ${glowStyle}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-sm font-extrabold ${isToday ? "text-primary" : "text-foreground"}`}
                      >
                        {record.day}
                      </span>
                      {record.status !== "upcoming" && record.status !== "weekend" && (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            record.status === "present"
                              ? "bg-emerald-500"
                              : record.status === "late"
                                ? "bg-amber-500"
                                : record.status === "absent"
                                  ? "bg-red-500"
                                  : record.status === "leave"
                                    ? "bg-sky-500"
                                    : "bg-violet-500"
                          }`}
                        />
                      )}
                    </div>
                    <div className="mt-auto hidden sm:block">
                      {record.hours && (
                        <div className="text-[10px] font-bold text-foreground/85 leading-none">
                          {record.hours}h logged
                        </div>
                      )}
                      {record.status === "leave" && (
                        <div className="text-[8px] font-bold text-sky-500 uppercase tracking-tight truncate leading-none">
                          Leave
                        </div>
                      )}
                      {record.status === "holiday" && (
                        <div className="text-[8px] font-bold text-violet-500 uppercase tracking-tight truncate leading-none">
                          Holiday
                        </div>
                      )}
                      {record.status === "weekend" && (
                        <div className="text-[8px] text-muted-foreground/50 font-medium leading-none">
                          Off
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Hours Chart ─── */}
      <div className="rounded-2xl p-0 pt-2 px-1">
        <div className="pb-4 flex flex-row items-center justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Active Working Hours Trend
            </h3>
            <p className="text-xs text-muted-foreground">
              Hours logged per day against the standard 8-hour target.
            </p>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/40 px-2 py-1 rounded-lg">
            <Info className="h-3 w-3" /> Auto-synced
          </div>
        </div>
        {chartData.length > 0 ? (
          <div className="h-64 w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border) / 0.3)"
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  domain={[0, 12]}
                />
                <RechartsTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
                />
                <ReferenceLine
                  y={8}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{
                    value: "Target: 8h",
                    position: "top",
                    fill: "#ef4444",
                    fontSize: 10,
                  }}
                />
                <Bar
                  dataKey="Hours"
                  fill="url(#colorHours)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            No working hours data available for this month yet.
          </div>
        )}
      </div>

      {/* ─── Attendance History Table ─── */}
      <div className="rounded-2xl overflow-hidden px-1">
        <div className="pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">Attendance History Logs</h3>
            <p className="text-sm text-muted-foreground">
              Review all logs for {selectedMonthLabel}.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-full sm:w-60 rounded-xl border-border/40 bg-muted/20"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-muted/20 border border-border/40 rounded-xl px-2 h-9">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-2 text-foreground"
              >
                <option value="all">All Statuses</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="leave">Leave</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border/20 bg-muted/20 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Day</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Logged Hours</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr
                    key={log.day}
                    className={`border-b border-border/10 transition-colors hover:bg-muted/15 cursor-pointer ${
                      selectedDay?.day === log.day ? "bg-muted/25" : ""
                    }`}
                    onClick={() => setSelectedDay(log)}
                  >
                    <td className="py-3 px-4 font-semibold">{log.dateStr}</td>
                    <td className="py-3 px-4 text-muted-foreground">{log.dayName}</td>
                    <td className="py-3 px-4">
                      {log.checkIn ? (
                        <span className="font-medium">{log.checkIn}</span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {log.checkOut ? (
                        <span className="font-medium">{log.checkOut}</span>
                      ) : log.checkIn ? (
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary border-primary/20"
                        >
                          Active
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {log.hours ? `${log.hours} hrs` : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      {log.location ? (
                        <span className="flex items-center gap-1 text-xs">
                          {log.location === "Remote" ? (
                            <Laptop className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                          )}
                          {log.location}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={`font-semibold capitalize text-[10px] ${
                          log.status === "present"
                            ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10"
                            : log.status === "late"
                              ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/10"
                              : log.status === "absent"
                                ? "bg-red-500/10 text-red-500 hover:bg-red-500/10"
                                : log.status === "leave"
                                  ? "bg-sky-500/10 text-sky-500 hover:bg-sky-500/10"
                                  : log.status === "holiday"
                                    ? "bg-violet-500/10 text-violet-500 hover:bg-violet-500/10"
                                    : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {log.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {(log.status === "absent" || log.status === "late") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRequestCorrection(log)}
                          className="h-7 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg px-2.5"
                        >
                          Correct
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    No logs found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
