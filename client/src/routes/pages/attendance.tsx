import { useState, useEffect, useMemo, useCallback } from "react"
import { Spinner } from "@/components/ui/spinner"
import { ApplyLeaveDialog } from "@/components/dashboard/apply-leave-dialog"
import { DayDetailDialog } from "@/components/dashboard/day-detail-dialog"
import { DEFAULT_LEAVE_BALANCES, resolveLeaveIcon } from "@/components/dashboard/types"
import { useAttendanceSettingsQuery, useHolidaysQuery } from "@/hooks/useAttendanceSettings"
import {
  useLeaveApplicationsQuery,
  useLeaveBalancesQuery,
  useApplyLeaveMutation,
  useCancelLeaveMutation,
  useUpdateLeaveMutation,
} from "@/hooks/useLeaveApplications"
import { toast } from "sonner"
import { format } from "date-fns"
import {
  useMyAttendanceQuery,
  useSubmitCorrectionMutation,
  useDailyAttendanceQuery,
  useApproveCorrectionMutation,
  useRejectCorrectionMutation,
  usePendingCorrectionsQuery,
  useOverrideAttendanceMutation,
  useMyRangeAttendanceQuery,
  type AttendanceRecord,
  type DailyAttendanceLog
} from "@/hooks/useAttendance"
import { useEmployeesQuery } from "@/hooks/useEmployees"
import { useAuthStore } from "@/store/useAuthStore"
import { useSearchParams } from "react-router"
import { Tabs, TabsContent } from "@/components/ui/tabs"

