import { useState } from "react"
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
import { Coffee, Image as ImageIcon, ChevronDown, ChevronUp } from "lucide-react"
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
  onEditLeave?: (app: any) => void
  viewMode?: "leave" | "regular"
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

const formatDateDMY = (dateStr?: string) => {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "—"
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
  } catch {
    return "—"
  }
}

const formatDateTimeDMY = (dateStr?: string) => {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "—"
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    
    let hours = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, "0")
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12
    hours = hours ? hours : 12
    const hoursStr = String(hours).padStart(2, "0")
    
    return `${day}-${month}-${year} ${hoursStr}:${minutes} ${ampm}`
  } catch {
    return "—"
  }
}



export function DayDetailDialog({
  open,
  onOpenChange,
  selectedDayNumber,
  calMonth,
  calYear,
  record,
  leaveApplications,
  balances: _balances,
  onCancelLeave: _onCancelLeave,
  onApplyLeave,
  onEditLeave: _onEditLeave,
  viewMode = "regular",
}: DayDetailDialogProps) {
  const { user } = useAuthStore()
  const [docsOpen, setDocsOpen] = useState(true)
  const [historyOpen, setHistoryOpen] = useState(true)
  const { data: department } = useDepartmentQuery(user?.departmentId || "")
  const { data: designation } = useDesignationQuery(user?.designationId || "")
  const { data: settings } = useAttendanceSettingsQuery()

  if (!record) return null

  const matchingLeave = leaveApplications.find(la => selectedDayNumber >= la.startDay && selectedDayNumber <= la.endDay) as any
  const workMinutes = record.hours ? Math.round(record.hours * 60) : null

  const rosterStart = settings?.startTime ? convert24to12(settings.startTime) : "10:00 AM"
  const rosterEnd = settings?.endTime ? convert24to12(settings.endTime) : "06:00 PM"
  
  const getDurationHours = (start?: string, end?: string): number => {
    if (!start || !end) return 8
    const [sH, sM] = start.split(":").map(Number)
    const [eH, eM] = end.split(":").map(Number)
    return eH - sH + (eM - sM) / 60
  }
  const duration = getDurationHours(settings?.startTime, settings?.endTime)

  const showLeaveMode = viewMode === "leave" && matchingLeave
  const selectedLeave = matchingLeave?.rawLeave || matchingLeave

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6 sm:max-w-[800px]">
        {showLeaveMode ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-base font-bold text-[#0c624d]">
                Leave Request Details
              </DialogTitle>
              <DialogDescription className="text-center text-xs">
                Review detailed leave application information.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-6 py-2">
              {/* Two-column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column Box */}
                <div className="border border-[#badbcc] rounded-md overflow-hidden bg-white shadow-sm">
                  <div className="bg-[#f5f9f6] px-3 py-2 border-b border-[#badbcc]">
                    <h3 className="text-xs font-bold text-[#0c624d] uppercase tracking-wide">Leave Application</h3>
                  </div>
                  <table className="w-full text-[11px] border-collapse">
                    <tbody>
                      <tr className="border-b border-[#dee2e6]">
                        <td className="w-1/3 bg-[#fdfdfd] p-2 font-bold text-[#0c624d] border-r border-[#dee2e6]">Employee :</td>
                        <td className="p-2 font-bold text-gray-800">{selectedLeave.employeeName || user?.fullNameEnglish || "—"}</td>
                      </tr>
                      <tr className="border-b border-[#dee2e6]">
                        <td className="bg-[#fdfdfd] p-2 font-bold text-[#0c624d] border-r border-[#dee2e6]">Apply Date :</td>
                        <td className="p-2 font-bold text-gray-800">{formatDateDMY(selectedLeave.createdAt)}</td>
                      </tr>
                      <tr>
                        <td className="bg-[#fdfdfd] p-2 font-bold text-[#0c624d] border-r border-[#dee2e6]">Date Range :</td>
                        <td className="p-2 font-bold text-[#0c624d]">{formatDateDMY(selectedLeave.startDate)} - {formatDateDMY(selectedLeave.endDate)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Right Column Box */}
                <div className="border border-[#badbcc] rounded-md overflow-hidden bg-white shadow-sm">
                  <div className="bg-[#f5f9f6] px-3 py-2 border-b border-[#badbcc]">
                    <h3 className="text-xs font-bold text-[#0c624d] uppercase tracking-wide">Leave Application</h3>
                  </div>
                  <table className="w-full text-[11px] border-collapse">
                    <tbody>
                      <tr className="border-b border-[#dee2e6]">
                        <td className="w-2/5 bg-[#fdfdfd] p-2 font-bold text-[#0c624d] border-r border-[#dee2e6]">Leave Name :</td>
                        <td className="p-2 font-bold text-gray-800">{selectedLeave.leaveTypeName || "Leave"}</td>
                      </tr>
                      <tr className="border-b border-[#dee2e6]">
                        <td className="bg-[#fdfdfd] p-2 font-bold text-[#0c624d] border-r border-[#dee2e6]">Pay Type :</td>
                        <td className="p-2 font-bold text-gray-800">{selectedLeave.leaveTypePaid ? "Paid Leave" : "Unpaid Leave"}</td>
                      </tr>
                      <tr>
                        <td className="bg-[#fdfdfd] p-2 font-bold text-[#0c624d] border-r border-[#dee2e6]">Approval Status :</td>
                        <td className="p-2">
                          <span className={cn(
                            "font-bold",
                            selectedLeave.status === "Approved" && "text-emerald-700",
                            selectedLeave.status === "Pending" && "text-amber-600",
                            selectedLeave.status === "Rejected" && "text-rose-600"
                          )}>
                            {selectedLeave.status}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Application Documents Section */}
              <div className="space-y-2">
                <div
                  className="flex items-center justify-between gap-1 text-[13px] font-bold text-[#0c624d] hover:text-[#0c624d]/80 transition-colors cursor-pointer select-none bg-[#f5f9f6] border border-[#badbcc] rounded-md px-3 py-2"
                  onClick={() => setDocsOpen(!docsOpen)}
                >
                  <span>Application Documents</span>
                  {docsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
                {docsOpen && (
                  <div className="border border-[#dee2e6] rounded-md overflow-hidden bg-white shadow-sm transition-all duration-200">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-[#f8f9fa] text-gray-700 border-b border-[#dee2e6]">
                          <th className="w-12 p-2.5 border-r border-[#dee2e6] font-bold text-center">SL</th>
                          <th className="p-2.5 border-r border-[#dee2e6] font-bold text-left">Name</th>
                          <th className="p-2.5 border-r border-[#dee2e6] font-bold text-left">Document Extension</th>
                          <th className="w-24 p-2.5 font-bold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedLeave.attachments && selectedLeave.attachments.length > 0 ? (
                          selectedLeave.attachments.map((att: any, idx: number) => {
                            const extension = att.fileName.split(".").pop() || "unknown";
                            return (
                              <tr key={att.id || idx} className="border-b border-[#dee2e6] hover:bg-gray-50/50">
                                <td className="p-2 border-r border-[#dee2e6] text-center">{idx + 1}</td>
                                <td className="p-2 border-r border-[#dee2e6] text-left font-medium">{att.title || att.fileName}</td>
                                <td className="p-2 border-r border-[#dee2e6] text-left">{extension}</td>
                                <td className="p-2 text-center">
                                  <a
                                    href={att.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center p-1 rounded hover:bg-rose-50 text-rose-600 transition-colors"
                                  >
                                    <ImageIcon className="h-4 w-4" />
                                  </a>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-gray-400 italic">No documents uploaded</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Application Approval History Section */}
              <div className="space-y-2">
                <div
                  className="flex items-center justify-between gap-1 text-[13px] font-bold text-[#0c624d] hover:text-[#0c624d]/80 transition-colors cursor-pointer select-none bg-[#f5f9f6] border border-[#badbcc] rounded-md px-3 py-2"
                  onClick={() => setHistoryOpen(!historyOpen)}
                >
                  <span>Application Approval History</span>
                  {historyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
                {historyOpen && (
                  <div className="border border-[#dee2e6] rounded-md overflow-hidden bg-white shadow-sm transition-all duration-200">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-[#f8f9fa] text-gray-700 border-b border-[#dee2e6]">
                          <th className="w-12 p-2.5 border-r border-[#dee2e6] font-bold text-center">SL</th>
                          <th className="p-2.5 border-r border-[#dee2e6] font-bold text-left">Activity by</th>
                          <th className="p-2.5 border-r border-[#dee2e6] font-bold text-left">Time</th>
                          <th className="p-2.5 border-r border-[#dee2e6] font-bold text-left">Type</th>
                          <th className="p-2.5 font-bold text-left">Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const history = [];
                          
                          history.push({
                            sl: 1,
                            activityBy: selectedLeave.employeeName || user?.fullNameEnglish || "—",
                            time: selectedLeave.createdAt ? formatDateTimeDMY(selectedLeave.createdAt) : "—",
                            type: "Applied",
                            remark: selectedLeave.reason || "—"
                          });

                          if (selectedLeave.status === "Approved") {
                            history.push({
                              sl: 2,
                              activityBy: selectedLeave.approvedByName || "Admin",
                              time: selectedLeave.approvedAt ? formatDateTimeDMY(selectedLeave.approvedAt) : "—",
                              type: "Final Approved",
                              remark: ""
                            });
                          } else if (selectedLeave.status === "Rejected") {
                            history.push({
                              sl: 2,
                              activityBy: selectedLeave.approvedByName || "Admin",
                              time: selectedLeave.rejectedAt ? formatDateTimeDMY(selectedLeave.rejectedAt) : "—",
                              type: "Rejected",
                              remark: selectedLeave.rejectionReason || "No reason provided"
                            });
                          } else {
                            history.push({
                              sl: 2,
                              activityBy: "—",
                              time: "—",
                              type: "Pending Final Approval",
                              remark: ""
                            });
                          }
                          return history;
                        })().map((row) => (
                          <tr key={row.sl} className="border-b border-[#dee2e6] hover:bg-gray-50/50">
                            <td className="p-2 border-r border-[#dee2e6] text-center">{row.sl}</td>
                            <td className="p-2 border-r border-[#dee2e6] text-left font-medium">{row.activityBy}</td>
                            <td className="p-2 border-r border-[#dee2e6] text-left">{row.time}</td>
                            <td className="p-2 border-r border-[#dee2e6] text-left font-medium">{row.type}</td>
                            <td className="p-2 text-left text-gray-500">{row.remark || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 border-[#f08135] text-[#f08135] hover:bg-[#f08135]/10 text-[11px] font-bold"
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
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
                      <span className="font-semibold capitalize">{matchingLeave ? matchingLeave.status : "—"}</span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Leave Application</span>
                      <span className="font-semibold">{matchingLeave ? (matchingLeave.rawLeave?.leaveTypeName || "Leave") : "—"}</span>
                    </div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Holiday</span>
                      <span className="font-semibold text-right max-w-[180px] truncate">{record.status === "holiday" && record.notes ? record.notes : "—"}</span>
                    </div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Leave Reason</span>
                      <span className="font-semibold text-right max-w-[180px] truncate">{matchingLeave ? (matchingLeave.reason || "—") : "—"}</span>
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


            </div>

            <DialogFooter className="gap-2 mt-4">
              {(() => {
                if (!record || record.status === "holiday" || record.status === "weekend") return null
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
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

