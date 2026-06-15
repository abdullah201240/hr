import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { AttendanceCalendar } from "@/components/dashboard/attendance-calendar"
import { ApplyLeaveDialog } from "@/components/dashboard/apply-leave-dialog"
import { DayDetailDialog } from "@/components/dashboard/day-detail-dialog"
import { MyTasksCard } from "@/components/dashboard/my-tasks-card"
import { AnnouncementsCard } from "@/components/dashboard/announcements-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  MapPin,
  Laptop,
  LogIn,
  LogOut,
  CheckCircle,
  Clock,
} from "lucide-react"
import type {
  AttendanceRecord,
  LeaveApplication,
  LeaveBalance,
  SetupHoliday,
} from "@/components/dashboard/types"
import {
  DEFAULT_LEAVE_BALANCES,
  INITIAL_TASKS,
  DEFAULT_ANNOUNCEMENTS,
  resolveLeaveIcon,
} from "@/components/dashboard/types"
import {
  useMyAttendanceQuery,
  useCheckInMutation,
  useCheckOutMutation,
} from "@/hooks/useAttendance"
import { format } from "date-fns"

// ─── Isolated Clock Component (re-renders only itself every second) ──────────
const ClockDisplay = memo(function ClockDisplay() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="text-center py-4 bg-muted/30 rounded-2xl border border-border/20">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current Time</p>
      <p className="font-mono text-2xl font-extrabold text-primary tracking-widest mt-1">
        {now.toLocaleTimeString("en-US", { hour12: true })}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
      </p>
    </div>
  )
})

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  // ── Announcements ──────────────────────────────────────────────────────────
  const [announcements] = useState(() => {
    const saved = localStorage.getItem("hr_announcements")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.filter((a: any) => a.status === "Published")
      } catch (e) {
        console.error(e)
      }
    }
    return DEFAULT_ANNOUNCEMENTS
  })

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const toggleTask = (id: number) =>
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t))

  // ── Calendar State ─────────────────────────────────────────────────────────
  const todayDate = new Date()
  const [calMonth, setCalMonth] = useState(todayDate.getMonth())
  const [calYear] = useState(todayDate.getFullYear())
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(todayDate.getDate())

  // ── Dialog State ───────────────────────────────────────────────────────────
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [leaveType, setLeaveType] = useState("casual")

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  const [dragOverDay, setDragOverDay] = useState<number | null>(null)

  // ── Leave Applications ─────────────────────────────────────────────────────
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>(() => {
    const saved = localStorage.getItem("hr_leave_applications")
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { console.error(e) }
    }
    return [
      { id: "default-leave-1", startDay: 15, endDay: 15, leaveType: "casual", reason: "Personal family matter", attachments: [], status: "approved" }
    ]
  })

  // ── Leave Balances ─────────────────────────────────────────────────────────
  const [balances, setBalances] = useState<LeaveBalance[]>(() => {
    const saved = localStorage.getItem("hr_leave_balances")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const savedKeys = new Set(parsed.map((b: any) => b.key))
        const requiredKeys = ["annual", "sick", "casual", "late", "travel", "movement", "emergency", "unpaid"]
        const hasAllKeys = requiredKeys.every(k => savedKeys.has(k))
        if (hasAllKeys) {
          return parsed.map((b: any) => ({ ...b, icon: resolveLeaveIcon(b.key) }))
        }
        localStorage.removeItem("hr_leave_balances")
      } catch (e) {
        console.error(e)
      }
    }
    return DEFAULT_LEAVE_BALANCES
  })

  // ── Real-Time Attendance Query and Mutations ──────────────────────────────
  const { data: dbLogs = [] } = useMyAttendanceQuery(calYear, calMonth)
  const checkInMut = useCheckInMutation()
  const checkOutMut = useCheckOutMutation()
  const [punchLocation, setPunchLocation] = useState<"Office" | "Remote">("Office")

  // ── Holiday Settings ───────────────────────────────────────────────────────
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

  // ── Clock Timer ────────────────────────────────────────────────────────────
  // (Clock is now isolated in ClockDisplay component — no re-render cascade)

  // ── Apply Leave Handler ────────────────────────────────────────────────────
  const handleApplyLeave = (data: {
    startDay: number; endDay: number; leaveType: string; reason: string;
    attachments: { id: string; title: string; fileName: string }[]
  }) => {
    const duration = data.endDay - data.startDay + 1
    if (duration <= 0) return

    const newApp: LeaveApplication = {
      id: Math.random().toString(36).substring(2, 9),
      startDay: data.startDay,
      endDay: data.endDay,
      leaveType: data.leaveType,
      reason: data.reason,
      attachments: data.attachments,
      status: "approved"
    }

    const updatedApps = [...leaveApplications, newApp]
    const updatedBalances = balances.map(b =>
      b.key === data.leaveType ? { ...b, used: b.used + duration } : b
    )
    const serializableBalances = updatedBalances.map(({ icon, ...rest }) => rest)

    setLeaveApplications(updatedApps)
    setBalances(updatedBalances)
    localStorage.setItem("hr_leave_applications", JSON.stringify(updatedApps))
    localStorage.setItem("hr_leave_balances", JSON.stringify(serializableBalances))
    setIsLeaveDialogOpen(false)
  }

  // ── Cancel Leave Handler ───────────────────────────────────────────────────
  const handleCancelLeaveById = (id: string) => {
    const appToCancel = leaveApplications.find(la => la.id === id)
    if (!appToCancel) return

    const duration = appToCancel.endDay - appToCancel.startDay + 1
    const updatedApps = leaveApplications.filter(la => la.id !== id)
    const updatedBalances = balances.map(b =>
      b.key === appToCancel.leaveType ? { ...b, used: Math.max(0, b.used - duration) } : b
    )
    const serializableBalances = updatedBalances.map(({ icon, ...rest }) => rest)

    setLeaveApplications(updatedApps)
    setBalances(updatedBalances)
    localStorage.setItem("hr_leave_applications", JSON.stringify(updatedApps))
    localStorage.setItem("hr_leave_balances", JSON.stringify(serializableBalances))
  }

  // ── Computed Final Attendance (memoized to avoid recomputing every second) ─
  const finalAttendance = useMemo(() => dbLogs.map((record): AttendanceRecord => {
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

    const matchingRegularHoliday = regularHolidays.find(h => {
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
      return { ...record, status: "holiday" as const, notes: matchingRegularHoliday.name, checkIn: null, checkOut: null, hours: null }
    }

    const isWeeklyHoliday = weeklyHolidays.includes(record.dayName)
    if (isWeeklyHoliday) {
      if (!record.checkIn) {
        return { ...record, status: "weekend" as const, checkIn: null, checkOut: null, hours: null }
      }
    } else {
      if (!record.checkIn && record.status !== "leave") {
        return { ...record, status: "absent" as const }
      }
    }

    return record
  }), [dbLogs, leaveApplications, balances, regularHolidays, weeklyHolidays, calYear, calMonth])

  // ── Selected Day Record (memoized) ──────────────────────────────────────────
  const selectedRecord = useMemo(
    () => finalAttendance.find(d => d.day === selectedDayNumber),
    [finalAttendance, selectedDayNumber]
  )

  // ── Today's Checkin Record for Punch Widget (memoized) ──────────────────────
  const todayRecord = useMemo(
    () => finalAttendance.find(d => d.day === todayDate.getDate() && calMonth === todayDate.getMonth() && calYear === todayDate.getFullYear()),
    [finalAttendance, calMonth, calYear]
  )

  // ── Punch Mutations ────────────────────────────────────────────────────────
  const handleCheckIn = () => {
    checkInMut.mutate(
      {
        location: punchLocation,
        ipAddress: "192.168.10.45",
        device: navigator.userAgent.substring(0, 100),
        notes: "Dashboard check-in"
      },
      {
        onSuccess: () => {
          toast.success("Checked in successfully!", {
            description: `Punch registered at ${format(new Date(), "hh:mm A")}`
          })
        }
      }
    )
  }

  const handleCheckOut = () => {
    checkOutMut.mutate(
      {
        notes: "Dashboard check-out"
      },
      {
        onSuccess: () => {
          toast.success("Checked out successfully!", {
            description: `Punch registered at ${format(new Date(), "hh:mm A")}`
          })
        }
      }
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-6">
        {/* ── Stepper Footer columns for punch widget and calendar ─────────── */}
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <AttendanceCalendar
              calMonth={calMonth}
              calYear={calYear}
              onMonthChange={setCalMonth}
              currentTime={todayDate}
              selectedDayNumber={selectedDayNumber}
              onSelectDay={setSelectedDayNumber}
              onOpenDayDetail={() => setIsDayDetailOpen(true)}
              onOpenLeaveDialog={(day, type) => {
                setSelectedDayNumber(day)
                if (type) setLeaveType(type)
                setIsLeaveDialogOpen(true)
              }}
              finalAttendance={finalAttendance}
              leaveApplications={leaveApplications}
              balances={balances}
              dragOverDay={dragOverDay}
              onDragOver={setDragOverDay}
              onCancelLeave={handleCancelLeaveById}
            />
          </div>

          <div className="lg:col-span-1">
            <Card className="shadow-none border-border/40 h-full flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Attendance Punch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
                {/* Mon ticking clock (isolated re-render) */}
                <ClockDisplay />

                {/* Location selector */}
                {!todayRecord?.checkIn && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Select Location</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={punchLocation === "Office" ? "default" : "outline"}
                        onClick={() => setPunchLocation("Office")}
                        className="gap-2 h-9 rounded-xl text-xs"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        Office
                      </Button>
                      <Button
                        type="button"
                        variant={punchLocation === "Remote" ? "default" : "outline"}
                        onClick={() => setPunchLocation("Remote")}
                        className="gap-2 h-9 rounded-xl text-xs"
                      >
                        <Laptop className="h-3.5 w-3.5" />
                        Remote
                      </Button>
                    </div>
                  </div>
                )}

                {/* Punch details / status */}
                <div className="bg-muted/20 border border-border/10 rounded-2xl p-4 space-y-3 flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-semibold capitalize">
                      {todayRecord?.checkIn
                        ? todayRecord.checkOut
                          ? "Shift Completed"
                          : "Active Working"
                        : "Not Checked In"}
                    </span>
                  </div>
                  {todayRecord?.checkIn && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Punch In</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {todayRecord.checkIn} ({todayRecord.location})
                      </span>
                    </div>
                  )}
                  {todayRecord?.checkOut && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Punch Out</span>
                      <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {todayRecord.checkOut}
                      </span>
                    </div>
                  )}
                  {todayRecord?.hours && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Hours Logged</span>
                      <span className="font-semibold">
                        {todayRecord.hours} hrs
                      </span>
                    </div>
                  )}
                </div>

                {/* Punch action button */}
                <div className="pt-2">
                  {todayRecord?.checkOut ? (
                    <Button disabled className="w-full h-11 rounded-xl gap-2 bg-muted text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      Shift Completed
                    </Button>
                  ) : todayRecord?.checkIn ? (
                    <Button
                      onClick={handleCheckOut}
                      disabled={checkOutMut.isPending}
                      className="w-full h-11 rounded-xl gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20"
                    >
                      {checkOutMut.isPending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                      {checkOutMut.isPending ? "Punching Out..." : "Punch Out"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCheckIn}
                      disabled={checkInMut.isPending}
                      className="w-full h-11 rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                    >
                      {checkInMut.isPending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <LogIn className="h-4 w-4" />
                      )}
                      {checkInMut.isPending ? "Punching In..." : "Punch In"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Apply Leave Dialog ────────────────────────────────────────────── */}
        <ApplyLeaveDialog
          open={isLeaveDialogOpen}
          onOpenChange={setIsLeaveDialogOpen}
          selectedDayNumber={selectedDayNumber}
          leaveType={leaveType}
          onLeaveTypeChange={setLeaveType}
          balances={balances}
          onSubmit={handleApplyLeave}
        />

        {/* ── Day Detail Dialog ─────────────────────────────────────────────── */}
        <DayDetailDialog
          open={isDayDetailOpen}
          onOpenChange={setIsDayDetailOpen}
          selectedDayNumber={selectedDayNumber}
          record={selectedRecord}
          leaveApplications={leaveApplications}
          balances={balances}
          onCancelLeave={handleCancelLeaveById}
          onApplyLeave={() => setIsLeaveDialogOpen(true)}
        />

        {/* ── Two-Column: Tasks + Announcements ─────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          <MyTasksCard
            tasks={tasks}
            onToggleTask={toggleTask}
            onDeleteTask={(id) => setTasks(ts => ts.filter(t => t.id !== id))}
            onToggleAll={(checked) => setTasks(ts => ts.map(t => ({ ...t, done: checked })))}
          />
          <AnnouncementsCard announcements={announcements} />
        </div>
      </div>
    </div>
  )
}
