import { useState } from "react"
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
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  Users,
  CheckCircle,
  Clock,
  Building2,
  Phone,
  Calendar,
  IdCard,
  UserCheck,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import Swal from "sweetalert2"
import { cn } from "@/lib/utils"

const initialEmployees = [
  { employeeId: "EMP-001", name: "Sarah Mitchell", email: "sarah.m@sadoshima.com", phone: "+880 1711-234567", role: "Senior Engineer", dept: "Engineering", status: "Active", employeeType: "Permanent", gender: "Female", bloodGroup: "B+", joinDate: "2023-03-15", dateOfBirth: "1992-07-22", lineManager: "James Cooper", initials: "SM" },
  { employeeId: "EMP-002", name: "James Cooper", email: "james.c@sadoshima.com", phone: "+880 1722-345678", role: "Product Manager", dept: "Product", status: "Active", employeeType: "Permanent", gender: "Male", bloodGroup: "A+", joinDate: "2022-08-01", dateOfBirth: "1990-01-10", lineManager: "", initials: "JC" },
  { employeeId: "EMP-003", name: "Emily Zhang", email: "emily.z@sadoshima.com", phone: "+880 1733-456789", role: "HR Specialist", dept: "HR", status: "Active", employeeType: "Permanent", gender: "Female", bloodGroup: "O+", joinDate: "2024-01-10", dateOfBirth: "1995-11-05", lineManager: "Lisa Johnson", initials: "EZ" },
  { employeeId: "EMP-004", name: "David Kim", email: "david.k@sadoshima.com", phone: "+880 1744-567890", role: "Finance Analyst", dept: "Finance", status: "On Leave", employeeType: "Contractual", gender: "Male", bloodGroup: "AB+", joinDate: "2023-06-20", dateOfBirth: "1988-04-18", lineManager: "James Cooper", initials: "DK" },
  { employeeId: "EMP-005", name: "Lisa Johnson", email: "lisa.j@sadoshima.com", phone: "+880 1755-678901", role: "Marketing Lead", dept: "Marketing", status: "Active", employeeType: "Permanent", gender: "Female", bloodGroup: "B-", joinDate: "2021-11-05", dateOfBirth: "1993-09-30", lineManager: "", initials: "LJ" },
  { employeeId: "EMP-006", name: "Marcus Brown", email: "marcus.b@sadoshima.com", phone: "+880 1766-789012", role: "Sales Rep", dept: "Sales", status: "Active", employeeType: "Probation", gender: "Male", bloodGroup: "A-", joinDate: "2025-02-01", dateOfBirth: "1997-06-14", lineManager: "Lisa Johnson", initials: "MB" },
]

export default function EmployeesPage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState<any[]>(() => {
    const stored = localStorage.getItem("employees_list")
    return stored ? JSON.parse(stored) : initialEmployees
  })
  const [searchTerm, setSearchTerm] = useState("")

  const handleDelete = (email: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This employee profile will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-destructive hover:bg-destructive/90 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2"
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = employees.filter((emp: any) => emp.email !== email)
        setEmployees(updated)
        localStorage.setItem("employees_list", JSON.stringify(updated))
        
        Swal.fire({
          title: "Deleted!",
          text: "Employee profile has been deleted.",
          icon: "success",
          confirmButtonText: "Done",
          buttonsStyling: false,
          customClass: {
            confirmButton: "swal2-confirm swal2-styled"
          }
        })
      }
    })
  }

  const filteredEmployees = employees.filter((emp: any) => {
    const term = searchTerm.toLowerCase()
    return (
      (emp.name || "").toLowerCase().includes(term) ||
      (emp.email || "").toLowerCase().includes(term) ||
      (emp.role || "").toLowerCase().includes(term) ||
      (emp.dept || "").toLowerCase().includes(term) ||
      (emp.employeeId || "").toLowerCase().includes(term) ||
      (emp.phone || "").toLowerCase().includes(term)
    )
  })

  // KPI calculations
  const totalEmployees = employees.length
  const activeEmployees = employees.filter((emp: any) => emp.status === "Active").length
  const onLeaveEmployees = employees.filter((emp: any) => emp.status === "On Leave").length
  const totalDepartments = new Set(employees.map((emp: any) => emp.dept)).size

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

      {/* KPI Cards section (Subtle styling, strictly borderless and shadowless) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Workforce</span>
            <p className="text-3xl font-bold tracking-tight">{totalEmployees}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Members</span>
            <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">{activeEmployees}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">On Leave</span>
            <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{onLeaveEmployees}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Departments</span>
            <p className="text-3xl font-bold tracking-tight">{totalDepartments}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Search controls directly in flow without Card container */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, email, department, or phone..."
              className="pl-9 bg-transparent border-border/60 hover:border-border transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Clean, borderless, shadowless Table Container */}
        <div className="w-full overflow-x-auto bg-transparent">
          <Table>
            <TableHeader className="bg-muted/10 border-b border-border/30">
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableHead className="w-24 font-semibold text-xs text-muted-foreground">ID</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Employee</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Department</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Designation</TableHead>
                <TableHead className="hidden lg:table-cell font-semibold text-xs text-muted-foreground">Line Manager</TableHead>
                <TableHead className="hidden md:table-cell font-semibold text-xs text-muted-foreground">Phone</TableHead>
                <TableHead className="hidden lg:table-cell font-semibold text-xs text-muted-foreground">Join Date</TableHead>
                <TableHead className="hidden md:table-cell font-semibold text-xs text-muted-foreground">Type</TableHead>
                <TableHead className="hidden lg:table-cell font-semibold text-xs text-muted-foreground">Gender</TableHead>
                <TableHead className="hidden xl:table-cell font-semibold text-xs text-muted-foreground">Blood</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                <TableHead className="w-12 font-semibold text-xs text-muted-foreground" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-24 text-center border-b-0">
                    <p className="text-sm text-muted-foreground">No employees found matching &quot;{searchTerm}&quot;.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((emp: any) => (
                  <TableRow key={emp.email} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5">
                        <IdCard className="h-3 w-3 text-muted-foreground/50" />
                        <span className="text-xs font-mono font-semibold text-muted-foreground">{emp.employeeId || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="cursor-pointer py-3" onClick={() => navigate(`/employees/view/${encodeURIComponent(emp.email)}`)}>
                      <div className="flex items-center gap-3 group">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                            {emp.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm group-hover:text-primary transition-colors duration-200">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="secondary" className="text-[10px] font-semibold">{emp.dept}</Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-xs text-muted-foreground">{emp.role}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-3">
                      {emp.lineManager ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <UserCheck className="h-3 w-3 shrink-0" />
                          <span>{emp.lineManager}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
                        emp.employeeType === "Permanent" ? "bg-emerald-500/10 text-emerald-600" :
                        emp.employeeType === "Contractual" ? "bg-amber-500/10 text-amber-600" :
                        "bg-sky-500/10 text-sky-600"
                      )}>
                        {emp.employeeType || "Permanent"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-3">
                      <span className="text-xs text-muted-foreground">{emp.gender || "—"}</span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell py-3">
                      <Badge variant="outline" className="text-[10px] font-bold">{emp.bloodGroup || "—"}</Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        variant={emp.status === "Active" ? "default" : "outline"}
                        className={emp.status === "Active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10" : ""}
                      >
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => navigate(`/employees/view/${encodeURIComponent(emp.email)}`)}>
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/employees/edit/${encodeURIComponent(emp.email)}`)}>
                            <Edit2 className="mr-2 h-3.5 w-3.5" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            variant="destructive"
                            onClick={() => handleDelete(emp.email)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

