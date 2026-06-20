import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  Plus,
  Eye,
  Users,
  CheckCircle,
  Clock,
  Building2,
  Calendar,
  IdCard,
  Phone,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FilterX,
  Pencil,
  ToggleRight,
  ToggleLeft,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useEmployeesQuery } from "@/hooks/useEmployees"
import { useDepartmentOptionsQuery } from "@/hooks/useDepartments"
import { useDesignationOptionsQuery } from "@/hooks/useDesignations"
import { StatusChangeDialog } from "@/components/employee/status-change-dialog"


export default function EmployeesPage() {
  const navigate = useNavigate()

  // Filter and pagination states
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce search input by 300ms to avoid API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])
  const [departmentId, setDepartmentId] = useState<string>("all")
  const [designationId, setDesignationId] = useState<string>("all")
  const [status, setStatus] = useState<string>("active")
  const [employeeType, setEmployeeType] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const [statusDialogEmployee, setStatusDialogEmployee] = useState<{ id: string; name: string; currentStatus: string } | null>(null)

  // API Hooks
  const { data: deptOptions } = useDepartmentOptionsQuery()
  const { data: desigOptions } = useDesignationOptionsQuery()

  const { data, isLoading, isError, error } = useEmployeesQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    departmentId: departmentId === "all" ? undefined : departmentId,
    designationId: designationId === "all" ? undefined : designationId,
    status: status === "all" ? undefined : status,
    employeeType: employeeType === "all" ? undefined : employeeType,
    sortBy,
    sortOrder,
  })

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
    setPage(1)
  }

  const resetFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setDepartmentId("all")
    setDesignationId("all")
    setStatus("active")
    setEmployeeType("all")
    setPage(1)
  }

  // Get data fields
  const employeesList = data?.data || []
  const meta = data?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 }

  // Initials generator
  const getInitials = (name: string) => {
    return name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "EM"
  }

  // Smart windowing pagination page numbers builder
  const getPageNumbers = (currentPage: number, totalPages: number) => {
    const pages: Array<number | string> = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (currentPage > 3) {
        pages.push("...")
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push("...")
      }

      pages.push(totalPages)
    }

    return pages
  }

  const pagesArray = getPageNumbers(meta.page, meta.totalPages)



  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Employees</h2>
          <p className="text-muted-foreground">Manage your workforce and employee records</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/employees/create")}>
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* KPI Cards section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Active</span>
            <p className="text-3xl font-bold tracking-tight">{status === "active" ? meta.total : "—"}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Workforce Filters</span>
            <p className="text-sm font-medium text-muted-foreground mt-2">Showing page {meta.page} of {meta.totalPages}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Departments</span>
            <p className="text-3xl font-bold tracking-tight">{deptOptions?.length || 0}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Designations</span>
            <p className="text-3xl font-bold tracking-tight">{desigOptions?.length || 0}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Search and Filters Controls */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or email..."
              className="pl-9 bg-transparent border-border/60 hover:border-border transition-colors"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <Select
            value={departmentId}
            onValueChange={(val) => {
              setDepartmentId(val)
              setPage(1)
            }}
          >
            <SelectTrigger className="bg-transparent border-border/60">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {deptOptions?.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={designationId}
            onValueChange={(val) => {
              setDesignationId(val)
              setPage(1)
            }}
          >
            <SelectTrigger className="bg-transparent border-border/60">
              <SelectValue placeholder="Designation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Designations</SelectItem>
              {desigOptions?.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={employeeType}
            onValueChange={(val) => {
              setEmployeeType(val)
              setPage(1)
            }}
          >
            <SelectTrigger className="bg-transparent border-border/60">
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Full-time">Full-time</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Contract">Contract</SelectItem>
              <SelectItem value="Probation">Probation</SelectItem>
              <SelectItem value="Intern">Intern</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(val) => {
              setStatus(val)
              setPage(1)
            }}
          >
            <SelectTrigger className="bg-transparent border-border/60">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>

            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Show</span>
            <Select
              value={String(limit)}
              onValueChange={(val) => {
                setLimit(Number(val))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-18 h-8 bg-transparent border-border/60 text-xs">
                <SelectValue placeholder={String(limit)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-muted-foreground text-xs">entries</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-xs gap-1.5 h-8 hover:bg-muted text-muted-foreground"
          >
            <FilterX className="h-3.5 w-3.5" />
            Reset Filters
          </Button>
        </div>

        {/* Clean, borderless, shadowless Table Container */}
        <div className="w-full overflow-x-auto bg-transparent border border-border/30 rounded-2xl">
          <Table>
            <TableHeader className="bg-muted/10 border-b border-border/30">
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableHead className="w-28 font-semibold text-xs text-muted-foreground">
                  <button
                    onClick={() => handleSort("employeeId")}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    ID <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">
                  <button
                    onClick={() => handleSort("fullNameEnglish")}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Employee <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Department</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Designation</TableHead>
                <TableHead className="hidden md:table-cell font-semibold text-xs text-muted-foreground">Phone</TableHead>
                <TableHead className="hidden lg:table-cell font-semibold text-xs text-muted-foreground">
                  <button
                    onClick={() => handleSort("joinDate")}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    Join Date <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell font-semibold text-xs text-muted-foreground">Type</TableHead>
                <TableHead className="hidden lg:table-cell font-semibold text-xs text-muted-foreground">Gender</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                <TableHead className="w-32 font-semibold text-xs text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-48 text-center border-b-0">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-xs text-muted-foreground">Loading employees...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-48 text-center border-b-0">
                    <p className="text-sm text-destructive font-medium">
                      Error loading records: {error.message}
                    </p>
                  </TableCell>
                </TableRow>
              ) : employeesList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center border-b-0">
                    <p className="text-sm text-muted-foreground">No employees found matching query.</p>
                  </TableCell>
                </TableRow>
              ) : (
                employeesList.map((emp) => (
                  <TableRow key={emp.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5">
                        <IdCard className="h-3 w-3 text-muted-foreground/50" />
                        <span className="text-xs font-mono font-semibold text-muted-foreground">
                          {emp.employeeId || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="cursor-pointer py-3" onClick={() => navigate(`/employees/view/${emp.id}`)}>
                      <div className="flex items-center gap-3 group">
                        <Avatar className="h-9 w-9">
                          {emp.employeePhotoUrl ? (
                            <img src={emp.employeePhotoUrl} alt={emp.fullNameEnglish} className="object-cover h-full w-full" />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                              {getInitials(emp.fullNameEnglish)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm group-hover:text-primary transition-colors duration-200">
                            {emp.fullNameEnglish}
                          </p>
                          <p className="text-xs text-muted-foreground">{emp.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="secondary" className="text-[10px] font-semibold">
                        {emp.departmentName || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-xs text-muted-foreground">{emp.designationName || "—"}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span>{emp.phone || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{emp.joinDate || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-3">
                      <Badge className={cn(
                        "text-[9px] font-bold border-none",
                        emp.employeeType === "Full-time" ? "bg-emerald-500/10 text-emerald-600" :
                        emp.employeeType === "Contract" ? "bg-amber-500/10 text-amber-600" :
                        "bg-sky-500/10 text-sky-600"
                      )}>
                        {emp.employeeType || "Probation"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-3">
                      <span className="text-xs text-muted-foreground">{emp.gender || "—"}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        variant={emp.status === "active" ? "default" : "outline"}
                        className={emp.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10" : ""}
                      >
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-muted"
                          onClick={() => navigate(`/employees/view/${emp.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-muted"
                          onClick={() => navigate(`/employees/edit/${emp.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${
                            emp.status === "active"
                              ? "text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600"
                              : "text-muted-foreground/40 hover:bg-muted"
                          }`}
                          onClick={() => {
                            setStatusDialogEmployee({ id: emp.id, name: emp.fullNameEnglish, currentStatus: emp.status })
                          }}
                        >
                          {emp.status === "active" ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Server-Side Pagination Controls with Ellipsis Windowing */}
        {!isLoading && !isError && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/20 pt-4">
            <span className="text-xs text-muted-foreground">
              Showing {(meta.page - 1) * meta.limit + 1} to{" "}
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} entries
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {pagesArray.map((pageNum, idx) => {
                if (pageNum === "...") {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-2 text-xs text-muted-foreground">
                      ...
                    </span>
                  )
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    className="h-8 w-8 text-xs font-semibold"
                    onClick={() => setPage(Number(pageNum))}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Status Change Dialog */}
      <StatusChangeDialog
        employee={statusDialogEmployee}
        onClose={() => setStatusDialogEmployee(null)}
      />

    </div>
  )
}
