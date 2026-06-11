import { useState } from "react"
import { useNavigate } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Building2, 
  Users, 
  Plus, 
  Briefcase, 
  Search, 
  TrendingUp, 
  Layers,
  Award,
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  Filter,
  Network,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import Swal from "sweetalert2"
import OrgChart from "@/components/organization/org-chart"

const initialDepartments = [
  { name: "Engineering", head: "Michael Torres", count: 64, openRoles: 5, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { name: "Product", head: "Sarah Chen", count: 32, openRoles: 2, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { name: "Marketing", head: "Anna Williams", count: 28, openRoles: 3, color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
  { name: "Sales", head: "Robert Davis", count: 45, openRoles: 8, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { name: "Human Resources", head: "Patricia Lee", count: 12, openRoles: 1, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { name: "Finance", head: "Thomas Wright", count: 18, openRoles: 2, color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
]

const initialDesignations = [
  { name: "Software Engineer", grade: "L1", department: "Engineering", count: 24, openRoles: 2 },
  { name: "Senior Software Engineer", grade: "L2", department: "Engineering", count: 18, openRoles: 1 },
  { name: "Tech Lead", grade: "L3", department: "Engineering", count: 8, openRoles: 1 },
  { name: "Engineering Manager", grade: "L4", department: "Engineering", count: 4, openRoles: 1 },
  { name: "Product Manager", grade: "L3", department: "Product", count: 12, openRoles: 1 },
  { name: "Designer", grade: "L2", department: "Product", count: 14, openRoles: 2 },
  { name: "HR Specialist", grade: "L2", department: "HR", count: 6, openRoles: 0 },
  { name: "Finance Analyst", grade: "L2", department: "Finance", count: 8, openRoles: 1 },
  { name: "Marketing Lead", grade: "L3", department: "Marketing", count: 10, openRoles: 2 },
  { name: "Sales Rep", grade: "L1", department: "Sales", count: 20, openRoles: 5 },
]

export default function DepartmentsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("departments")
  const [deptSearch, setDeptSearch] = useState("")
  const [desgSearch, setDesgSearch] = useState("")

  const [departments, setDepartments] = useState<any[]>(() => {
    const stored = localStorage.getItem("departments_list")
    return stored ? JSON.parse(stored) : initialDepartments
  })

  const [designations, setDesignations] = useState<any[]>(() => {
    const stored = localStorage.getItem("designations_list")
    return stored ? JSON.parse(stored) : initialDesignations
  })

  const handleDeleteDept = (name: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This department will be permanently deleted.",
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
        const updated = departments.filter((d: any) => d.name !== name)
        setDepartments(updated)
        localStorage.setItem("departments_list", JSON.stringify(updated))
        Swal.fire("Deleted!", "Department has been deleted.", "success")
      }
    })
  }

  const handleDeleteDesg = (name: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This designation will be permanently deleted.",
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
        const updated = designations.filter((d: any) => d.name !== name)
        setDesignations(updated)
        localStorage.setItem("designations_list", JSON.stringify(updated))
        Swal.fire("Deleted!", "Designation has been deleted.", "success")
      }
    })
  }

  const filteredDepts = departments.filter(dept => 
    dept.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
    dept.head.toLowerCase().includes(deptSearch.toLowerCase())
  )

  const filteredDesgs = designations.filter(desg => 
    desg.name.toLowerCase().includes(desgSearch.toLowerCase()) ||
    desg.department.toLowerCase().includes(desgSearch.toLowerCase()) ||
    desg.grade.toLowerCase().includes(desgSearch.toLowerCase())
  )

  // Calculations for Department KPIs
  const totalDepts = departments.length
  const totalMembers = departments.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0)
  const totalOpenRoles = departments.reduce((acc, curr) => acc + (Number(curr.openRoles) || 0), 0)
  const avgDeptSize = totalDepts > 0 ? Math.round(totalMembers / totalDepts) : 0

  // Calculations for Designation KPIs
  const totalDesgs = designations.length
  const uniqueGrades = new Set(designations.map(d => d.grade)).size
  const maxAllocatedRole = designations.length > 0 
    ? designations.reduce((prev, current) => (prev.count > current.count) ? prev : current)
    : { name: "N/A", count: 0 }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Organization Structure</h2>
          <p className="text-muted-foreground">Manage departments, designations, roles and pay-grades</p>
        </div>
        <Button 
          className="gap-2" 
          onClick={() => navigate(activeTab === "departments" ? "/departments/create" : activeTab === "designations" ? "/designations/create" : "#")}
          disabled={activeTab === "orgchart"}
        >
          <Plus className="h-4 w-4" />
          {activeTab === "departments" ? "Add Department" : activeTab === "designations" ? "Add Designation" : "Edit in Tree"}
        </Button>
      </div>

      <Tabs defaultValue="departments" onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-[500px] grid-cols-3 shadow-none border border-border/40 bg-muted/20">
          <TabsTrigger value="departments" className="text-xs">Departments</TabsTrigger>
          <TabsTrigger value="designations" className="text-xs">Designations</TabsTrigger>
          <TabsTrigger value="orgchart" className="text-xs">Org Chart</TabsTrigger>
        </TabsList>

        {/* DEPARTMENTS TAB CONTENT */}
        <TabsContent value="departments" className="space-y-6 outline-none">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Departments</span>
                <p className="text-3xl font-bold tracking-tight">{totalDepts}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Members</span>
                <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">{totalMembers}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Open Positions</span>
                <p className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{totalOpenRoles}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Briefcase className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Dept Size</span>
                <p className="text-3xl font-bold tracking-tight">{avgDeptSize} <span className="text-xs text-muted-foreground font-normal">/ dept</span></p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search departments..."
                className="pl-9 bg-transparent border-border/60 hover:border-border transition-colors text-xs h-9"
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2 h-9 text-xs">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          {/* Clean, borderless, shadowless Table Container */}
          <div className="w-full overflow-x-auto bg-transparent">
            <Table>
              <TableHeader className="bg-muted/10 border-b border-border/30">
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead className="font-semibold text-xs text-muted-foreground">Department Name</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Head of Department</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Total Members</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Open Roles</TableHead>
                  <TableHead className="w-12 font-semibold text-xs text-muted-foreground" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center border-b-0">
                      <p className="text-sm text-muted-foreground">No departments found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepts.map((dept: any) => (
                    <TableRow key={dept.name} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                      <TableCell className="cursor-pointer py-3 font-semibold text-sm hover:text-primary transition-colors" onClick={() => navigate(`/departments/view/${encodeURIComponent(dept.name)}`)}>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
                            <Building2 className="h-4 w-4" />
                          </div>
                          {dept.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground py-3">
                        {dept.head || "—"}
                      </TableCell>
                      <TableCell className="text-sm py-3 font-medium">
                        {dept.count || 0} members
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="secondary" className="text-xs bg-primary/8 text-primary border-none">
                          {dept.openRoles || 0} open
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => navigate(`/departments/view/${encodeURIComponent(dept.name)}`)}>
                              <Eye className="mr-2 h-3.5 w-3.5" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/departments/edit/${encodeURIComponent(dept.name)}`)}>
                              <Edit2 className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => handleDeleteDept(dept.name)}>
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
        </TabsContent>

        {/* ORG CHART TAB CONTENT */}
        <TabsContent value="orgchart" className="space-y-6 outline-none">
          {/* Org Chart */}
          <div className="rounded-2xl border border-border/50 bg-card/50 p-5 sm:p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Network className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Enterprise Organization Chart</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Full hierarchy from CEO to individual contributors. Hover any card to add, edit, or remove positions.
                </p>
              </div>
            </div>
            <OrgChart />
          </div>
        </TabsContent>

        {/* DESIGNATIONS TAB CONTENT */}
        <TabsContent value="designations" className="space-y-6 outline-none">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Designations</span>
                <p className="text-3xl font-bold tracking-tight">{totalDesgs}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Briefcase className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pay Grade Bands</span>
                <p className="text-3xl font-bold tracking-tight text-purple-600 dark:text-purple-400">{uniqueGrades}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Max Allocated Role</span>
                <p className="text-sm font-bold truncate max-w-[160px] text-emerald-600 dark:text-emerald-500 mt-2">{maxAllocatedRole.name}</p>
                <p className="text-[10px] text-muted-foreground">{maxAllocatedRole.count} active officers</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Award className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Designation Openings</span>
                <p className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                  {designations.reduce((acc, curr) => acc + (Number(curr.openRoles) || 0), 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search designations..."
                className="pl-9 bg-transparent border-border/60 hover:border-border transition-colors text-xs h-9"
                value={desgSearch}
                onChange={(e) => setDesgSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2 h-9 text-xs">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>

          {/* Clean, borderless, shadowless Table Container */}
          <div className="w-full overflow-x-auto bg-transparent">
            <Table>
              <TableHeader className="bg-muted/10 border-b border-border/30">
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead className="font-semibold text-xs text-muted-foreground">Designation Title</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Department</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Pay Grade</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Occupants</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Vacancies</TableHead>
                  <TableHead className="w-12 font-semibold text-xs text-muted-foreground" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDesgs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center border-b-0">
                      <p className="text-sm text-muted-foreground">No designations found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDesgs.map((desg: any) => (
                    <TableRow key={desg.name} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                      <TableCell className="cursor-pointer py-3 font-semibold text-sm hover:text-primary transition-colors" onClick={() => navigate(`/designations/view/${encodeURIComponent(desg.name)}`)}>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
                            <Briefcase className="h-4 w-4" />
                          </div>
                          {desg.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm py-3 text-muted-foreground">
                        {desg.department}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className="text-[10px] font-bold border-muted-foreground/30 px-2 py-0.5">
                          Grade {desg.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm py-3 font-medium">
                        {desg.count || 0} officers
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant={desg.openRoles > 0 ? "default" : "secondary"}
                          className={desg.openRoles > 0 ? "bg-emerald-500/10 text-emerald-600 border-none text-[10px] font-bold" : "border-none text-[10px] font-bold"}
                        >
                          {desg.openRoles || 0} vacancies
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => navigate(`/designations/view/${encodeURIComponent(desg.name)}`)}>
                              <Eye className="mr-2 h-3.5 w-3.5" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/designations/edit/${encodeURIComponent(desg.name)}`)}>
                              <Edit2 className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => handleDeleteDesg(desg.name)}>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
