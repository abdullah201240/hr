import { useState, useMemo } from "react"
import { AttendanceCalendar } from "@/components/dashboard/attendance-calendar"
import { ApplyLeaveDialog } from "@/components/dashboard/apply-leave-dialog"
import { DayDetailDialog } from "@/components/dashboard/day-detail-dialog"
import { MyTasksCard } from "@/components/dashboard/my-tasks-card"
import { AnnouncementsCard } from "@/components/dashboard/announcements-card"
import { TaskDetailsSheet } from "@/components/tasks/TaskDetailsSheet"
import { TaskCreateDialog } from "@/components/tasks/TaskCreateDialog"
import { isAfter, parseISO } from "date-fns"
import type {
  AttendanceRecord,
} from "@/components/dashboard/types"
import {
  resolveLeaveIcon,
} from "@/components/dashboard/types"
import { useMyAttendanceQuery } from "@/hooks/useAttendance"
import { useAnnouncementsPaginated } from "@/hooks/useAnnouncements"
import { useAttendanceSettingsQuery, useHolidaysQuery } from "@/hooks/useAttendanceSettings"
import {
  useLeaveApplicationsQuery,
  useLeaveBalancesQuery,
  useApplyLeaveMutation,
  useCancelLeaveMutation,
  useUpdateLeaveMutation,
} from "@/hooks/useLeaveApplications"
import { useAuthStore } from "@/store/useAuthStore"
import {
  useTasksQuery,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useCreateTaskMutation,
} from "@/hooks/useTasks"
import { toast } from "sonner"

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)

  // ── Announcements (fetch only published, limit to 10 for dashboard) ──────────────────────────────────
  const { data: announcementsPage } = useAnnouncementsPaginated({
    limit: 10,
    status: 'Published',
  })
  const announcements = announcementsPage?.data || []


  // ── Tasks (Fetch user's live assigned tasks from DB) ──────────────────────
  const { data: dbTasks = [] } = useTasksQuery({ assigneeId: user?.id })
  const updateTaskMut = useUpdateTaskMutation()
  const deleteTaskMut = useDeleteTaskMutation()
  const createTaskMut = useCreateTaskMutation()

  const handleCreateTask = (data: any) => {
    createTaskMut.mutate(data, {
      onSuccess: () => {
        setIsAddTaskOpen(false)
        toast.success("Task created successfully")
      }
    })
  }

  const mappedTasks = useMemo(() => {
    return dbTasks.map(t => {
      const overdue = t.dueDate ? isAfter(new Date(), parseISO(t.dueDate)) && t.status !== "Done" : false;
      return {
        id: t.id,
        text: t.title,
        priority: t.priority,
        due: t.dueDate ? new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "No date",
        done: t.status === "Done",
        projectName: t.projectName,
        subtasksTotal: t.subtasksTotal,
        subtasksCompleted: t.subtasksCompleted,
        overdue,
      };
    })
  }, [dbTasks])

  const toggleTask = (id: string) => {
    const taskItem = dbTasks.find(t => t.id === id)
    if (!taskItem) return
    const nextStatus = taskItem.status === "Done" ? "Todo" : "Done"
    updateTaskMut.mutate(
      { id, data: { status: nextStatus } },
      {
        onSuccess: () => {
          toast.success("Task status updated")
        },
      }
    )
  }

  const deleteTask = (id: string) => {
    deleteTaskMut.mutate(id, {
      onSuccess: () => {
        toast.success("Task deleted successfully")
      },
    })
  }

  const toggleAllTasks = (checked: boolean) => {
    const nextStatus = checked ? "Done" : "Todo"
    dbTasks.forEach(t => {
      const isCurrentlyDone = t.status === "Done"
      if (isCurrentlyDone !== checked) {
        updateTaskMut.mutate({ id: t.id, data: { status: nextStatus } })
      }
    })
  }

  // ── Calendar State ─────────────────────────────────────────────────────────
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
  const [draggedLeaveType, setDraggedLeaveType] = useState<string | null>(null)

  // ── Leave Applications & Balances (Dynamic from API) ───────────────────────

  const { data: leaveApplicationsData } = useLeaveApplicationsQuery({
    employeeId: user?.id,
    limit: 100,
  })
  const leaveApplications = leaveApplicationsData?.data || []

  const { data: dbBalances = [] } = useLeaveBalancesQuery(calYear)

  const balances = useMemo(() => {
    if (!dbBalances || dbBalances.length === 0) return []

    const normalized = dbBalances.map(b => ({
      id: b.id,
      key: b.key,
      label: b.label,
      total: b.total,
      used: b.used,
      color: b.color || "bg-sky-500",
      icon: b.icon || "coffee",
      requiresDocument: b.requiresDocument
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

  // ── Real-Time Attendance Query ────────────────────────────────────────────
  const { data: dbLogs = [] } = useMyAttendanceQuery(calYear, calMonth)
  const { data: settings } = useAttendanceSettingsQuery()
  const { data: holidaysData = [] } = useHolidaysQuery()

  // ── Holiday Settings ───────────────────────────────────────────────────────
  const weeklyHolidays = useMemo(() => settings?.weeklyHolidays || ["Saturday", "Sunday"], [settings])
  const regularHolidays = useMemo(() => {
    return holidaysData.map((h: any) => ({
      id: h.id,
      name: h.name,
      startDate: h.startDate,
      endDate: h.endDate,
      startDay: h.startDate ? new Date(h.startDate + "T00:00:00").getDate() : 1,
      endDay: h.endDate ? new Date(h.endDate + "T00:00:00").getDate() : 1
    }))
  }, [holidaysData])

  // ── Apply/Cancel Leave Handlers ───────────────────────────────────────────
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

  const handleCancelLeaveById = (id: string) => {
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

  // Map API leave applications to format expected by internal components
  // Only include leaves that overlap with the current calendar month
  const mappedLeaveApplications = useMemo(() => {
    return leaveApplications
      .filter((la) => {
        const startStr = typeof la.startDate === 'string' ? la.startDate.split('T')[0] : new Date(la.startDate).toISOString().split('T')[0]
        const endStr = typeof la.endDate === 'string' ? la.endDate.split('T')[0] : new Date(la.endDate).toISOString().split('T')[0]
        const firstDayStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`
        const lastDayStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(new Date(calYear, calMonth + 1, 0).getDate()).padStart(2, '0')}`
        return startStr <= lastDayStr && endStr >= firstDayStr
      })
      .map((la) => {
        const startStr = typeof la.startDate === 'string' ? la.startDate.split('T')[0] : new Date(la.startDate).toISOString().split('T')[0]
        const endStr = typeof la.endDate === 'string' ? la.endDate.split('T')[0] : new Date(la.endDate).toISOString().split('T')[0]
        const [startYear, startMonth, startDayVal] = startStr.split('-').map(Number)
        const [endYear, endMonth, endDayVal] = endStr.split('-').map(Number)

        let startDay = 1
        if (startYear === calYear && (startMonth - 1) === calMonth) {
          startDay = startDayVal
        }
        let endDay = new Date(calYear, calMonth + 1, 0).getDate()
        if (endYear === calYear && (endMonth - 1) === calMonth) {
          endDay = endDayVal
        }

        return {
          id: la.id,
          startDay,
          endDay,
          leaveType: la.leaveTypeName.toLowerCase().replace(" leave", "").replace(" ", ""),
          reason: la.reason,
          attachments: la.attachments,
          status: la.status,
          rawLeave: la,
        }
      })
  }, [leaveApplications, calYear, calMonth])


  // ── Computed Final Attendance (memoized to avoid recomputing every second) ─
  const finalAttendance = useMemo(() => dbLogs.map((record): AttendanceRecord => {
    const matchingLeave = mappedLeaveApplications.find(la => record.day >= la.startDay && record.day <= la.endDay)
    if (matchingLeave) {
      const selectedTypeObj = balances.find(b => b.key === matchingLeave.leaveType)
      const typeLabel = selectedTypeObj?.label || "Leave"
      return {
        ...record,
        status: "leave" as const,
        notes: `${matchingLeave.status} ${typeLabel}: ${matchingLeave.reason}`,
        attachments: matchingLeave.attachments as any,
      }
    }

    const matchingRegularHoliday = regularHolidays.find((h: any) => {
      if (h.startDate && h.endDate) {
        const recordDate = new Date(calYear, calMonth, record.day)
        const start = new Date(h.startDate + "T00:00:00")
        const end = new Date(h.endDate + "T00:00:00")
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
    }

    if (record.status === "upcoming") return record

    if (!record.checkIn && record.status !== "leave" && record.status !== "weekend" && record.status !== "holiday") {
      return { ...record, status: "absent" as const }
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
            onMonthChange={(month, year) => {
              setCalMonth(month)
              setCalYear(year)
            }}
            currentTime={todayDate}
            selectedDayNumber={selectedDayNumber}
            onSelectDay={setSelectedDayNumber}
            onOpenDayDetail={(mode) => {
              setDayDetailMode(mode)
              setIsDayDetailOpen(true)
            }}
            onOpenLeaveDialog={(day, leaveType) => {
              setSelectedDayNumber(day)
              setDraggedLeaveType(leaveType || null)
              setIsLeaveDialogOpen(true)
            }}
            finalAttendance={finalAttendance}
            leaveApplications={mappedLeaveApplications as any}
            balances={balances}
            dragOverDay={dragOverDay}
            onDragOver={setDragOverDay}
            onCancelLeave={handleCancelLeaveById}
          />
        </div>

        {/* ── Apply Leave Dialog ────────────────────────────────────────────── */}
        <ApplyLeaveDialog
          open={isLeaveDialogOpen}
          onOpenChange={(open) => {
            if (applyLeaveMutation.isPending || updateLeaveMutation.isPending) return
            setIsLeaveDialogOpen(open)
            if (!open) {
              setEditLeaveData(null)
              setDraggedLeaveType(null)
            }
          }}
          selectedDate={`${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(selectedDayNumber).padStart(2, "0")}`}
          balances={balances}
          preSelectedLeaveKey={draggedLeaveType}
          initialData={editLeaveData}
          onSubmit={handleApplyLeave}
          isSubmitting={applyLeaveMutation.isPending || updateLeaveMutation.isPending}
        />

        {/* ── Day Detail Dialog ─────────────────────────────────────────────── */}
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

        {/* ── Two-Column: Tasks + Announcements ─────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          <MyTasksCard
            tasks={mappedTasks}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            onToggleAll={toggleAllTasks}
            onAddTask={() => setIsAddTaskOpen(true)}
            onTaskClick={(id) => setSelectedTaskId(id)}
          />
          <AnnouncementsCard announcements={announcements} />
        </div>
      </div>

      <TaskDetailsSheet
        taskId={selectedTaskId || ""}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />

      <TaskCreateDialog
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onSubmit={handleCreateTask}
        isPending={createTaskMut.isPending}
      />
    </div>
  )
}
