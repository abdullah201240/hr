import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Search,
  Plus,
  Clock,
  CalendarCheck,
  CalendarX,
  Palmtree,
  CalendarDays,
  Users,
  Download,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { format } from "date-fns"
import {
  useRangeAttendanceQuery,
  useOverrideAttendanceMutation,
  type DailyAttendanceLog,
} from "@/hooks/useAttendance"
import { useEmployeesQuery } from "@/hooks/useEmployees"
import { useDepartmentOptionsQuery } from "@/hooks/useDepartments"
import { toast } from "sonner"

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

export default function CompanyAttendancePage() {
  const [filterMode, setFilterMode] = useState<"day" | "month" | "year" | "range">("day")
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth()) // 0-11
  const [customStartDate, setCustomStartDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [customEndDate, setCustomEndDate] = useState(() => format(new Date(), "yyyy-MM-dd"))

  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"date" | "name" | "idCode" | "status" | "hours">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Pagination states
  const [cursor, setCursor] = useState<string | null>(null)
  const [cursorHistory, setCursorHistory] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(50)

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCursor(null)
    setCursorHistory([])
    setCurrentPage(1)
  }, [
    filterMode,
    selectedDate,
    selectedYear,
    selectedMonth,
    customStartDate,
    customEndDate,
    searchQuery,
    departmentFilter,
    statusFilter,
    limit,
  ])

  // Override Dialog State
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false)
  const [overrideEmployeeId, setOverrideEmployeeId] = useState("")
  const [overrideDate, setOverrideDate] = useState("")
  const [overrideStatus, setOverrideStatus] = useState("present")
  const [overrideCheckIn, setOverrideCheckIn] = useState("09:00")
  const [overrideCheckOut, setOverrideCheckOut] = useState("18:00")
  const [overrideNotes, setOverrideNotes] = useState("")

  // Compute actual date range for API query
  const { queryStartDate, queryEndDate } = useMemo(() => {
    if (filterMode === "day") {
      return { queryStartDate: selectedDate, queryEndDate: selectedDate }
    } else if (filterMode === "month") {
      const start = format(new Date(selectedYear, selectedMonth, 1), "yyyy-MM-dd")
      const end = format(new Date(selectedYear, selectedMonth + 1, 0), "yyyy-MM-dd")
      return { queryStartDate: start, queryEndDate: end }
    } else if (filterMode === "year") {
      const start = format(new Date(selectedYear, 0, 1), "yyyy-MM-dd")
      const end = format(new Date(selectedYear, 11, 31), "yyyy-MM-dd")
      return { queryStartDate: start, queryEndDate: end }
    } else {
      return { queryStartDate: customStartDate, queryEndDate: customEndDate }
    }
  }, [filterMode, selectedDate, selectedYear, selectedMonth, customStartDate, customEndDate])

  // Queries & Mutations
  const { data: pageData, isLoading: isLoadingLogs, refetch } = useRangeAttendanceQuery(
    queryStartDate,
    queryEndDate,
    limit,
    cursor || undefined,
    departmentFilter,
    statusFilter,
    searchQuery
  )
  const dailyLogs = pageData?.data || []
  const hasNextPage = pageData?.hasNextPage || false
  const nextCursor = pageData?.nextCursor || null

  const handleNextPage = () => {
    if (nextCursor) {
      setCursorHistory([...cursorHistory, cursor || ""])
      setCursor(nextCursor)
      setCurrentPage((prev) => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (cursorHistory.length > 0) {
      const prevCursor = cursorHistory[cursorHistory.length - 1]
      setCursorHistory(cursorHistory.slice(0, -1))
      setCursor(prevCursor || null)
      setCurrentPage((prev) => prev - 1)
    }
  }

  const { data: employeesData } = useEmployeesQuery({ page: 1, limit: 100, status: "active" })
  const { data: departmentOptions = [] } = useDepartmentOptionsQuery()
  const overrideMut = useOverrideAttendanceMutation()

  const activeEmployees = employeesData?.data || []

  // Correlation map to match employee's department info
  const employeeDeptMap = useMemo(() => {
    const map = new Map<string, { departmentId: string; departmentName: string }>()
    for (const emp of activeEmployees) {
      map.set(emp.id, {
        departmentId: emp.departmentId,
        departmentName: emp.departmentName || "General",
      })
    }
    return map
  }, [activeEmployees])

  // Filtered & mapped daily logs
  const processedLogs = useMemo(() => {
    const logs = dailyLogs
      .map((log) => {
        const deptInfo = employeeDeptMap.get(log.employeeId)
        return {
          ...log,
          departmentId: deptInfo?.departmentId || "",
          departmentName: deptInfo?.departmentName || "—",
        }
      })

    // Apply Sorting
    logs.sort((a, b) => {
      let comparison = 0
      if (sortBy === "date") {
        comparison = a.date.localeCompare(b.date)
      } else if (sortBy === "name") {
        comparison = a.employeeName.localeCompare(b.employeeName)
      } else if (sortBy === "idCode") {
        comparison = a.employeeIdCode.localeCompare(b.employeeIdCode)
      } else if (sortBy === "status") {
        comparison = a.status.localeCompare(b.status)
      } else if (sortBy === "hours") {
        const hA = a.hours || 0
        const hB = b.hours || 0
        comparison = hA - hB
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    return logs
  }, [dailyLogs, employeeDeptMap, sortBy, sortOrder])

  // Computed summary counts
  const counts = useMemo(() => {
    if (pageData?.counts) {
      return pageData.counts
    }
    return { present: 0, late: 0, absent: 0, leave: 0, holiday: 0, weekend: 0 }
  }, [pageData?.counts])

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
      setOverrideDate(queryStartDate)
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
      toast.success("Attendance overridden successfully")
      setIsOverrideDialogOpen(false)
      refetch()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      toast.error(error.response?.data?.message || error.message || "Failed to override attendance")
    }
  }

  const handleExportCSV = () => {
    if (processedLogs.length === 0) {
      toast.error("No data available to export")
      return
    }
    const headers = "Date,Employee Name,Employee ID,Department,Check In,Check Out,Hours,Status,Notes\n"
    const rows = processedLogs
      .map(
        (log) =>
          `"${log.date}","${log.employeeName}","${log.employeeIdCode}","${log.departmentName}","${log.checkIn || "—"}","${
            log.checkOut || "—"
          }",${log.hours || 0},"${log.status}","${log.notes || ""}"`
      )
      .join("\n")
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `company_attendance_${queryStartDate}_to_${queryEndDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          Company Attendance
        </h2>
        <p className="text-muted-foreground">Monitor and override attendance logs for the entire workforce</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Present</span>
            <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">{counts.present}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CalendarCheck className="h-5 w-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Late</span>
            <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{counts.late}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Absent</span>
            <p className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-500">{counts.absent}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
            <CalendarX className="h-5 w-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">On Leave</span>
            <p className="text-3xl font-bold tracking-tight text-sky-600 dark:text-sky-500">{counts.leave}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
            <Palmtree className="h-5 w-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40 col-span-2 sm:col-span-1">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Holiday / Off</span>
            <p className="text-3xl font-bold tracking-tight text-violet-600 dark:text-violet-500">{counts.holiday + counts.weekend}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
            <CalendarDays className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex flex-col gap-4 bg-muted/10 p-5 border border-border/30 rounded-xl">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Filter Mode</label>
            <Select value={filterMode} onValueChange={(val: any) => setFilterMode(val)}>
              <SelectTrigger className="w-36 h-9 bg-transparent border-border/60 text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Single Day</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
                <SelectItem value="range">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filterMode === "day" && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Select Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 w-40 bg-transparent border-border/60 text-xs font-semibold"
              />
            </div>
          )}

          {filterMode === "month" && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Select Month</label>
                <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
                  <SelectTrigger className="w-32 h-9 bg-transparent border-border/60 text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, idx) => (
                      <SelectItem key={idx} value={String(idx)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Select Year</label>
                <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                  <SelectTrigger className="w-24 h-9 bg-transparent border-border/60 text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {filterMode === "year" && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Select Year</label>
              <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                <SelectTrigger className="w-28 h-9 bg-transparent border-border/60 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filterMode === "range" && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Start Date</label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-9 w-40 bg-transparent border-border/60 text-xs font-semibold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">End Date</label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-9 w-40 bg-transparent border-border/60 text-xs font-semibold"
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Department</label>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-40 h-9 bg-transparent border-border/60 text-xs font-semibold">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departmentOptions.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9 bg-transparent border-border/60 text-xs font-semibold">
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
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3 border-t border-border/20 pt-4 mt-1">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Search Employee</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-transparent border-border/60 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Sorting Options */}
          <div className="flex gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Sort By</label>
              <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                <SelectTrigger className="w-36 h-9 bg-transparent border-border/60 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterMode !== "day" && <SelectItem value="date">Date</SelectItem>}
                  <SelectItem value="name">Employee Name</SelectItem>
                  <SelectItem value="idCode">Employee ID</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="hours">Hours Logged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Order</label>
              <Select value={sortOrder} onValueChange={(val: any) => setSortOrder(val)}>
                <SelectTrigger className="w-28 h-9 bg-transparent border-border/60 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline" className="h-9 gap-1.5 text-xs font-semibold border-border/60">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => handleOpenOverride()} className="h-9 gap-1.5 text-xs font-semibold">
              <Plus className="h-4 w-4" />
              Manual Entry
            </Button>
          </div>
        </div>
      </div>

      {/* Daily Logs Table */}
      <Card className="shadow-none border-border/40">
        <CardContent className="p-0">
          <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold">Workforce Logs</h3>
              <p className="text-[11px] text-muted-foreground">Detailed check-in, check-out and logged hours</p>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/40 px-2 py-1 rounded-lg">
              <Info className="h-3 w-3" /> Showing {processedLogs.length} entries
            </div>
          </div>
          <div className="overflow-x-auto">
            {isLoadingLogs ? (
              <div className="flex justify-center items-center py-16">
                <Spinner className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/30">
                  <TableRow className="border-b-0 hover:bg-transparent">
                    {filterMode !== "day" && (
                      <TableHead className="font-semibold text-xs text-muted-foreground">Date</TableHead>
                    )}
                    <TableHead className="font-semibold text-xs text-muted-foreground">Employee</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">ID Code</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Department</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Check In</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Check Out</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Logged Hours</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Notes</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground text-right w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedLogs.length > 0 ? (
                    processedLogs.map((log) => (
                      <TableRow key={log.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        {filterMode !== "day" && (
                          <TableCell className="py-3 text-xs font-medium text-muted-foreground">
                            {format(new Date(log.date), "dd-MM-yyyy")}
                          </TableCell>
                        )}
                        <TableCell className="py-3 font-semibold">{log.employeeName}</TableCell>
                        <TableCell className="py-3 text-muted-foreground text-xs">{log.employeeIdCode}</TableCell>
                        <TableCell className="py-3 text-muted-foreground text-xs">{log.departmentName}</TableCell>
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
                      <TableCell colSpan={9} className="py-16 text-center text-muted-foreground">
                        <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm font-semibold">No attendance records found</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Try selecting a different date or clearing filters</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {dailyLogs.length > 0 && (
        <Card className="shadow-none border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{dailyLogs.length}</span> logs
                {cursorHistory.length > 0 && ` (Page ${currentPage})`}
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-medium">Rows per page:</span>
                  <Select value={String(limit)} onValueChange={(val) => setLimit(Number(val))}>
                    <SelectTrigger className="w-16 h-7 text-[11px] bg-transparent border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10" className="text-xs">10</SelectItem>
                      <SelectItem value="20" className="text-xs">20</SelectItem>
                      <SelectItem value="50" className="text-xs">50</SelectItem>
                      <SelectItem value="100" className="text-xs">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={cursorHistory.length === 0}
                    className="text-xs gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!hasNextPage}
                    className="text-xs gap-1"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Entry / Override Dialog */}
      <Dialog open={isOverrideDialogOpen} onOpenChange={setIsOverrideDialogOpen}>
        <DialogContent className="p-6 sm:max-w-[500px]">
          <form onSubmit={handleOverrideSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {overrideEmployeeId ? "Override Attendance Log" : "Manual Attendance Entry"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Manually check in, check out, or update attendance status for any employee.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Employee Selection */}
              {!overrideEmployeeId ? (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Select Employee</Label>
                  <Select value={overrideEmployeeId} onValueChange={setOverrideEmployeeId}>
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Choose employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeEmployees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id} className="text-xs">
                          {emp.fullNameEnglish} ({emp.employeeId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Employee</Label>
                  <Input
                    value={activeEmployees.find(e => e.id === overrideEmployeeId)?.fullNameEnglish || "Selected Employee"}
                    disabled
                    className="text-xs font-semibold bg-muted"
                  />
                </div>
              )}

              {/* Date selection */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                  className="text-xs font-semibold"
                />
              </div>

              {/* Status selection */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={overrideStatus} onValueChange={setOverrideStatus}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present" className="text-xs">Present</SelectItem>
                    <SelectItem value="late" className="text-xs">Late</SelectItem>
                    <SelectItem value="absent" className="text-xs">Absent</SelectItem>
                    <SelectItem value="leave" className="text-xs">Leave</SelectItem>
                    <SelectItem value="holiday" className="text-xs">Holiday</SelectItem>
                    <SelectItem value="weekend" className="text-xs">Weekend</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Check in & out times (only if present/late) */}
              {(overrideStatus === "present" || overrideStatus === "late") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Check In Time</Label>
                    <Input
                      type="time"
                      value={overrideCheckIn}
                      onChange={(e) => setOverrideCheckIn(e.target.value)}
                      className="text-xs font-semibold"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Check Out Time</Label>
                    <Input
                      type="time"
                      value={overrideCheckOut}
                      onChange={(e) => setOverrideCheckOut(e.target.value)}
                      className="text-xs font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Notes / Override Reason</Label>
                <Textarea
                  placeholder="Reason for manual entry or override..."
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  className="text-xs min-h-[70px]"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOverrideDialogOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={overrideMut.isPending} className="h-8 text-xs">
                {overrideMut.isPending ? "Submitting..." : "Save Entry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
