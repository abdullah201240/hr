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
  Check,
  X,
  Plus,
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
  addMonths,
  subMonths,
} from "date-fns"
import {
  useMyAttendanceQuery,
  useSubmitCorrectionMutation,
  useDailyAttendanceQuery,
  useApproveCorrectionMutation,
  useRejectCorrectionMutation,
  usePendingCorrectionsQuery,
  useOverrideAttendanceMutation,
  type AttendanceRecord,
  type DailyAttendanceLog,
  type CorrectionRequest,
} from "@/hooks/useAttendance"
import { useEmployeesQuery } from "@/hooks/useEmployees"
import { useAuthStore } from "@/store/useAuthStore"
import { useSearchParams } from "react-router"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

// ─── Time Format Helper Functions ──────────────────────────────────────────────
function convert24to12(time24: string): string {
  if (!time24) return ""
  const [hourStr, minStr] = time24.split(":")
  let hour = parseInt(hourStr, 10)
  const min = parseInt(minStr, 10)
  const ampm = hour >= 12 ? "PM" : "AM"
  hour = hour % 12
  hour = hour ? hour : 12 // 0 should be 12
  const hrStr = hour.toString().padStart(2, "0")
  const minFormatted = min.toString().padStart(2, "0")
  return `${hrStr}:${minFormatted} ${ampm}`
}

