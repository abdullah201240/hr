import { useState, useEffect, useMemo, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AttendanceCalendar } from "@/components/dashboard/attendance-calendar"
import { ApplyLeaveDialog } from "@/components/dashboard/apply-leave-dialog"
import { DayDetailDialog } from "@/components/dashboard/day-detail-dialog"
import type {
  AttendanceRecord as DashAttendanceRecord,
} from "@/components/dashboard/types"
import {
  DEFAULT_LEAVE_BALANCES,
  resolveLeaveIcon,
} from "@/components/dashboard/types"
import Swal from "sweetalert2"
import { useAttendanceSettingsQuery, useHolidaysQuery } from "@/hooks/useAttendanceSettings"
import {
  useLeaveApplicationsQuery,
  useLeaveBalancesQuery,
  useApplyLeaveMutation,
  useCancelLeaveMutation,
} from "@/hooks/useLeaveApplications"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MapPin,
  Laptop,
  Search,
  BarChart3,
  CalendarDays,
  Info,
  Check,
  X,
  Plus,
  Clock,
  CalendarCheck,
  CalendarX,
  Palmtree,
  Users,
  FileWarning,
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
  type DailyAttendanceLog
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
  hour = hour ? hour : 12
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

  const todayDate = new Date()
  const [calMonth, setCalMonth] = useState(todayDate.getMonth())
  const [calYear, setCalYear] = useState(todayDate.getFullYear())
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(todayDate.getDate())

  // ── Dialog State ───────────────────────────────────────────────────────────
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  const [dragOverDay, setDragOverDay] = useState<number | null>(null)

  // ── Leave Applications & Balances (Dynamic from API) ───────────────────────
  const { data: leaveApplicationsData } = useLeaveApplicationsQuery({
    employeeId: user?.id,
    limit: 100,
  })
  const leaveApplications = leaveApplicationsData?.data || []

  const { data: dbBalances = [] } = useLeaveBalancesQuery(calYear)

  const balances = useMemo(() => {
    const normalized = dbBalances && dbBalances.length > 0
      ? dbBalances.map(b => ({
          id: b.id,
          key: b.key,
          label: b.label,
          total: b.total,
          used: b.used,
          color: b.color || "bg-sky-500",
          icon: b.icon || "coffee",
          requiresDocument: b.requiresDocument
        }))
      : DEFAULT_LEAVE_BALANCES.map(db => ({
          id: db.key,
          key: db.key,
          label: db.label,
          total: db.total,
          used: db.used,
          color: db.color,
          icon: db.key,
          requiresDocument: false
        }))

    return normalized.map(item => {
      const resolvedIcon = resolveLeaveIcon(item.icon)

      return {
        id: item.id,
        label: item.label,
        used: item.used,
        total: item.total,
        color: item.color,
        light: item.color.replace("bg-", "text-"),
        icon: resolvedIcon,
        key: item.key,
        requiresDocument: item.requiresDocument
      }
    })
  }, [dbBalances])

  // ── Holiday Settings (Dynamic from API) ────────────────────────────────────
  const { data: settings } = useAttendanceSettingsQuery()
  const { data: holidaysData = [] } = useHolidaysQuery()
  const [weeklyHolidays, setWeeklyHolidays] = useState<string[]>(["Saturday", "Sunday"])

  const regularHolidays = useMemo(() => {
    if (holidaysData && holidaysData.length > 0) {
      return holidaysData.map((h: any) => ({
        id: h.id,
        name: h.name,
        startDate: h.startDate,
        endDate: h.endDate,
        startDay: h.startDate ? new Date(h.startDate).getDate() : 1,
        endDay: h.endDate ? new Date(h.endDate).getDate() : 1
      }))
    }
    const savedRegular = localStorage.getItem("hr_regular_holidays")
    if (savedRegular) {
      try { return JSON.parse(savedRegular) } catch (e) { console.error(e) }
    }
    return [
      { id: "default-1", name: "National Holiday - Independence Celebration", startDay: 18, endDay: 18 }
    ]
  }, [holidaysData])

  useEffect(() => {
    if (settings?.weeklyHolidays) {
      setWeeklyHolidays(settings.weeklyHolidays)
    } else {
      const savedWeekly = localStorage.getItem("hr_weekly_holidays")
      if (savedWeekly) {
        try { setWeeklyHolidays(JSON.parse(savedWeekly)) } catch (e) { console.error(e) }
      }
    }
  }, [settings])

  // Apply leave, cancel leave handlers
  const applyLeaveMutation = useApplyLeaveMutation()
  const cancelLeaveMutation = useCancelLeaveMutation()

  const handleApplyLeave = (data: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
    attachments: any[];
  }) => {
    applyLeaveMutation.mutate(
      {
        leaveTypeId: data.leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        attachments: data.attachments,
      },
      {
        onSuccess: () => {
          setIsLeaveDialogOpen(false)
          Swal.fire({
            title: "Applied!",
            text: "Your leave application has been submitted successfully.",
            icon: "success",
            confirmButtonText: "Ok",
          })
        },
        onError: (err: any) => {
          Swal.fire({
            title: "Failed to Apply",
            text: err?.response?.data?.message || err?.message || "Something went wrong.",
            icon: "error",
            confirmButtonText: "Ok",
          })
        },
      }
    )
  }

  const handleCancelLeaveById = (id: string) => {
    Swal.fire({
      title: "Cancel Leave?",
      text: "Are you sure you want to cancel this leave application?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel it",
      cancelButtonText: "No",
    }).then((result) => {
      if (result.isConfirmed) {
        cancelLeaveMutation.mutate(id, {
          onSuccess: () => {
            Swal.fire({
              title: "Cancelled!",
              text: "Leave application cancelled.",
              icon: "info",
            })
          },
          onError: (err: any) => {
            Swal.fire({
              title: "Cancel Failed",
              text: err?.response?.data?.message || err?.message || "Something went wrong.",
              icon: "error",
            })
          }
        })
      }
    })
  }

  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const { data: attendanceRecords = [], isLoading } = useMyAttendanceQuery(
    calYear,
    calMonth
  )

  const viewMonth = useMemo(() => new Date(calYear, calMonth, 1), [calYear, calMonth])

  // Map API leave applications to format expected by internal components
  const mappedLeaveApplications = useMemo(() => {
    return leaveApplications.map((la) => {
      const start = new Date(la.startDate)
      const end = new Date(la.endDate)
      return {
        id: la.id,
        startDay: start.getFullYear() === calYear && start.getMonth() === calMonth ? start.getDate() : 1,
        endDay: end.getFullYear() === calYear && end.getMonth() === calMonth ? end.getDate() : 31,
        leaveType: la.leaveTypeName.toLowerCase().replace(" leave", "").replace(" ", ""),
        reason: la.reason,
        attachments: la.attachments,
        status: la.status,
      }
    })
  }, [leaveApplications, calYear, calMonth])

  // Computed final attendance matching dashboard logic
  const finalAttendance = useMemo(() => attendanceRecords.map((record): DashAttendanceRecord => {
    const matchingLeave = mappedLeaveApplications.find(la => record.day >= la.startDay && record.day <= la.endDay)
    if (matchingLeave) {
      const selectedTypeObj = balances.find(b => b.key === matchingLeave.leaveType)
      const typeLabel = selectedTypeObj?.label || "Leave"
      return {
        ...record,
        status: "leave" as const,
        notes: `${matchingLeave.status} ${typeLabel}: ${matchingLeave.reason}`,
        attachments: matchingLeave.attachments as any,
        breakHours: record.breakHours || 0
      }
    }

    if (record.status === "upcoming") return { ...record, breakHours: record.breakHours || 0 }

    const matchingRegularHoliday = regularHolidays.find((h: any) => {
      if (h.startDate && h.endDate) {
        const recordDate = new Date(calYear, calMonth, record.day)
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
      return { ...record, status: "holiday" as const, notes: matchingRegularHoliday.name, checkIn: null, checkOut: null, hours: null, breakHours: record.breakHours || 0 }
    }

    const isWeeklyHoliday = weeklyHolidays.includes(record.dayName)
    if (isWeeklyHoliday) {
      if (!record.checkIn) {
        return { ...record, status: "weekend" as const, checkIn: null, checkOut: null, hours: null, breakHours: record.breakHours || 0 }
      }
    } else {
      if (!record.checkIn && record.status !== "leave" && record.status !== "weekend" && record.status !== "holiday") {
        return { ...record, status: "absent" as const, breakHours: record.breakHours || 0 }
      }
    }

    return { ...record, breakHours: record.breakHours || 0 }
  }), [attendanceRecords, leaveApplications, balances, regularHolidays, weeklyHolidays, calYear, calMonth])

  // Selected Day Record
  const selectedRecord = useMemo(
    () => finalAttendance.find(d => d.day === selectedDayNumber),
    [finalAttendance, selectedDayNumber]
  )

  // Link selectedDay for historical reasons (like table highlighting)
  const selectedDay = useMemo(() => {
    const rec = finalAttendance.find(d => d.day === selectedDayNumber)
    return (rec as unknown as AttendanceRecord) || null
  }, [finalAttendance, selectedDayNumber])

  const setSelectedDay = useCallback((record: AttendanceRecord | null) => {
    if (record) {
      setSelectedDayNumber(record.day)
    }
  }, [])


  const filteredLogs = useMemo(() => attendanceRecords.filter((log) => {
    if (log.status === "upcoming") return false
    const matchesStatus = filterStatus === "all" || log.status === filterStatus
    const matchesSearch =
      log.dayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.dateStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.location && log.location.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesStatus && matchesSearch
  }), [attendanceRecords, filterStatus, searchQuery])

  const chartData = useMemo(() => attendanceRecords
    .filter((d) => (d.status === "present" || d.status === "late") && d.hours)
    .map((d) => ({
      name: d.dateStr,
      Hours: d.hours,
      Target: 8,
    })), [attendanceRecords])

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
  const { data: employeesData } = useEmployeesQuery({ page: 1, limit: 100, status: "active" }, { enabled: isAdminOrHR })

  // Mutations
  const overrideMut = useOverrideAttendanceMutation()
  const approveCorrectionMut = useApproveCorrectionMutation()
  const rejectCorrectionMut = useRejectCorrectionMutation()

  const activeEmployees = employeesData?.data || []

  const filteredDailyLogs = useMemo(() => {
    return dailyLogs.filter((log) => {
      const matchesStatus = adminFilterStatus === "all" || log.status === adminFilterStatus
      const matchesSearch =
        log.employeeName.toLowerCase().includes(adminSearch.toLowerCase()) ||
        log.employeeIdCode.toLowerCase().includes(adminSearch.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [dailyLogs, adminSearch, adminFilterStatus])

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
      setOverrideEmployeeId(log.employeeId)
      setOverrideDate(log.date)
      setOverrideStatus(log.status)
      setOverrideCheckIn(convert12to24(log.checkIn) || "09:00")
      setOverrideCheckOut(convert12to24(log.checkOut) || "18:00")
      setOverrideNotes(log.notes || "")
    } else {
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

  // ─── Render My Attendance Section ──────────────────────────────────────────
  const renderMyAttendance = () => (
    <div className="space-y-6">
      {/* ─── Interactive Calendar ─── */}
      <AttendanceCalendar
        calMonth={calMonth}
        calYear={calYear}
        onMonthChange={(month, year) => {
          setCalMonth(month)
          setCalYear(year)
        }}
        currentTime={todayDate}
        selectedDayNumber={selectedDayNumber}
        onSelectDay={setSelectedDayNumber}
        onOpenDayDetail={() => setIsDayDetailOpen(true)}
        onOpenLeaveDialog={(day) => {
          setSelectedDayNumber(day)
          setIsLeaveDialogOpen(true)
        }}
        finalAttendance={finalAttendance}
        leaveApplications={mappedLeaveApplications as any}
        balances={balances}
        dragOverDay={dragOverDay}
        onDragOver={setDragOverDay}
        onCancelLeave={handleCancelLeaveById}
      />

      {/* ─── Hours Chart ─── */}
      <Card className="shadow-none border-border/40">
        <CardContent className="p-4 pt-5">
          <div className="pb-4 flex flex-row items-center justify-between">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Active Working Hours Trend
              </h3>
              <p className="text-xs text-muted-foreground">Hours logged per day against the standard 8-hour target.</p>
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} domain={[0, 12]} />
                  <RechartsTooltip content={<ChartTooltipContent />} cursor={{ fill: "hsl(var(--muted) / 0.2)" }} />
                  <ReferenceLine y={8} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Target: 8h", position: "top", fill: "#ef4444", fontSize: 10 }} />
                  <Bar dataKey="Hours" fill="url(#colorHours)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ChartContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              No working hours data available for this month yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Attendance History Table ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-transparent border-border/60 hover:border-border transition-colors text-xs h-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 text-xs h-9 bg-transparent border-border/60">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="leave">Leave</SelectItem>
              <SelectItem value="holiday">Holiday</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="shadow-none border-border/40">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/30">
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="font-semibold text-xs text-muted-foreground">Date</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Day</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Check In</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Check Out</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Logged Hours</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Location</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground text-right w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr
                        key={log.day}
                        className={`border-b border-border/20 hover:bg-muted/10 transition-colors cursor-pointer ${selectedDay?.day === log.day ? "bg-muted/20" : ""}`}
                        onClick={() => setSelectedDay(log)}
                      >
                        <TableCell className="py-3 font-semibold">{log.dateStr}</TableCell>
                        <TableCell className="py-3 text-muted-foreground">{log.dayName}</TableCell>
                        <TableCell className="py-3">
                          {log.checkIn ? (
                            <span className="font-medium">{log.checkIn}</span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          {log.checkOut ? (
                            <span className="font-medium">{log.checkOut}</span>
                          ) : log.checkIn ? (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">Active</Badge>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 font-semibold">
                          {log.hours ? `${log.hours} hrs` : <span className="text-muted-foreground/40">—</span>}
                        </TableCell>
                        <TableCell className="py-3">
                          {log.location ? (
                            <span className="flex items-center gap-1 text-xs">
                              {log.location === "Remote" ? <Laptop className="h-3 w-3 text-muted-foreground" /> : <MapPin className="h-3 w-3 text-muted-foreground" />}
                              {log.location}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge className={`text-[9px] font-bold capitalize border-none ${
                            log.status === "present" ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10"
                              : log.status === "late" ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/10"
                              : log.status === "absent" ? "bg-red-500/10 text-red-500 hover:bg-red-500/10"
                              : log.status === "leave" ? "bg-sky-500/10 text-sky-500 hover:bg-sky-500/10"
                              : log.status === "holiday" ? "bg-violet-500/10 text-violet-500 hover:bg-violet-500/10"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          {log.correctionStatus === "pending" ? (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">Pending</Badge>
                          ) : log.correctionStatus === "approved" ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Corrected</Badge>
                          ) : (
                            (log.status !== "upcoming" && log.status !== "weekend" && log.status !== "holiday") && (
                              <div className="flex items-center justify-end gap-1">
                                {log.correctionStatus === "rejected" && (
                                  <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px]">Rejected</Badge>
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
                        </TableCell>
                      </tr>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                        No logs found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {isAdminOrHR ? (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
         

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
            {/* ─── KPI Cards ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Present</span>
                  <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">{dailyCounts.present}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CalendarCheck className="h-5 w-5" />
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Late</span>
                  <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{dailyCounts.late}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Absent</span>
                  <p className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-500">{dailyCounts.absent}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
                  <CalendarX className="h-5 w-5" />
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leave</span>
                  <p className="text-3xl font-bold tracking-tight text-sky-600 dark:text-sky-500">{dailyCounts.leave}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                  <Palmtree className="h-5 w-5" />
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Holiday / Off</span>
                  <p className="text-3xl font-bold tracking-tight text-violet-600 dark:text-violet-500">{dailyCounts.holiday + dailyCounts.weekend}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5" />
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Corrections</span>
                  <p className="text-3xl font-bold tracking-tight text-primary">{pendingCorrections.length}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileWarning className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* ─── Admin Sub-tabs ─── */}
            <Tabs value={adminSubTab} onValueChange={(v) => setAdminSubTab(v as "logs" | "corrections")} className="space-y-4">
              <TabsList className="grid w-full sm:w-[400px] grid-cols-2 shadow-none border border-border/40 bg-muted/20 rounded-xl">
                <TabsTrigger value="logs" className="text-xs font-semibold rounded-lg">Workforce Daily Logs</TabsTrigger>
                <TabsTrigger value="corrections" className="text-xs font-semibold rounded-lg">Pending Corrections ({pendingCorrections.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="logs" className="space-y-4 outline-none">
                {/* ─── Controls ─── */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Select Date</label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="h-9 w-44 bg-transparent border-border/60 text-xs font-semibold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Status Filter</label>
                    <Select value={adminFilterStatus} onValueChange={setAdminFilterStatus}>
                      <SelectTrigger className="w-36 h-9 bg-transparent border-border/60 text-xs">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="late">Late</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="leave">Leave</SelectItem>
                        <SelectItem value="holiday">Holiday</SelectItem>
                        <SelectItem value="weekend">Weekend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Search Employee</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or ID..."
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        className="pl-9 h-9 bg-transparent border-border/60 text-xs font-semibold"
                      />
                    </div>
                  </div>
                  <Button onClick={() => handleOpenOverride()} className="h-9 gap-1.5 text-xs font-semibold">
                    <Plus className="h-4 w-4" />
                    Manual Entry
                  </Button>
                </div>

                {/* ─── Daily Logs Table ─── */}
                <Card className="shadow-none border-border/40">
                  <CardContent className="p-0">
                    <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold">Daily Workforce Logs</h3>
                        <p className="text-[11px] text-muted-foreground">Employee check-ins, check-outs, and hours logged</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-muted/20 border-border/30">{filteredDailyLogs.length} entries</Badge>
                    </div>
                    <div className="overflow-x-auto">
                      {isLoadingDaily ? (
                        <div className="flex justify-center items-center py-12">
                          <Spinner className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        <Table>
                          <TableHeader className="bg-muted/10 border-b border-border/30">
                            <TableRow className="border-b-0 hover:bg-transparent">
                              <TableHead className="font-semibold text-xs text-muted-foreground">Employee</TableHead>
                              <TableHead className="font-semibold text-xs text-muted-foreground">ID Code</TableHead>
                              <TableHead className="font-semibold text-xs text-muted-foreground">Check In</TableHead>
                              <TableHead className="font-semibold text-xs text-muted-foreground">Check Out</TableHead>
                              <TableHead className="font-semibold text-xs text-muted-foreground">Logged Hours</TableHead>
                              <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                              <TableHead className="font-semibold text-xs text-muted-foreground">Notes</TableHead>
                              <TableHead className="font-semibold text-xs text-muted-foreground text-right w-24">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredDailyLogs.length > 0 ? (
                              filteredDailyLogs.map((log) => (
                                <TableRow key={log.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                                  <TableCell className="py-3 font-semibold">{log.employeeName}</TableCell>
                                  <TableCell className="py-3 text-muted-foreground text-xs">{log.employeeIdCode}</TableCell>
                                  <TableCell className="py-3">
                                    {log.checkIn ? <span className="font-semibold text-emerald-600 dark:text-emerald-400">{log.checkIn}</span> : <span className="text-muted-foreground/30">—</span>}
                                  </TableCell>
                                  <TableCell className="py-3">
                                    {log.checkOut ? <span className="font-semibold text-amber-600 dark:text-amber-400">{log.checkOut}</span> : <span className="text-muted-foreground/30">—</span>}
                                  </TableCell>
                                  <TableCell className="py-3 font-bold">{log.hours ? `${log.hours} hrs` : <span className="text-muted-foreground/30">—</span>}</TableCell>
                                  <TableCell className="py-3">
                                    <Badge className={`text-[9px] font-bold capitalize border-none ${
                                      log.status === "present" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                                        : log.status === "late" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                                        : log.status === "absent" ? "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                                        : log.status === "leave" ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
                                        : log.status === "holiday" ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
                                        : "bg-muted text-muted-foreground"
                                    }`}>
                                      {log.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-3 text-muted-foreground italic max-w-[160px] truncate text-xs">{log.notes || "—"}</TableCell>
                                  <TableCell className="py-3 text-right">
                                    <Button variant="ghost" size="sm" onClick={() => handleOpenOverride(log)} className="h-7 text-[10px] font-semibold text-primary hover:text-primary/95 hover:bg-primary/5 rounded-lg px-2.5">
                                      Override
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                                  <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                                  <p className="text-sm font-semibold">No attendance records found</p>
                                  <p className="text-xs text-muted-foreground/60 mt-1">Try selecting a different date</p>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="corrections" className="outline-none">
                <Card className="shadow-none border-border/40">
                  <CardContent className="p-0">
                    <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold">Pending Attendance Corrections</h3>
                        <p className="text-[11px] text-muted-foreground">Approve or reject employee correction requests</p>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-none text-[10px]">{pendingCorrections.length} pending</Badge>
                    </div>
                    <div className="overflow-x-auto">
                      {isLoadingCorrections ? (
                        <div className="flex justify-center items-center py-12">
                          <Spinner className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        <Table>
                          <TableHeader className="bg-muted/10 border-b border-border/30">
                            <TableRow className="border-b-0 hover:bg-transparent">
                              <TableHead className="font-semibold text-xs text-muted-foreground">Employee</TableHead>
                              <TableHead className="font-semibold text-xs text-muted-foreground">Date</TableHead>
                              <TableHead className="font-semibold text-xs text-muted-foreground">Current Log</TableHead>
                              <TableHead className="font-semibold text-xs text-muted-foreground">Proposed</TableHead>
                              <TableHead className="font-semibold text-xs text-muted-foreground">Reason</TableHead>
                              <TableHead className="font-semibold text-xs text-muted-foreground text-right w-24">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingCorrections.length > 0 ? (
                              pendingCorrections.map((corr) => (
                                <TableRow key={corr.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                                  <TableCell className="py-3">
                                    <div className="font-semibold">{corr.employeeName}</div>
                                    <div className="text-[10px] text-muted-foreground">{corr.employeeIdCode}</div>
                                  </TableCell>
                                  <TableCell className="py-3 font-semibold">{corr.date}</TableCell>
                                  <TableCell className="py-3">
                                    <div className="text-xs text-muted-foreground">In: {corr.checkIn || "—"}</div>
                                    <div className="text-xs text-muted-foreground">Out: {corr.checkOut || "—"}</div>
                                  </TableCell>
                                  <TableCell className="py-3">
                                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">In: {corr.proposedCheckIn}</div>
                                    <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">Out: {corr.proposedCheckOut}</div>
                                  </TableCell>
                                  <TableCell className="py-3 max-w-xs truncate text-xs text-muted-foreground" title={corr.correctionReason}>
                                    {corr.correctionReason}
                                  </TableCell>
                                  <TableCell className="py-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleApproveCorrection(corr.id, corr.employeeName, corr.date)}
                                        className="h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-600 text-muted-foreground"
                                        title="Approve"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleRejectCorrection(corr.id, corr.employeeName, corr.date)}
                                        className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground"
                                        title="Reject"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                  <FileWarning className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                                  <p className="text-sm font-semibold">No pending corrections</p>
                                  <p className="text-xs text-muted-foreground/60 mt-1">All correction requests have been processed</p>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      ) : (
        <>
          {/* ─── Non-admin Header ─── */}
          <div>
            <h2 className="text-2xl font-bold">Attendance</h2>
            <p className="text-muted-foreground">Track your daily attendance and schedule</p>
          </div>
          {isLoading ? (
            <div className="flex h-[400px] items-center justify-center">
              <Spinner className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : (
            renderMyAttendance()
          )}
        </>
      )}

      {/* ─── Correction Dialog Modal ─── */}
      <Dialog open={isCorrectionDialogOpen} onOpenChange={setIsCorrectionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Request Attendance Correction</DialogTitle>
            <DialogDescription className="text-xs">
              Request changes for your attendance log on <span className="font-semibold text-foreground">{correctionRecord?.dateStr}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCorrectionSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="proposedCheckIn" className="text-xs font-semibold">Proposed Check-In Time</Label>
              <Input
                id="proposedCheckIn"
                type="time"
                value={proposedCheckIn}
                onChange={(e) => setProposedCheckIn(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proposedCheckOut" className="text-xs font-semibold">Proposed Check-Out Time</Label>
              <Input
                id="proposedCheckOut"
                type="time"
                value={proposedCheckOut}
                onChange={(e) => setProposedCheckOut(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="correctionReason" className="text-xs font-semibold">Reason for Correction</Label>
              <Textarea
                id="correctionReason"
                placeholder="Explain why you are requesting this correction..."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="text-xs min-h-[90px] resize-none"
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsCorrectionDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitCorrectionMut.isPending}>
                {submitCorrectionMut.isPending ? (
                  <><Spinner className="mr-2 h-4 w-4 text-primary-foreground" />Submitting...</>
                ) : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Admin Manual Override Dialog Modal ─── */}
      <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Attendance Manual Override</DialogTitle>
            <DialogDescription className="text-xs">Directly override or add an attendance log for an employee.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleOverrideSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Employee</Label>
              <select
                value={overrideEmployeeId}
                onChange={(e) => setOverrideEmployeeId(e.target.value)}
                className="w-full h-10 rounded-lg border border-border/60 bg-transparent text-xs px-3 focus:outline-none cursor-pointer"
                required
              >
                <option value="">-- Choose Employee --</option>
                {activeEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.fullNameEnglish} ({emp.employeeId})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Date</Label>
              <Input
                type="date"
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Attendance Status</Label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value)}
                className="w-full h-10 rounded-lg border border-border/60 bg-transparent text-xs px-3 focus:outline-none cursor-pointer"
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

            {(overrideStatus === "present" || overrideStatus === "late") && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase font-semibold">Check-In</Label>
                  <Input
                    type="time"
                    value={overrideCheckIn}
                    onChange={(e) => setOverrideCheckIn(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase font-semibold">Check-Out</Label>
                  <Input
                    type="time"
                    value={overrideCheckOut}
                    onChange={(e) => setOverrideCheckOut(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Override Reason / Notes</Label>
              <Textarea
                placeholder="e.g. Card reader failure, field duty, manual override..."
                value={overrideNotes}
                onChange={(e) => setOverrideNotes(e.target.value)}
                className="text-xs min-h-[70px] resize-none"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsOverrideDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={overrideMut.isPending}>
                {overrideMut.isPending ? (
                  <><Spinner className="mr-2 h-4 w-4 text-primary-foreground animate-spin" />Saving...</>
                ) : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Apply Leave Dialog ─── */}
      <ApplyLeaveDialog
        open={isLeaveDialogOpen}
        onOpenChange={setIsLeaveDialogOpen}
        selectedDate={`${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(selectedDayNumber).padStart(2, "0")}`}
        balances={balances}
        onSubmit={handleApplyLeave}
      />

      {/* ─── Day Detail Dialog ─── */}
      <DayDetailDialog
        open={isDayDetailOpen}
        onOpenChange={setIsDayDetailOpen}
        selectedDayNumber={selectedDayNumber}
        record={selectedRecord}
        leaveApplications={mappedLeaveApplications as any}
        balances={balances}
        onCancelLeave={handleCancelLeaveById}
        onApplyLeave={() => setIsLeaveDialogOpen(true)}
      />
    </div>
  )
}
