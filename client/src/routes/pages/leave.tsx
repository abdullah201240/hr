import { useState, useEffect, useMemo } from "react"
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
} from "lucide-react"
import Swal from "sweetalert2"

interface LeaveRequest {
  id: string
  name: string
  email: string
  type: string
  from: string
  to: string
  days: number
  reason: string
  status: "Pending" | "Approved" | "Rejected"
  appliedDate: string
  attachments?: { id: string; title: string; fileName: string }[]
}

const INITIAL_REQUESTS: LeaveRequest[] = [
  { id: "req-1", name: "Sarah Mitchell", email: "sarah.m@sadoshima.com", type: "Vacation", from: "2026-06-15", to: "2026-06-17", days: 3, reason: "Family trip out of town", status: "Pending", appliedDate: "2026-06-10", attachments: [{ id: "att-1", title: "Flight Tickets", fileName: "flight_booking_pdf_1.pdf" }] },
  { id: "req-2", name: "David Kim", email: "david.k@sadoshima.com", type: "Sick Leave", from: "2026-06-10", to: "2026-06-12", days: 3, reason: "Severe flu and recovery", status: "Approved", appliedDate: "2026-06-08", attachments: [{ id: "att-2", title: "Doctor Certificate", fileName: "medical_report_june.png" }] },
  { id: "req-3", name: "Marcus Brown", email: "marcus.b@sadoshima.com", type: "Personal Leave", from: "2026-06-20", to: "2026-06-20", days: 1, reason: "Bank and registration appointments", status: "Pending", appliedDate: "2026-06-12" },
  { id: "req-4", name: "Emily Zhang", email: "emily.z@sadoshima.com", type: "Vacation", from: "2026-06-25", to: "2026-06-30", days: 5, reason: "Summer vacation plans", status: "Pending", appliedDate: "2026-06-11" },
  { id: "req-5", name: "Lisa Johnson", email: "lisa.j@sadoshima.com", type: "Maternity Leave", from: "2026-07-01", to: "2026-09-28", days: 90, reason: "Maternity and post-natal care", status: "Approved", appliedDate: "2026-05-15", attachments: [{ id: "att-3", title: "Hospital Admittance", fileName: "maternity_notice.pdf" }] },
]

export default function LeavePage() {
  // Core State
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All")

  // Load Initial Data
  useEffect(() => {
    const storedRequests = localStorage.getItem("hr_leave_requests")
    if (storedRequests) {
      try {
        setRequests(JSON.parse(storedRequests))
      } catch (e) {
        setRequests(INITIAL_REQUESTS)
      }
    } else {
      setRequests(INITIAL_REQUESTS)
      localStorage.setItem("hr_leave_requests", JSON.stringify(INITIAL_REQUESTS))
    }
  }, [])

  // Persist State Helper
  const saveRequests = (updated: LeaveRequest[]) => {
    setRequests(updated)
    localStorage.setItem("hr_leave_requests", JSON.stringify(updated))
  }

  // Action Handlers
  const handleApprove = (id: string) => {
    const updated = requests.map(req => req.id === id ? { ...req, status: "Approved" as const } : req)
    saveRequests(updated)
    Swal.fire({
      title: "Approved!",
      text: "The leave request has been approved successfully.",
      icon: "success",
      confirmButtonText: "Done",
      buttonsStyling: false,
      customClass: { confirmButton: "swal2-confirm swal2-styled" }
    })
  }

  const handleReject = (id: string) => {
    Swal.fire({
      title: "Reject Request?",
      text: "Are you sure you want to reject this leave request?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, reject it",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-destructive hover:bg-destructive/90 text-white px-4 py-2 rounded-md mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-md"
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = requests.map(req => req.id === id ? { ...req, status: "Rejected" as const } : req)
        saveRequests(updated)
        Swal.fire({
          title: "Rejected!",
          text: "Leave request status updated to Rejected.",
          icon: "info",
          confirmButtonText: "Done",
          buttonsStyling: false,
          customClass: { confirmButton: "swal2-confirm swal2-styled" }
        })
      }
    })
  }

  // Filter & Search Logic
  const filteredRequests = requests.filter(req => {
    const matchesSearch =
      req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "All" ? true : req.status === statusFilter
    return matchesSearch && matchesStatus
  })

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

      {/* KPI Cards section (Subtle styling, strictly borderless and shadowless) */}
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
          {filteredRequests.length === 0 ? (
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
                        <p className="font-semibold text-sm">{req.name}</p>
                        <p className="text-xs text-muted-foreground">{req.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="secondary" className="text-[10px] font-bold tracking-wide uppercase">
                        {req.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="text-xs">
                        <p className="font-semibold text-primary">
                          {new Date(req.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(req.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                            <Badge
                              key={att.id}
                              variant="outline"
                              className="text-[9px] bg-sky-500/5 text-sky-600 dark:text-sky-400 border-sky-500/20 max-w-[120px] truncate"
                              title={`${att.title}: ${att.fileName}`}
                            >
                              {att.title}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/40 italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        className={req.status === "Approved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10" : req.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10" : "bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/10"}
                      >
                        {req.status}
                      </Badge>
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
