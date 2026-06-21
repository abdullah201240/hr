import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Image as ImageIcon } from "lucide-react"

interface LeaveApplicationDetail {
  id: string
  employeeId?: string
  employeeName: string
  employeeEmail: string
  employeePhone?: string
  employeeEmergencyPhone?: string
  leaveTypeId?: string
  leaveTypeName: string
  leaveTypePaid?: boolean
  leaveTypeColor?: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: string
  rejectionReason?: string
  approvedByName?: string
  approvedAt?: string
  rejectedAt?: string
  createdAt?: string
  firstApprovedAt?: string
  lineManagerId?: string
  attachments?: Array<{ id: string; title: string; fileName: string; fileUrl: string }>
}

interface LeaveDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedLeave: LeaveApplicationDetail | null
  user: any
  onApprove: (id: string) => void
  onReject: (id: string) => void
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

const getLeaveCode = (id: string) => {
  if (!id) return "LTA-00000000"
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const absHash = Math.abs(hash) % 100000000
  return `LTA-${absHash.toString().padStart(8, "0")}`
}

const getLeaveBadgeClasses = (colorName?: string) => {
  const c = colorName?.toLowerCase() || "sky"
  if (c.includes("emerald") || c.includes("green")) {
    return { bg: "bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-500/20" }
  }
  if (c.includes("amber") || c.includes("yellow") || c.includes("orange")) {
    return { bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", border: "border-amber-500/20" }
  }
  if (c.includes("rose") || c.includes("red")) {
    return { bg: "bg-rose-500/10", text: "text-rose-700 dark:text-rose-400", border: "border-rose-500/20" }
  }
  if (c.includes("violet") || c.includes("purple")) {
    return { bg: "bg-violet-500/10", text: "text-violet-700 dark:text-violet-400", border: "border-violet-500/20" }
  }
  return { bg: "bg-sky-500/10", text: "text-sky-700 dark:text-sky-400", border: "border-sky-500/20" }
}

export function LeaveDetailsDialog({
  isOpen,
  onClose,
  selectedLeave,
  user,
  onApprove,
  onReject,
}: LeaveDetailsDialogProps) {
  if (!selectedLeave) return null

  const getApprovalHistory = () => {
    const history = []

    if (selectedLeave.status === "Pending_2nd" || selectedLeave.firstApprovedAt) {
      history.push({
        sl: 1,
        activityBy: "Line Manager",
        time: selectedLeave.firstApprovedAt ? formatDateTimeDMY(selectedLeave.firstApprovedAt) : "Just now",
        type: "Line Manager Approved (1st Step)",
        remark: ""
      })
    }

    if (selectedLeave.status === "Approved") {
      history.push({
        sl: history.length + 1,
        activityBy: selectedLeave.approvedByName || "Admin",
        time: selectedLeave.approvedAt ? formatDateTimeDMY(selectedLeave.approvedAt) : "Just now",
        type: "Final Approved",
        remark: ""
      })
    } else if (selectedLeave.status === "Rejected") {
      history.push({
        sl: history.length + 1,
        activityBy: selectedLeave.approvedByName || "Admin",
        time: selectedLeave.rejectedAt ? formatDateTimeDMY(selectedLeave.rejectedAt) : "Just now",
        type: "Rejected",
        remark: selectedLeave.rejectionReason || "No reason provided"
      })
    } else if (selectedLeave.status === "Pending_2nd") {
      history.push({
        sl: history.length + 1,
        activityBy: "—",
        time: "—",
        type: "Pending Final Approval",
        remark: ""
      })
    } else {
      history.push({
        sl: 1,
        activityBy: "—",
        time: "—",
        type: "Awaiting Line Manager Approval",
        remark: ""
      })
    }
    return history
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[950px] p-6 bg-background border-border text-foreground">
        <DialogHeader className="border-b border-border/40 pb-3 mb-4">
          <DialogTitle className="text-xl font-bold text-center text-[#0c624d] dark:text-emerald-400 uppercase tracking-wide">
            Leave Request
          </DialogTitle>
          <DialogDescription className="sr-only">
            Leave request details view
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[75vh] overflow-y-auto pr-1 space-y-6 text-xs">
          {/* Two-column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column Box */}
            <div className="border border-[#badbcc] dark:border-emerald-900/30 rounded-md overflow-hidden bg-white dark:bg-card shadow-sm">
              <div className="bg-[#f5f9f6] dark:bg-emerald-950/20 px-3 py-2 border-b border-[#badbcc] dark:border-emerald-900/30">
                <h3 className="text-xs font-bold text-[#0c624d] dark:text-emerald-400 uppercase tracking-wide">Leave Application</h3>
              </div>
              <table className="w-full text-[11px] border-collapse">
                <tbody>
                  <tr className="border-b border-[#dee2e6] dark:border-border/40">
                    <td className="w-1/3 bg-[#fdfdfd] dark:bg-muted/10 p-2 font-bold text-[#0c624d] dark:text-emerald-400 border-r border-[#dee2e6] dark:border-border/40">Code :</td>
                    <td className="p-2 text-gray-700 dark:text-foreground font-medium">{getLeaveCode(selectedLeave.id)}</td>
                  </tr>
                  <tr className="border-b border-[#dee2e6] dark:border-border/40">
                    <td className="bg-[#fdfdfd] dark:bg-muted/10 p-2 font-bold text-[#0c624d] dark:text-emerald-400 border-r border-[#dee2e6] dark:border-border/40">Subject :</td>
                    <td className="p-2 text-gray-700 dark:text-foreground font-medium">Application for {selectedLeave.leaveTypeName}</td>
                  </tr>
                  <tr className="border-b border-[#dee2e6] dark:border-border/40">
                    <td className="bg-[#fdfdfd] dark:bg-muted/10 p-2 font-bold text-[#0c624d] dark:text-emerald-400 border-r border-[#dee2e6] dark:border-border/40">Employee :</td>
                    <td className="p-2 font-bold text-gray-800 dark:text-foreground">{selectedLeave.employeeName}</td>
                  </tr>
                  <tr className="border-b border-[#dee2e6] dark:border-border/40">
                    <td className="bg-[#fdfdfd] dark:bg-muted/10 p-2 font-bold text-[#0c624d] dark:text-emerald-400 border-r border-[#dee2e6] dark:border-border/40">Apply Date :</td>
                    <td className="p-2 font-bold text-gray-800 dark:text-foreground">{formatDateDMY(selectedLeave.createdAt)}</td>
                  </tr>
                  <tr className="border-b border-[#dee2e6] dark:border-border/40">
                    <td className="bg-[#fdfdfd] dark:bg-muted/10 p-2 font-bold text-[#0c624d] dark:text-emerald-400 border-r border-[#dee2e6] dark:border-border/40">Date Range :</td>
                    <td className="p-2 font-bold text-[#0c624d] dark:text-emerald-300">{formatDateDMY(selectedLeave.startDate)} - {formatDateDMY(selectedLeave.endDate)}</td>
                  </tr>
                  <tr className="border-b border-[#dee2e6] dark:border-border/40">
                    <td className="bg-[#fdfdfd] dark:bg-muted/10 p-2 font-bold text-[#0c624d] dark:text-emerald-400 border-r border-[#dee2e6] dark:border-border/40">Contact No :</td>
                    <td className="p-2 text-gray-700 dark:text-foreground font-medium">{selectedLeave.employeePhone || "01791545892"}</td>
                  </tr>
                  <tr className="border-b border-[#dee2e6] dark:border-border/40">
                    <td className="bg-[#fdfdfd] dark:bg-muted/10 p-2 font-bold text-[#0c624d] dark:text-emerald-400 border-r border-[#dee2e6] dark:border-border/40">Emergency Contact :</td>
                    <td className="p-2 text-gray-700 dark:text-foreground font-medium">{selectedLeave.employeeEmergencyPhone || "01791545892"}</td>
                  </tr>
                  <tr>
                    <td className="bg-[#fdfdfd] dark:bg-muted/10 p-2 font-bold text-[#0c624d] dark:text-emerald-400 border-r border-[#dee2e6] dark:border-border/40">Logs :</td>
                    <td className="p-2 text-gray-700 dark:text-foreground font-medium"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right Column Box */}
            <div className="border border-[#badbcc] dark:border-emerald-900/30 rounded-md overflow-hidden bg-white dark:bg-card shadow-sm">
              <div className="bg-[#f5f9f6] dark:bg-emerald-950/20 px-3 py-2 border-b border-[#badbcc] dark:border-emerald-900/30">
                <h3 className="text-xs font-bold text-[#0c624d] dark:text-emerald-400 uppercase tracking-wide">Leave Application</h3>
              </div>
              <table className="w-full text-[11px] border-collapse">
                <tbody>
                  <tr className="border-b border-[#dee2e6] dark:border-border/40">
                    <td className="w-2/5 bg-[#fdfdfd] dark:bg-muted/10 p-2 font-bold text-[#0c624d] dark:text-emerald-400 border-r border-[#dee2e6] dark:border-border/40">Leave Name :</td>
                    <td className="p-2">
                      {(() => {
                        const c = getLeaveBadgeClasses(selectedLeave.leaveTypeColor)
                        return (
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.bg} ${c.text} ${c.border} border`}>
                            {selectedLeave.leaveTypeName}
                          </span>
                        )
                      })()}
                    </td>
                  </tr>
                  <tr className="border-b border-[#dee2e6] dark:border-border/40">
                    <td className="bg-[#fdfdfd] dark:bg-muted/10 p-2 font-bold text-[#0c624d] dark:text-emerald-400 border-r border-[#dee2e6] dark:border-border/40">Pay Type :</td>
                    <td className="p-2 font-bold text-gray-800 dark:text-foreground">{selectedLeave.leaveTypePaid ? "Paid Leave" : "Unpaid Leave"}</td>
                  </tr>
                  <tr className="border-b border-[#dee2e6] dark:border-border/40">
                    <td className="bg-[#fdfdfd] dark:bg-muted/10 p-2 font-bold text-[#0c624d] dark:text-emerald-400 border-r border-[#dee2e6] dark:border-border/40">Assigned By/ Supporting Person :</td>
                    <td className="p-2 text-gray-700 dark:text-foreground font-medium"></td>
                  </tr>
                  <tr className="border-b border-[#dee2e6] dark:border-border/40">
                    <td className="bg-[#fdfdfd] dark:bg-muted/10 p-2 font-bold text-[#0c624d] dark:text-emerald-400 border-r border-[#dee2e6] dark:border-border/40">Full Address :</td>
                    <td className="p-2 text-gray-700 dark:text-foreground font-medium"></td>
                  </tr>
                  <tr className="border-b border-[#dee2e6] dark:border-border/40">
                    <td className="bg-[#fdfdfd] dark:bg-muted/10 p-2 font-bold text-[#0c624d] dark:text-emerald-400 border-r border-[#dee2e6] dark:border-border/40">Description :</td>
                    <td className="p-2 text-gray-700 dark:text-foreground font-medium">{selectedLeave.reason || "—"}</td>
                  </tr>
                  <tr className="border-b border-[#dee2e6] dark:border-border/40">
                    <td className="bg-[#fdfdfd] dark:bg-muted/10 p-2 font-bold text-[#0c624d] dark:text-emerald-400 border-r border-[#dee2e6] dark:border-border/40">Approval Remark :</td>
                    <td className="p-2 text-gray-700 dark:text-foreground font-medium">{selectedLeave.rejectionReason || "—"}</td>
                  </tr>
                  <tr>
                    <td className="bg-[#fdfdfd] dark:bg-muted/10 p-2 font-bold text-[#0c624d] dark:text-emerald-400 border-r border-[#dee2e6] dark:border-border/40">Approval Status :</td>
                    <td className="p-2">
                      <span className={
                        selectedLeave.status === "Approved" ? "font-bold text-emerald-700 dark:text-emerald-400" :
                        selectedLeave.status === "Pending" ? "font-bold text-amber-600 dark:text-amber-400" :
                        selectedLeave.status === "Pending_2nd" ? "font-bold text-sky-600 dark:text-sky-400" :
                        "font-bold text-rose-600 dark:text-rose-400"
                      }>
                        {selectedLeave.status === "Pending_2nd" ? "Pending 2nd Step" : selectedLeave.status}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Application Documents Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-[13px] font-bold text-rose-800 dark:text-rose-400">
              <span>Application Documents</span>
              <span className="text-[10px] select-none">▼</span>
            </div>
            <div className="border border-[#dee2e6] dark:border-border/40 rounded-md overflow-hidden bg-white dark:bg-card shadow-sm">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] dark:bg-muted/30 text-gray-700 dark:text-foreground border-b border-[#dee2e6] dark:border-border/40">
                    <th className="w-12 p-2.5 border-r border-[#dee2e6] dark:border-border/40 font-bold text-center">SL</th>
                    <th className="p-2.5 border-r border-[#dee2e6] dark:border-border/40 font-bold text-left">Name</th>
                    <th className="p-2.5 border-r border-[#dee2e6] dark:border-border/40 font-bold text-left">Document Extension</th>
                    <th className="w-24 p-2.5 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLeave.attachments && selectedLeave.attachments.length > 0 ? (
                    selectedLeave.attachments.map((att, idx) => {
                      const extension = att.fileName.split(".").pop() || "unknown";
                      return (
                        <tr key={att.id || idx} className="border-b border-[#dee2e6] dark:border-border/20 hover:bg-muted/10 transition-colors">
                          <td className="p-2 border-r border-[#dee2e6] dark:border-border/20 text-center">{idx + 1}</td>
                          <td className="p-2 border-r border-[#dee2e6] dark:border-border/20 text-left font-medium">{att.title || att.fileName}</td>
                          <td className="p-2 border-r border-[#dee2e6] dark:border-border/20 text-left">{extension}</td>
                          <td className="p-2 text-center">
                            <a
                              href={att.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center p-1 rounded hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors"
                            >
                              <ImageIcon className="h-4 w-4" />
                            </a>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground italic">No documents uploaded</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Application Approval History Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-[13px] font-bold text-rose-800 dark:text-rose-400">
              <span>Application Approval History</span>
              <span className="text-[10px] select-none">▼</span>
            </div>
            <div className="border border-[#dee2e6] dark:border-border/40 rounded-md overflow-hidden bg-white dark:bg-card shadow-sm">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] dark:bg-muted/30 text-gray-700 dark:text-foreground border-b border-[#dee2e6] dark:border-border/40">
                    <th className="w-12 p-2.5 border-r border-[#dee2e6] dark:border-border/40 font-bold text-center">SL</th>
                    <th className="p-2.5 border-r border-[#dee2e6] dark:border-border/40 font-bold text-left">Activity by</th>
                    <th className="p-2.5 border-r border-[#dee2e6] dark:border-border/40 font-bold text-left">Time</th>
                    <th className="p-2.5 border-r border-[#dee2e6] dark:border-border/40 font-bold text-left">Type</th>
                    <th className="p-2.5 font-bold text-left">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {getApprovalHistory().map((row) => (
                    <tr key={row.sl} className="border-b border-[#dee2e6] dark:border-border/20 hover:bg-muted/10 transition-colors">
                      <td className="p-2 border-r border-[#dee2e6] dark:border-border/20 text-center">{row.sl}</td>
                      <td className="p-2 border-r border-[#dee2e6] dark:border-border/20 text-left font-medium">{row.activityBy}</td>
                      <td className="p-2 border-r border-[#dee2e6] dark:border-border/20 text-left">{row.time}</td>
                      <td className="p-2 border-r border-[#dee2e6] dark:border-border/20 text-left font-medium">{row.type}</td>
                      <td className="p-2 text-left text-muted-foreground">{row.remark || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border/40 mt-4">
          {selectedLeave && (
            (() => {
              const isPending1st = selectedLeave.status === "Pending";
              const isPending2nd = selectedLeave.status === "Pending_2nd";
              const isLineManager = selectedLeave.lineManagerId === user?.id;
              const hasApprovePerm = user?.permissions?.includes("leave:approve");

              const canAction = (isPending1st && (isLineManager || (!selectedLeave.lineManagerId && hasApprovePerm))) ||
                                (isPending2nd && hasApprovePerm);

              if (!canAction) return null;

              return (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      onApprove(selectedLeave.id)
                      onClose()
                    }}
                    className="h-8 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white border-none shadow-sm transition-colors"
                  >
                    {isPending2nd ? "Approve (2nd Step)" : "Approve"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onReject(selectedLeave.id)
                      onClose()
                    }}
                    className="h-8 text-xs font-semibold border-rose-500/20 text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 shadow-sm transition-colors"
                  >
                    Reject
                  </Button>
                </>
              );
            })()
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs bg-[#f0ad4e] hover:bg-[#ec971f] dark:bg-amber-600 dark:hover:bg-amber-700 hover:text-white text-white border-none px-6 rounded-md shadow-sm transition-colors font-semibold"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
