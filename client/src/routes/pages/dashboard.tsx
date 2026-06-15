import { useState, useEffect, useMemo } from "react"
import { AttendanceCalendar } from "@/components/dashboard/attendance-calendar"
import { ApplyLeaveDialog } from "@/components/dashboard/apply-leave-dialog"
import { DayDetailDialog } from "@/components/dashboard/day-detail-dialog"
import { MyTasksCard } from "@/components/dashboard/my-tasks-card"
import { AnnouncementsCard } from "@/components/dashboard/announcements-card"
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
import { useMyAttendanceQuery } from "@/hooks/useAttendance"

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

  // ── Real-Time Attendance Query ────────────────────────────────────────────
  const { data: dbLogs = [] } = useMyAttendanceQuery(calYear, calMonth)

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-6">
        {/* ── Calendar ──────────────────────────────────────────────────────── */}
        <div>
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
