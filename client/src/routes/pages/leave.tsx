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
  CalendarOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Loader2,
  Download,
} from "lucide-react"
import Swal from "sweetalert2"
import {
  useLeaveApplicationsQuery,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
} from "@/hooks/useLeaveApplications"

export default function LeavePage() {
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All")

  // API Queries & Mutations
  const { data: listResponse, isLoading } = useLeaveApplicationsQuery({
    limit: 1000, // Load all for complete sorting and stats
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
                  <TableHead className="font-semibold text-xs text-muted-foreground">Attachments</TableHead>
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
                      {req.attachments && req.attachments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {req.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={att.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex"
                            >
                              <Badge
                                variant="outline"
                                className="text-[9px] bg-sky-500/5 text-sky-600 dark:text-sky-400 border-sky-500/20 max-w-[120px] truncate hover:bg-sky-500/10 cursor-pointer flex items-center gap-1"
                                title={`Download: ${att.title}`}
                              >
                                <Download className="h-2 w-2" />
                                {att.title}
                              </Badge>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/40 italic">—</span>
                      )}
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
                      {req.status === "Pending" ? (
                        <div className="inline-flex gap-2 justify-end">
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
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Processed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  )
}
