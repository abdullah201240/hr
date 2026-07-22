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
import {
  CalendarOff,
  Search,
  Filter,
  Eye,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react"
import {
  useLeaveApplicationsQuery,
} from "@/hooks/useLeaveApplications"
import { useLeaveTypeOptionsQuery } from "@/hooks/useLeaveTypes"
import { LeaveDetailsDialog } from "@/components/leave/leave-details-dialog"

// ─── Leave type color helper ────────────────────────────────────────────────
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

// Status badge styling
const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Pending_2nd: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  Approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Rejected: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  Cancelled: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
}

export default function LeaveApplicationsPage() {

  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("All")
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("all")
  const [selectedLeave, setSelectedLeave] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Fetch leave types for filter
  const { data: leaveTypeOptions } = useLeaveTypeOptionsQuery()

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const searchTimeoutRef = useState<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    if (searchTimeoutRef[0]) clearTimeout(searchTimeoutRef[0])
    searchTimeoutRef[0] = setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1)
    }, 400)
  }, [])

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

  const handleViewDetails = (req: any) => {
    setSelectedLeave(req)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedLeave(null)
  }

  // Query params
  const queryParams = useMemo(() => ({
    page,
    limit: pageSize,
    search: debouncedSearch || undefined,
    status: statusFilter !== "All" ? (statusFilter as any) : undefined,
    leaveTypeId: leaveTypeFilter !== "all" ? leaveTypeFilter : undefined,
    sortBy,
    sortOrder,
  }), [page, pageSize, debouncedSearch, statusFilter, leaveTypeFilter, sortBy, sortOrder])

  // Fetch data
  const { data: listResponse, isLoading } = useLeaveApplicationsQuery(queryParams)
  const requests = listResponse?.data || []
  const meta = listResponse?.meta || { total: 0, page: 1, limit: 10, totalPages: 0 }

  const totalCount = meta.total

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leave Applications</h2>
          <p className="text-sm text-muted-foreground mt-1">Review and track all leave applications</p>
        </div>
      </div>

      {/* KPI Cards */}
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

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          {/* Search + Status + Leave Type */}
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
                  <SelectItem value="Pending" className="text-xs">Pending</SelectItem>
                  <SelectItem value="Pending_2nd" className="text-xs">Pending 2nd</SelectItem>
                  <SelectItem value="Approved" className="text-xs">Approved</SelectItem>
                  <SelectItem value="Rejected" className="text-xs">Rejected</SelectItem>
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

          {/* Sort + Page Size */}
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
                  <SelectItem value="endDate" className="text-xs">End Date</SelectItem>
                  <SelectItem value="days" className="text-xs">Duration</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(val: "asc" | "desc") => setSortOrder(val)}>
                <SelectTrigger className="w-32 text-xs h-8 bg-transparent border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc" className="text-xs">Newest First</SelectItem>
                  <SelectItem value="asc" className="text-xs">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Page size:</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-24 text-xs h-8 bg-transparent border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10" className="text-xs">10 rows</SelectItem>
                  <SelectItem value="20" className="text-xs">20 rows</SelectItem>
                  <SelectItem value="50" className="text-xs">50 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs font-semibold w-[180px]">Employee</TableHead>
                <TableHead className="text-xs font-semibold">Type</TableHead>
                <TableHead className="text-xs font-semibold">Duration</TableHead>
                <TableHead className="text-xs font-semibold">Reason</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold w-[80px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-xs">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <CalendarOff className="h-8 w-8 opacity-40" />
                      <span className="text-xs">No leave applications found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req: any) => {
                  const leaveColor = getLeaveBadgeClasses(req.leaveTypeColor)
                  const statusClass = STATUS_STYLES[req.status] || STATUS_STYLES.Pending

                  return (
                    <TableRow key={req.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div>
                          <p className="text-xs font-semibold">{req.employeeName}</p>
                          {req.employeeIdCode && (
                            <p className="text-[10px] text-muted-foreground">{req.employeeIdCode}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${leaveColor.bg} ${leaveColor.text} ${leaveColor.border}`}
                        >
                          {req.leaveTypeName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p className="font-medium">{req.days} day{req.days !== 1 ? "s" : ""}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {req.startDate} → {req.endDate}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs max-w-[200px] truncate">{req.reason}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] font-semibold ${statusClass}`}>
                          {req.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleViewDetails(req)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} entries
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={meta.page <= 1}
                onClick={() => setPage(1)}
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={meta.page <= 1}
                onClick={() => setPage(meta.page - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-3 text-xs font-medium">
                Page {meta.page}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage(meta.page + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage(meta.totalPages)}
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Leave Details Dialog */}
      {selectedLeave && (
        <LeaveDetailsDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          selectedLeave={selectedLeave}
          user={null}
          onApprove={() => {}}
          onReject={() => {}}
        />
      )}
    </div>
  )
}