function convert12to24(time12: string | null | undefined): string {
  if (!time12) return ""
  const match = time12.match(/^(\d{2}):(\d{2}) ([AP]M)$/)
  if (!match) return ""
  let [_, hoursStr, minutesStr, modifier] = match
  let hours = parseInt(hoursStr, 10)
  if (modifier === "PM" && hours < 12) hours += 12
  if (modifier === "AM" && hours === 12) hours = 0
  return `${hours.toString().padStart(2, "0")}:${minutesStr}`
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
  const { user } = useAuthStore()
  const isAdminOrHR = user?.role === "admin" || user?.role === "hr"

  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "my-attendance"

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true })
  }

  const today = new Date()
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today))
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch real attendance records
  const { data: attendanceRecords = [], isLoading } = useMyAttendanceQuery(
    viewMonth.getFullYear(),
    viewMonth.getMonth()
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

  // Correction state & mutations
  const [isCorrectionDialogOpen, setIsCorrectionDialogOpen] = useState(false)
  const [correctionRecord, setCorrectionRecord] = useState<AttendanceRecord | null>(null)
  const [proposedCheckIn, setProposedCheckIn] = useState("09:00")
  const [proposedCheckOut, setProposedCheckOut] = useState("18:00")
  const [correctionReason, setCorrectionReason] = useState("")

  const submitCorrectionMut = useSubmitCorrectionMutation()

  const handleRequestCorrection = (record: AttendanceRecord) => {
    setCorrectionRecord(record)
    setProposedCheckIn(convert12to24(record.checkIn) || "09:00")
    setProposedCheckOut(convert12to24(record.checkOut) || "18:00")
    setCorrectionReason(record.correctionReason || "")
    setIsCorrectionDialogOpen(true)
  }

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!correctionRecord) return

    const dateObj = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), correctionRecord.day)
    const dateStr = dateObj.toLocaleDateString("en-CA")

    const payload = {
      date: dateStr,
      proposedCheckIn: convert24to12(proposedCheckIn),
      proposedCheckOut: convert24to12(proposedCheckOut),
      correctionReason,
    }

    try {
      await submitCorrectionMut.mutateAsync(payload)
      toast.success("Correction request submitted successfully", {
        description: `Your request for ${correctionRecord.dateStr} has been sent for approval.`,
      })
      setIsCorrectionDialogOpen(false)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error("Failed to submit correction request", {
        description: error.response?.data?.message || error.message || "An error occurred.",
      })
    }
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

  // ─── Employee Attendance (Admin/HR View) State ──────────────────────────────
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [adminSearch, setAdminSearch] = useState("")
  const [adminFilterStatus, setAdminFilterStatus] = useState("all")
  const [adminSubTab, setAdminSubTab] = useState<"logs" | "corrections">("logs")

  // Override dialog state
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false)
  const [overrideEmployeeId, setOverrideEmployeeId] = useState("")
  const [overrideDate, setOverrideDate] = useState("")
  const [overrideStatus, setOverrideStatus] = useState("present")
  const [overrideCheckIn, setOverrideCheckIn] = useState("09:00")
  const [overrideCheckOut, setOverrideCheckOut] = useState("18:00")
  const [overrideNotes, setOverrideNotes] = useState("")

  // API Queries for Admin
  const { data: dailyLogs = [], isLoading: isLoadingDaily, refetch: refetchDaily } = useDailyAttendanceQuery(selectedDate)
  const { data: pendingCorrections = [], isLoading: isLoadingCorrections } = usePendingCorrectionsQuery()
  const { data: employeesData } = useEmployeesQuery({ page: 1, limit: 100, status: "active" })

  // Mutations
  const overrideMut = useOverrideAttendanceMutation()
  const approveCorrectionMut = useApproveCorrectionMutation()
  const rejectCorrectionMut = useRejectCorrectionMutation()

  const activeEmployees = employeesData?.data || []

  // Filtered daily logs
  const filteredDailyLogs = useMemo(() => {
    return dailyLogs.filter((log) => {
      const matchesStatus = adminFilterStatus === "all" || log.status === adminFilterStatus
      const matchesSearch =
        log.employeeName.toLowerCase().includes(adminSearch.toLowerCase()) ||
        log.employeeIdCode.toLowerCase().includes(adminSearch.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [dailyLogs, adminSearch, adminFilterStatus])

  // Count summaries for daily logs
  const dailyCounts = useMemo(() => {
    const counts = { present: 0, late: 0, absent: 0, leave: 0, holiday: 0, weekend: 0 }
    for (const log of dailyLogs) {
      if (log.status in counts) {
        counts[log.status as keyof typeof counts]++
      }
    }
    return counts
  }, [dailyLogs])

  const handleOpenOverride = (log?: DailyAttendanceLog) => {
    if (log) {
      // Edit mode
      setOverrideEmployeeId(log.employeeId)
      setOverrideDate(log.date)
      setOverrideStatus(log.status)
      setOverrideCheckIn(convert12to24(log.checkIn) || "09:00")
      setOverrideCheckOut(convert12to24(log.checkOut) || "18:00")
      setOverrideNotes(log.notes || "")
    } else {
      // New override mode
      setOverrideEmployeeId("")
      setOverrideDate(selectedDate)
      setOverrideStatus("present")
      setOverrideCheckIn("09:00")
      setOverrideCheckOut("18:00")
      setOverrideNotes("")
    }
    setIsOverrideDialogOpen(true)
  }

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!overrideEmployeeId) {
      toast.error("Please select an employee")
      return
    }

    const payload = {
      employeeId: overrideEmployeeId,
      date: overrideDate,
      status: overrideStatus,
      checkIn: (overrideStatus === "present" || overrideStatus === "late") ? convert24to12(overrideCheckIn) : undefined,
      checkOut: (overrideStatus === "present" || overrideStatus === "late") ? convert24to12(overrideCheckOut) : undefined,
      notes: overrideNotes || undefined,
    }

    try {
      await overrideMut.mutateAsync(payload)
      toast.success("Attendance entry updated successfully")
      setIsOverrideDialogOpen(false)
      refetchDaily()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || error.message || "Failed to update attendance")
    }
  }

  const handleApproveCorrection = async (id: string, name: string, date: string) => {
    try {
      await approveCorrectionMut.mutateAsync(id)
      toast.success(`Approved correction for ${name} on ${date}`)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || error.message || "Approval failed")
    }
  }

  const handleRejectCorrection = async (id: string, name: string, date: string) => {
    try {
      await rejectCorrectionMut.mutateAsync(id)
      toast.success(`Rejected correction for ${name} on ${date}`)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || error.message || "Rejection failed")
    }
  }

  // ─── Render My Attendance Section (Extracted standard logic) ────────────────
  const renderMyAttendance = () => (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
        <div>
          <h3 className="text-xl font-bold tracking-tight">My Visual Schedule</h3>
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
                      {record.correctionStatus === "pending" && (
                        <div className="text-[8px] font-bold text-amber-500 uppercase tracking-tight truncate leading-none mt-1">
                          Pending Correct
                        </div>
                      )}
                      {record.correctionStatus === "approved" && (
                        <div className="text-[8px] font-bold text-emerald-500 uppercase tracking-tight truncate leading-none mt-1">
                          Corrected
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
                      {log.correctionStatus === "pending" ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                          Pending Approval
                        </Badge>
                      ) : log.correctionStatus === "approved" ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                          Corrected
                        </Badge>
                      ) : (
                        (log.status !== "upcoming" && log.status !== "weekend" && log.status !== "holiday") && (
                          <div className="flex flex-col items-end gap-1">
                            {log.correctionStatus === "rejected" && (
                              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px] mb-1">
                                Rejected
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRequestCorrection(log)}
                              className="h-7 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg px-2.5"
                            >
                              {log.correctionStatus === "rejected" ? "Re-submit" : "Correct"}
                            </Button>
                          </div>
                        )
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

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {isAdminOrHR ? (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Attendance Management
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Track personal logs and oversee company-wide workforce attendance
              </p>
            </div>
            <TabsList className="grid w-full sm:w-[380px] grid-cols-2 shadow-none border border-border/40 bg-muted/20 rounded-xl">
              <TabsTrigger value="my-attendance" className="text-xs font-semibold rounded-lg">My Attendance</TabsTrigger>
              <TabsTrigger value="employee-attendance" className="text-xs font-semibold rounded-lg">Employee Attendance</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="my-attendance" className="space-y-6 outline-none">
            {isLoading ? (
              <div className="flex h-[400px] items-center justify-center">
                <Spinner className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : (
              renderMyAttendance()
            )}
          </TabsContent>

          <TabsContent value="employee-attendance" className="space-y-6 outline-none">
            {/* ─── Employee Attendance Summary Cards ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Present</span>
                <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">{dailyCounts.present}</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Late</span>
                <p className="text-xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">{dailyCounts.late}</p>
              </div>
              <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Absent</span>
                <p className="text-xl font-extrabold text-red-700 dark:text-red-300 mt-1">{dailyCounts.absent}</p>
              </div>
              <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/10 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Leave</span>
                <p className="text-xl font-extrabold text-sky-700 dark:text-sky-300 mt-1">{dailyCounts.leave}</p>
              </div>
              <div className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Holiday / Off</span>
                <p className="text-xl font-extrabold text-violet-700 dark:text-violet-300 mt-1">{dailyCounts.holiday + dailyCounts.weekend}</p>
              </div>
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Corrections</span>
                <p className="text-xl font-extrabold text-primary mt-1">{pendingCorrections.length}</p>
              </div>
            </div>

            {/* ─── Admin Sub-tabs ─── */}
            <div className="flex items-center justify-between border-b border-border/20 pb-2">
              <div className="flex gap-4 text-xs font-bold">
                <button
                  onClick={() => setAdminSubTab("logs")}
                  className={`pb-2 transition-colors relative ${
                    adminSubTab === "logs" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Workforce Daily Logs
                </button>
                <button
                  onClick={() => setAdminSubTab("corrections")}
                  className={`pb-2 transition-colors relative ${
                    adminSubTab === "corrections" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Pending Corrections ({pendingCorrections.length})
                </button>
              </div>
            </div>

            {adminSubTab === "logs" && (
              <div className="space-y-6">
                {/* ─── Controls ─── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10 p-4 rounded-2xl border border-border/40">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Select Date</label>
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="h-9 w-40 rounded-xl bg-card border-border/40 text-xs font-semibold"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Status Filter</label>
                      <select
                        value={adminFilterStatus}
                        onChange={(e) => setAdminFilterStatus(e.target.value)}
                        className="h-9 w-36 rounded-xl border border-border/40 bg-card text-xs px-2.5 font-semibold focus:outline-none cursor-pointer text-foreground"
                      >
                        <option value="all">All Statuses</option>
                        <option value="present">Present</option>
                        <option value="late">Late</option>
                        <option value="absent">Absent</option>
                        <option value="leave">Leave</option>
                        <option value="holiday">Holiday</option>
                        <option value="weekend">Weekend</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Search Employee</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Search by name or ID..."
                          value={adminSearch}
                          onChange={(e) => setAdminSearch(e.target.value)}
                          className="pl-9 h-9 w-48 rounded-xl bg-card border-border/40 text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleOpenOverride()}
                    className="h-9 gap-1.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 text-xs mt-auto self-end sm:self-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Manual Entry
                  </Button>
                </div>

                {/* ─── Daily Logs Table ─── */}
                <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold">Daily Workforce Logs</h3>
                      <p className="text-[11px] text-muted-foreground">List of employee check-ins, check-outs, and hours logged</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-muted/20 border-border/30">
                      {filteredDailyLogs.length} total entries
                    </Badge>
                  </div>
                  <div className="overflow-x-auto">
                    {isLoadingDaily ? (
                      <div className="flex justify-center items-center py-12">
                        <Spinner className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border/20 bg-muted/20 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            <th className="py-3.5 px-5">Employee</th>
                            <th className="py-3.5 px-5">ID Code</th>
                            <th className="py-3.5 px-5">Check In</th>
                            <th className="py-3.5 px-5">Check Out</th>
                            <th className="py-3.5 px-5">Logged Hours</th>
                            <th className="py-3.5 px-5">Status</th>
                            <th className="py-3.5 px-5">Notes</th>
                            <th className="py-3.5 px-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDailyLogs.length > 0 ? (
                            filteredDailyLogs.map((log) => (
                              <tr key={log.id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                                <td className="py-3.5 px-5 font-semibold text-foreground">{log.employeeName}</td>
                                <td className="py-3.5 px-5 text-muted-foreground">{log.employeeIdCode}</td>
                                <td className="py-3.5 px-5">
                                  {log.checkIn ? <span className="font-semibold text-emerald-600 dark:text-emerald-400">{log.checkIn}</span> : <span className="text-muted-foreground/30">—</span>}
                                </td>
                                <td className="py-3.5 px-5">
                                  {log.checkOut ? <span className="font-semibold text-amber-600 dark:text-amber-400">{log.checkOut}</span> : <span className="text-muted-foreground/30">—</span>}
                                </td>
                                <td className="py-3.5 px-5 font-bold">{log.hours ? `${log.hours} hrs` : <span className="text-muted-foreground/30">—</span>}</td>
                                <td className="py-3.5 px-5">
                                  <Badge
                                    className={`text-[9px] font-bold capitalize border-none px-2 py-0.5 ${
                                      log.status === "present"
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                                        : log.status === "late"
                                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                                          : log.status === "absent"
                                            ? "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                                            : log.status === "leave"
                                              ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
                                              : log.status === "holiday"
                                                ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
                                                : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {log.status}
                                  </Badge>
                                </td>
                                <td className="py-3.5 px-5 text-muted-foreground italic max-w-[160px] truncate">{log.notes || "—"}</td>
                                <td className="py-3.5 px-5 text-right">
                                  <Button variant="ghost" size="sm" onClick={() => handleOpenOverride(log)} className="h-7 text-[10px] font-semibold text-primary hover:text-primary/95 hover:bg-primary/5 rounded-lg px-2.5">
                                    Override
                                  </Button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-muted-foreground">
                                No attendance records found for this date.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {adminSubTab === "corrections" && (
              <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold">Pending Attendance Corrections</h3>
                    <p className="text-[11px] text-muted-foreground">Approve or reject employee requests for checking in/out corrections</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-none text-[10px]">
                    {pendingCorrections.length} pending
                  </Badge>
                </div>
                <div className="overflow-x-auto">
                  {isLoadingCorrections ? (
                    <div className="flex justify-center items-center py-12">
                      <Spinner className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/20 bg-muted/20 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <th className="py-3.5 px-5">Employee</th>
                          <th className="py-3.5 px-5">Date</th>
                          <th className="py-3.5 px-5">Current Log</th>
                          <th className="py-3.5 px-5">Proposed Correction</th>
                          <th className="py-3.5 px-5">Reason</th>
                          <th className="py-3.5 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingCorrections.length > 0 ? (
                          pendingCorrections.map((corr) => (
                            <tr key={corr.id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                              <td className="py-3.5 px-5">
                                <div className="font-semibold text-foreground">{corr.employeeName}</div>
                                <div className="text-[10px] text-muted-foreground">{corr.employeeIdCode}</div>
                              </td>
                              <td className="py-3.5 px-5 font-semibold text-foreground">{corr.date}</td>
                              <td className="py-3.5 px-5">
                                <div className="text-muted-foreground">In: {corr.checkIn || "—"}</div>
                                <div className="text-muted-foreground">Out: {corr.checkOut || "—"}</div>
                              </td>
                              <td className="py-3.5 px-5">
                                <div className="font-semibold text-emerald-600 dark:text-emerald-400">In: {corr.proposedCheckIn}</div>
                                <div className="font-semibold text-amber-600 dark:text-amber-400">Out: {corr.proposedCheckOut}</div>
                              </td>
                              <td className="py-3.5 px-5 max-w-xs truncate text-muted-foreground" title={corr.correctionReason}>
                                {corr.correctionReason}
                              </td>
                              <td className="py-3.5 px-5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleApproveCorrection(corr.id, corr.employeeName, corr.date)}
                                    className="h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-600 rounded-lg text-muted-foreground"
                                    title="Approve"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleRejectCorrection(corr.id, corr.employeeName, corr.date)}
                                    className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-muted-foreground"
                                    title="Reject"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-muted-foreground">
                              No pending correction requests.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        isLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <Spinner className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : (
          renderMyAttendance()
        )
      )}

      {/* ─── Correction Dialog Modal ─── */}
      <Dialog open={isCorrectionDialogOpen} onOpenChange={setIsCorrectionDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-border/40 bg-card p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/85">
              Request Attendance Correction
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Request changes for your attendance log on <span className="font-semibold text-foreground">{correctionRecord?.dateStr}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCorrectionSubmit} className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="proposedCheckIn" className="text-xs font-semibold text-foreground/80">
                Proposed Check-In Time
              </Label>
              <Input
                id="proposedCheckIn"
                type="time"
                value={proposedCheckIn}
                onChange={(e) => setProposedCheckIn(e.target.value)}
                className="rounded-xl border-border/40 bg-muted/20 focus-visible:ring-primary/20 h-10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proposedCheckOut" className="text-xs font-semibold text-foreground/80">
                Proposed Check-Out Time
              </Label>
              <Input
                id="proposedCheckOut"
                type="time"
                value={proposedCheckOut}
                onChange={(e) => setProposedCheckOut(e.target.value)}
                className="rounded-xl border-border/40 bg-muted/20 focus-visible:ring-primary/20 h-10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="correctionReason" className="text-xs font-semibold text-foreground/80">
                Reason for Correction
              </Label>
              <Textarea
                id="correctionReason"
                placeholder="Please explain why you are requesting this correction (e.g. forgot to check in, system issue)..."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="rounded-xl border-border/40 bg-muted/20 focus-visible:ring-primary/20 min-h-[90px]"
                required
              />
            </div>

            <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2 border-t border-border/10 -mx-6 -mb-6 bg-muted/30 p-4 rounded-b-2xl">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCorrectionDialogOpen(false)}
                className="rounded-xl border-border/40 hover:bg-muted/50 h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitCorrectionMut.isPending}
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20 h-10 font-semibold"
              >
                {submitCorrectionMut.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4 text-primary-foreground" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Admin Manual Override Dialog Modal ─── */}
      <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-border/40 bg-card p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Attendance Manual Override
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Directly override or add an attendance log for an employee.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleOverrideSubmit} className="space-y-4 py-3">
            {/* Employee Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Employee</Label>
              <select
                value={overrideEmployeeId}
                onChange={(e) => setOverrideEmployeeId(e.target.value)}
                className="w-full h-10 rounded-xl border border-border/40 bg-muted/20 text-xs px-3 focus:outline-none cursor-pointer text-foreground"
                required
              >
                <option value="">-- Choose Employee --</option>
                {activeEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullNameEnglish} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Date</Label>
              <Input
                type="date"
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
                className="rounded-xl border-border/40 bg-muted/20 h-10 text-xs"
                required
              />
            </div>

            {/* Status Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Attendance Status</Label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value)}
                className="w-full h-10 rounded-xl border border-border/40 bg-muted/20 text-xs px-3 focus:outline-none cursor-pointer text-foreground"
                required
              >
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="leave">Leave</option>
                <option value="holiday">Holiday</option>
                <option value="weekend">Weekend</option>
              </select>
            </div>

            {/* Times (only if Present or Late) */}
            {(overrideStatus === "present" || overrideStatus === "late") && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase">Check-In</Label>
                  <Input
                    type="time"
                    value={overrideCheckIn}
                    onChange={(e) => setOverrideCheckIn(e.target.value)}
                    className="rounded-xl border-border/40 bg-muted/20 h-10 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase">Check-Out</Label>
                  <Input
                    type="time"
                    value={overrideCheckOut}
                    onChange={(e) => setOverrideCheckOut(e.target.value)}
                    className="rounded-xl border-border/40 bg-muted/20 h-10 text-xs"
                    required
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Override Reason / Notes</Label>
              <Textarea
                placeholder="e.g. Card reader failure, field duty, manual override..."
                value={overrideNotes}
                onChange={(e) => setOverrideNotes(e.target.value)}
                className="rounded-xl border-border/40 bg-muted/20 min-h-[70px] text-xs"
              />
            </div>

            <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2 border-t border-border/10 -mx-6 -mb-6 bg-muted/30 p-4 rounded-b-2xl">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOverrideDialogOpen(false)}
                className="rounded-xl border-border/40 hover:bg-muted/50 h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={overrideMut.isPending}
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20 h-10 font-semibold"
              >
                {overrideMut.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4 text-primary-foreground animate-spin animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