// Import modular components
import { RequestCorrectionDialog, convert24to12 } from "@/components/attendance/RequestCorrectionDialog"
import { OverrideAttendanceDialog } from "@/components/attendance/OverrideAttendanceDialog"
import { MyAttendanceTab } from "@/components/attendance/MyAttendanceTab"
import { EmployeeAttendanceTab } from "@/components/attendance/EmployeeAttendanceTab"
import {
  mapBalances,
  mapRegularHolidays,
  mapLeaveApplications,
  computeFinalAttendance,
} from "@/components/attendance/attendance-utils"

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
  const [editLeaveData, setEditLeaveData] = useState<any>(null)
  const [dayDetailMode, setDayDetailMode] = useState<"leave" | "regular">("regular")

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
    return mapBalances(dbBalances, DEFAULT_LEAVE_BALANCES, resolveLeaveIcon)
  }, [dbBalances])

  // ── Holiday Settings (Dynamic from API) ────────────────────────────────────
  const { data: settings } = useAttendanceSettingsQuery()
  const { data: holidaysData = [] } = useHolidaysQuery()
  const [weeklyHolidays, setWeeklyHolidays] = useState<string[]>(["Saturday", "Sunday"])

  const regularHolidays = useMemo(() => {
    return mapRegularHolidays(holidaysData)
  }, [holidaysData])

  useEffect(() => {
    if (settings?.weeklyHolidays) {
      setWeeklyHolidays(settings.weeklyHolidays)
    }
  }, [settings])

  // Apply leave, cancel leave, update leave handlers
  const applyLeaveMutation = useApplyLeaveMutation()
  const cancelLeaveMutation = useCancelLeaveMutation()
  const updateLeaveMutation = useUpdateLeaveMutation()

  const handleApplyLeave = (data: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
    attachments: any[];
  }) => {
    if (editLeaveData) {
      updateLeaveMutation.mutate(
        {
          id: editLeaveData.id,
          payload: {
            leaveTypeId: data.leaveTypeId,
            startDate: data.startDate,
            endDate: data.endDate,
            reason: data.reason,
            attachments: data.attachments,
          },
        },
        {
          onSuccess: () => {
            setIsLeaveDialogOpen(false)
            setEditLeaveData(null)
            toast.success("Leave application updated/resubmitted successfully.")
          },
          onError: (err: any) => {
            setIsLeaveDialogOpen(false)
            setEditLeaveData(null)
            toast.error(err?.response?.data?.message || err?.message || "Something went wrong.")
          },
        }
      )
    } else {
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
            toast.success("Leave application submitted successfully.")
          },
          onError: (err: any) => {
            setIsLeaveDialogOpen(false)
            toast.error(err?.response?.data?.message || err?.message || "Something went wrong.")
          },
        }
      )
    }
  }

  const handleCancelLeaveById = async (id: string) => {
    setIsDayDetailOpen(false) // Close DayDetailDialog first
    cancelLeaveMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Leave application cancelled.")
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || err?.message || "Something went wrong.")
      }
    })
  }

  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Personal logs pagination states
  const [myCursor, setMyCursor] = useState<string | null>(null)
  const [myCursorHistory, setMyCursorHistory] = useState<string[]>([])
  const [myCurrentPage, setMyCurrentPage] = useState(1)
  const [myLimit, setMyLimit] = useState(10)

  // Reset pagination on filter or date changes
  useEffect(() => {
    setMyCursor(null)
    setMyCursorHistory([])
    setMyCurrentPage(1)
  }, [calYear, calMonth, filterStatus, searchQuery, myLimit])

  const { myQueryStartDate, myQueryEndDate } = useMemo(() => {
    const start = format(new Date(calYear, calMonth, 1), "yyyy-MM-dd")
    const end = format(new Date(calYear, calMonth + 1, 0), "yyyy-MM-dd")
    return { myQueryStartDate: start, myQueryEndDate: end }
  }, [calYear, calMonth])

  const { data: myRangeData, isLoading: isLoadingMyRange, isFetching: isFetchingMyRange } = useMyRangeAttendanceQuery(
    myQueryStartDate,
    myQueryEndDate,
    myLimit,
    myCursor || undefined,
    filterStatus,
    searchQuery
  )

  const myRangeLogs = myRangeData?.data || []
  const myHasNextPage = myRangeData?.hasNextPage || false
  const myNextCursor = myRangeData?.nextCursor || null

  const handleMyNextPage = () => {
    if (myNextCursor) {
      setMyCursorHistory([...myCursorHistory, myCursor || ""])
      setMyCursor(myNextCursor)
      setMyCurrentPage((prev) => prev + 1)
    }
  }

  const handleMyPrevPage = () => {
    if (myCursorHistory.length > 0) {
      const prevCursor = myCursorHistory[myCursorHistory.length - 1]
      setMyCursorHistory(myCursorHistory.slice(0, -1))
      setMyCursor(prevCursor || null)
      setMyCurrentPage((prev) => prev - 1)
    }
  }

  const processedMyRangeLogs = useMemo(() => {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return myRangeLogs.map((log) => {
      const dateObj = new Date(log.date)
      const dayName = dayNames[dateObj.getDay()]
      const dateStr = format(dateObj, "MMM d, yyyy")
      return {
        ...log,
        day: dateObj.getDate(),
        dayName,
        dateStr,
      }
    })
  }, [myRangeLogs])

  const { data: attendanceRecords = [], isLoading } = useMyAttendanceQuery(
    calYear,
    calMonth
  )

  const viewMonth = useMemo(() => new Date(calYear, calMonth, 1), [calYear, calMonth])

  // Map API leave applications to format expected by internal components
  const mappedLeaveApplications = useMemo(() => {
    return mapLeaveApplications(leaveApplications, calYear, calMonth)
  }, [leaveApplications, calYear, calMonth])

  // Computed final attendance matching dashboard logic
  const finalAttendance = useMemo(() => {
    return computeFinalAttendance(attendanceRecords, mappedLeaveApplications, balances, regularHolidays, weeklyHolidays, calYear, calMonth)
  }, [attendanceRecords, mappedLeaveApplications, balances, regularHolidays, weeklyHolidays, calYear, calMonth])

  // Selected Day Record
  const selectedRecord = useMemo(
    () => finalAttendance.find(d => d.day === selectedDayNumber),
    [finalAttendance, selectedDayNumber]
  )

  const selectedDay = useMemo(() => {
    const rec = finalAttendance.find(d => d.day === selectedDayNumber)
    return (rec as unknown as AttendanceRecord) || null
  }, [finalAttendance, selectedDayNumber])

  const setSelectedDay = useCallback((record: any) => {
    if (record) {
      setSelectedDayNumber(record.day)
    }
  }, [])

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
  const submitCorrectionMut = useSubmitCorrectionMutation()

  const handleRequestCorrection = (record: any) => {
    setCorrectionRecord(record)
    setIsCorrectionDialogOpen(true)
  }

  const handleCorrectionSubmit = async (proposedCheckIn: string, proposedCheckOut: string, correctionReason: string) => {
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

  // Pagination states for Daily Workforce Logs
  const [adminCurrentPage, setAdminCurrentPage] = useState(1)
  const [adminPageSize, setAdminPageSize] = useState(20)

  // Reset pagination on filter or search changes
  useEffect(() => {
    setAdminCurrentPage(1)
  }, [selectedDate, adminSearch, adminFilterStatus, adminPageSize])

  // Override dialog state
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false)
  const [overrideRecord, setOverrideRecord] = useState<any>(null)

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

  const paginatedDailyLogs = useMemo(() => {
    const startIndex = (adminCurrentPage - 1) * adminPageSize
    const endIndex = startIndex + adminPageSize
    return filteredDailyLogs.slice(startIndex, endIndex)
  }, [filteredDailyLogs, adminCurrentPage, adminPageSize])

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
    setOverrideRecord(log || null)
    setIsOverrideDialogOpen(true)
  }

  const handleOverrideSubmit = async (payload: any) => {
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

  const renderMyAttendance = () => (
    <MyAttendanceTab
      calMonth={calMonth}
      calYear={calYear}
      setCalMonth={setCalMonth}
      setCalYear={setCalYear}
      todayDate={todayDate}
      selectedDayNumber={selectedDayNumber}
      setSelectedDayNumber={setSelectedDayNumber}
      setDayDetailMode={setDayDetailMode}
      setIsDayDetailOpen={setIsDayDetailOpen}
      setIsLeaveDialogOpen={setIsLeaveDialogOpen}
      finalAttendance={finalAttendance}
      mappedLeaveApplications={mappedLeaveApplications}
      balances={balances}
      dragOverDay={dragOverDay}
      setDragOverDay={setDragOverDay}
      handleCancelLeaveById={handleCancelLeaveById}
      chartData={chartData}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      filterStatus={filterStatus}
      setFilterStatus={setFilterStatus}
      isLoadingMyRange={isLoadingMyRange}
      isFetchingMyRange={isFetchingMyRange}
      processedMyRangeLogs={processedMyRangeLogs}
      selectedDay={selectedDay}
      setSelectedDay={setSelectedDay}
      handleRequestCorrection={handleRequestCorrection}
      myRangeLogs={myRangeLogs}
      myCursorHistory={myCursorHistory}
      myCurrentPage={myCurrentPage}
      myLimit={myLimit}
      setMyLimit={setMyLimit}
      handleMyPrevPage={handleMyPrevPage}
      handleMyNextPage={handleMyNextPage}
      myHasNextPage={myHasNextPage}
    />
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
            <EmployeeAttendanceTab
              dailyCounts={dailyCounts}
              pendingCorrections={pendingCorrections}
              adminSubTab={adminSubTab}
              setAdminSubTab={setAdminSubTab}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              adminFilterStatus={adminFilterStatus}
              setAdminFilterStatus={setAdminFilterStatus}
              adminSearch={adminSearch}
              setAdminSearch={setAdminSearch}
              handleOpenOverride={handleOpenOverride}
              filteredDailyLogs={filteredDailyLogs}
              paginatedDailyLogs={paginatedDailyLogs}
              isLoadingDaily={isLoadingDaily}
              isLoadingCorrections={isLoadingCorrections}
              adminCurrentPage={adminCurrentPage}
              setAdminCurrentPage={setAdminCurrentPage}
              adminPageSize={adminPageSize}
              setAdminPageSize={setAdminPageSize}
              handleApproveCorrection={handleApproveCorrection}
              handleRejectCorrection={handleRejectCorrection}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <>
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

      {/* Modular Dialogs */}
      <RequestCorrectionDialog
        open={isCorrectionDialogOpen}
        onOpenChange={setIsCorrectionDialogOpen}
        record={correctionRecord}
        onSubmit={handleCorrectionSubmit}
        isPending={submitCorrectionMut.isPending}
      />

      <OverrideAttendanceDialog
        open={isOverrideDialogOpen}
        onOpenChange={setIsOverrideDialogOpen}
        activeEmployees={activeEmployees}
        record={overrideRecord}
        defaultDate={selectedDate}
        onSubmit={handleOverrideSubmit}
        isPending={overrideMut.isPending}
      />

      {/* Apply Leave Dialog */}
      <ApplyLeaveDialog
        open={isLeaveDialogOpen}
        onOpenChange={(open) => {
          setIsLeaveDialogOpen(open)
          if (!open) setEditLeaveData(null)
        }}
        selectedDate={`${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(selectedDayNumber).padStart(2, "0")}`}
        balances={balances}
        initialData={editLeaveData}
        onSubmit={handleApplyLeave}
      />

      {/* Day Detail Dialog */}
      <DayDetailDialog
        open={isDayDetailOpen}
        onOpenChange={setIsDayDetailOpen}
        selectedDayNumber={selectedDayNumber}
        calMonth={calMonth}
        calYear={calYear}
        record={selectedRecord}
        leaveApplications={mappedLeaveApplications as any}
        balances={balances}
        onCancelLeave={handleCancelLeaveById}
        onApplyLeave={() => {
          setEditLeaveData(null)
          setIsLeaveDialogOpen(true)
        }}
        onEditLeave={(app) => {
          setEditLeaveData(app.rawLeave)
          setIsLeaveDialogOpen(true)
        }}
        viewMode={dayDetailMode}
      />
    </div>
  )
}
