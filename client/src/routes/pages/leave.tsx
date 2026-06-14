import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  CalendarOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  CalendarDays,
  Plus,
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
}

const INITIAL_REQUESTS: LeaveRequest[] = [
  { id: "req-1", name: "Sarah Mitchell", email: "sarah.m@sadoshima.com", type: "Vacation", from: "2026-06-15", to: "2026-06-17", days: 3, reason: "Family trip out of town", status: "Pending", appliedDate: "2026-06-10" },
  { id: "req-2", name: "David Kim", email: "david.k@sadoshima.com", type: "Sick Leave", from: "2026-06-10", to: "2026-06-12", days: 3, reason: "Severe flu and recovery", status: "Approved", appliedDate: "2026-06-08" },
  { id: "req-3", name: "Marcus Brown", email: "marcus.b@sadoshima.com", type: "Personal Leave", from: "2026-06-20", to: "2026-06-20", days: 1, reason: "Bank and registration appointments", status: "Pending", appliedDate: "2026-06-12" },
  { id: "req-4", name: "Emily Zhang", email: "emily.z@sadoshima.com", type: "Vacation", from: "2026-06-25", to: "2026-06-30", days: 5, reason: "Summer vacation plans", status: "Pending", appliedDate: "2026-06-11" },
  { id: "req-5", name: "Lisa Johnson", email: "lisa.j@sadoshima.com", type: "Maternity Leave", from: "2026-07-01", to: "2026-09-28", days: 90, reason: "Maternity and post-natal care", status: "Approved", appliedDate: "2026-05-15" },
]

const DEFAULT_EMPLOYEES = [
  { name: "Sarah Mitchell", email: "sarah.m@sadoshima.com" },
  { name: "James Cooper", email: "james.c@sadoshima.com" },
  { name: "Emily Zhang", email: "emily.z@sadoshima.com" },
  { name: "David Kim", email: "david.k@sadoshima.com" },
  { name: "Lisa Johnson", email: "lisa.j@sadoshima.com" },
  { name: "Marcus Brown", email: "marcus.b@sadoshima.com" },
]

