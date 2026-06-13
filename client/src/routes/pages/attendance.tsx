import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Laptop,
  AlertCircle,
  FileText,
  Search,
  Filter,
  BarChart3,
  CalendarDays,
  Info,
  Settings,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ReferenceLine } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { toast } from "sonner"

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
  { day: 15, dateStr: "Jun 15", dayName: "Monday", status: "leave", checkIn: null, checkOut: null, hours: null, breakHours: 0, location: null, ipAddress: null, device: null, notes: "Approved Casual Leave" },
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

const chartConfig = {
  Hours: {
    label: "Hours Logged",
    color: "hsl(var(--primary))",
  },
}

export interface SetupHoliday {
  id: string
  name: string
  startDay: number
  endDay: number
  startDate?: string
  endDate?: string
}

export default function AttendancePage() {
  const navigate = useNavigate()
  const [selectedMonth] = useState("June 2026")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Load Holiday Settings from localStorage
  const [weeklyHolidays, setWeeklyHolidays] = useState<string[]>(["Saturday", "Sunday"])
  const [regularHolidays, setRegularHolidays] = useState<SetupHoliday[]>([
    { id: "default-1", name: "National Holiday - Independence Celebration", startDay: 18, endDay: 18 }
  ])

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

  // Compute final attendance records dynamically based on weekly and regular holiday settings
  const mockJuneAttendance = initialJuneAttendance.map((record) => {
    if (record.status === "upcoming") return record

    // Check regular holidays (range-based)
    const matchingRegularHoliday = regularHolidays.find(h => {
      if (h.startDate && h.endDate) {
        const recordDate = new Date(2026, 5, record.day) // June 2026
        const start = new Date(h.startDate)
        const end = new Date(h.endDate)
        // Strip hours
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

  // Selected Day State
  const [selectedDay, setSelectedDay] = useState<AttendanceRecord | null>(mockJuneAttendance[10]) // default today June 11

  // Sync selectedDay structure when it changes dynamically
  useEffect(() => {
    if (selectedDay) {
      const refreshed = mockJuneAttendance.find(d => d.day === selectedDay.day)
      if (refreshed) {
        setSelectedDay(refreshed)
      }
    }
  }, [weeklyHolidays, regularHolidays])

  // Filter & Search handling
  const filteredLogs = mockJuneAttendance.filter(log => {
    if (log.status === "upcoming") return false
    const matchesStatus = filterStatus === "all" || log.status === filterStatus
    const matchesSearch = log.dayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.dateStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.location && log.location.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  // Format chart data
  const chartData = mockJuneAttendance
    .filter(d => (d.status === "present" || d.status === "late") && d.day <= 11)
    .map(d => ({
      name: d.dateStr,
      Hours: d.hours,
      Target: 8,
    }))

  const handleRequestCorrection = (record: AttendanceRecord) => {
    toast.success(`Correction request submitted for ${record.dateStr}`, {
      description: "Your manager has been notified to review your logs."
    })
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* ─── Header Section ─── */}
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
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border/40 bg-card hover:bg-muted/50">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/40 bg-card text-sm font-semibold">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span>{selectedMonth}</span>
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border/40 bg-card hover:bg-muted/50">
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          {/* Configure Calendar Navigation Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/attendance/setup")}
            title="Configure Weekly & Calendar Holidays"
            className="h-9 w-9 rounded-xl border-border/40 bg-card hover:bg-muted/50 text-muted-foreground hover:text-primary ml-1"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid gap-6 lg:grid-cols-4 px-1">

        {/* Centerpiece Calendar Grid (3 Columns) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 px-0">
              <div>
                <h3 className="text-lg font-bold">Shift & Status Calendar</h3>
                <p className="text-xs text-muted-foreground">Click any day to view detailed check-in logs and settings.</p>
              </div>

              {/* Mini legend */}
              <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 text-xs">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Present</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500"></span> Late</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500"></span> Absent</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-500"></span> Leave</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-500"></span> Holiday</span>
              </div>
            </div>

            <div className="py-2 px-0">
              {/* Days of week header */}
              <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted-foreground pb-2 border-b border-border/20 mb-3">
                <div>MON</div>
                <div>TUE</div>
                <div>WED</div>
                <div>THU</div>
                <div>FRI</div>
                <div>SAT</div>
                <div>SUN</div>
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
                {mockJuneAttendance.map((record) => {
                  const isToday = record.day === 11 // June 11 is today
                  const isSelected = selectedDay?.day === record.day

                  // Style determination
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
                        <span className={`text-sm font-extrabold ${isToday ? "text-primary" : "text-foreground"}`}>
                          {record.day}
                        </span>
                        {record.status !== "upcoming" && record.status !== "weekend" && (
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            record.status === "present" ? "bg-emerald-500" :
                            record.status === "late" ? "bg-amber-500" :
                            record.status === "absent" ? "bg-red-500" :
                            record.status === "leave" ? "bg-sky-500" : "bg-violet-500"
                          }`} />
                        )}
                      </div>

                      {/* Cell Content */}
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
                          <div className="text-[8px] text-muted-foreground/50 font-medium leading-none">Off</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Weekly Hours Trend Chart */}
          <div className="rounded-2xl p-0 pt-2">
            <div className="pb-4 flex flex-row items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Active Working Hours Trend
                </h3>
                <p className="text-xs text-muted-foreground">Hours logged per day this month against the standard 8-hour target.</p>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/40 px-2 py-1 rounded-lg">
                <Info className="h-3 w-3" /> Auto-synced
              </div>
            </div>
            <div className="p-0">
              <div className="h-64 w-full">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
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
                    <ReferenceLine y={8} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Target: 8h', position: 'top', fill: '#ef4444', fontSize: 10 }} />
                    <Bar
                      dataKey="Hours"
                      fill="url(#colorHours)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Day Detail Sidebar (1 Column) */}
        <div className="lg:col-span-1">
          {selectedDay ? (
            <div className="rounded-2xl bg-card sticky top-6 overflow-hidden p-1">
              <div className="p-5 bg-muted/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-semibold text-xs border-border/40">
                    {selectedDay.dayName}
                  </Badge>
                  <Badge className={`font-semibold capitalize ${
                    selectedDay.status === "present" ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10" :
                    selectedDay.status === "late" ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/10" :
                    selectedDay.status === "absent" ? "bg-red-500/10 text-red-500 hover:bg-red-500/10" :
                    selectedDay.status === "leave" ? "bg-sky-500/10 text-sky-500 hover:bg-sky-500/10" :
                    selectedDay.status === "holiday" ? "bg-violet-500/10 text-violet-500 hover:bg-violet-500/10" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {selectedDay.status}
                  </Badge>
                </div>
                <h3 className="text-xl font-bold mt-2">{selectedDay.dateStr}, 2026</h3>
                {selectedDay.day === 11 && (
                  <Badge className="mt-1.5 bg-primary/20 text-primary border-primary/20 hover:bg-primary/20">
                    Today
                  </Badge>
                )}
              </div>

              <div className="p-4 space-y-5">
                {/* Punch info timeline */}
                {selectedDay.status !== "weekend" && selectedDay.status !== "holiday" && selectedDay.status !== "leave" && selectedDay.status !== "absent" ? (
                  <div className="space-y-4">
                    <div className="relative pl-6 border-l border-border/60 space-y-4">
                      {/* Check-In */}
                      <div className="relative">
                        <span className="absolute -left-[30px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-background">
                          <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                        </span>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Check In</div>
                        <div className="text-lg font-bold text-foreground mt-0.5">{selectedDay.checkIn}</div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          {selectedDay.location === "Remote" ? <Laptop className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                          <span>{selectedDay.location} ({selectedDay.ipAddress})</span>
                        </div>
                      </div>

                      {/* Check-Out */}
                      <div className="relative">
                        <span className={`absolute -left-[30px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-background ${selectedDay.checkOut ? "bg-primary" : "bg-muted"}`}>
                          <Clock className="h-2.5 w-2.5 text-white" />
                        </span>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Check Out</div>
                        <div className="text-lg font-bold text-foreground mt-0.5">
                          {selectedDay.checkOut || <span className="text-sm font-medium italic text-muted-foreground">Active session</span>}
                        </div>
                        {selectedDay.checkOut && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            {selectedDay.location === "Remote" ? <Laptop className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                            <span>{selectedDay.location} ({selectedDay.ipAddress})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/20 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Active Hours</span>
                        <span className="font-semibold">{selectedDay.hours} hrs</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Break Hours</span>
                        <span className="font-semibold">{selectedDay.breakHours} hr</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Punctuality</span>
                        <span className={`font-semibold ${selectedDay.status === "late" ? "text-amber-500" : "text-emerald-500"}`}>
                          {selectedDay.status === "late" ? "Late" : "On Time"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-6 px-4 bg-muted/15 rounded-xl border border-border/20">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/60 mb-2" />
                    <h4 className="text-sm font-bold capitalize">{selectedDay.status} Day</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedDay.notes || "No time logs recorded for this day."}
                    </p>
                  </div>
                )}

                {/* Additional Info / Notes */}
                {selectedDay.notes && (
                  <div className="p-3 bg-muted/40 rounded-xl text-xs text-muted-foreground flex gap-2">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground">Day Note: </span>
                      {selectedDay.notes}
                    </div>
                  </div>
                )}

                {/* Request correction */}
                {(selectedDay.status === "absent" || selectedDay.status === "late" || (selectedDay.dayName !== "Saturday" && selectedDay.dayName !== "Sunday" && !selectedDay.checkOut)) && (
                  <div className="pt-2">
                    <Button
                      onClick={() => handleRequestCorrection(selectedDay)}
                      className="w-full rounded-xl gap-2 text-xs font-semibold bg-primary hover:bg-primary/90"
                    >
                      <FileText className="h-4 w-4" /> Request Regularization
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                      Submit missing check-in/out logs for manager approval.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-card p-6 text-center">
              <CalendarClock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-bold">No Day Selected</h3>
              <p className="text-sm text-muted-foreground mt-1">Click a day on the calendar to see complete punch and log details.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Detailed Log List Table ─── */}
      <div className="rounded-2xl overflow-hidden">
        <div className="pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-0">
          <div>
            <h3 className="text-lg font-bold">Attendance History logs</h3>
            <p className="text-sm text-muted-foreground">Review all logs for {selectedMonth}.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-full sm:w-60 rounded-xl border-border/40 bg-muted/20"
              />
            </div>

            {/* Status Filter */}
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
        <div className="px-0">
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
                      className={`border-b border-border/10 transition-colors hover:bg-muted/15 cursor-pointer ${selectedDay?.day === log.day ? "bg-muted/25" : ""}`}
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
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Active</Badge>
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
                            {log.location === "Remote" ? <Laptop className="h-3 w-3 text-muted-foreground" /> : <MapPin className="h-3 w-3 text-muted-foreground" />}
                            {log.location}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`font-semibold capitalize text-[10px] ${log.status === "present" ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10" :
                            log.status === "late" ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/10" :
                              log.status === "absent" ? "bg-red-500/10 text-red-500 hover:bg-red-500/10" :
                                log.status === "leave" ? "bg-sky-500/10 text-sky-500 hover:bg-sky-500/10" :
                                  log.status === "holiday" ? "bg-violet-500/10 text-violet-500 hover:bg-violet-500/10" :
                                    "bg-muted text-muted-foreground"
                          }`}>
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
    </div>
  )
}
