import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CalendarOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Loader2,
  Eye,
  Download,
  FileText,
  Image as ImageIcon,
} from "lucide-react"
import Swal from "sweetalert2"
import {
  useLeaveApplicationsQuery,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
} from "@/hooks/useLeaveApplications"
import { useAuthStore } from "@/store/useAuthStore"

const isImageFile = (fileName?: string, url?: string) => {
  const name = (fileName || url || "").toLowerCase();
  return name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".webp") || name.endsWith(".gif");
};

// Type for leave application with attachments
interface LeaveApplicationDetail {
  id: string
  employeeId?: string
  employeeName: string
  employeeEmail: string
  leaveTypeName: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: string
  rejectionReason?: string
  attachments?: Array<{ id: string; title: string; fileName: string; fileUrl: string }>
}

export default function LeavePage() {
  const { user } = useAuthStore()

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All")
  const [selectedLeave, setSelectedLeave] = useState<LeaveApplicationDetail | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Helper to open dialog with leave details
  const handleViewDetails = (req: any) => {
    console.log("Opening leave details:", req)
    setSelectedLeave(req as LeaveApplicationDetail)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedLeave(null)
  }

  // API Queries & Mutations
  const { data: listResponse, isLoading } = useLeaveApplicationsQuery({
    limit: 100, // Server DTO caps at 100
  })
  const requests = listResponse?.data || []

  const approveMutation = useApproveLeaveMutation()
  const rejectMutation = useRejectLeaveMutation()

  // Action Handlers
  const handleApprove = (id: string) => {
    approveMutation.mutate(
      { id, payload: { status: "Approved" } },
      {
        onSuccess: () => {
          Swal.fire({
            title: "Approved!",
            text: "The leave request has been approved successfully.",
            icon: "success",
            confirmButtonText: "Done",
            buttonsStyling: false,
            customClass: { confirmButton: "swal2-confirm swal2-styled px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-xs font-semibold" }
          })
        },
        onError: (err: any) => {
          Swal.fire({
            title: "Failed to Approve",
            text: err?.response?.data?.message || err?.message || "An error occurred.",
            icon: "error",
          })
        }
      }
    )
  }

  const handleReject = (id: string) => {
    Swal.fire({
      title: "Reject Request?",
      text: "Provide a reason to reject this leave request:",
      icon: "warning",
      input: "text",
      inputPlaceholder: "Reason for rejection...",
      showCancelButton: true,
      confirmButtonText: "Yes, reject it",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-destructive hover:bg-destructive/90 text-white px-4 py-2 rounded-md mr-2 text-xs font-semibold",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-md text-xs font-semibold"
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const rejectionReason = result.value || "No reason provided"
        rejectMutation.mutate(
          { id, payload: { status: "Rejected", rejectionReason } },
          {
            onSuccess: () => {
              Swal.fire({
                title: "Rejected!",
                text: "Leave request status updated to Rejected.",
                icon: "info",
                confirmButtonText: "Done",
                buttonsStyling: false,
                customClass: { confirmButton: "swal2-confirm swal2-styled px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-xs font-semibold" }
              })
            },
            onError: (err: any) => {
              Swal.fire({
                title: "Failed to Reject",
                text: err?.response?.data?.message || err?.message || "An error occurred.",
                icon: "error",
              })
            }
          }
        )
      }
    })
  }

  // Filter & Search Logic
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch =
        req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.leaveTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.reason.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "All" ? true : req.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [requests, searchTerm, statusFilter])

  // Counters (single-pass memoized)
  const counts = useMemo(() => {
    const c = { Pending: 0, Approved: 0, Rejected: 0 }
    for (const r of requests) {
      if (r.status in c) c[r.status as keyof typeof c]++
    }
    return c
  }, [requests])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leave Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Review, authorize, and log employee leave requests</p>
        </div>
      </div>

      {/* KPI Cards section */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Approval</span>
            <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{counts.Pending}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approved Requests</span>
            <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">{counts.Approved}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rejected Requests</span>
            <p className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-500">{counts.Rejected}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
            <XCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main List Container */}
      <div className="space-y-4">
        {/* Search, Filter controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, type, or reason..."
              className="pl-9 bg-transparent border-border/60 hover:border-border transition-colors text-xs h-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
              <SelectTrigger className="w-36 text-xs h-9 bg-transparent border-border/60">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" className="text-xs">All Requests</SelectItem>
                <SelectItem value="Pending" className="text-xs">Pending Only</SelectItem>
                <SelectItem value="Approved" className="text-xs">Approved Only</SelectItem>
                <SelectItem value="Rejected" className="text-xs">Rejected Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Requests Table */}
        <div className="w-full overflow-x-auto bg-transparent">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Loading leave requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border/60 rounded-2xl bg-muted/5">
              <CalendarOff className="h-8 w-8 text-muted-foreground/35 mx-auto mb-2" />
              <p className="text-sm font-semibold text-muted-foreground">No leave requests found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try modifying your search or filter keywords</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/10 border-b border-border/30">
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead className="font-semibold text-xs text-muted-foreground">Employee</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Type</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Duration</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Reason</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                  <TableHead className="w-36 font-semibold text-xs text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow key={req.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                    <TableCell className="py-3">
                      <div>
                        <p className="font-semibold text-sm">{req.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{req.employeeEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="secondary" className="text-[10px] font-bold tracking-wide uppercase">
                        {req.leaveTypeName}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="text-xs">
                        <p className="font-semibold text-primary">
                          {new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-muted-foreground text-[10px]">{req.days} {req.days === 1 ? "day" : "days"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 max-w-xs truncate text-xs text-muted-foreground" title={req.reason}>
                      {req.reason}
                    </TableCell>
                    <TableCell className="py-3">
                      <div>
                        <Badge
                          className={req.status === "Approved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10" : req.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10" : "bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/10"}
                        >
                          {req.status}
                        </Badge>
                        {req.status === "Rejected" && req.rejectionReason && (
                          <p className="text-[9px] text-rose-500 font-medium max-w-[120px] truncate" title={req.rejectionReason}>
                            Reason: {req.rejectionReason}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="inline-flex gap-2 justify-end items-center">
                        {/* View Details Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(req)}
                          className="h-8 w-8 p-0 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          title="View details & attachments"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {req.status === "Pending" ? (
                          (user?.role === "admin" || user?.role === "hr") ? (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApprove(req.id)}
                                className="h-8 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white border-none"
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(req.id)}
                                className="h-8 text-xs font-semibold border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
                              >
                                Reject
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Pending</span>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Processed</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Leave Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Leave Application Details</DialogTitle>
            <DialogDescription>
              Review the leave request and attached documents before taking action.
            </DialogDescription>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-4 py-2">
              {/* Employee Info */}
              <div className="rounded-lg border border-border/40 overflow-hidden">
                <div className="bg-muted/40 px-3 py-1.5 border-b border-border/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Employee Info</p>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-semibold">{selectedLeave.employeeName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-semibold">{selectedLeave.employeeEmail}</span>
                  </div>
                </div>
              </div>

              {/* Leave Details */}
              <div className="rounded-lg border border-border/40 overflow-hidden">
                <div className="bg-muted/40 px-3 py-1.5 border-b border-border/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Leave Details</p>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant="secondary" className="text-[10px]">{selectedLeave.leaveTypeName}</Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-semibold">
                      {new Date(selectedLeave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(selectedLeave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Days</span>
                    <span className="font-semibold">{selectedLeave.days} {selectedLeave.days === 1 ? "day" : "days"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      className={selectedLeave.status === "Approved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : selectedLeave.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"}
                    >
                      {selectedLeave.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="rounded-lg border border-border/40 overflow-hidden">
                <div className="bg-muted/40 px-3 py-1.5 border-b border-border/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Reason</p>
                </div>
                <div className="p-3">
                  <p className="text-xs text-muted-foreground">{selectedLeave.reason}</p>
                  {selectedLeave.status === "Rejected" && selectedLeave.rejectionReason && (
                    <p className="text-xs text-rose-500 font-medium mt-2">
                      Rejection reason: {selectedLeave.rejectionReason}
                    </p>
                  )}
                </div>
              </div>

              {/* Attachments */}
              <div className="rounded-lg border border-border/40 overflow-hidden">
                <div className="bg-muted/40 px-3 py-1.5 border-b border-border/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Attachments ({Array.isArray(selectedLeave.attachments) ? selectedLeave.attachments.length : 0})
                  </p>
                </div>
                <div className="p-3">
                  {Array.isArray(selectedLeave.attachments) && selectedLeave.attachments.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {selectedLeave.attachments.map((att, index) => {
                        const isImg = isImageFile(att.fileName, att.fileUrl);
                        return (
                          <a
                            key={att.id || `att-${index}`}
                            href={att.fileUrl || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 p-2 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors group"
                          >
                            {isImg ? (
                              <ImageIcon className="h-5 w-5 text-emerald-500 shrink-0" />
                            ) : (
                              <FileText className="h-5 w-5 text-sky-500 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{att.title || "Untitled"}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{att.fileName || "Unknown file"}</p>
                            </div>
                            <Download className="h-4 w-4 text-muted-foreground group-hover:text-sky-500 shrink-0" />
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No attachments uploaded</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
            {selectedLeave && selectedLeave.status === "Pending" && (user?.role === "admin" || user?.role === "hr") && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    handleApprove(selectedLeave.id);
                    handleCloseDialog();
                  }}
                  className="h-8 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white border-none animate-fade-in"
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleReject(selectedLeave.id);
                    handleCloseDialog();
                  }}
                  className="h-8 text-xs font-semibold border-rose-500/20 text-rose-500 hover:bg-rose-500/10 animate-fade-in"
                >
                  Reject
                </Button>
              </>
            )}
            
            <Button variant="outline" size="sm" onClick={handleCloseDialog}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