export default function LeavePage() {
  // Core State
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<{ name: string; email: string }[]>([])
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All")
  
  // Dialog/Form States
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedEmployeeEmail, setSelectedEmployeeEmail] = useState("")
  const [leaveType, setLeaveType] = useState("Vacation")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")

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

    const storedEmployees = localStorage.getItem("employees_list")
    if (storedEmployees) {
      try {
        const parsed = JSON.parse(storedEmployees)
        setEmployees(parsed.map((e: any) => ({ name: e.name, email: e.email })))
      } catch (e) {
        setEmployees(DEFAULT_EMPLOYEES)
      }
    } else {
      setEmployees(DEFAULT_EMPLOYEES)
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

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployeeEmail || !startDate || !endDate || !reason.trim()) {
      Swal.fire("Error", "Please fill in all details.", "error")
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end < start) {
      Swal.fire("Error", "End date cannot be earlier than start date.", "error")
      return
    }

    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const emp = employees.find(e => e.email === selectedEmployeeEmail)
    const empName = emp ? emp.name : "Unknown Employee"

    const newRequest: LeaveRequest = {
      id: `req-${Date.now()}`,
      name: empName,
      email: selectedEmployeeEmail,
      type: leaveType,
      from: startDate,
      to: endDate,
      days: durationDays,
      reason: reason.trim(),
      status: "Pending",
      appliedDate: new Date().toISOString().split("T")[0]
    }

    saveRequests([newRequest, ...requests])
    setIsDialogOpen(false)

    // Reset Form
    setSelectedEmployeeEmail("")
    setLeaveType("Vacation")
    setStartDate("")
    setEndDate("")
    setReason("")

    Swal.fire({
      title: "Submitted!",
      text: "New leave request was registered successfully.",
      icon: "success",
      confirmButtonText: "Done",
      buttonsStyling: false,
      customClass: { confirmButton: "swal2-confirm swal2-styled" }
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

  // Counters
  const countPending = requests.filter(r => r.status === "Pending").length
  const countApproved = requests.filter(r => r.status === "Approved").length
  const countRejected = requests.filter(r => r.status === "Rejected").length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leave Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Review, authorize, and log employee leave requests</p>
        </div>

        {/* Dialog for New Request */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              New Leave Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px]">
            <form onSubmit={handleCreateRequest}>
              <DialogHeader>
                <DialogTitle className="text-base font-bold">New Leave Request</DialogTitle>
                <DialogDescription className="text-xs">
                  Provide details to log a new employee leave request.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Employee Selector */}
                <div className="space-y-1.5">
                  <Label htmlFor="req-employee" className="text-xs font-semibold">Employee *</Label>
                  <Select value={selectedEmployeeEmail} onValueChange={setSelectedEmployeeEmail}>
                    <SelectTrigger id="req-employee" className="w-full text-xs h-9">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.email} value={emp.email} className="text-xs">
                          {emp.name} ({emp.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Leave Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="req-type" className="text-xs font-semibold">Leave Type *</Label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger id="req-type" className="w-full text-xs h-9">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vacation" className="text-xs">Vacation</SelectItem>
                      <SelectItem value="Sick Leave" className="text-xs">Sick Leave</SelectItem>
                      <SelectItem value="Personal Leave" className="text-xs">Personal Leave</SelectItem>
                      <SelectItem value="Maternity Leave" className="text-xs">Maternity Leave</SelectItem>
                      <SelectItem value="Paternity Leave" className="text-xs">Paternity Leave</SelectItem>
                      <SelectItem value="Unpaid Leave" className="text-xs">Unpaid Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Ranges */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="req-start" className="text-xs font-semibold">Start Date *</Label>
                    <Input
                      id="req-start"
                      type="date"
                      value={startDate}
                      onChange={e => {
                        setStartDate(e.target.value)
                        if (!endDate || endDate < e.target.value) {
                          setEndDate(e.target.value)
                        }
                      }}
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="req-end" className="text-xs font-semibold">End Date *</Label>
                    <Input
                      id="req-end"
                      type="date"
                      min={startDate}
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                {/* Duration Badge */}
                {startDate && endDate && endDate >= startDate && (
                  <div className="text-[10px] text-sky-600 dark:text-sky-400 font-bold bg-sky-500/10 px-2 py-1 rounded w-fit">
                    Duration: {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-1.5">
                  <Label htmlFor="req-reason" className="text-xs font-semibold">Reason *</Label>
                  <Textarea
                    id="req-reason"
                    placeholder="Enter reason for leave..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="text-xs min-h-[70px] resize-none"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                  Submit Request
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards (Clean borderless aesthetic styling) */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/[0.04] transition-all duration-300 hover:bg-amber-500/15 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Pending Approval</span>
            <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{countPending}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-500 flex items-center justify-center">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/[0.04] transition-all duration-300 hover:bg-emerald-500/15 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">Approved Requests</span>
            <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">{countApproved}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-red-500/10 dark:bg-red-500/[0.04] transition-all duration-300 hover:bg-red-500/15 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-red-600 dark:text-red-500 uppercase tracking-wider">Rejected Requests</span>
            <p className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-500">{countRejected}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-red-500/20 text-red-600 dark:text-red-500 flex items-center justify-center">
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

        {/* Requests List */}
        <div className="space-y-3.5">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border/60 rounded-2xl bg-muted/5">
              <CalendarOff className="h-8 w-8 text-muted-foreground/35 mx-auto mb-2" />
              <p className="text-sm font-semibold text-muted-foreground">No leave requests found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try modifying your search or filter keywords</p>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/40 hover:border-border/80 transition-all duration-200 bg-card"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{req.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{req.email}</span>
                    <Badge variant="secondary" className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5">
                      {req.type}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3 text-primary shrink-0" />
                      {new Date(req.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(req.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="font-semibold text-primary/80">({req.days} {req.days === 1 ? "day" : "days"})</span>
                  </div>

                  {req.reason && (
                    <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-2xl bg-muted/20 p-2 rounded-lg mt-1 border border-border/10">
                      <span className="font-bold text-foreground/75 block text-[10px] uppercase tracking-wide mb-0.5">Reason:</span>
                      {req.reason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  {req.status === "Pending" ? (
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
                    <Badge
                      className={req.status === "Approved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10" : "bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/10"}
                    >
                      {req.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
