import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Coffee, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AttendanceRecord, LeaveApplication, LeaveBalance } from "./types"
import { formatFullDate } from "./types"
import { useAuthStore } from "@/store/useAuthStore"
import { useDepartmentQuery } from "@/hooks/useDepartments"
import { useDesignationQuery } from "@/hooks/useDesignations"
import { useAttendanceSettingsQuery } from "@/hooks/useAttendanceSettings"

interface DayDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDayNumber: number
  calMonth: number
  calYear: number
  record: AttendanceRecord | undefined
  leaveApplications: LeaveApplication[]
  balances: LeaveBalance[]
  onCancelLeave: (id: string) => void
  onApplyLeave: () => void
}

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

export function DayDetailDialog({
  open,
  onOpenChange,
  selectedDayNumber,
  calMonth,
  calYear,
  record,
  leaveApplications,
  balances,
  onCancelLeave,
  onApplyLeave,
}: DayDetailDialogProps) {
  const { user } = useAuthStore()
  const { data: department } = useDepartmentQuery(user?.departmentId || "")
  const { data: designation } = useDesignationQuery(user?.designationId || "")
  const { data: settings } = useAttendanceSettingsQuery()

  if (!record) return null

  const matchingLeave = leaveApplications.find(la => selectedDayNumber >= la.startDay && selectedDayNumber <= la.endDay)
  const workMinutes = record.hours ? Math.round(record.hours * 60) : null
  const leaveTypeLabel = matchingLeave ? balances.find(b => b.key === matchingLeave.leaveType)?.label : null

  const rosterStart = settings?.startTime ? convert24to12(settings.startTime) : "10:00 AM"
  const rosterEnd = settings?.endTime ? convert24to12(settings.endTime) : "06:00 PM"
  
  const getDurationHours = (start?: string, end?: string): number => {
    if (!start || !end) return 8
    const [sH, sM] = start.split(":").map(Number)
    const [eH, eM] = end.split(":").map(Number)
    return eH - sH + (eM - sM) / 60
  }
  const duration = getDurationHours(settings?.startTime, settings?.endTime)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {record ? `${formatFullDate(record.day, calMonth, calYear)} — Day Details` : `Day ${selectedDayNumber}`}
          </DialogTitle>
          <DialogDescription className="text-xs">Complete attendance and shift information for this day.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Section 1: Employee & Shift Info */}
          <div className="rounded-lg border border-border/40 overflow-hidden">
            <div className="bg-muted/40 px-3 py-1.5 border-b border-border/30">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Employee & Shift Info</p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-border/20">
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Date</span><span className="font-semibold">{formatFullDate(record.day, calMonth, calYear)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Department</span><span className="font-semibold">{department?.name || "—"}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Employee</span><span className="font-semibold">{user?.fullNameEnglish || "—"}</span></div>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Shift Name</span><span className="font-semibold">{designation?.name || "—"}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Roster Time</span><span className="font-semibold">{rosterStart} – {rosterEnd}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Day Duration</span><span className="font-semibold">Day Shift ({duration}h)</span></div>
              </div>
            </div>
          </div>

          {/* Section 2: Duty & Leave Details */}
          <div className="rounded-lg border border-border/40 overflow-hidden">
            <div className="bg-muted/40 px-3 py-1.5 border-b border-border/30">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Duty & Leave Details</p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-border/20">
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Duty Type</span><span className="font-semibold">{user?.employeeType || "Regular"}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Present Status</span>
                  <Badge className={cn("text-[9px] font-bold",
                    record.status === "present" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                    record.status === "late" && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                    record.status === "absent" && "bg-red-500/10 text-red-600 border-red-500/20",
                    record.status === "leave" && "bg-sky-500/10 text-sky-600 border-sky-500/20",
                    record.status === "holiday" && "bg-violet-500/10 text-violet-600 border-violet-500/20",
                    record.status === "weekend" && "bg-muted text-muted-foreground"
                  )}>
                    {record.status === "weekend" ? "Weekend" : record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Leave Status</span>
                  <span className="font-semibold">{record.status === "leave" ? "On Leave" : "—"}</span>
                </div>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Leave Application</span>
                  <span className="font-semibold">{leaveTypeLabel || "—"}</span>
                </div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Holiday</span>
                  <span className="font-semibold text-right max-w-[180px] truncate">{record.status === "holiday" && record.notes ? record.notes : "—"}</span>
                </div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Leave Reason</span>
                  <span className="font-semibold text-right max-w-[180px] truncate">{matchingLeave ? matchingLeave.reason : "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Time & Attendance */}
          <div className="rounded-lg border border-border/40 overflow-hidden">
            <div className="bg-muted/40 px-3 py-1.5 border-b border-border/30">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Time & Attendance</p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-border/20">
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Punch In</span><span className="font-semibold">{record.checkIn || "—"}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Punch Out</span><span className="font-semibold">{record.checkOut || "Active"}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Punch Duration</span><span className="font-semibold">{record.checkIn ? `${record.checkIn} – ${record.checkOut || "Active"}` : "—"}</span></div>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Work Minutes</span><span className="font-semibold">{workMinutes ? `${workMinutes} min` : "—"}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Break Hours</span><span className="font-semibold">{record.breakHours}h</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Location</span>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{record.location || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Attachments */}
          {record.attachments && record.attachments.length > 0 && (
            <div className="rounded-lg border border-border/40 overflow-hidden">
              <div className="bg-muted/40 px-3 py-1.5 border-b border-border/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Attachments</p>
              </div>
              <div className="p-3">
                <div className="flex flex-wrap gap-2">
                  {record.attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/20 text-sky-600 rounded-lg px-2 py-1 text-[11px] font-semibold">
                      <span className="opacity-70">{att.title}:</span>
                      <span className="underline cursor-pointer">{att.fileName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {(() => {
            if (!record || record.status === "holiday" || record.status === "weekend") return null
            if (record.status === "leave") {
              const app = leaveApplications.find(la => selectedDayNumber >= la.startDay && selectedDayNumber <= la.endDay)
              return (
                <Button size="sm" variant="outline"
                  onClick={() => { if (app) { onCancelLeave(app.id); onOpenChange(false); } }}
                  className="h-8 border-red-500/30 hover:border-red-500 hover:bg-red-500/10 text-red-600 dark:text-red-400 gap-1 text-[11px] font-bold px-3">
                  <XCircle className="h-3.5 w-3.5" /> Cancel Leave
                </Button>
              )
            }
            return (
              <Button size="sm" variant="outline"
                onClick={() => { onOpenChange(false); onApplyLeave(); }}
                className="h-8 border-sky-500/30 hover:border-sky-500 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400 gap-1 text-[11px] font-bold px-3">
                <Coffee className="h-3.5 w-3.5" /> Apply Leave
              </Button>
            )
          })()}
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-[11px]">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
