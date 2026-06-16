import { memo, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { LeaveBalanceChips } from "./leave-balance-chips"
import type { AttendanceRecord, LeaveApplication, LeaveBalance } from "./types"
import { formatMonthYear, formatFullDate } from "./types"

interface AttendanceCalendarProps {
  calMonth: number
  calYear: number
  onMonthChange: (month: number, year: number) => void
  currentTime: Date
  selectedDayNumber: number
  onSelectDay: (day: number) => void
  onOpenDayDetail: (mode: "leave" | "regular") => void
  onOpenLeaveDialog: (day: number, leaveType?: string) => void
  finalAttendance: AttendanceRecord[]
  leaveApplications: LeaveApplication[]
  balances: LeaveBalance[]
  dragOverDay: number | null
  onDragOver: (day: number | null) => void
  onCancelLeave: (id: string) => void
}

export const AttendanceCalendar = memo(function AttendanceCalendar({
  calMonth,
  calYear,
  onMonthChange,
  currentTime,
  selectedDayNumber,
  onSelectDay,
  onOpenDayDetail,
  onOpenLeaveDialog,
  finalAttendance,
  leaveApplications,
  balances,
  dragOverDay,
  onDragOver,
  onCancelLeave,
}: AttendanceCalendarProps) {
  const daysInMonth = useMemo(() => new Date(calYear, calMonth + 1, 0).getDate(), [calYear, calMonth])
  const startOffset = useMemo(() => (new Date(calYear, calMonth, 1).getDay() + 6) % 7, [calYear, calMonth])
  const isCurrentMo = useMemo(
    () => calMonth === currentTime.getMonth() && calYear === currentTime.getFullYear(),
    [calMonth, calYear, currentTime]
  )
  const today = currentTime.getDate()

  return (
    <Card className="shadow-none border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Shift & Attendance Calendar</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{formatMonthYear(calMonth, calYear)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (calMonth === 0) onMonthChange(11, calYear - 1)
                else onMonthChange(calMonth - 1, calYear)
              }}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (calMonth === 11) onMonthChange(0, calYear + 1)
                else onMonthChange(calMonth + 1, calYear)
              }}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <LeaveBalanceChips balances={balances} />

          {/* Day headers */}
          <div className="grid grid-cols-7 text-center">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
              <div key={d} className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider py-2.5">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
            {Array.from({ length: startOffset }).map((_, i) => <div key={`pad-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const record = finalAttendance.find(d => d.day === day)
              const isToday = isCurrentMo && day === today
              const isSel = day === selectedDayNumber

              let cellBg = "bg-transparent hover:bg-muted/30"
              let textColor = "text-foreground"
              if (record) {
                if (record.status === "present") {
                  cellBg = "bg-emerald-500/10 hover:bg-emerald-500/15 dark:bg-emerald-500/[0.04]"
                  textColor = "text-emerald-600 dark:text-emerald-400 font-semibold"
                } else if (record.status === "late") {
                  cellBg = "bg-amber-500/10 hover:bg-amber-500/15 dark:bg-amber-500/[0.04]"
                  textColor = "text-amber-600 dark:text-amber-400 font-semibold"
                } else if (record.status === "absent") {
                  cellBg = "bg-red-500/10 hover:bg-red-500/15 dark:bg-red-500/[0.04]"
                  textColor = "text-red-600 dark:text-red-400 font-semibold"
                } else if (record.status === "leave") {
                  cellBg = "bg-sky-500/10 hover:bg-sky-500/15 dark:bg-sky-500/[0.04]"
                  textColor = "text-sky-600 dark:text-sky-400 font-semibold"
                } else if (record.status === "holiday") {
                  cellBg = "bg-violet-500/10 hover:bg-violet-500/15 dark:bg-violet-500/[0.04]"
                  textColor = "text-violet-600 dark:text-violet-400 font-semibold"
                } else if (record.status === "weekend") {
                  cellBg = "bg-muted/30 hover:bg-muted/40 dark:bg-muted/15"
                  textColor = "text-muted-foreground/60"
                } else if (record.status === "upcoming") {
                  cellBg = "bg-transparent border border-dashed border-border/80 hover:bg-muted/20"
                  textColor = "text-muted-foreground"
                }
              }

              return (
                <Tooltip key={`d-${day}`}>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => {
                        if (record) {
                          onSelectDay(day)
                          if (record.status !== "upcoming") {
                            onOpenDayDetail("regular")
                          }
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = "copy"
                        onDragOver(day)
                      }}
                      onDragLeave={() => onDragOver(null)}
                      onDrop={(e) => {
                        e.preventDefault()
                        const droppedType = e.dataTransfer.getData("leaveType")
                        if (droppedType) {
                          onSelectDay(day)
                          onOpenLeaveDialog(day, droppedType)
                        }
                        onDragOver(null)
                      }}
                      className={cn(
                        "relative rounded-xl flex flex-col items-stretch p-2 text-xs font-medium transition-all duration-200 hover:scale-[1.02] min-h-[100px] cursor-pointer group",
                        cellBg,
                        isToday && "ring-2 ring-primary",
                        isSel && "ring-2 ring-foreground",
                        dragOverDay === day && "ring-2 ring-primary ring-offset-1 bg-primary/5 scale-[1.04]"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <span className={cn("text-xs leading-none font-semibold", isToday ? "text-primary font-extrabold" : textColor)}>{day}</span>
                        {record && record.status !== "upcoming" && record.status !== "weekend" && record.status !== "holiday" && (
                          record.status === "leave" ? (() => {
                            const app = leaveApplications.find(la => day >= la.startDay && day <= la.endDay)
                            // Only show cancel button if leave is still pending
                            if (!app || app.status.toLowerCase() !== "pending") return null
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onCancelLeave(app.id)
                                }}
                                className="h-3.5 w-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-red-500 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                                title="Cancel leave"
                              >×</button>
                            )
                          })() : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onSelectDay(day)
                                onOpenLeaveDialog(day)
                              }}
                              className="h-3.5 w-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-sky-500 hover:bg-sky-500/20 transition-colors opacity-0 group-hover:opacity-100"
                              title="Apply leave"
                            >+</button>
                          )
                        )}
                      </div>

                      {record && record.status !== "upcoming" && (
                        record.status === "leave" ? (
                          <div 
                            className="flex flex-col gap-1 mt-2 flex-1 justify-start p-1.5 rounded"
                          >
                            <span
                              onClick={(e) => {
                                e.stopPropagation()
                                onSelectDay(day)
                                onOpenDayDetail("leave")
                              }}
                              className="text-[9px] font-bold uppercase tracking-tight leading-normal px-1.5 py-0.5 bg-sky-500/20 text-sky-700 dark:text-sky-400 rounded w-fit block truncate max-w-full cursor-pointer hover:bg-sky-500/30 transition-colors"
                            >
                              {(() => {
                                const matchingLeave = leaveApplications.find(la => day >= la.startDay && day <= la.endDay) as any
                                return matchingLeave ? (matchingLeave.rawLeave?.leaveTypeName || "Leave") : "Leave"
                              })()}
                            </span>
                            {(() => {
                              const la = leaveApplications.find(la => day >= la.startDay && day <= la.endDay)
                              const leaveStatus = la?.status?.toLowerCase() || ""
                              return leaveStatus ? (
                                <span className={cn(
                                  "text-[7.5px] font-bold uppercase tracking-wider leading-none px-1.5 py-0.5 rounded w-fit",
                                  leaveStatus === "pending" && "bg-amber-500/20 text-amber-700 dark:text-amber-400",
                                  leaveStatus === "approved" && "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
                                  leaveStatus === "rejected" && "bg-red-500/20 text-red-700 dark:text-red-400",
                                )}>
                                  {leaveStatus}
                                </span>
                              ) : null
                            })()}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5 mt-1 flex-1 justify-center">
                            <span className={cn(
                              "text-[9px] font-bold uppercase tracking-tight leading-none px-1.5 py-0.5 rounded self-start",
                              record.status === "present" && "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
                              record.status === "late" && "bg-amber-500/20 text-amber-700 dark:text-amber-400",
                              record.status === "absent" && "bg-red-500/20 text-red-700 dark:text-red-400",
                              record.status === "holiday" && "bg-violet-500/20 text-violet-700 dark:text-violet-400",
                              record.status === "weekend" && "bg-muted/60 text-muted-foreground"
                            )}>
                              {record.status === "holiday"
                                ? "HOLIDAY"
                                : record.status === "weekend"
                                  ? "WEEKEND OFF"
                                  : record.status === "absent"
                                    ? "ABSENT"
                                    : record.status === "present"
                                      ? "REGULAR"
                                      : "LATE"
                              }
                            </span>

                            {(record.status === "present" || record.status === "late") && record.checkIn && (
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                                <span className="text-[9px] text-muted-foreground leading-none truncate">
                                  {record.checkIn}–{record.checkOut || "Active"}
                                </span>
                              </div>
                            )}

                            {(record.status === "present" || record.status === "late") && record.hours && (
                              <span className="text-[9px] text-muted-foreground/80 leading-none">
                                {record.hours}h{record.location === "Remote" ? " · RM" : ""}
                              </span>
                            )}

                            {record.status === "holiday" && record.notes && (
                              <span className="text-[8px] text-violet-600/70 dark:text-violet-400/70 leading-none truncate">
                                {record.notes.length > 22 ? record.notes.substring(0, 22) + "…" : record.notes}
                              </span>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-[200px] p-2 space-y-1">
                    <p className="font-bold">{formatFullDate(day, calMonth, calYear)}</p>
                    {record && (
                      <p className="capitalize">Status: <span className="font-semibold">{record.status}</span></p>
                    )}
                    {record && record.checkIn && (
                      <p>Punch: {record.checkIn} - {record.checkOut || "Active"}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
