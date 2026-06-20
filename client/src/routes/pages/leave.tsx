import { useState, useMemo, useCallback } from "react"
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
import { LeaveDetailsDialog } from "@/components/leave/leave-details-dialog"
import {
  CalendarOff,
  CheckCircle2,
  Search,
  Filter,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import Swal from "sweetalert2"
import { toast } from "sonner"
import {
  useLeaveApplicationsQuery,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
} from "@/hooks/useLeaveApplications"
import { useLeaveTypeOptionsQuery } from "@/hooks/useLeaveTypes"
import { useAuthStore } from "@/store/useAuthStore"

// ─── Leave type color helper ────────────────────────────────────────────────
// Maps DB color classes (e.g. "bg-sky-500") to badge styles
const LEAVE_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  "bg-sky-500":     { bg: "bg-sky-500/10",     text: "text-sky-600 dark:text-sky-400",         border: "border-sky-500/20" },
  "bg-rose-500":    { bg: "bg-rose-500/10",     text: "text-rose-600 dark:text-rose-400",       border: "border-rose-500/20" },
  "bg-amber-500":   { bg: "bg-amber-500/10",    text: "text-amber-600 dark:text-amber-400",     border: "border-amber-500/20" },
  "bg-orange-500":  { bg: "bg-orange-500/10",   text: "text-orange-600 dark:text-orange-400",   border: "border-orange-500/20" },
  "bg-red-600":     { bg: "bg-red-600/10",      text: "text-red-600 dark:text-red-400",         border: "border-red-600/20" },
  "bg-emerald-500": { bg: "bg-emerald-500/10",  text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
  "bg-violet-500":  { bg: "bg-violet-500/10",   text: "text-violet-600 dark:text-violet-400",   border: "border-violet-500/20" },
  "bg-indigo-500":  { bg: "bg-indigo-500/10",   text: "text-indigo-600 dark:text-indigo-400",   border: "border-indigo-500/20" },
  "bg-pink-500":    { bg: "bg-pink-500/10",     text: "text-pink-600 dark:text-pink-400",       border: "border-pink-500/20" },
  "bg-teal-500":    { bg: "bg-teal-500/10",     text: "text-teal-600 dark:text-teal-400",       border: "border-teal-500/20" },
  "bg-cyan-500":    { bg: "bg-cyan-500/10",     text: "text-cyan-600 dark:text-cyan-400",       border: "border-cyan-500/20" },
  "bg-lime-500":    { bg: "bg-lime-500/10",     text: "text-lime-600 dark:text-lime-400",       border: "border-lime-500/20" },
  "bg-blue-500":    { bg: "bg-blue-500/10",     text: "text-blue-600 dark:text-blue-400",       border: "border-blue-500/20" },
  "bg-green-500":   { bg: "bg-green-500/10",    text: "text-green-600 dark:text-green-400",     border: "border-green-500/20" },
  "bg-yellow-500":  { bg: "bg-yellow-500/10",   text: "text-yellow-600 dark:text-yellow-400",   border: "border-yellow-500/20" },
  "bg-purple-500":  { bg: "bg-purple-500/10",   text: "text-purple-600 dark:text-purple-400",   border: "border-purple-500/20" },
}
const DEFAULT_LEAVE_COLOR = { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", border: "border-slate-500/20" }

const getLeaveBadgeClasses = (color?: string) => {
  if (!color) return DEFAULT_LEAVE_COLOR
  return LEAVE_COLOR_MAP[color] || DEFAULT_LEAVE_COLOR
}

// Type for leave application with attachments
interface LeaveApplicationDetail {
  id: string
  employeeId?: string
  employeeName: string
  employeeEmail: string
  employeeIdCode?: string
  employeePhone?: string
  employeeEmergencyPhone?: string
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
  attachments?: Array<{ id: string; title: string; fileName: string; fileUrl: string }>
}

export default function LeavePage() {
  const { user } = useAuthStore()

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("all")
  const [selectedLeave, setSelectedLeave] = useState<LeaveApplicationDetail | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Pagination & Sort States
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Fetch leave type options for filter dropdown
  const { data: leaveTypeOptions } = useLeaveTypeOptionsQuery()

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const searchTimeoutRef = useState<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    if (searchTimeoutRef[0]) clearTimeout(searchTimeoutRef[0])
    searchTimeoutRef[0] = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1) // Reset to page 1 on search
    }, 400)
  }, [])

  // Reset page on filter change
  const handleStatusChange = useCallback((val: string) => {
    setStatusFilter(val)
    setPage(1)
  }, [])

  const handleLeaveTypeChange = useCallback((val: string) => {
    setLeaveTypeFilter(val)
    setPage(1)
  }, [])

  const handlePageSizeChange = useCallback((val: string) => {
    setPageSize(Number(val))
    setPage(1)
  }, [])

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

  // Build query params for server-side filtering/pagination
  const queryParams = useMemo(() => ({
    page,
    limit: pageSize,
    search: debouncedSearch || undefined,
    status: statusFilter !== "All" ? (statusFilter as "Pending" | "Approved" | "Rejected") : undefined,
    leaveTypeId: leaveTypeFilter !== "all" ? leaveTypeFilter : undefined,
    sortBy,
    sortOrder,
  }), [page, pageSize, debouncedSearch, statusFilter, leaveTypeFilter, sortBy, sortOrder])

  // API Queries & Mutations
  const { data: listResponse, isLoading, isFetching } = useLeaveApplicationsQuery(queryParams)
  const requests = listResponse?.data || []
  const meta = listResponse?.meta || { total: 0, page: 1, limit: 10, totalPages: 0 }

  const approveMutation = useApproveLeaveMutation()
  const rejectMutation = useRejectLeaveMutation()

  // Action Handlers
  const handleApprove = (id: string) => {
    setIsDialogOpen(false) // Close detail dialog if open
    approveMutation.mutate(
      { id, payload: { status: "Approved" } },
      {
        onSuccess: () => {
          toast.success("Leave request approved successfully.")
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || err?.message || "An error occurred.")
        }
      }
    )
  }

  const handleReject = (id: string) => {
    setIsDialogOpen(false) // Close detail dialog if open
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
              toast.success("Leave request rejected.")
            },
            onError: (err: any) => {
              toast.error(err?.response?.data?.message || err?.message || "An error occurred.")
            }
          }
        )
      }
    })
  }

  // Filter & Search Logic
  const filteredRequests = requests // Server-side filtering applied

  // Counters from meta
  const totalCount = meta.total

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
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Records</span>
            <p className="text-3xl font-bold tracking-tight text-sky-600 dark:text-sky-500">{totalCount}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
            <CalendarOff className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Page</span>
            <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">{meta.page} <span className="text-sm text-muted-foreground">of {meta.totalPages || 1}</span></p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Page Size</span>
            <p className="text-3xl font-bold tracking-tight text-violet-600 dark:text-violet-500">{pageSize}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
            <Filter className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main List Container */}
      <div className="space-y-4">
        {/* Search, Filter controls */}
        <div className="flex flex-col gap-3">
          {/* Row 1: Search + Status + Leave Type */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, type, or reason..."
                className="pl-9 bg-transparent border-border/60 hover:border-border transition-colors text-xs h-9"
                value={searchTerm}
                onChange={e => handleSearchChange(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-36 text-xs h-9 bg-transparent border-border/60">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All" className="text-xs">All Status</SelectItem>
                  <SelectItem value="Pending" className="text-xs">Pending Only</SelectItem>
                  <SelectItem value="Approved" className="text-xs">Approved Only</SelectItem>
                  <SelectItem value="Rejected" className="text-xs">Rejected Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={leaveTypeFilter} onValueChange={handleLeaveTypeChange}>
              <SelectTrigger className="w-44 text-xs h-9 bg-transparent border-border/60">
                <SelectValue placeholder="Leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Leave Types</SelectItem>
                {leaveTypeOptions?.map((lt) => (
                  <SelectItem key={lt.id} value={lt.id} className="text-xs">
                    {lt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 2: Sort + Page Size */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Sort:</span>
              <Select value={sortBy} onValueChange={(val: string) => { setSortBy(val); setPage(1) }}>
                <SelectTrigger className="w-36 text-xs h-8 bg-transparent border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt" className="text-xs">Apply Date</SelectItem>
                  <SelectItem value="startDate" className="text-xs">Start Date</SelectItem>
                  <SelectItem value="days" className="text-xs">Duration</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(val: string) => { setSortOrder(val as "asc" | "desc"); setPage(1) }}>
                <SelectTrigger className="w-28 text-xs h-8 bg-transparent border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc" className="text-xs">Newest First</SelectItem>
                  <SelectItem value="asc" className="text-xs">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground font-medium">Rows:</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20 text-xs h-8 bg-transparent border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10" className="text-xs">10</SelectItem>
                  <SelectItem value="20" className="text-xs">20</SelectItem>
                  <SelectItem value="50" className="text-xs">50</SelectItem>
                  <SelectItem value="100" className="text-xs">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="w-full overflow-x-auto bg-transparent relative">
          {isFetching && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          )}
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
                      {(() => {
                        const c = getLeaveBadgeClasses((req as any).leaveTypeColor)
                        return (
                          <Badge className={`${c.bg} ${c.text} ${c.border} hover:opacity-90 text-[10px] font-bold tracking-wide uppercase`}>
                            {req.leaveTypeName}
                          </Badge>
                        )
                      })()}
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

        {/* Pagination Controls */}
        {meta.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{((meta.page - 1) * meta.limit) + 1}</span> to <span className="font-semibold text-foreground">{Math.min(meta.page * meta.limit, meta.total)}</span> of <span className="font-semibold text-foreground">{meta.total}</span> records
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={meta.page <= 1 || isFetching}
                onClick={() => setPage(1)}
                title="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={meta.page <= 1 || isFetching}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                title="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page number buttons */}
              {(() => {
                const pages: number[] = []
                const start = Math.max(1, meta.page - 2)
                const end = Math.min(meta.totalPages, meta.page + 2)
                for (let i = start; i <= end; i++) pages.push(i)
                return pages.map(p => (
                  <Button
                    key={p}
                    variant={p === meta.page ? "default" : "outline"}
                    size="sm"
                    className={`h-8 w-8 p-0 text-xs font-semibold ${p === meta.page ? "bg-primary text-primary-foreground" : ""}`}
                    disabled={isFetching}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))
              })()}

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={meta.page >= meta.totalPages || isFetching}
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                title="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={meta.page >= meta.totalPages || isFetching}
                onClick={() => setPage(meta.totalPages)}
                title="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Leave Details Dialog */}
      <LeaveDetailsDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        selectedLeave={selectedLeave}
        user={user}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}
